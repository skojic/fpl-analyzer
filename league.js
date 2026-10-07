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

    TOP_ID: 'top',

    // Overall top managers' ownership, published once per gameweek by scripts/build-data.js
    async getTopOwnership() {
        if (this.topOwnership !== undefined) return this.topOwnership;
        this.topOwnership = null;
        try {
            if (!FPL_API.IS_BROWSER) {
                const fs = require('fs');
                this.topOwnership = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'data', 'ownership.json'), 'utf8'));
                return this.topOwnership;
            }
            const response = await fetch('data/ownership.json', { cache: 'no-cache' });
            if (response.ok) this.topOwnership = await response.json();
        } catch (error) {
            console.error('Top ownership unavailable:', error.message);
        }
        return this.topOwnership;
    },

    // Threats / differentials against the overall top managers instead of a league's rivals
    async analyzeTop() {
        const top = await this.getTopOwnership();
        if (!top) throw new Error('Top ownership not published yet');
        const stats = new Map(Object.entries(top.players).map(([id, s]) => [parseInt(id, 10), s]));
        return this.buildRows(stats, top.gameweek, {
            league: { name: `Overall top ${top.sample}` },
            standings: [],
            me: null,
            rivalsSampled: top.sample,
            hasMore: false,
            chips: top.chips
        });
    },

    // EO = average multiplier among rivals (0 bench, 1 starting, 2 captain, 3 triple captain), as a percentage.
    // Points of a player you hold with a lower multiplier than his EO cost you ground, and the other way round.
    async analyze(leagueId) {
        if (leagueId === this.TOP_ID) return this.analyzeTop();
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

        const n = Math.max(1, picks.length);
        const counts = new Map(); // element -> { owned, captained, multiplier }
        const chips = {};
        for (const { data } of picks) {
            if (data.active_chip) chips[data.active_chip] = (chips[data.active_chip] || 0) + 1;
            for (const p of data.picks) {
                const c = counts.get(p.element) || { owned: 0, captained: 0, multiplier: 0 };
                c.owned++;
                if (p.is_captain) c.captained++;
                c.multiplier += p.multiplier;
                counts.set(p.element, c);
            }
        }
        const stats = new Map([...counts].map(([id, c]) => [id, { eo: c.multiplier / n, owned: c.owned / n, captained: c.captained / n }]));

        return this.buildRows(stats, gameweek, {
            league: standingsData.league,
            standings,
            me: standings.find(r => r.entry === myId) || null,
            rivalsSampled: picks.length,
            hasMore: !!standingsData.standings.has_next,
            chips
        });
    },

    // Rows per player owned by you or the rivals: EO, your multiplier, projected points and the swing
    async buildRows(stats, gameweek, info) {
        const mine = await FPL_API.getEntryPicks(FPL_API.TEAM_ID, gameweek);
        const myMultiplier = new Map(mine.picks.map(p => [p.element, p.multiplier]));

        // Projected points for the next gameweek, for everyone owned by you or a rival
        const allPlayers = await FPL_API.getAllPlayers();
        const byId = new Map(allPlayers.map(p => [p.id, p]));
        const ids = new Set([...stats.keys(), ...myMultiplier.keys()]);
        const ctx = await Predictor.getContext();
        const rows = [];
        for (const id of ids) {
            const player = byId.get(id);
            if (!player) continue;
            const s = stats.get(id) || { eo: 0, owned: 0, captained: 0 };
            const eo = s.eo;                           // 1.0 = 100%
            const yours = myMultiplier.get(id) || 0;
            const xPts = Predictor.projectPlayerSync(player, ctx).perGW[0] || 0;
            rows.push({
                player,
                ownership: s.owned,
                captaincy: s.captained,
                eo,
                yours,
                xPts,
                // Expected points gained (+) or lost (-) against the average rival next gameweek
                exposure: (yours - eo) * xPts
            });
        }

        return {
            ...info,
            gameweek,
            rows,
            threats: rows.filter(r => r.exposure < -0.2).sort((a, b) => a.exposure - b.exposure),
            differentials: rows.filter(r => r.exposure > 0.2).sort((a, b) => b.exposure - a.exposure),
            captains: rows.filter(r => r.captaincy > 0).sort((a, b) => b.captaincy - a.captaincy),
            template: rows.filter(r => r.ownership >= 0.5).sort((a, b) => b.ownership - a.ownership)
        };
    }
};

if (typeof module !== 'undefined') module.exports = League;
