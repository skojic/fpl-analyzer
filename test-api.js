// Quick API test script for FPL Analyzer
// Runs the real client (fpl-api.js, direct API access in Node), the prediction model (prediction.js)
// and the proxy handler (api/proxy.js)
// Usage: node test-api.js
const FPL_API = require('./fpl-api.js');
global.FPL_API = FPL_API; // prediction.js expects the browser global
const Predictor = require('./prediction.js');
global.Predictor = Predictor; // league.js expects the browser global
const League = require('./league.js');
const Live = require('./live.js');
const Odds = require('./scripts/build-odds.js');
const Contrast = require('./scripts/contrast.js');
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
    ['Planner: multi-week plan respects locks, bans, budget and club limit', async () => {
        const team = await FPL_API.getTeamComposition();
        const players = await FPL_API.getAllPlayers();
        const bank = team.entryHistory.bank / 10;
        const first = await Predictor.planTransfers(team.picks, players, bank);
        const bought = first.steps.flatMap(st => st.moves.map(m => m.in.id));
        const sold = first.steps.flatMap(st => st.moves.map(m => m.out.id));
        const prefs = { locked: sold.slice(0, 1), banned: bought.slice(0, 1) };
        const plan = await Predictor.planTransfers(team.picks, players, bank, prefs);

        let squad = plan.squad.slice();
        let money = plan.bank;
        const sell = { ...plan.sellingPrice };
        for (const st of plan.steps) {
            if (st.moves.length > 2) throw new Error(`GW${st.gw}: ${st.moves.length} moves`);
            for (const m of st.moves) {
                if (prefs.locked.includes(m.out.id)) throw new Error(`sold locked ${m.out.name}`);
                if (prefs.banned.includes(m.in.id)) throw new Error(`bought banned ${m.in.name}`);
                money += sell[m.out.id] - m.in.price;
                sell[m.in.id] = m.in.price;
                squad = squad.map(p => (p.id === m.out.id ? m.in : p));
            }
            if (money < -1e-9) throw new Error(`GW${st.gw}: bank ${money.toFixed(1)}`);
            const perClub = {};
            for (const p of squad) perClub[p.teamId] = (perClub[p.teamId] || 0) + 1;
            if (Math.max(...Object.values(perClub)) > 3) throw new Error(`GW${st.gw}: club limit`);
        }
        if (plan.gain < 0) throw new Error(`plan worse than rolling: ${plan.gain}`);
        return `+${first.gain} pts, with lock/ban +${plan.gain}`;
    }],
    ['Optimizer: Wildcard / Free Hit squads are valid and beat your squad', async () => {
        const team = await FPL_API.getTeamComposition();
        const players = await FPL_API.getAllPlayers();
        const report = await Predictor.getSquadReport(team.picks, players, team.entryHistory.bank / 10);
        for (const [name, result] of [['wildcard', report.wildcard], ['free hit', report.freeHit]]) {
            if (!result) throw new Error(`no ${name} squad`);
            const squad = result.squad.map(pr => pr.player);
            const shape = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
            for (const p of squad) shape[p.position]++;
            if (squad.length !== 15 || shape.GKP !== 2 || shape.DEF !== 5 || shape.MID !== 5 || shape.FWD !== 3) throw new Error(`${name}: shape ${JSON.stringify(shape)}`);
            if (new Set(squad.map(p => p.id)).size !== 15) throw new Error(`${name}: duplicate player`);
            if (result.cost > report.budget + 1e-9) throw new Error(`${name}: £${result.cost}m over £${report.budget}m`);
            const perClub = {};
            for (const p of squad) perClub[p.teamId] = (perClub[p.teamId] || 0) + 1;
            if (Math.max(...Object.values(perClub)) > 3) throw new Error(`${name}: club limit`);
            if (result.gain < -1e-9) throw new Error(`${name} worse than your squad (${result.gain})`);
        }
        if (!(report.rating > 0 && report.rating <= 100)) throw new Error(`rating ${report.rating}`);
        return `rating ${report.rating}, wildcard +${report.wildcard.gain.toFixed(1)}, free hit +${report.freeHit.gain.toFixed(1)}`;
    }],
    ['Optimizer: chip calendar', async () => {
        const team = await FPL_API.getTeamComposition();
        const players = await FPL_API.getAllPlayers();
        const cal = await Predictor.getChipCalendar(team.picks, players, team.entryHistory.bank / 10);
        if (!cal) return 'no open chip window';
        for (const w of cal.weeks) {
            if (w.bboost < 0 || w['3xc'] < 0 || (w.freehit !== null && w.freehit < -1e-9)) throw new Error(`GW${w.gameweek}: negative chip value`);
        }
        for (const [chip, gw] of Object.entries(cal.best)) {
            if (!cal.available.includes(chip) || !cal.weeks.some(w => w.gameweek === gw)) throw new Error(`best ${chip} GW${gw}`);
        }
        return `${cal.weeks.length} weeks to GW${cal.deadline}, best ${JSON.stringify(cal.best)}`;
    }],
    ['League: effective ownership adds up per rival', async () => {
        const leagues = await League.getMyLeagues();
        if (!leagues.length) return 'no leagues';
        const a = await League.analyze(leagues[0].id);
        // Each rival fields 11 starters plus a captain (x2), more with Triple Captain / Bench Boost
        const total = a.rows.reduce((sum, r) => sum + r.eo, 0);
        if (total < 11.9 || total > 16.1) throw new Error(`EO sums to ${total.toFixed(2)} per rival`);
        for (const r of a.rows) {
            if (Math.abs(r.exposure - (r.yours - r.eo) * r.xPts) > 1e-9) throw new Error(`exposure of ${r.player.name}`);
        }
        return `${a.league.name}: ${a.rivalsSampled} rivals, EO total ${(total * 100).toFixed(0)}%`;
    }],
    ['Live: provisional bonus matches confirmed bonus', async () => {
        const gw = (await FPL_API.getBootstrapStatic()).events.filter(e => e.finished).pop();
        if (!gw) return 'no finished gameweek';
        const [live, fixtures] = await Promise.all([FPL_API.getEventLive(gw.id), FPL_API.getEventFixtures(gw.id)]);
        const actual = {};
        for (const e of live.elements) for (const x of e.explain) for (const st of x.stats) if (st.identifier === 'bonus') actual[`${x.fixture}:${e.id}`] = st.value;
        for (const f of fixtures) {
            const computed = Live.provisionalBonus(f);
            const keys = new Set([...Object.keys(computed).map(id => `${f.id}:${id}`), ...Object.keys(actual).filter(k => k.startsWith(`${f.id}:`))]);
            for (const k of keys) {
                const id = k.split(':')[1];
                if ((computed[id] || 0) !== (actual[k] || 0)) throw new Error(`GW${gw.id} fixture ${f.id} player ${id}: ${computed[id] || 0} vs ${actual[k] || 0}`);
            }
        }
        return `GW${gw.id}: ${fixtures.length} matches`;
    }],
    ['Live: league table matches official totals after the gameweek', async () => {
        const gw = await Live.getGameweek();
        if (!gw.finished) return `GW${gw.gameweek} still in progress, skipped`;
        const leagues = await League.getMyLeagues();
        if (!leagues.length) return 'no leagues';
        const table = await Live.leagueTable(leagues[0].id, gw);
        const official = new Map((await FPL_API.getLeagueStandings(leagues[0].id)).standings.results.map(r => [r.entry, r]));
        for (const r of table) {
            const o = official.get(r.entry);
            if (o.total !== r.total || o.event_total !== r.points) throw new Error(`${r.team}: ${r.points}/${r.total} vs ${o.event_total}/${o.total}`);
        }
        return `${table.length} managers`;
    }],
    ['Odds: market maths and team names', async () => {
        const close = (a, b, tol = 0.002) => Math.abs(a - b) < tol;
        const market = { home: 0.45, draw: 0.27, away: 0.28, over25: 0.5 };
        const g = Odds.expectedGoals(market);
        if (!close(Odds.pOver25(g.total), 0.5)) throw new Error(`total ${g.total}`);
        const o = Odds.outcome(g.home, g.away);
        if (!close(o.pHome / (o.pHome + o.pAway), 0.45 / 0.73)) throw new Error('home share');
        const bootstrap = await FPL_API.getBootstrapStatic();
        const keys = new Set(bootstrap.teams.map(t => Odds.teamKey(t.name)));
        if (keys.size !== bootstrap.teams.length) throw new Error('two FPL teams share a key');
        for (const [oddsName, fplShort] of [['Manchester City', 'MCI'], ['Manchester United', 'MUN'], ['Tottenham Hotspur', 'TOT'],
            ['Nottingham Forest', 'NFO'], ['Brighton and Hove Albion', 'BHA'], ['AFC Bournemouth', 'BOU'], ['Leeds United', 'LEE']]) {
            const team = bootstrap.teams.find(t => t.short_name === fplShort);
            if (team && Odds.teamKey(oddsName) !== Odds.teamKey(team.name)) throw new Error(`${oddsName} does not map to ${team.name}`);
        }
        return `even-ish match -> ${g.home.toFixed(2)} v ${g.away.toFixed(2)}`;
    }],
    ['Odds: sample market maps to a fixture and is blended into the model', async () => {
        const [bootstrap, fixtures] = await Promise.all([FPL_API.getBootstrapStatic(), FPL_API.getFixtures()]);
        const f = fixtures.find(x => !x.finished && x.event);
        if (!f) return 'no upcoming fixture';
        const name = id => bootstrap.teams.find(t => t.id === id).name;
        const event = {
            home_team: name(f.team_h), away_team: name(f.team_a), commence_time: f.kickoff_time,
            bookmakers: [{ markets: [
                { key: 'h2h', outcomes: [{ name: name(f.team_h), price: 1.5 }, { name: 'Draw', price: 4.5 }, { name: name(f.team_a), price: 7 }] },
                { key: 'totals', outcomes: [{ name: 'Over', point: 2.5, price: 1.7 }, { name: 'Under', point: 2.5, price: 2.2 }] }
            ] }]
        };
        const { fixtures: matched, unmatched } = Odds.buildOdds([event], bootstrap, fixtures);
        if (!matched[f.id] || unmatched.length) throw new Error('sample event not matched to its fixture');
        const plain = Predictor.buildContext(bootstrap, fixtures, null, 5);
        const withOdds = Predictor.buildContext(bootstrap, fixtures, null, 5, matched);
        const a = Predictor.fixtureGoals(f.team_h, f.team_a, true, f.id, plain);
        const b = Predictor.fixtureGoals(f.team_h, f.team_a, true, f.id, withOdds);
        const target = matched[f.id].goalsHome;
        const between = (x, lo, hi) => x >= Math.min(lo, hi) - 1e-9 && x <= Math.max(lo, hi) + 1e-9;
        if (!b.fromOdds || !between(b.scored, a.scored, target)) throw new Error(`blend ${b.scored} not between ${a.scored} and ${target}`);
        return `home xG ${a.scored.toFixed(2)} (model) -> ${b.scored.toFixed(2)} (odds ${target.toFixed(2)})`;
    }],
    ['Design: theme colours meet WCAG AA contrast in light and dark', async () => {
        const failed = Contrast.check().filter(r => !r.ok);
        if (failed.length) throw new Error(failed.map(r => `${r.theme} ${r.what}: ${r.ratio} < ${r.min}`).join('; '));
        return `${Contrast.check().length} pairs`;
    }],
    ['Live: overall rank estimate matches official ranks after the gameweek', async () => {
        const gw = await Live.getGameweek();
        if (!gw.finished) return `GW${gw.gameweek} still in progress, skipped`;
        const sample = await Live.buildRankSample(gw);
        const entries = new Set([FPL_API.TEAM_ID]);
        for (const page of [3, 400, 20000, 100000, 180000]) {
            (await FPL_API.getLeagueStandings(314, page)).standings.results.slice(0, 3).forEach(r => entries.add(r.entry));
        }
        const errors = [];
        for (const entry of entries) {
            const picks = await FPL_API.getEntryPicks(entry, gw.gameweek);
            const official = picks.entry_history.overall_rank;
            const estimate = Live.estimateRank(sample, Live.scorePicks(picks, gw).total);
            errors.push(Math.abs(estimate / official - 1));
        }
        errors.sort((a, b) => a - b);
        const median = errors[Math.floor(errors.length / 2)];
        if (median > 0.05) throw new Error(`median error ${(median * 100).toFixed(1)}%`);
        return `${errors.length} managers, median error ${(median * 100).toFixed(1)}%, worst ${(errors[errors.length - 1] * 100).toFixed(1)}%`;
    }],
    ['Model: blank and double gameweeks are detected and projected', async () => {
        const [bootstrap, fixtures] = await Promise.all([FPL_API.getBootstrapStatic(), FPL_API.getFixtures()]);
        const next = bootstrap.events.find(e => e.is_next);
        if (!next) return 'season over';
        // Simulate: move one match of the next gameweek two weeks later -> blank now, double then
        const moved = fixtures.find(f => f.event === next.id);
        const later = next.id + 2;
        const simulated = fixtures.map(f => (f === moved ? { ...f, event: later } : f));
        const ctx = Predictor.buildContext(bootstrap, simulated, null, 5);
        const players = await FPL_API.getAllPlayers();
        const home = players.find(p => p.teamId === moved.team_h && p.status === 'a' && p.minutes > 300);
        const result = Predictor.specialGameweeks(ctx, simulated, [home]);
        const blankWeek = result.weeks.find(w => w.gameweek === next.id);
        const doubleWeek = result.weeks.find(w => w.gameweek === later);
        if (!blankWeek || blankWeek.blankTeams.length !== 2 || !blankWeek.yourBlank.includes(home.name)) throw new Error('blank not detected');
        if (!doubleWeek || doubleWeek.doubleTeams.length !== 2 || !doubleWeek.yourDouble.includes(home.name)) throw new Error('double not detected');
        const pr = Predictor.projectPlayerSync(home, ctx);
        if (pr.perGW[0] !== 0) throw new Error(`blank week projects ${pr.perGW[0]}`);
        if (pr.fixtures.filter(f => f.event === later).length !== 2) throw new Error('double week should have two fixtures');
        return `${home.name}: GW${next.id} blank 0 pts, GW${later} double ${pr.perGW[2].toFixed(1)} pts`;
    }],
    ['Lineup: suggested XI, captain and bench order are valid', async () => {
        const team = await FPL_API.getTeamComposition();
        const players = await FPL_API.getAllPlayers();
        const s = await Predictor.suggestLineup(team.picks, players, team.entryHistory.bank / 10);
        if (!s) return 'no next gameweek';
        const count = pos => s.xi.filter(p => p.position === pos).length;
        if (s.xi.length !== 11 || s.bench.length !== 4) throw new Error(`${s.xi.length} starters, ${s.bench.length} on the bench`);
        if (count('GKP') !== 1 || count('DEF') < 3 || count('MID') < 2 || count('FWD') < 1) throw new Error('invalid formation');
        if (s.bench[0].position !== 'GKP') throw new Error('backup goalkeeper should be first on the bench');
        const outfield = s.bench.slice(1).map(p => p.xPts);
        if (outfield.some((x, i) => i > 0 && x > outfield[i - 1] + 1e-9)) throw new Error('bench not ordered by projected points');
        const captain = s.xi.find(p => p.isCaptain);
        if (!captain || s.xi.some(p => p.xPts > captain.xPts + 1e-9)) throw new Error('captain is not the highest projection');
        if (!s.xi.some(p => p.isViceCaptain)) throw new Error('no vice-captain');
        if (s.gain < -1e-9) throw new Error(`suggestion worse than current lineup (${s.gain})`);
        return `GW${s.gameweek}: ${s.points.toFixed(1)} xPts (+${s.gain.toFixed(1)}), C ${captain.name}, bench ${s.bench.map(p => p.name).join(', ')}`;
    }],
    ['Odds: bookmaker team ratings are recovered and used for unpriced matches', async () => {
        const [bootstrap, fixtures] = await Promise.all([FPL_API.getBootstrapStatic(), FPL_API.getFixtures()]);
        const base = Predictor.buildContext(bootstrap, fixtures, null, 5, {});
        // Made-up "true" strengths, and odds-implied goals that follow them exactly, for the next 3 gameweeks
        const truth = {};
        bootstrap.teams.forEach((t, i) => { truth[t.id] = { attack: 0.8 + 0.4 * ((i * 7) % 20) / 19, defence: 0.8 + 0.4 * ((i * 11) % 20) / 19 }; });
        const H = Predictor.HOME_ADVANTAGE;
        const gws = base.horizon.slice(0, 3).map(g => g.id);
        const odds = {};
        for (const f of fixtures.filter(x => gws.includes(x.event))) {
            odds[f.id] = { event: f.event, home: f.team_h, away: f.team_a,
                goalsHome: base.leagueAvg * truth[f.team_h].attack * truth[f.team_a].defence * H,
                goalsAway: base.leagueAvg * truth[f.team_a].attack * truth[f.team_h].defence / H };
        }
        const saved = Predictor.MARKET_PRIOR_MATCHES;
        Predictor.MARKET_PRIOR_MATCHES = 0.01; // almost no pull to the model: the fit should find the truth
        const ctx = Predictor.buildContext(bootstrap, fixtures, null, 5, {}, odds);
        Predictor.MARKET_PRIOR_MATCHES = saved;
        // Attack and defence are only identified up to a common factor: compare products, as the model uses them
        let worst = 0;
        for (const f of Object.values(odds)) {
            const fit = ctx.market[f.home].attack * ctx.market[f.away].defence;
            const real = truth[f.home].attack * truth[f.away].defence;
            worst = Math.max(worst, Math.abs(fit / real - 1));
        }
        if (worst > 0.02) throw new Error(`fit off by ${(worst * 100).toFixed(1)}%`);

        // An unpriced later match moves towards the bookmaker view
        const later = fixtures.find(f => f.event === base.horizon[4].id);
        const plain = Predictor.fixtureGoals(later.team_h, later.team_a, true, later.id, base);
        const withMarket = Predictor.fixtureGoals(later.team_h, later.team_a, true, later.id, ctx);
        const target = base.leagueAvg * truth[later.team_h].attack * truth[later.team_a].defence * H;
        const between = (x, lo, hi) => x >= Math.min(lo, hi) - 1e-9 && x <= Math.max(lo, hi) + 1e-9;
        if (!withMarket.fromMarket || !between(withMarket.scored, plain.scored, target)) throw new Error('unpriced match not moved towards the market');
        return `fit within ${(worst * 100).toFixed(2)}% on ${Object.keys(odds).length} matches; GW${later.event} home xG ${plain.scored.toFixed(2)} -> ${withMarket.scored.toFixed(2)}`;
    }],
    ['Matches: next gameweek predictions are consistent', async () => {
        const r = await Predictor.getMatchPredictions();
        if (!r) return 'no next gameweek';
        const fixtures = (await FPL_API.getFixtures()).filter(f => f.event === r.gameweek);
        if (r.matches.length !== fixtures.length) throw new Error(`${r.matches.length} matches vs ${fixtures.length} fixtures`);
        for (const m of r.matches) {
            const sum = m.model.home + m.model.draw + m.model.away;
            if (Math.abs(sum - 1) > 1e-6) throw new Error(`${m.home.shortName} v ${m.away.shortName}: model chances sum to ${sum}`);
            if ((m.model.goalsHome > m.model.goalsAway) !== (m.model.home > m.model.away)) throw new Error('favourite does not follow expected goals');
            if (m.bookmakers && Math.abs(m.bookmakers.home + m.bookmakers.draw + m.bookmakers.away - 1) > 0.01) throw new Error('bookmaker chances do not sum to 1');
        }
        // Poisson sanity: equal teams -> equal win chances; a much stronger home side is a clear favourite
        const even = Predictor.outcomeProbabilities(1.4, 1.4);
        const strong = Predictor.outcomeProbabilities(2.5, 0.6);
        if (Math.abs(even.home - even.away) > 1e-9 || strong.home < 0.7) throw new Error('outcome probabilities off');
        return `GW${r.gameweek}: ${r.matches.length} matches, ${r.matches.filter(m => m.bookmakers).length} with odds`;
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
