/**
 * Sample for the live overall rank estimate (see Live.buildRankSample in live.js).
 * Built from about 30 overall-league standings pages and 150 managers' live scores, then shared by
 * every visitor through Vercel's CDN for 10 minutes, so the FPL API sees one build per 10 minutes.
 *
 * Usage: GET /api/rank
 */
global.FPL_API = require('../fpl-api.js');
const Live = require('../live.js');

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const log = console.log;
    console.log = () => {}; // fpl-api.js logs every request
    try {
        FPL_API.resetCache(); // fresh data on every build
        const gw = await Live.getGameweek();
        const sample = await Live.buildRankSample(gw);
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1800');
        return res.status(200).json(sample);
    } catch (error) {
        return res.status(502).json({ error: 'Rank sample failed', message: error.message });
    } finally {
        console.log = log;
    }
};
