// Mini-league analysis: effective ownership (EO) among your rivals and what it means for your rank
const League = {
    // Your classic leagues; private leagues first (public ones hold millions, only the top 50 are sampled)
    async getMyLeagues() {
        const entry = await FPL_API.getManagerTeam();
        const leagues = (entry.leagues && entry.leagues.classic) || [];
        return leagues
            .filter(l => l.rank_count)
            .map(l => ({ id: l.id, name: l.name, isPrivate: l.league_type === 'x', rank: l.entry_rank, size: l.rank_count }))
            .sort((a, b) => (b.isPrivate - a.isPrivate) || (a.size - b.size));
    },

    // EO = average multiplier among rivals (0 bench, 1 starting, 2 captain, 3 triple captain), as a percentage.
    // Points of a player you hold with a lower multiplier than his EO cost you ground, and the other way round.
    async analyze(leagueId) {
        const [standingsData, bootstrap] = await Promise.all([
            FPL_API.getLeagueStandings(leagueId),
            FPL_API.getBootstrapStatic()
        ]);
        const current = bootstrap.events.find(e => e.is_current);
        if (!current) throw new Error('The season has not started yet');
        const gameweek = current.id;
        const myId = FPL_API.TEAM_ID;
        const standings = standingsData.standings.results;
        const rivals = standings.filter(r => r.entry !== myId);

        // Rivals' picks, a few requests at a time
        const queue = rivals.slice();
        const picks = [];
        const worker = async () => {
            while (queue.length) {
                const rival = queue.shift();
                try {
                    picks.push({ rival, data: await FPL_API.getEntryPicks(rival.entry, gameweek) });
                } catch (error) {
                    console.error(error.message);
                }
            }
        };
        await Promise.all(Array.from({ length: 6 }, worker));

        const mine = await FPL_API.getEntryPicks(myId, gameweek);
        const myMultiplier = new Map(mine.picks.map(p => [p.element, p.multiplier]));

        const n = Math.max(1, picks.length);
        const stats = new Map(); // element -> { owned, starting, captained, multiplier }
        const chips = {};
        for (const { data } of picks) {
            if (data.active_chip) chips[data.active_chip] = (chips[data.active_chip] || 0) + 1;
            for (const p of data.picks) {
                const s = stats.get(p.element) || { owned: 0, starting: 0, captained: 0, multiplier: 0 };
                s.owned++;
                if (p.multiplier > 0) s.starting++;
                if (p.is_captain) s.captained++;
                s.multiplier += p.multiplier;
                stats.set(p.element, s);
            }
        }

        // Projected points for the next gameweek, for everyone owned by you or a rival
        const allPlayers = await FPL_API.getAllPlayers();
        const byId = new Map(allPlayers.map(p => [p.id, p]));
        const ids = new Set([...stats.keys(), ...myMultiplier.keys()]);
        const ctx = await Predictor.getContext();
        const rows = [];
        for (const id of ids) {
            const player = byId.get(id);
            if (!player) continue;
            const s = stats.get(id) || { owned: 0, starting: 0, captained: 0, multiplier: 0 };
            const eo = s.multiplier / n;               // 1.0 = 100%
            const yours = myMultiplier.get(id) || 0;
            const xPts = Predictor.projectPlayerSync(player, ctx).perGW[0] || 0;
            rows.push({
                player,
                ownership: s.owned / n,
                captaincy: s.captained / n,
                eo,
                yours,
                xPts,
                // Expected points gained (+) or lost (-) against the average rival next gameweek
                exposure: (yours - eo) * xPts
            });
        }

        const me = standings.find(r => r.entry === myId) || null;
        return {
            league: standingsData.league,
            gameweek,
            standings,
            me,
            rivalsSampled: picks.length,
            hasMore: !!standingsData.standings.has_next,
            chips,
            rows,
            threats: rows.filter(r => r.exposure < -0.2).sort((a, b) => a.exposure - b.exposure),
            differentials: rows.filter(r => r.exposure > 0.2).sort((a, b) => b.exposure - a.exposure),
            captains: rows.filter(r => r.captaincy > 0).sort((a, b) => b.captaincy - a.captaincy),
            template: rows.filter(r => r.ownership >= 0.5).sort((a, b) => b.ownership - a.ownership)
        };
    }
};

if (typeof module !== 'undefined') module.exports = League;
