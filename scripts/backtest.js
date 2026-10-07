// Backtest of the prediction model on this season's finished gameweeks.
// For each gameweek g it rebuilds every player's stats from matches before g (element-summary history),
// projects g with the real model and compares with the points actually scored.
// Availability flags are not historical, so everyone is treated as available: this measures the
// model given availability, the same way for the model and the baselines.
//
// Usage: node scripts/backtest.js [output.json]     (default: data/accuracy.json)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
global.FPL_API = require(path.join(root, 'fpl-api.js'));
const Predictor = require(path.join(root, 'prediction.js'));

const quiet = console.log;
console.log = () => {};

const SUM_FIELDS = ['minutes', 'starts', 'saves', 'bonus', 'bps', 'yellow_cards', 'red_cards', 'goals_scored', 'assists',
    'clean_sheets', 'goals_conceded', 'defensive_contribution', 'total_points', 'tackles', 'recoveries', 'clearances_blocks_interceptions'];
const FLOAT_FIELDS = ['expected_goals', 'expected_assists', 'expected_goal_involvements', 'expected_goals_conceded'];

function stats(pairs) {
    const n = pairs.length;
    if (!n) return null;
    const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
    const p = pairs.map(x => x[0]);
    const a = pairs.map(x => x[1]);
    const mp = mean(p);
    const ma = mean(a);
    const cov = pairs.reduce((s, [x, y]) => s + (x - mp) * (y - ma), 0);
    const vp = p.reduce((s, x) => s + (x - mp) ** 2, 0);
    const va = a.reduce((s, y) => s + (y - ma) ** 2, 0);
    const round = x => Math.round(x * 1000) / 1000;
    return {
        n,
        mae: round(mean(pairs.map(([x, y]) => Math.abs(x - y)))),
        rmse: round(Math.sqrt(mean(pairs.map(([x, y]) => (x - y) ** 2)))),
        corr: round(vp && va ? cov / Math.sqrt(vp * va) : 0),
        bias: round(mp - ma)
    };
}

// Average actual points of the top-k players by a ranking (how good the picks at the top are)
function topK(rows, key, k = 10) {
    const top = rows.slice().sort((x, y) => y[key] - x[key]).slice(0, k);
    return Math.round((top.reduce((s, r) => s + r.actual, 0) / top.length) * 100) / 100;
}

async function main() {
    const out = process.argv[2] || path.join(root, 'data', 'accuracy.json');
    const [bootstrap, fixtures] = await Promise.all([FPL_API.getBootstrapStatic(), FPL_API.getFixtures()]);
    const finished = bootstrap.events.filter(e => e.finished && e.data_checked).map(e => e.id);
    const gameweeks = finished.filter(g => g >= 2);
    if (!gameweeks.length) throw new Error('No finished gameweeks to test yet');

    // Match history for everyone who has played this season
    const players = bootstrap.elements.filter(e => e.minutes > 0);
    const history = {};
    const queue = players.slice();
    await Promise.all(Array.from({ length: 8 }, async () => {
        while (queue.length) {
            const e = queue.shift();
            try {
                history[e.id] = (await FPL_API.getPlayerDetails(e.id)).history || [];
            } catch (error) {
                history[e.id] = [];
            }
        }
    }));

    const results = [];
    for (const g of gameweeks) {
        // Season as it stood before gameweek g
        const elements = bootstrap.elements.map(e => {
            const rows = (history[e.id] || []).filter(r => r.round < g);
            const raw = { ...e, status: 'a', chance_of_playing_next_round: null, chance_of_playing_this_round: null, news: '' };
            for (const f of SUM_FIELDS) raw[f] = rows.reduce((s, r) => s + (r[f] || 0), 0);
            for (const f of FLOAT_FIELDS) raw[f] = String(rows.reduce((s, r) => s + (parseFloat(r[f]) || 0), 0));
            const played = rows.filter(r => r.minutes > 0).length;
            raw.points_per_game = String(played ? raw.total_points / played : 0);
            raw.form = String(rows.slice(-4).reduce((s, r) => s + r.total_points, 0) / Math.max(1, rows.slice(-4).length));
            return raw;
        });
        const asOf = { ...bootstrap, elements };
        const fixturesAsOf = fixtures.map(f => ({ ...f, finished: f.event !== null && f.event < g, finished_provisional: false }));
        const ctx = Predictor.buildContext(asOf, fixturesAsOf, g);

        Predictor.recentForm = {};
        const rows = [];
        for (const raw of elements) {
            const before = (history[raw.id] || []).filter(r => r.round < g);
            const during = (history[raw.id] || []).filter(r => r.round === g);
            if (!before.some(r => r.minutes > 0) && !during.some(r => r.minutes > 0)) continue;

            Predictor.recentForm[raw.id] = Predictor.recentFormFromHistory(before);

            const player = FPL_API.formatPlayer(raw, asOf.teams, asOf.element_types);
            const projected = Predictor.projectPlayerSync(player, ctx).perGW[0] || 0;
            const actual = during.reduce((s, r) => s + r.total_points, 0);
            const fixturesInGW = (ctx.fixturesByTeam[player.teamId] || {})[g] || [];

            // Baselines: points per appearance x appearance rate so far, and average points of the last 4 matches
            const appearances = before.filter(r => r.minutes > 0).length;
            const ppg = appearances ? raw.total_points / appearances : 0;
            const rate = before.length ? appearances / before.length : 0;
            rows.push({
                id: raw.id,
                projected,
                actual,
                ppg: ppg * rate * fixturesInGW.length,
                form: parseFloat(raw.form) * fixturesInGW.length
            });
        }

        results.push({
            gameweek: g,
            model: stats(rows.map(r => [r.projected, r.actual])),
            baselinePPG: stats(rows.map(r => [r.ppg, r.actual])),
            baselineForm: stats(rows.map(r => [r.form, r.actual])),
            top10Actual: { model: topK(rows, 'projected'), ppg: topK(rows, 'ppg'), form: topK(rows, 'form') }
        });
    }

    const pooled = key => {
        const all = results.map(r => r[key]).filter(Boolean);
        const n = all.reduce((s, r) => s + r.n, 0);
        const w = f => Math.round((all.reduce((s, r) => s + r[f] * r.n, 0) / n) * 1000) / 1000;
        return { n, mae: w('mae'), rmse: w('rmse'), corr: w('corr'), bias: w('bias') };
    };
    const avgTop = key => Math.round((results.reduce((s, r) => s + r.top10Actual[key], 0) / results.length) * 100) / 100;
    const report = {
        generated: new Date().toISOString(),
        note: 'Projections rebuilt from match history before each gameweek; everyone treated as available.',
        overall: {
            model: pooled('model'),
            baselinePPG: pooled('baselinePPG'),
            baselineForm: pooled('baselineForm'),
            top10Actual: { model: avgTop('model'), ppg: avgTop('ppg'), form: avgTop('form') }
        },
        gameweeks: results
    };

    // Only rewrite when the results change, so the daily job doesn't commit (and deploy) for a timestamp
    const strip = r => JSON.stringify({ ...r, generated: undefined });
    let previous = null;
    try { previous = JSON.parse(fs.readFileSync(out, 'utf8')); } catch (e) { /* first run */ }
    const changed = !previous || strip(previous) !== strip(report);
    if (changed) {
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
    }

    const line = (name, s) => `${name.padEnd(14)} MAE ${s.mae.toFixed(2)}  RMSE ${s.rmse.toFixed(2)}  corr ${s.corr.toFixed(2)}  bias ${s.bias >= 0 ? '+' : ''}${s.bias.toFixed(2)}`;
    quiet(`Backtest GW${gameweeks[0]}-${gameweeks[gameweeks.length - 1]}, ${report.overall.model.n} player-gameweeks`);
    quiet(line('Model', report.overall.model));
    quiet(line('Baseline PPG', report.overall.baselinePPG));
    quiet(line('Baseline form', report.overall.baselineForm));
    quiet(`Top-10 picks' actual points per GW: model ${report.overall.top10Actual.model}, PPG ${report.overall.top10Actual.ppg}, form ${report.overall.top10Actual.form}`);
    for (const r of results) quiet(`  GW${r.gameweek}: ${line('model', r.model)} | form MAE ${r.baselineForm.mae.toFixed(2)} | top-10 ${r.top10Actual.model} vs ${r.top10Actual.form}`);
    quiet(changed ? `Saved ${path.relative(root, out)}` : 'Results unchanged, file not rewritten');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
