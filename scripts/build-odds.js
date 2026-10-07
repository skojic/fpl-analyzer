// Bookmaker odds for upcoming Premier League matches, from The Odds API (free tier: 500 credits / month).
// Converts each match's 1X2 and over/under 2.5 odds into expected goals for both teams and writes
// data/odds.json, which the prediction model blends with its own team ratings.
// One call per run costs 2 credits (2 markets x 1 region), so a daily run uses about 60 a month.
//
// Usage: ODDS_API_KEY=... node scripts/build-odds.js      (skips quietly when the key is missing)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const API = 'https://api.the-odds-api.com/v4/sports/soccer_epl/odds/';
const MAX_KICKOFF_GAP_HOURS = 48; // an odds event matches an FPL fixture with the same teams kicking off this close

// ── Team names: The Odds API uses full club names, FPL short ones ────────────
const ALIASES = {
    'man city': 'manchester city', 'man utd': 'manchester united', 'man united': 'manchester united',
    spurs: 'tottenham', "nott'm forest": 'nottingham forest', 'nottm forest': 'nottingham forest',
    wolves: 'wolverhampton', 'sheffield utd': 'sheffield united', 'west brom': 'west bromwich'
};
const FILLER = new Set(['fc', 'afc', 'and', '&', 'hove', 'albion', 'hotspur', 'wanderers', 'town', 'city', 'united']);

function teamKey(name) {
    let n = String(name).toLowerCase().replace(/[.']/g, m => (m === "'" ? "'" : '')).trim();
    if (ALIASES[n]) n = ALIASES[n];
    // Keep the two Manchester clubs apart before dropping filler words
    n = n.replace('manchester city', 'mancity').replace('manchester united', 'manutd');
    return n.split(/\s+/).filter(w => !FILLER.has(w)).join(' ');
}

// ── Odds to expected goals ───────────────────────────────────────────────────
const poisson = (k, lambda) => {
    let p = Math.exp(-lambda);
    for (let i = 1; i <= k; i++) p *= lambda / i;
    return p;
};

// Probability of more than 2.5 goals when the match total is Poisson(mu)
const pOver25 = mu => 1 - poisson(0, mu) - poisson(1, mu) - poisson(2, mu);

// Home win and away win probabilities for independent Poisson goals
function outcome(home, away) {
    let pHome = 0;
    let pAway = 0;
    for (let i = 0; i <= 12; i++) {
        for (let j = 0; j <= 12; j++) {
            const p = poisson(i, home) * poisson(j, away);
            if (i > j) pHome += p;
            else if (j > i) pAway += p;
        }
    }
    return { pHome, pAway };
}

function bisect(fn, lo, hi, target, increasing = true) {
    for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        if ((fn(mid) < target) === increasing) lo = mid;
        else hi = mid;
    }
    return (lo + hi) / 2;
}

// Bookmaker probabilities without the margin, averaged over bookmakers
function consensus(event) {
    const h2h = [];
    const totals = [];
    for (const book of event.bookmakers || []) {
        for (const market of book.markets || []) {
            if (market.key === 'h2h') {
                const price = name => (market.outcomes.find(o => o.name === name) || {}).price;
                const [h, d, a] = [price(event.home_team), price('Draw'), price(event.away_team)];
                if (!h || !d || !a) continue;
                const sum = 1 / h + 1 / d + 1 / a;
                h2h.push({ home: 1 / h / sum, draw: 1 / d / sum, away: 1 / a / sum });
            }
            if (market.key === 'totals') {
                const over = market.outcomes.find(o => o.name === 'Over' && o.point === 2.5);
                const under = market.outcomes.find(o => o.name === 'Under' && o.point === 2.5);
                if (over && under) totals.push((1 / over.price) / (1 / over.price + 1 / under.price));
            }
        }
    }
    if (!h2h.length) return null;
    const avg = (rows, f) => rows.reduce((s, r) => s + f(r), 0) / rows.length;
    return {
        home: avg(h2h, r => r.home),
        draw: avg(h2h, r => r.draw),
        away: avg(h2h, r => r.away),
        over25: totals.length ? avg(totals, x => x) : null,
        bookmakers: h2h.length
    };
}

// Expected goals for both teams that reproduce the market: the total from over/under 2.5
// (or `fallbackTotal` without that market) and the home/away split from the 1X2 odds
function expectedGoals(market, fallbackTotal = 2.8) {
    const total = market.over25 !== null ? bisect(pOver25, 0.3, 7, market.over25) : fallbackTotal;
    const homeShare = market.home / (market.home + market.away);
    const share = bisect(r => {
        const o = outcome(r * total, (1 - r) * total);
        return o.pHome / (o.pHome + o.pAway);
    }, 0.03, 0.97, homeShare);
    return { home: share * total, away: (1 - share) * total, total };
}

// Match odds events to FPL fixtures by teams and kickoff time
function buildOdds(events, bootstrap, fixtures) {
    const teamByKey = new Map(bootstrap.teams.map(t => [teamKey(t.name), t.id]));
    const out = {};
    const unmatched = [];
    for (const event of events) {
        const home = teamByKey.get(teamKey(event.home_team));
        const away = teamByKey.get(teamKey(event.away_team));
        const kickoff = new Date(event.commence_time).getTime();
        const fixture = fixtures.find(f => !f.finished && f.event && f.team_h === home && f.team_a === away
            && Math.abs(new Date(f.kickoff_time).getTime() - kickoff) <= MAX_KICKOFF_GAP_HOURS * 3600000);
        const market = consensus(event);
        if (!fixture || !market) {
            unmatched.push(`${event.home_team} v ${event.away_team}`);
            continue;
        }
        const goals = expectedGoals(market);
        const round = x => Math.round(x * 1000) / 1000;
        out[fixture.id] = {
            event: fixture.event,
            kickoff: fixture.kickoff_time,
            home: fixture.team_h,
            away: fixture.team_a,
            goalsHome: round(goals.home),
            goalsAway: round(goals.away),
            pHome: round(market.home),
            pDraw: round(market.draw),
            pAway: round(market.away),
            pOver25: market.over25 === null ? null : round(market.over25),
            bookmakers: market.bookmakers
        };
    }
    return { fixtures: out, unmatched };
}

// Keep the latest odds taken before kickoff for every match (data/odds-history.json). Matches leave the
// bookmakers' list once they start, so what remains is the last pre-match price. The backtest uses it
// to measure how much weight the odds deserve.
function updateHistory(matched, now = new Date()) {
    const file = path.join(root, 'data', 'odds-history.json');
    let history = { fixtures: {} };
    try { history = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { /* first run */ }
    let updated = 0;
    for (const [id, odds] of Object.entries(matched)) {
        if (!odds.kickoff || new Date(odds.kickoff) <= now) continue; // in-play prices are not pre-match odds
        history.fixtures[id] = { ...odds, takenAt: now.toISOString() };
        updated++;
    }
    history.generated = now.toISOString();
    fs.writeFileSync(file, JSON.stringify(history) + '\n');
    return `data/odds-history.json: ${updated} matches updated, ${Object.keys(history.fixtures).length} kept`;
}

async function main() {
    const key = process.env.ODDS_API_KEY;
    if (!key) {
        console.log('ODDS_API_KEY not set, odds skipped');
        return;
    }
    global.FPL_API = require(path.join(root, 'fpl-api.js'));
    const log = console.log;
    console.log = () => {};
    const [bootstrap, fixtures] = await Promise.all([FPL_API.getBootstrapStatic(), FPL_API.getFixtures()]);

    const url = `${API}?apiKey=${encodeURIComponent(key)}&regions=uk&markets=h2h,totals&oddsFormat=decimal&dateFormat=iso`;
    const response = await fetch(url);
    if (!response.ok) {
        // Never print the URL: it contains the key
        throw new Error(`The Odds API returned ${response.status}: ${(await response.text()).slice(0, 200)}`);
    }
    const events = await response.json();
    const { fixtures: matched, unmatched } = buildOdds(events, bootstrap, fixtures);
    log(`odds: ${Object.keys(matched).length} of ${events.length} matches mapped, credits left ${response.headers.get('x-requests-remaining')}`);
    if (unmatched.length) log(`odds: not mapped: ${unmatched.join(', ')}`);

    const file = path.join(root, 'data', 'odds.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ generated: new Date().toISOString(), source: 'the-odds-api.com', fixtures: matched }) + '\n');
    log('data/odds.json written');
    log(updateHistory(matched));
}

if (require.main === module) {
    main().catch(error => {
        console.error(error.message);
        process.exit(1);
    });
}

module.exports = { teamKey, consensus, expectedGoals, buildOdds, updateHistory, pOver25, outcome };
