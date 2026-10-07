/**
 * Serverless proxy for the FPL API
 * Deployed on Vercel alongside the static site, so the browser calls it same-origin
 *
 * Usage: /api/proxy?url=https://fantasy.premierleague.com/api/...
 */

const ALLOWED_HOST = 'fantasy.premierleague.com';

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Method not allowed',
            method: req.method
        });
    }

    try {
        const { url } = req.query;

        // Validate URL parameter exists
        if (!url) {
            return res.status(400).json({ error: 'Missing url parameter' });
        }

        // Only allow FPL API requests (query values arrive already decoded)
        let target;
        try {
            target = new URL(url);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid url parameter' });
        }
        if (target.protocol !== 'https:' || target.hostname !== ALLOWED_HOST || !target.pathname.startsWith('/api/')) {
            return res.status(400).json({
                error: 'Only FPL API requests allowed',
                url
            });
        }

        console.log(`[Proxy] Fetching: ${target.href}`);

        // Fetch from FPL API
        const response = await fetch(target.href, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });

        // Read response body
        const responseText = await response.text();

        // Log response status
        console.log(`[Proxy] Response status: ${response.status}`);

        if (!response.ok) {
            console.error(`[Proxy] Error: ${response.status} - ${responseText.substring(0, 100)}`);
            return res.status(response.status).json({
                error: `FPL API returned ${response.status}`,
                statusText: response.statusText
            });
        }

        // Parse JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error(`[Proxy] JSON parse error: ${e.message}`);
            return res.status(502).json({
                error: 'Invalid JSON response from FPL API',
                message: e.message
            });
        }

        // Cache in the browser and on Vercel's CDN, so repeat requests skip the function.
        // Live gameweek data (live points, a gameweek's fixtures) is kept for a minute only.
        const live = /^\/api\/event\/\d+\/live\/$/.test(target.pathname) || (target.pathname === '/api/fixtures/' && target.searchParams.has('event'));
        const ttl = live ? 60 : 300;
        res.setHeader('Cache-Control', `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`);

        return res.status(200).json(data);

    } catch (error) {
        console.error('[Proxy] Error:', error);
        return res.status(502).json({
            error: 'Proxy error',
            message: error.message
        });
    }
};
