/**
 * Serverless CORS Proxy for FPL API
 * Deployed on Vercel to bypass CORS restrictions
 * 
 * Usage: /api/proxy?url=https://fantasy.premierleague.com/api/...
 */

module.exports = async (req, res) => {
    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { url } = req.query;

    // Validate URL parameter
    if (!url) {
        res.status(400).json({ error: 'Missing url parameter' });
        return;
    }

    try {
        // Decode the URL
        const decodedUrl = decodeURIComponent(url);
        console.log('Proxying request to:', decodedUrl);

        // Only allow FPL API requests
        if (!decodedUrl.includes('fantasy.premierleague.com')) {
            res.status(400).json({ error: 'Only FPL API requests allowed' });
            return;
        }

        // Fetch from FPL API with proper headers
        const response = await fetch(decodedUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`FPL API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Set response headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min cache

        res.status(200).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(502).json({
            error: 'Failed to fetch from FPL API',
            message: error.message
        });
    }
};
