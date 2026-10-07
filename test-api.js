// Quick API test script for FPL Analyzer
// Runs the real client (fpl-api.js, direct API access in Node), the prediction model (prediction.js)
// and the proxy handler (api/proxy.js)
// Usage: node test-api.js
const FPL_API = require('./fpl-api.js');
global.FPL_API = FPL_API; // prediction.js expects the browser global
const Predictor = require('./prediction.js');
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
    ['Model: scoring rules match the live game', async () => {
        const live = (await FPL_API.getBootstrapStatic()).game_config.scoring;
        const rules = Predictor.SCORING_RULES;
        for (const pos of ['GKP', 'DEF', 'MID', 'FWD']) {
            if (rules.goals[pos] !== live.goals_scored[pos]) throw new Error(`goals ${pos}: ${rules.goals[pos]} vs live ${live.goals_scored[pos]}`);
            if (rules.cleanSheets[pos] !== live.clean_sheets[pos]) throw new Error(`clean sheets ${pos}: ${rules.cleanSheets[pos]} vs live ${live.clean_sheets[pos]}`);
            if (live.defensive_contribution && rules.defensiveContribution[pos] !== live.defensive_contribution[pos]) {
                throw new Error(`defensive contribution ${pos}: ${rules.defensiveContribution[pos]} vs live ${live.defensive_contribution[pos]}`);
            }
        }
    }],
    ['Model: unavailable players project 0 for the next gameweek', async () => {
        const players = await FPL_API.getAllPlayers();
        const out = players.filter(p => p.chanceOfPlayingNextRound === 0 && p.minutes > 0).slice(0, 5);
        for (const p of out) {
            const { perGW } = await Predictor.projectPlayer(p);
            if (perGW[0] !== 0) throw new Error(`${p.name} (${p.status}, 0%) projects ${perGW[0]}`);
        }
        return `${out.length} checked`;
    }],
    ['Model: transfer plan respects budget, club limit and formation', async () => {
        const team = await FPL_API.getTeamComposition();
        const players = await FPL_API.getAllPlayers();
        const plan = await Predictor.getTransferPlan(team.picks, players, team.entryHistory.bank / 10);
        const ctx = await Predictor.getContext();
        for (const tr of plan.transfers) {
            if (tr.in.price > plan.bank + tr.out.sellingPrice + 1e-9) throw new Error(`${tr.in.name} over budget`);
            const squad = plan.squad.map(p => (p.id === tr.out.id ? tr.in : p));
            const perClub = {};
            for (const p of squad) perClub[p.teamId] = (perClub[p.teamId] || 0) + 1;
            if (Math.max(...Object.values(perClub)) > 3) throw new Error(`${tr.in.name} breaks the 3-per-club limit`);
            if (tr.in.position !== tr.out.position) throw new Error('position mismatch');
        }
        const lineup = Predictor.bestLineup(plan.squad.map(p => Predictor.projectPlayerSync(p, ctx)), 0);
        const count = pos => lineup.xi.filter(pr => pr.player.position === pos).length;
        if (lineup.xi.length !== 11 || count('GKP') !== 1 || count('DEF') < 3 || count('MID') < 2 || count('FWD') < 1) {
            throw new Error('invalid XI');
        }
        if (!(plan.freeTransfers >= 0 && plan.freeTransfers <= plan.maxFree)) throw new Error(`free transfers ${plan.freeTransfers}`);
        return `${plan.transfers.length} options, ${plan.freeTransfers} FT, XI ${lineup.points.toFixed(1)} pts`;
    }],
    ['Model: return date parsing', async () => {
        const d = Predictor.parseReturnDate('Hamstring injury - Expected back 18 Oct');
        if (!d || d.getUTCDate() !== 18 || d.getUTCMonth() !== 9) throw new Error(`got ${d}`);
        if (Predictor.parseReturnDate('Knock - 75% chance of playing') !== null) throw new Error('false match');
    }],
    ['Model: probability helpers', async () => {
        const close = (a, b) => Math.abs(a - b) < 1e-3;
        // Poisson(2): P(X>=1) = 1 - e^-2; E[floor(X/2)] = sum over k of P(k) * floor(k/2)
        if (!close(Predictor.probAtLeast(2, 1), 1 - Math.exp(-2))) throw new Error('probAtLeast');
        if (!close(Predictor.expectedPerN(2, 2), 0.7546)) throw new Error(`expectedPerN ${Predictor.expectedPerN(2, 2)}`);
        if (Predictor.probAtLeast(0, 10) !== 0 || Predictor.expectedPerN(0, 3) !== 0) throw new Error('zero rate');
        const total = Predictor.teamExpectedTotal([
            { player: { multiplier: 2 }, expectedPoints: 5 },
            { player: { multiplier: 1 }, expectedPoints: 3 },
            { player: { multiplier: 0 }, expectedPoints: 4 }
        ]);
        if (total !== 13) throw new Error(`teamExpectedTotal ${total}`);
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
