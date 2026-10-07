// Quick API test script for FPL Analyzer
// Runs the real client (fpl-api.js, direct API access in Node) and the proxy handler (api/proxy.js)
// Usage: node test-api.js
const FPL_API = require('./fpl-api.js');
const proxy = require('./api/proxy.js');

// Minimal stand-in for Vercel's request/response objects
function callProxy(query, method = 'GET') {
    return new Promise(resolve => {
        const res = {
            statusCode: 200,
            headers: {},
            setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
            status(code) { this.statusCode = code; return this; },
            json(body) { resolve({ status: this.statusCode, headers: this.headers, body }); return this; },
            end() { resolve({ status: this.statusCode, headers: this.headers, body: null }); return this; }
        };
        proxy({ method, query }, res);
    });
}

const BOOTSTRAP = `${FPL_API.BASE_URL}/bootstrap-static/`;

const tests = [
    ['Client: bootstrap-static', async () => {
        const data = await FPL_API.getBootstrapStatic();
        if (!data.elements || !data.elements.length) throw new Error('No players in response');
        return `${data.elements.length} players, current GW ${FPL_API.getCurrentGameweek(data)}`;
    }],
    ['Client: manager team', async () => {
        const data = await FPL_API.getManagerTeam();
        return `Team: ${data.name}`;
    }],
    ['Client: fixtures', async () => {
        const data = await FPL_API.getFixtures();
        return `${data.length} fixtures`;
    }],
    ['Proxy: forwards FPL request', async () => {
        const r = await callProxy({ url: BOOTSTRAP });
        if (r.status !== 200 || !r.body.elements) throw new Error(`Got ${r.status}: ${JSON.stringify(r.body).slice(0, 100)}`);
        return `200, cache-control: ${r.headers['cache-control']}`;
    }],
    ['Proxy: rejects missing url', async () => {
        const r = await callProxy({});
        if (r.status !== 400) throw new Error(`Expected 400, got ${r.status}`);
    }],
    ['Proxy: rejects other hosts', async () => {
        for (const url of [
            'https://evil.example/?fantasy.premierleague.com',
            'https://fantasy.premierleague.com.evil.example/api/',
            'http://fantasy.premierleague.com/api/bootstrap-static/',
            'https://fantasy.premierleague.com/drf/'
        ]) {
            const r = await callProxy({ url });
            if (r.status !== 400) throw new Error(`Expected 400 for ${url}, got ${r.status}`);
        }
    }],
    ['Proxy: rejects non-GET', async () => {
        const r = await callProxy({ url: BOOTSTRAP }, 'POST');
        if (r.status !== 405) throw new Error(`Expected 405, got ${r.status}`);
    }]
];

async function runTests() {
    let passed = 0;
    let failed = 0;

    for (const [name, fn] of tests) {
        try {
            const info = await fn();
            console.log(`✅ ${name}${info ? ` - ${info}` : ''}`);
            passed++;
        } catch (error) {
            console.log(`❌ ${name} - ${error.message}`);
            failed++;
        }
    }

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
