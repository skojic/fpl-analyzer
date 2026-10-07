// One-off check: does our The Odds API plan include anytime-goalscorer odds for the Premier League?
// Costs about 2 credits: listing events is free, the markets list of one match is 1 credit, and that
// match's anytime-goalscorer odds are 1 credit (only charged if the market is returned).
// Soccer player props come from US bookmakers only, so region "us" is used. The key is never printed.
//
// Usage: ODDS_API_KEY=... node scripts/check-odds-markets.js
const API = 'https://api.the-odds-api.com/v4/sports/soccer_epl';
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
    console.log(`1. Upcoming Premier League matches listed: ${upcoming.length} (free call)`);
    if (!upcoming.length) return;
    const event = upcoming[0];
    console.log(`   Checking: ${event.home_team} v ${event.away_team}, ${event.commence_time}`);

    const markets = await get(`/events/${event.id}/markets?regions=us`, key);
    console.log(`2. Markets list: HTTP ${markets.status}, cost ${markets.cost}, credits left ${markets.remaining}`);
    if (!markets.ok) {
        console.log(`   ${markets.message}`);
    } else {
        for (const book of markets.data.bookmakers || []) {
            console.log(`   ${book.key}: ${book.markets.map(m => m.key).join(', ')}`);
        }
        const offered = (markets.data.bookmakers || []).filter(b => b.markets.some(m => m.key === MARKET)).map(b => b.key);
        console.log(`   ${MARKET} offered by: ${offered.length ? offered.join(', ') : 'none listed (yet)'}`);
    }

    const odds = await get(`/events/${event.id}/odds?regions=us&markets=${MARKET}&oddsFormat=decimal`, key);
    console.log(`3. ${MARKET} odds: HTTP ${odds.status}, cost ${odds.cost}, credits left ${odds.remaining}`);
    if (!odds.ok) {
        console.log(`   ${odds.message}`);
        console.log(odds.status === 401 || odds.status === 403 || /plan|upgrade/i.test(odds.message)
            ? 'RESULT: not available on this plan'
            : 'RESULT: request failed, see message above');
        return;
    }
    const books = (odds.data.bookmakers || []).filter(b => (b.markets || []).some(m => m.key === MARKET));
    if (!books.length) {
        console.log('RESULT: allowed on this plan, but no bookmaker has priced this match yet; try closer to kickoff');
        return;
    }
    const outcomes = books[0].markets.find(m => m.key === MARKET).outcomes;
    console.log(`   ${books.length} bookmakers; sample from ${books[0].key}:`);
    for (const o of outcomes.slice(0, 8)) console.log(`   ${o.description || o.name}: ${o.price} (${Math.round(100 / o.price)}%)`);
    console.log('RESULT: available on this plan');
}

main().catch(error => {
    console.error(error.message);
    process.exit(1);
});
