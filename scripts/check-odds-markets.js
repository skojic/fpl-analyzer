// One-off check: does our The Odds API plan include anytime-goalscorer odds for the Premier League?
// Costs about 2 credits: listing events is free, the markets list of one match is 1 credit, and that
// match's anytime-goalscorer odds are 1 credit (only charged if the market is returned).
// Soccer player props come from US bookmakers only, so region "us" is used. The key is never printed.
//
// Usage: ODDS_API_KEY=... node scripts/check-odds-markets.js
const API = 'https://api.the-odds-api.com/v4/sports/soccer_epl';

// On GitHub Actions, findings are also written as annotations: they show on the run page and can be
// read through the public API, unlike the job log
const ON_ACTIONS = !!process.env.GITHUB_ACTIONS;
function report(line) {
    console.log(line);
    if (ON_ACTIONS) console.log(`::notice title=Odds markets check::${line.replace(/%/g, '%25').replace(/\r?\n/g, ' ')}`);
}
const MARKET = 'player_goal_scorer_anytime';

async function get(path, key) {
    const sep = path.includes('?') ? '&' : '?';
    const response = await fetch(`${API}${path}${sep}apiKey=${encodeURIComponent(key)}`);
    const body = await response.text();
    let data = null;
    try { data = JSON.parse(body); } catch (e) { /* not JSON */ }
    return {
        ok: response.ok,
        status: response.status,
        data,
        message: data && data.message ? data.message : body.slice(0, 200),
        remaining: response.headers.get('x-requests-remaining'),
        cost: response.headers.get('x-requests-last')
    };
}

async function main() {
    const key = process.env.ODDS_API_KEY;
    if (!key) {
        console.log('ODDS_API_KEY not set');
        process.exit(1);
    }

    const events = await get('/events?dateFormat=iso', key);
    if (!events.ok) throw new Error(`events: HTTP ${events.status} ${events.message}`);
    const upcoming = events.data.filter(e => new Date(e.commence_time) > new Date())
        .sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    report(`1. Upcoming Premier League matches listed: ${upcoming.length} (free call)`);
    if (!upcoming.length) return;
    const event = upcoming[0];
    report(`   Checking: ${event.home_team} v ${event.away_team}, ${event.commence_time}`);

    const markets = await get(`/events/${event.id}/markets?regions=us`, key);
    report(`2. Markets list: HTTP ${markets.status}, cost ${markets.cost}, credits left ${markets.remaining}`);
    if (!markets.ok) {
        report(`   ${markets.message}`);
    } else {
        for (const book of markets.data.bookmakers || []) {
            console.log(`   ${book.key}: ${book.markets.map(m => m.key).join(', ')}`);
        }
        const offered = (markets.data.bookmakers || []).filter(b => b.markets.some(m => m.key === MARKET)).map(b => b.key);
        report(`   ${MARKET} offered by: ${offered.length ? offered.join(', ') : 'none listed (yet)'}`);
    }

    const odds = await get(`/events/${event.id}/odds?regions=us&markets=${MARKET}&oddsFormat=decimal`, key);
    report(`3. ${MARKET} odds: HTTP ${odds.status}, cost ${odds.cost}, credits left ${odds.remaining}`);
    if (!odds.ok) {
        report(`   ${odds.message}`);
        report(odds.status === 401 || odds.status === 403 || /plan|upgrade/i.test(odds.message)
            ? 'RESULT: not available on this plan'
            : 'RESULT: request failed, see message above');
        return;
    }
    const books = (odds.data.bookmakers || []).filter(b => (b.markets || []).some(m => m.key === MARKET));
    if (!books.length) {
        report('RESULT: allowed on this plan, but no bookmaker has priced this match yet; try closer to kickoff');
        return;
    }
    const outcomes = books[0].markets.find(m => m.key === MARKET).outcomes;
    report(`   ${books.length} bookmakers; sample from ${books[0].key}:`);
    report(`   ${outcomes.slice(0, 8).map(o => `${o.description || o.name} ${o.price}`).join(', ')}`);
    report('RESULT: available on this plan');
}

main().catch(error => {
    report(`RESULT: check failed: ${error.message}`);
    process.exit(1);
});
