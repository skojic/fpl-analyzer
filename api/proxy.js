/**
 * Serverless CORS Proxy for FPL API
 * Deployed on Vercel to bypass CORS restrictions
 * 
 * Usage: /api/proxy?url=https://fantasy.premierleague.com/api/...
 */

module.exports = async (req, res) => {
    // CRITICAL: Set CORS headers IMMEDIATELY for ALL responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

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

        // Decode the URL
        const decodedUrl = decodeURIComponent(url);
        
        // Only allow FPL API requests
        if (!decodedUrl.includes('fantasy.premierleague.com')) {
            return res.status(400).json({ 
                error: 'Only FPL API requests allowed',
                url: decodedUrl
            });
        }

        console.log(`[Proxy] Fetching: ${decodedUrl}`);

        // Fetch from FPL API
        const response = await fetch(decodedUrl, {
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

        // Set cache header
        res.setHeader('Cache-Control', 'public, max-age=300');

        // Return data with CORS headers
        return res.status(200).json(data);

    } catch (error) {
        console.error('[Proxy] Error:', error);
        return res.status(502).json({
            error: 'Proxy error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
