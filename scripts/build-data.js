// Builds the data files the site loads, from the FPL API. Run daily by .github/workflows/data.yml.
//   data/recent-form.json  starts / minutes over the last matches for every player (minutes model)
//   data/ownership.json    effective ownership among the overall top managers, once per gameweek
// Files are rewritten only when their content changes.
//
// Usage: node scripts/build-data.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
global.FPL_API = require(path.join(root, 'fpl-api.js'));
const Predictor = require(path.join(root, 'prediction.js'));

const OVERALL_LEAGUE = 314;
const TOP_MANAGERS = 1000; // 20 standings pages, one picks request per manager

const say = console.log;
console.log = () => {};

// Run fn over items, a few at a time
async function pool(items, size, fn) {
    const queue = items.slice();
    await Promise.all(Array.from({ length: size }, async () => {
        while (queue.length) await fn(queue.shift());
    }));
}

function writeIfChanged(file, data) {
    const strip = d => JSON.stringify({ ...d, generated: undefined });
    let previous = null;
    try { previous = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { /* first run */ }
    if (previous && strip(previous) === strip(data)) {
        say(`${path.relative(root, file)} unchanged`);
        return;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data) + '\n');
    say(`${path.relative(root, file)} written`);
}

async function buildRecentForm(bootstrap) {
    const players = bootstrap.elements.filter(e => e.minutes > 0);
    const form = {};
    let failed = 0;
    await pool(players, 8, async e => {
        try {
            const recent = Predictor.recentFormFromHistory((await FPL_API.getPlayerDetails(e.id)).history);
            if (recent) form[e.id] = recent;
        } catch (error) {
            failed++;
        }
    });
    if (failed > players.length * 0.05) throw new Error(`recent form: ${failed} of ${players.length} players failed`);
    const lastFinishedEvent = Math.max(0, ...bootstrap.events.filter(e => e.finished).map(e => e.id));
    writeIfChanged(path.join(root, 'data', 'recent-form.json'), {
        generated: new Date().toISOString(),
        lastFinishedEvent,
        players: Object.fromEntries(Object.entries(form).sort(([a], [b]) => a - b))
    });
}

async function buildOwnership(bootstrap) {
    const current = bootstrap.events.find(e => e.is_current);
    if (!current) return say('ownership: season not started');
    const file = path.join(root, 'data', 'ownership.json');
    try {
        if (JSON.parse(fs.readFileSync(file, 'utf8')).gameweek === current.id) return say(`ownership: GW${current.id} already built`);
    } catch (e) { /* not built yet */ }

    const pages = Array.from({ length: Math.ceil(TOP_MANAGERS / 50) }, (_, i) => i + 1);
    const entries = [];
    await pool(pages, 4, async page => {
        const data = await FPL_API.getLeagueStandings(OVERALL_LEAGUE, page);
        entries.push(...data.standings.results.map(r => r.entry));
    });

    const stats = {};
    const chips = {};
    let sampled = 0;
    await pool(entries.slice(0, TOP_MANAGERS), 8, async entry => {
        try {
            const picks = await FPL_API.getEntryPicks(entry, current.id);
            sampled++;
            if (picks.active_chip) chips[picks.active_chip] = (chips[picks.active_chip] || 0) + 1;
            for (const p of picks.picks) {
                const s = stats[p.element] || (stats[p.element] = { owned: 0, starting: 0, captained: 0, multiplier: 0 });
                s.owned++;
                if (p.multiplier > 0) s.starting++;
                if (p.is_captain) s.captained++;
                s.multiplier += p.multiplier;
            }
        } catch (error) {
            /* a manager whose picks fail is left out of the sample */
        }
    });
    if (sampled < TOP_MANAGERS * 0.9) throw new Error(`ownership: only ${sampled} of ${TOP_MANAGERS} managers loaded`);

    const round = x => Math.round(x * 10000) / 10000;
    writeIfChanged(file, {
        generated: new Date().toISOString(),
        gameweek: current.id,
        sample: sampled,
        chips,
        players: Object.fromEntries(Object.entries(stats)
            .sort(([a], [b]) => a - b)
            .map(([id, s]) => [id, { eo: round(s.multiplier / sampled), owned: round(s.owned / sampled), captained: round(s.captained / sampled) }]))
    });
}

async function main() {
    const bootstrap = await FPL_API.getBootstrapStatic();
    await buildRecentForm(bootstrap);
    await buildOwnership(bootstrap);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
