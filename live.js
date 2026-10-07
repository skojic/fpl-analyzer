// Live gameweek: points as matches are played, provisional bonus, automatic substitutions
// and a live mini-league table
const Live = {
    // Bonus from BPS for a match whose bonus isn't confirmed yet: 3 / 2 / 1 to the top three, ties share
    provisionalBonus(fixture) {
        const bps = (fixture.stats || []).find(s => s.identifier === 'bps');
        if (!bps) return {};
        const rows = [...bps.h, ...bps.a].sort((a, b) => b.value - a.value);
        const bonus = {};
        let position = 1;
        for (let i = 0; i < rows.length && position <= 3;) {
            const group = rows.filter(r => r.value === rows[i].value);
            for (const r of group) bonus[r.element] = 4 - position;
            position += group.length;
            i += group.length;
        }
        return bonus;
    },

    // Everything needed to score any team in the gameweek
    async getGameweek() {
        const bootstrap = await FPL_API.getBootstrapStatic();
        const current = bootstrap.events.find(e => e.is_current);
        if (!current) throw new Error('The season has not started yet');
        const gameweek = current.id;
        const [live, fixtures] = await Promise.all([FPL_API.getEventLive(gameweek), FPL_API.getEventFixtures(gameweek)]);

        // Provisional bonus for matches that have started but whose bonus is not in the live points yet
        const extraBonus = {};
        for (const f of fixtures) {
            if (!f.started || f.finished) continue;
            for (const [element, b] of Object.entries(this.provisionalBonus(f))) {
                extraBonus[element] = (extraBonus[element] || 0) + b;
            }
        }

        const players = new Map();
        for (const e of live.elements) {
            const fixtureIds = e.explain.map(x => x.fixture);
            players.set(e.id, {
                id: e.id,
                minutes: e.stats.minutes,
                points: e.stats.total_points + (extraBonus[e.id] || 0),
                provisionalBonus: extraBonus[e.id] || 0,
                fixtureIds
            });
        }

        // A player is "done" when all his team's matches this gameweek are over (blank = done)
        const elementTeam = new Map(bootstrap.elements.map(e => [e.id, e.team]));
        const teamFixtures = {};
        for (const f of fixtures) {
            for (const team of [f.team_h, f.team_a]) (teamFixtures[team] = teamFixtures[team] || []).push(f);
        }
        const isDone = id => (teamFixtures[elementTeam.get(id)] || []).every(f => f.finished || f.finished_provisional);
        const isPlaying = id => (teamFixtures[elementTeam.get(id)] || []).some(f => f.started && !(f.finished || f.finished_provisional));

        return {
            gameweek,
            bootstrap,
            fixtures,
            players,
            isDone,
            isPlaying,
            inProgress: fixtures.some(f => f.started && !(f.finished || f.finished_provisional)),
            started: fixtures.some(f => f.started),
            finished: fixtures.length > 0 && fixtures.every(f => f.finished)
        };
    },

    // Live points of one team's picks: automatic substitutions for starters who didn't play once their
    // matches are over (keeping a valid formation), and the vice-captain if the captain didn't play
    scorePicks(picks, gw) {
        const typeOf = new Map(gw.bootstrap.elements.map(e => [e.id, e.element_type]));
        const minPlay = Object.fromEntries(gw.bootstrap.element_types.map(t => [t.id, t.squad_min_play]));
        const benchBoost = picks.active_chip === 'bboost';
        const tripleCaptain = picks.active_chip === '3xc';
        const live = id => gw.players.get(id) || { minutes: 0, points: 0, provisionalBonus: 0 };

        let xi = picks.picks.filter(p => p.position <= 11).map(p => p.element);
        let bench = picks.picks.filter(p => p.position > 11).sort((a, b) => a.position - b.position).map(p => p.element);
        const subs = [];

        if (!benchBoost) {
            for (const out of xi.slice()) {
                if (live(out).minutes > 0 || !gw.isDone(out)) continue;
                for (const candidate of bench) {
                    if (live(candidate).minutes === 0) continue;
                    const after = xi.map(id => (id === out ? candidate : id));
                    const isKeeper = id => typeOf.get(id) === 1;
                    if (isKeeper(out) !== isKeeper(candidate)) continue;
                    const counts = {};
                    for (const id of after) counts[typeOf.get(id)] = (counts[typeOf.get(id)] || 0) + 1;
                    if (Object.entries(minPlay).some(([type, min]) => (counts[type] || 0) < min)) continue;
                    xi = after;
                    bench = bench.filter(id => id !== candidate);
                    subs.push({ out, in: candidate });
                    break;
                }
            }
        }

        const captain = picks.picks.find(p => p.is_captain);
        const vice = picks.picks.find(p => p.is_vice_captain);
        const captainOut = captain && live(captain.element).minutes === 0 && gw.isDone(captain.element);
        const armband = captainOut && vice && xi.includes(vice.element) ? vice.element : captain && captain.element;
        const counted = benchBoost ? picks.picks.map(p => p.element) : xi;

        let points = 0;
        const rows = picks.picks.map(p => {
            const playing = counted.includes(p.element);
            const multiplier = !playing ? 0 : p.element === armband ? (tripleCaptain ? 3 : 2) : 1;
            const l = live(p.element);
            points += l.points * multiplier;
            return {
                element: p.element,
                position: p.position,
                multiplier,
                isCaptain: p.element === armband,
                minutes: l.minutes,
                points: l.points,
                provisionalBonus: l.provisionalBonus,
                done: gw.isDone(p.element),
                playing: gw.isPlaying(p.element),
                subbedIn: subs.some(s => s.in === p.element),
                subbedOut: subs.some(s => s.out === p.element)
            };
        });

        const history = picks.entry_history || {};
        const hits = history.event_transfers_cost || 0;
        // FPL's gameweek points are before hits: total = previous total + points - hits
        const previousTotal = (history.total_points || 0) - (history.points || 0) + hits;
        return { points, hits, net: points - hits, previousTotal, total: previousTotal + points - hits, rows, subs, chip: picks.active_chip };
    },

    // Live table for a classic league (first 50 managers)
    async leagueTable(leagueId, gw) {
        const standings = (await FPL_API.getLeagueStandings(leagueId)).standings.results;
        const queue = standings.slice();
        const rows = [];
        await Promise.all(Array.from({ length: 6 }, async () => {
            while (queue.length) {
                const r = queue.shift();
                try {
                    const score = this.scorePicks(await FPL_API.getEntryPicks(r.entry, gw.gameweek), gw);
                    rows.push({ entry: r.entry, team: r.entry_name, manager: r.player_name, startRank: r.last_rank || r.rank, ...score });
                } catch (error) {
                    console.error(error.message);
                }
            }
        }));
        rows.sort((a, b) => b.total - a.total);
        rows.forEach((r, i) => { r.liveRank = i + 1; });
        return rows;
    }
};

if (typeof module !== 'undefined') module.exports = Live;
