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

    // ── Overall rank estimate ────────────────────────────────────────────────
    // FPL only publishes overall ranks after a gameweek is processed. While it is live, the rank is
    // estimated from a sample of the overall league: standings totals at spread-out ranks, and for a
    // few managers on each sampled page the gap between their live score and the gameweek points the
    // standings already include. Before FPL refreshes the standings that gap is the whole live score;
    // after a refresh it is close to zero, so the estimate works either way.
    OVERALL_LEAGUE: 314,
    RANK_LOG_POINTS: 16,      // ranks spread on a log scale (dense near the top)
    RANK_LINEAR_POINTS: 20,   // ranks every 5% of all managers
    RANK_SCORED: 5,           // managers per sampled page whose live score is computed
    RANK_SLICE_POINTS: 25,    // points used along each slice between two sampled pages

    rankPages(ranked) {
        const ranks = new Set([1, ranked]);
        for (let k = 0; k < this.RANK_LOG_POINTS; k++) ranks.add(Math.round(Math.exp(Math.log(ranked) * k / (this.RANK_LOG_POINTS - 1))));
        for (let k = 1; k < this.RANK_LINEAR_POINTS; k++) ranks.add(Math.round(ranked * k / this.RANK_LINEAR_POINTS));
        return [...new Set([...ranks].map(r => Math.max(1, Math.ceil(r / 50))))].sort((a, b) => a - b);
    },

    // Heavy part, run on the server and cached: sampled standings pages with live scores
    async buildRankSample(gw) {
        const event = gw.bootstrap.events.find(e => e.id === gw.gameweek) || {};
        const ranked = event.ranked_count || gw.bootstrap.total_players;
        const pages = this.rankPages(ranked);

        const pool = async (items, size, fn) => {
            const queue = items.slice();
            await Promise.all(Array.from({ length: size }, async () => { while (queue.length) await fn(queue.shift()); }));
        };

        const strata = [];
        await pool(pages, 6, async page => {
            try {
                const data = await FPL_API.getLeagueStandings(this.OVERALL_LEAGUE, page);
                const rows = data.standings.results;
                if (rows.length) strata.push({ page, first: rows[0].rank, rows });
            } catch (error) {
                console.error(`rank sample page ${page}: ${error.message}`);
            }
        });
        strata.sort((a, b) => a.first - b.first);

        // Live score minus the gameweek points in the standings, for a few managers spread through each page
        // (both before hits: the standings total already has them taken off)
        await pool(strata, 4, async st => {
            const step = Math.max(1, Math.floor(st.rows.length / this.RANK_SCORED));
            st.gaps = [];
            for (let i = 0; i < st.rows.length && st.gaps.length < this.RANK_SCORED; i += step) {
                try {
                    const score = this.scorePicks(await FPL_API.getEntryPicks(st.rows[i].entry, gw.gameweek), gw);
                    st.gaps.push(score.points - st.rows[i].event_total);
                } catch (error) {
                    /* skip managers whose picks fail */
                }
            }
        });

        return {
            gameweek: gw.gameweek,
            generated: new Date().toISOString(),
            rankedCount: ranked,
            inProgress: gw.inProgress,
            finished: gw.finished,
            strata: strata.map(st => ({ first: st.first, totals: st.rows.map(r => r.total), gaps: st.gaps }))
        };
    },

    // Light part, in the browser: rank of a live total within the sample.
    // Managers ahead = sum over slices of (managers in the slice) x (share whose total + gap beats yours).
    estimateRank(sample, liveTotal) {
        const strata = sample.strata;
        let ahead = 0;
        strata.forEach((st, k) => {
            const next = strata[k + 1];
            const size = (next ? next.first : sample.rankedCount + 1) - st.first;
            // A slice runs from this page to the next: totals fall from one page's median to the next,
            // so use evenly spread points along that line, plus the gaps measured nearby
            const median = list => list.slice().sort((x, y) => x - y)[Math.floor(list.length / 2)];
            const from = median(st.totals);
            const to = next ? median(next.totals) : from;
            const totals = Array.from({ length: this.RANK_SLICE_POINTS }, (_, j) => from + (to - from) * (j + 0.5) / this.RANK_SLICE_POINTS);
            const scores = [strata[k - 1], st, next].filter(Boolean).flatMap(x => x.gaps);
            if (!scores.length || !totals.length) return;
            let above = 0;
            for (const total of totals) {
                for (const score of scores) {
                    const theirs = total + score;
                    if (theirs > liveTotal) above += 1;
                    else if (theirs === liveTotal) above += 0.5;
                }
            }
            ahead += size * above / (totals.length * scores.length);
        });
        return Math.max(1, Math.round(ahead + 1));
    },

    // Your overall rank: FPL's own once the gameweek is processed, otherwise the estimate from /api/rank.
    // `before` is the rank after the previous gameweek, for the arrow.
    async overallRank(gw, mine, picks) {
        const event = gw.bootstrap.events.find(e => e.id === gw.gameweek) || {};
        const history = picks.entry_history || {};
        let before = null;
        try {
            const past = (await FPL_API.getManagerHistory()).current.find(e => e.event === gw.gameweek - 1);
            before = past ? past.overall_rank : null;
        } catch (error) {
            /* no arrow without history */
        }
        if (event.data_checked && history.overall_rank) return { rank: history.overall_rank, official: true, before };
        if (!FPL_API.IS_BROWSER) return { rank: null, official: false, before };
        try {
            const response = await fetch('/api/rank');
            if (!response.ok) return { rank: null, official: false, before };
            const sample = await response.json();
            if (sample.gameweek !== gw.gameweek || !sample.strata || !sample.strata.length) return { rank: null, official: false, before };
            return { rank: this.estimateRank(sample, mine.total), official: false, before, generated: sample.generated };
        } catch (error) {
            console.error('Rank estimate unavailable:', error.message);
            return { rank: null, official: false, before };
        }
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
