// FPL Points Prediction and Transfer Suggestion Module
const Predictor = {
    // FPL Scoring Rules (2026/27, matches bootstrap-static game_config.scoring)
    SCORING_RULES: {
        // Minutes played
        minutesPlayed: { threshold: 60, points: 2, underThreshold: 1 },

        // Goals scored
        goals: {
            GKP: 10,
            DEF: 6,
            MID: 5,
            FWD: 4
        },

        // Assists
        assists: 3,

        // Clean sheets
        cleanSheets: {
            GKP: 4,
            DEF: 4,
            MID: 1,
            FWD: 0
        },

        // Goals conceded (per 2 goals)
        goalsConceded: {
            GKP: -1,
            DEF: -1,
            MID: 0,
            FWD: 0
        },

        // Saves (per 3 saves)
        saves: {
            GKP: 1,
            other: 0
        },

        // Defensive contribution: points once a player reaches the action threshold in a match
        // (DEF: clearances, blocks, interceptions, tackles; MID/FWD: the same plus recoveries).
        // Thresholds are not in the API.
        defensiveContribution: {
            GKP: 0,
            DEF: 2,
            MID: 2,
            FWD: 2
        },
        defensiveContributionThreshold: {
            DEF: 10,
            MID: 12,
            FWD: 12
        },

        // Bonus points
        bonus: 1, // per bonus point

        // Penalties
        penaltySaved: 5,
        penaltyMissed: -2,

        // Cards
        yellowCard: -1,
        redCard: -3,

        // Own goals
        ownGoal: -2
    },

    // Chance of playing next round as 0..1. The API sends null when there is no flag,
    // and 0 for injured / suspended / unavailable players.
    getAvailability(player) {
        const chance = player.chanceOfPlayingNextRound;
        return chance === null || chance === undefined ? 1 : chance / 100;
    },

    // E[floor(X / n)] for X ~ Poisson(lambda): expected points from "1 per n" rules
    // (saves per 3, goals conceded per 2)
    expectedPerN(lambda, n) {
        if (!(lambda > 0)) return 0;
        let p = Math.exp(-lambda);
        let expected = 0;
        for (let k = 1; k <= 60; k++) {
            p *= lambda / k;
            expected += p * Math.floor(k / n);
        }
        return expected;
    },

    // P(X >= threshold) for X ~ Poisson(lambda)
    probAtLeast(lambda, threshold) {
        if (!(lambda > 0)) return 0;
        let p = Math.exp(-lambda);
        let below = p;
        for (let k = 1; k < threshold; k++) {
            p *= lambda / k;
            below += p;
        }
        return Math.max(0, 1 - below);
    },

    // ── Model settings ───────────────────────────────────────────────────────
    HORIZON: 5,             // gameweeks projected, starting with the next deadline
    DECAY: 0.9,             // weight of each gameweek relative to the one before (nearer counts more)
    HIT_COST: 4,            // points per transfer beyond the free ones
    HOME_ADVANTAGE: 1.1,    // goal multiplier at home (away = 1 / this)
    PRIOR_GAMES: 6,         // team ratings: weight (in matches) of FPL's strength rating vs this season's xG
    PRIOR_MINUTES: 270,     // player rates: minutes of position-average data blended into per-90 stats
    RECENT_MATCHES: 5,      // matches of element-summary history used for the minutes model
    START_MINUTES: 85,      // typical minutes for a starter
    SUB_MINUTES: 20,        // typical minutes for a substitute appearance
    FORMATION: { GKP: [1, 1], DEF: [3, 5], MID: [2, 5], FWD: [1, 3] },

    contexts: {},           // shared fixtures / team ratings per horizon length, built once per page load
    publishedFormLoaded: false,
    recentForm: {},         // playerId -> minutes profile from recent matches (null when unavailable)

    // ── Context: horizon, fixtures per team and gameweek, team strength ────
    async getContext(length = this.HORIZON) {
        if (this.contexts[length]) return this.contexts[length];

        const [bootstrap, fixtures] = await Promise.all([FPL_API.getBootstrapStatic(), FPL_API.getFixtures()]);
        await this.loadPublishedForm(bootstrap);
        this.contexts[length] = this.buildContext(bootstrap, fixtures, null, length);
        return this.contexts[length];
    },

    // Context from raw bootstrap + fixtures. `nextEventId` overrides the next gameweek
    // (the backtest rebuilds the season as it stood before a past gameweek).
    buildContext(bootstrap, fixtures, nextEventId = null, length = this.HORIZON) {
        // Horizon: the next N gameweeks (transfers made now count from the next deadline)
        const next = nextEventId ? bootstrap.events.find(e => e.id === nextEventId) : bootstrap.events.find(e => e.is_next);
        const horizon = next
            ? bootstrap.events
                .filter(e => e.id >= next.id && e.id < next.id + length)
                .map(e => ({ id: e.id, deadline: new Date(e.deadline_time) }))
            : [];
        const horizonIds = new Set(horizon.map(e => e.id));

        // Fixtures per team per gameweek. Blank = no entry, double = two entries.
        // Postponed fixtures have no event and drop out until they are rescheduled.
        const fixturesByTeam = {};
        const teamGames = {};
        for (const f of fixtures) {
            if (f.finished || f.finished_provisional) {
                teamGames[f.team_h] = (teamGames[f.team_h] || 0) + 1;
                teamGames[f.team_a] = (teamGames[f.team_a] || 0) + 1;
                continue;
            }
            if (!horizonIds.has(f.event)) continue;
            for (const [team, opponent, isHome, difficulty] of [
                [f.team_h, f.team_a, true, f.team_h_difficulty],
                [f.team_a, f.team_h, false, f.team_a_difficulty]
            ]) {
                const byEvent = fixturesByTeam[team] || (fixturesByTeam[team] = {});
                (byEvent[f.event] || (byEvent[f.event] = [])).push({
                    event: f.event, opponentId: opponent, isHome, difficulty, kickoffTime: f.kickoff_time
                });
            }
        }

        // Team xG for / against per 90 from player totals. Each player's xGC is his team's xGA
        // while he was on the pitch, so summed over the squad it is 11 x the team's xGA.
        const agg = {};
        const posTotals = {};
        for (const p of bootstrap.elements) {
            const t = agg[p.team] || (agg[p.team] = { xg: 0, xgc: 0, minutes: 0 });
            t.xg += parseFloat(p.expected_goals) || 0;
            t.xgc += parseFloat(p.expected_goals_conceded) || 0;
            t.minutes += p.minutes;

            // Position averages per 90, used to steady the rates of players with few minutes
            const pos = bootstrap.element_types.find(et => et.id === p.element_type).singular_name_short;
            const pt = posTotals[pos] || (posTotals[pos] = { minutes: 0, expectedGoals: 0, expectedAssists: 0, saves: 0, defensiveContribution: 0, bonus: 0, yellowCards: 0 });
            pt.minutes += p.minutes;
            pt.expectedGoals += parseFloat(p.expected_goals) || 0;
            pt.expectedAssists += parseFloat(p.expected_assists) || 0;
            pt.saves += p.saves;
            pt.defensiveContribution += p.defensive_contribution || 0;
            pt.bonus += p.bonus;
            pt.yellowCards += p.yellow_cards;
        }
        const positionRates = {};
        for (const [pos, pt] of Object.entries(posTotals)) {
            const n90 = Math.max(1, pt.minutes / 90);
            positionRates[pos] = Object.fromEntries(
                Object.entries(pt).filter(([k]) => k !== 'minutes').map(([k, v]) => [k, v / n90])
            );
        }

        const raw = {};
        for (const team of bootstrap.teams) {
            const t = agg[team.id] || { xg: 0, xgc: 0, minutes: 0 };
            raw[team.id] = t.minutes > 0
                ? { xgFor: t.xg * 11 * 90 / t.minutes, xgAgainst: t.xgc * 90 / t.minutes }
                : null;
        }
        const known = Object.values(raw).filter(Boolean);
        const leagueAvg = known.length
            ? known.reduce((sum, t) => sum + t.xgFor, 0) / known.length
            : 1.4;

        // Blend with FPL's 1-5 strength rating, which is all we have before matches are played.
        // attack > 1: scores more than average; defence > 1: concedes more than average.
        const teams = {};
        for (const team of bootstrap.teams) {
            const strength = ((team.strength_overall_home || 3) + (team.strength_overall_away || 3)) / 2;
            const prior = { attack: 1 + 0.15 * (strength - 3), defence: 1 - 0.15 * (strength - 3) };
            const games = teamGames[team.id] || 0;
            const w = raw[team.id] ? games / (games + this.PRIOR_GAMES) : 0;
            teams[team.id] = {
                shortName: team.short_name,
                attack: w * (raw[team.id] ? raw[team.id].xgFor / leagueAvg : 1) + (1 - w) * prior.attack,
                defence: w * (raw[team.id] ? raw[team.id].xgAgainst / leagueAvg : 1) + (1 - w) * prior.defence
            };
        }

        return { bootstrap, horizon, fixturesByTeam, teamGames, teams, leagueAvg, positionRates };
    },

    // ── Minutes model ────────────────────────────────────────────────────────
    // Starts / 60+ minutes / minutes over a player's last few matches (element-summary history rows)
    recentFormFromHistory(history) {
        const last = (history || []).slice(-this.RECENT_MATCHES);
        if (!last.length) return null;
        const avg = fn => last.reduce((sum, r) => sum + fn(r), 0) / last.length;
        const round = x => Math.round(x * 1000) / 1000;
        return {
            pStart: round(avg(r => r.starts)),
            p60: round(avg(r => (r.minutes >= 60 ? 1 : 0))),
            minutesPerMatch: round(avg(r => r.minutes))
        };
    },

    // Recent form for every player, published daily by scripts/build-data.js. Used only when it was built
    // after the latest finished gameweek, otherwise players are fetched one by one as before.
    async loadPublishedForm(bootstrap) {
        if (!FPL_API.IS_BROWSER || this.publishedFormLoaded) return;
        this.publishedFormLoaded = true;
        try {
            const response = await fetch('data/recent-form.json', { cache: 'no-cache' });
            if (!response.ok) return;
            const data = await response.json();
            const lastFinished = Math.max(0, ...bootstrap.events.filter(e => e.finished).map(e => e.id));
            if (data.lastFinishedEvent !== lastFinished) return;
            for (const [id, form] of Object.entries(data.players)) {
                if (!(id in this.recentForm)) this.recentForm[id] = form;
            }
        } catch (error) {
            console.error('Published recent form unavailable:', error.message);
        }
    },

    // Fetch the last few matches for these players (element-summary) to see current starts / minutes.
    async loadRecentHistory(players) {
        const queue = players.filter(p => !(p.id in this.recentForm));

        const worker = async () => {
            while (queue.length) {
                const player = queue.shift();
                this.recentForm[player.id] = null;
                try {
                    const details = await FPL_API.getPlayerDetails(player.id);
                    this.recentForm[player.id] = this.recentFormFromHistory(details.history);
                } catch (error) {
                    console.error(`Recent history unavailable for ${player.name}:`, error.message);
                }
            }
        };
        await Promise.all(Array.from({ length: 6 }, worker));
    },

    // Chance of starting, of a substitute appearance and of 60+ minutes in a match he is available for
    getMinutesProfile(player, ctx) {
        const games = ctx.teamGames[player.teamId] || 0;
        let pStart = games ? Math.min(1, (player.starts || 0) / games) : 0.6;
        let minutesPerMatch = games ? Math.min(90, (player.minutes || 0) / games) : 50;
        let p60 = pStart * 0.9;

        // Recent matches count more than the season average
        const recent = this.recentForm[player.id];
        if (recent) {
            pStart = 0.4 * pStart + 0.6 * recent.pStart;
            minutesPerMatch = 0.4 * minutesPerMatch + 0.6 * recent.minutesPerMatch;
            p60 = 0.4 * p60 + 0.6 * recent.p60;
        }

        // Minutes not explained by starts come from substitute appearances
        const subMinutes = Math.max(0, minutesPerMatch - pStart * this.START_MINUTES);
        const pSub = Math.min(1 - pStart, subMinutes / this.SUB_MINUTES);
        return {
            pStart,
            pSub,
            p60: Math.min(p60, pStart + pSub),
            expectedMinutes: pStart * this.START_MINUTES + pSub * this.SUB_MINUTES
        };
    },

    // "Expected back 18 Oct" / "Suspended until 25 Oct" -> Date, or null
    parseReturnDate(news) {
        const match = /(?:expected back|until)\s+(\d{1,2})\s+([A-Za-z]{3})/i.exec(news || '');
        if (!match) return null;
        const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
            .indexOf(match[2].toLowerCase());
        if (month < 0) return null;
        const now = new Date();
        const date = new Date(Date.UTC(now.getUTCFullYear(), month, parseInt(match[1], 10)));
        // A month earlier than now means next year (e.g. "Expected back 10 Jan" written in December)
        if (date < new Date(now.getTime() - 30 * 86400000)) date.setUTCFullYear(date.getUTCFullYear() + 1);
        return date;
    },

    // Availability for the k-th gameweek of the horizon (0 = next deadline)
    getAvailabilityForGW(player, k, deadline) {
        if (player.status === 'a') return 1;
        if (player.status === 'u') return 0; // left the club / not part of the squad

        // FPL's chance of playing is for the next round; later rounds use the return date when given
        const chance = this.getAvailability(player);
        if (k === 0) return chance;

        const back = this.parseReturnDate(player.news);
        if (back && deadline) return deadline >= back ? 1 : 0;

        if (player.status === 'd') return k === 1 ? (1 + chance) / 2 : 1;
        // Injured or suspended without a return date: out one more week, then gradually back
        return k === 1 ? chance : Math.min(1, 0.25 * (k - 1));
    },

    // Per-90 rate of a season total, steadied with position-average minutes for small samples
    getRate(player, total, key, ctx) {
        const posRate = (ctx.positionRates[player.position] || {})[key] || 0;
        const minutes = player.minutes || 0;
        return ((parseFloat(total) || 0) + posRate * this.PRIOR_MINUTES / 90) / ((minutes + this.PRIOR_MINUTES) / 90);
    },

    // ── Points for one fixture, given he is available ───────────────────────
    calculateFixturePoints(player, fixture, ctx, minutes) {
        const R = this.SCORING_RULES;
        const pos = player.position;
        const own = ctx.teams[player.teamId];
        const opp = ctx.teams[fixture.opponentId];
        if (!own || !opp) return 0;

        const home = fixture.isHome ? this.HOME_ADVANTAGE : 1 / this.HOME_ADVANTAGE;
        const minutesShare = minutes.expectedMinutes / 90;
        // His attacking rates already reflect his own team; scale by the opponent's defence
        const attackMult = opp.defence * home;
        // Goals his team is expected to concede in this match
        const concede = ctx.leagueAvg * opp.attack * own.defence / home;
        let points = 0;

        // Appearance: 2 for 60+ minutes, 1 for less
        points += minutes.p60 * R.minutesPlayed.points
            + Math.max(0, minutes.pStart + minutes.pSub - minutes.p60) * R.minutesPlayed.underThreshold;

        // Goals and assists
        points += this.getRate(player, player.expectedGoals, 'expectedGoals', ctx) * attackMult * minutesShare * (R.goals[pos] || 0);
        points += this.getRate(player, player.expectedAssists, 'expectedAssists', ctx) * attackMult * minutesShare * R.assists;

        // Clean sheet (needs 60+ minutes), P = e^-concede
        points += minutes.p60 * Math.exp(-concede) * (R.cleanSheets[pos] || 0);

        // Goals conceded: -1 per 2 while on the pitch (GKP / DEF)
        if (R.goalsConceded[pos]) {
            points += minutes.pStart * this.expectedPerN(concede * this.START_MINUTES / 90, 2) * R.goalsConceded[pos];
        }

        if (pos === 'GKP') {
            // Saves: 1 per 3; a stronger opponent attack means more shots to save
            const saves = this.getRate(player, player.saves, 'saves', ctx) * opp.attack / home * this.START_MINUTES / 90;
            points += minutes.pStart * this.expectedPerN(saves, 3) * R.saves.GKP;
            // Penalty saves: roughly one penalty every 4 matches, about 1 in 5 saved
            points += minutes.pStart * 0.25 * 0.2 * R.penaltySaved;
        }

        // Defensive contribution: 2 points for reaching the action threshold
        const dcThreshold = R.defensiveContributionThreshold[pos];
        if (dcThreshold) {
            const actions = this.getRate(player, player.defensiveContribution, 'defensiveContribution', ctx) * this.START_MINUTES / 90;
            points += minutes.pStart * this.probAtLeast(actions, dcThreshold) * R.defensiveContribution[pos];
        }

        // Bonus: his own bonus rate, nudged by how many goals his team should score
        points += this.getRate(player, player.bonus, 'bonus', ctx) * minutesShare * Math.sqrt(attackMult);

        // Yellow cards
        points += this.getRate(player, player.yellowCards, 'yellowCards', ctx) * minutesShare * R.yellowCard;

        return Math.max(0, points);
    },

    // Projected points per gameweek of the horizon (blank = 0, double = both fixtures)
    async projectPlayer(player) {
        const ctx = await this.getContext();
        return this.projectPlayerSync(player, ctx);
    },

    projectPlayerSync(player, ctx) {
        const minutes = this.getMinutesProfile(player, ctx);
        const byEvent = ctx.fixturesByTeam[player.teamId] || {};
        const fixtures = [];
        const perGW = ctx.horizon.map((gw, k) => {
            const available = this.getAvailabilityForGW(player, k, gw.deadline);
            return (byEvent[gw.id] || []).reduce((sum, f) => {
                const expectedPoints = available * this.calculateFixturePoints(player, f, ctx, minutes);
                fixtures.push({
                    ...f,
                    opponent: ctx.teams[f.opponentId] ? ctx.teams[f.opponentId].shortName : '?',
                    expectedPoints: Math.round(expectedPoints * 10) / 10
                });
                return sum + expectedPoints;
            }, 0);
        });
        const weighted = perGW.reduce((sum, pts, k) => sum + pts * Math.pow(this.DECAY, k), 0);
        return { player, perGW, weighted, total: perGW.reduce((a, b) => a + b, 0), fixtures, minutes };
    },

    // Fixture-by-fixture predictions over the horizon (used by the predictions page)
    async predictNext5Gameweeks(player) {
        return (await this.projectPlayer(player)).fixtures;
    },

    // Total expected points over the horizon
    async calculatePlayerNext5GWPoints(player) {
        const total = (await this.projectPlayer(player)).total;
        return Math.round(total * 10) / 10;
    },

    // Predict team points for the next gameweek
    async predictTeamPoints(team) {
        if (!team || team.length === 0) {
            return [];
        }
        await this.loadRecentHistory(team);
        const ctx = await this.getContext();

        return team.map(player => {
            const projection = this.projectPlayerSync(player, ctx);
            return { player, expectedPoints: Math.round((projection.perGW[0] || 0) * 10) / 10 };
        });
    },

    // Expected points for the team: starting XI only, captain counted with his multiplier
    teamExpectedTotal(predictions) {
        return predictions.reduce((sum, p) => {
            const multiplier = p.player.multiplier ?? 1;
            return sum + (parseFloat(p.expectedPoints) || 0) * multiplier;
        }, 0);
    },

    // ── Squad evaluation ─────────────────────────────────────────────────────
    // Best valid XI for one gameweek plus captain (counted twice)
    bestLineup(projections, k) {
        const byPos = { GKP: [], DEF: [], MID: [], FWD: [] };
        for (const pr of projections) byPos[pr.player.position].push(pr);
        for (const list of Object.values(byPos)) list.sort((a, b) => b.perGW[k] - a.perGW[k]);

        const xi = [];
        const count = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
        for (const [pos, [min]] of Object.entries(this.FORMATION)) {
            for (const pr of byPos[pos].slice(0, min)) { xi.push(pr); count[pos]++; }
        }
        const rest = ['DEF', 'MID', 'FWD']
            .flatMap(pos => byPos[pos].slice(this.FORMATION[pos][0]))
            .sort((a, b) => b.perGW[k] - a.perGW[k]);
        for (const pr of rest) {
            if (xi.length >= 11) break;
            const pos = pr.player.position;
            if (count[pos] < this.FORMATION[pos][1]) { xi.push(pr); count[pos]++; }
        }

        const captain = xi.reduce((best, pr) => (!best || pr.perGW[k] > best.perGW[k] ? pr : best), null);
        const points = xi.reduce((sum, pr) => sum + pr.perGW[k], 0) + (captain ? captain.perGW[k] : 0);
        return { points, xi, captain };
    },

    // Squad value over the horizon: best XI + captain each gameweek, nearer gameweeks weighted more
    squadValue(projections, ctx) {
        return ctx.horizon.reduce((sum, gw, k) =>
            sum + this.bestLineup(projections, k).points * Math.pow(this.DECAY, k), 0);
    },

    // ── Transfer state: squad after pending transfers, selling prices, free transfers ──
    async getTransferState(currentTeam, allPlayers, bank, ctx) {
        const nextId = ctx.horizon.length ? ctx.horizon[0].id : null;
        const settings = ctx.bootstrap.game_settings || {};
        const maxFree = 1 + (settings.max_extra_free_transfers ?? 4);
        const sellOnFee = settings.transfers_sell_on_fee ?? 0.5;

        let transfers = [];
        let history = { current: [], chips: [] };
        try {
            [transfers, history] = await Promise.all([FPL_API.getEntryTransfers(), FPL_API.getManagerHistory()]);
        } catch (error) {
            console.error('Transfer history unavailable, assuming 1 free transfer and current prices:', error.message);
        }

        const chipFor = event => ((history.chips || []).find(c => c.event === event) || {}).name;
        const byId = new Map(allPlayers.map(p => [p.id, p]));

        // Transfers already made for the next deadline: apply them to the squad and bank
        const pending = transfers.filter(tr => tr.event === nextId);
        let squad = currentTeam.slice();
        for (const tr of pending.slice().reverse()) {
            const incoming = byId.get(tr.element_in);
            const idx = squad.findIndex(p => p.id === tr.element_out);
            if (incoming && idx >= 0) {
                squad[idx] = { ...incoming, pickOrder: squad[idx].pickOrder, multiplier: squad[idx].multiplier };
                bank += (tr.element_out_cost - tr.element_in_cost) / 10;
            }
        }

        // Selling price: purchase price + half the rise (rounded down), or the current price if it fell.
        // Purchase price = latest transfer in (Free Hit squads revert, so skip those), else the start price.
        const sellingPrice = {};
        for (const p of squad) {
            const now = Math.round(p.price * 10);
            const buyIn = transfers.find(tr => tr.element_in === p.id && chipFor(tr.event) !== 'freehit');
            const bought = buyIn ? buyIn.element_in_cost : now - (p.costChangeStart || 0);
            sellingPrice[p.id] = (now <= bought ? now : bought + Math.floor((now - bought) * sellOnFee)) / 10;
        }

        // Free transfers: one from the second gameweek played, +1 each deadline (max 5),
        // Wildcard and Free Hit leave the banked ones untouched
        let freeTransfers = 1;
        const played = (history.current || []).filter(e => !nextId || e.event < nextId);
        for (const e of played.slice(1)) {
            const chip = chipFor(e.event);
            if (chip !== 'wildcard' && chip !== 'freehit') {
                const free = e.event_transfers - e.event_transfers_cost / this.HIT_COST;
                freeTransfers = Math.max(0, freeTransfers - free);
            }
            freeTransfers = Math.min(maxFree, freeTransfers + 1);
        }
        if (played.length === 0) freeTransfers = 1;
        freeTransfers = Math.max(0, freeTransfers - pending.length);

        return { squad, bank: Math.round(bank * 10) / 10, sellingPrice, freeTransfers, pending, maxFree };
    },

    // Best players to buy per position by projection (season minutes), affordable for at least one sale
    buildShortlist(state, allPlayers, ctx, size, banned = new Set()) {
        const squadIds = new Set(state.squad.map(p => p.id));
        const shortlist = {};
        for (const pos of ['GKP', 'DEF', 'MID', 'FWD']) {
            const maxSell = Math.max(0, ...state.squad.filter(p => p.position === pos).map(p => state.sellingPrice[p.id]));
            shortlist[pos] = allPlayers
                .filter(p => p.position === pos && !squadIds.has(p.id) && !banned.has(p.id) && p.status !== 'u'
                    && p.price <= state.bank + maxSell + 1e-9)
                .map(p => this.projectPlayerSync(p, ctx))
                .sort((a, b) => b.weighted - a.weighted)
                .slice(0, size)
                .map(pr => pr.player);
        }
        return shortlist;
    },

    // ── Transfer suggestions ─────────────────────────────────────────────────
    // Every single transfer is scored by how much it changes the squad value over the horizon
    // (best XI + captain each gameweek), within budget and the 3-per-club limit.
    async getTransferPlan(currentTeam, allPlayers, bank) {
        const ctx = await this.getContext();
        const state = await this.getTransferState(currentTeam, allPlayers, bank, ctx);
        const plan = { ...state, horizon: ctx.horizon, transfers: [] };
        if (!ctx.horizon.length) return plan;

        const clubLimit = (ctx.bootstrap.game_settings || {}).squad_team_limit || 3;
        const clubCount = {};
        for (const p of state.squad) clubCount[p.teamId] = (clubCount[p.teamId] || 0) + 1;

        const shortlist = this.buildShortlist(state, allPlayers, ctx, 8);

        // Recent minutes for the squad and the shortlist, then project again with them
        await this.loadRecentHistory([...state.squad, ...Object.values(shortlist).flat()]);
        const squadProj = state.squad.map(p => this.projectPlayerSync(p, ctx));
        const baseValue = this.squadValue(squadProj, ctx);
        const baseLineups = ctx.horizon.map((gw, k) => this.bestLineup(squadProj, k));

        const options = [];
        for (const [idx, out] of state.squad.entries()) {
            const sell = state.sellingPrice[out.id];
            for (const candidate of shortlist[out.position]) {
                if (candidate.price > state.bank + sell + 1e-9) continue;
                const clubAfter = (clubCount[candidate.teamId] || 0) + (candidate.teamId === out.teamId ? 0 : 1);
                if (clubAfter > clubLimit) continue;

                const inProj = this.projectPlayerSync(candidate, ctx);
                const newProj = squadProj.slice();
                newProj[idx] = inProj;
                const gain = this.squadValue(newProj, ctx) - baseValue;
                if (gain < 0.5) continue;

                options.push({
                    out: { ...out, sellingPrice: sell },
                    in: candidate,
                    position: out.position,
                    cost: Math.round((candidate.price - sell) * 10) / 10,
                    expectedPointsGain: Math.round(gain * 10) / 10,
                    outProjection: squadProj[idx],
                    inProjection: inProj,
                    outStartsGWs: baseLineups.filter(l => l.xi.includes(squadProj[idx])).length,
                    reason: ''
                });
            }
        }

        // Keep the best options per position (GKP 2, outfield 3), at most 2 per player sold
        const limits = { GKP: 2, DEF: 3, MID: 3, FWD: 3 };
        options.sort((a, b) => b.expectedPointsGain - a.expectedPointsGain);
        const perOut = {};
        const perPos = {};
        for (const option of options) {
            if ((perPos[option.position] || 0) >= limits[option.position]) continue;
            if ((perOut[option.out.id] || 0) >= 2) continue;
            perPos[option.position] = (perPos[option.position] || 0) + 1;
            perOut[option.out.id] = (perOut[option.out.id] || 0) + 1;

            const hitCost = state.freeTransfers >= 1 ? 0 : this.HIT_COST;
            option.hitCost = hitCost;
            option.netGain = Math.round((option.expectedPointsGain - hitCost) * 10) / 10;
            // With a free transfer, worth making above ~2 points; a hit needs to clear its 4 points by the same margin
            option.verdict = option.netGain >= 2 ? (hitCost ? 'hit' : 'make') : 'marginal';
            option.reason = this.getTransferReason(option.out, option.in, option, ctx);
            plan.transfers.push(option);
        }

        return plan;
    },

    // ── Fixture ticker ───────────────────────────────────────────────────────
    // Next `count` gameweeks per team: expected goals for (attack) and clean-sheet chance (defence)
    // from the model's team ratings, plus FPL's own difficulty. Blank = no cell entries, double = two.
    async getFixtureTicker(count = 8) {
        const ctx = await this.getContext();
        const fixtures = await FPL_API.getFixtures();
        const next = ctx.bootstrap.events.find(e => e.is_next);
        if (!next) return { events: [], teams: [] };
        const events = ctx.bootstrap.events.filter(e => e.id >= next.id && e.id < next.id + count).map(e => e.id);

        const rows = {};
        for (const team of ctx.bootstrap.teams) {
            rows[team.id] = { team: { id: team.id, shortName: team.short_name, name: team.name, code: team.code }, cells: events.map(() => []) };
        }
        for (const f of fixtures) {
            const col = events.indexOf(f.event);
            if (col < 0 || f.finished) continue;
            for (const [teamId, oppId, isHome, fdr] of [[f.team_h, f.team_a, true, f.team_h_difficulty], [f.team_a, f.team_h, false, f.team_a_difficulty]]) {
                const own = ctx.teams[teamId];
                const opp = ctx.teams[oppId];
                const home = isHome ? this.HOME_ADVANTAGE : 1 / this.HOME_ADVANTAGE;
                rows[teamId].cells[col].push({
                    opponent: opp.shortName,
                    isHome,
                    fdr,
                    xgFor: ctx.leagueAvg * own.attack * opp.defence * home,
                    csProb: Math.exp(-ctx.leagueAvg * opp.attack * own.defence / home)
                });
            }
        }
        return { events, leagueAvg: ctx.leagueAvg, teams: Object.values(rows) };
    },

    // ── Squad optimizer (Wildcard, Free Hit, team rating) ────────────────────
    SQUAD_SHAPE: { GKP: 2, DEF: 5, MID: 5, FWD: 3 },
    OPT_POOL: 30,           // best players per position (by projection) the optimizer may pick
    OPT_CHEAP: 6,           // plus the cheapest regular starters per position, for the bench
    OPT_PAIR_POOL: 12,      // players per position tried in two-player swaps
    BENCH_WEIGHT: 0.1,      // bench points count a little: cover for players who don't start

    // Weighted best XI + captain over the given gameweeks, plus a little for the bench
    squadScore(projections, gws, benchWeight = this.BENCH_WEIGHT) {
        let score = 0;
        for (const k of gws) {
            const lineup = this.bestLineup(projections, k);
            const xi = lineup.points - (lineup.captain ? lineup.captain.perGW[k] : 0);
            const bench = projections.reduce((sum, pr) => sum + pr.perGW[k], 0) - xi;
            score += Math.pow(this.DECAY, k) * (lineup.points + benchWeight * bench);
        }
        return score;
    },

    // Best 15 within budget, formation and the club limit for gameweeks `gws` (indexes into ctx.horizon).
    // Local search on the real objective, started from the cheapest valid squad and (when given) from
    // your current squad: repeatedly apply the best one- or two-player swap until nothing improves it.
    optimizeSquad(allPlayers, budget, ctx, gws, { benchWeight = this.BENCH_WEIGHT, start = null } = {}) {
        const clubLimit = (ctx.bootstrap.game_settings || {}).squad_team_limit || 3;
        const weightOf = pr => gws.reduce((sum, k) => sum + pr.perGW[k] * Math.pow(this.DECAY, k), 0);

        // Candidate pool per position
        const pool = {};
        for (const pos of Object.keys(this.SQUAD_SHAPE)) {
            const all = allPlayers
                .filter(p => p.position === pos && p.status !== 'u')
                .map(p => this.projectPlayerSync(p, ctx));
            const best = all.slice().sort((a, b) => weightOf(b) - weightOf(a)).slice(0, this.OPT_POOL);
            const cheap = all.filter(pr => pr.minutes.pStart >= 0.5).sort((a, b) => a.player.price - b.player.price).slice(0, this.OPT_CHEAP);
            pool[pos] = [...new Map([...best, ...cheap].map(pr => [pr.player.id, pr])).values()]
                .sort((a, b) => weightOf(b) - weightOf(a));
        }

        const cost = sq => sq.reduce((sum, pr) => sum + pr.player.price, 0);
        const clubOk = sq => {
            const c = {};
            for (const pr of sq) if ((c[pr.player.teamId] = (c[pr.player.teamId] || 0) + 1) > clubLimit) return false;
            return true;
        };

        // Cheapest valid squad
        let squad = [];
        const clubs = {};
        for (const [pos, n] of Object.entries(this.SQUAD_SHAPE)) {
            const byPrice = pool[pos].slice().sort((a, b) => a.player.price - b.player.price);
            for (const pr of byPrice) {
                if (squad.filter(x => x.player.position === pos).length >= n) break;
                if ((clubs[pr.player.teamId] || 0) >= clubLimit) continue;
                squad.push(pr);
                clubs[pr.player.teamId] = (clubs[pr.player.teamId] || 0) + 1;
            }
        }
        const starts = [];
        if (squad.length === 15 && cost(squad) <= budget + 1e-9) starts.push(squad);
        if (start && start.length === 15 && cost(start) <= budget + 1e-9 && clubOk(start)) starts.push(start);

        let bestResult = null;
        for (const first of starts) {
            const result = this.improveSquad(first, pool, budget, gws, benchWeight, cost, clubOk);
            if (!bestResult || result.score > bestResult.score) bestResult = result;
        }
        return bestResult && { ...bestResult, cost: Math.round(cost(bestResult.squad) * 10) / 10 };
    },

    improveSquad(squad, pool, budget, gws, benchWeight, cost, clubOk) {
        let score = this.squadScore(squad, gws, benchWeight);

        for (let iteration = 0; iteration < 200; iteration++) {
            const ids = new Set(squad.map(pr => pr.player.id));
            const spare = budget - cost(squad);
            let best = null;

            // One-player swaps
            squad.forEach((out, i) => {
                for (const pr of pool[out.player.position]) {
                    if (ids.has(pr.player.id) || pr.player.price - out.player.price > spare + 1e-9) continue;
                    const next = squad.slice();
                    next[i] = pr;
                    if (!clubOk(next)) continue;
                    const s = this.squadScore(next, gws, benchWeight);
                    if (s > score + 1e-6 && (!best || s > best.score)) best = { squad: next, score: s };
                }
            });

            // Two-player swaps (move money between positions) only when no single swap helps
            if (!best) {
                for (let i = 0; i < squad.length; i++) {
                    for (let j = i + 1; j < squad.length; j++) {
                        const [a, b] = [squad[i], squad[j]];
                        for (const c of pool[a.player.position].slice(0, this.OPT_PAIR_POOL)) {
                            if (ids.has(c.player.id)) continue;
                            for (const d of pool[b.player.position].slice(0, this.OPT_PAIR_POOL)) {
                                if (ids.has(d.player.id) || d.player.id === c.player.id) continue;
                                if (c.player.price + d.player.price - a.player.price - b.player.price > spare + 1e-9) continue;
                                const next = squad.slice();
                                next[i] = c;
                                next[j] = d;
                                if (!clubOk(next)) continue;
                                const s = this.squadScore(next, gws, benchWeight);
                                if (s > score + 1e-6 && (!best || s > best.score)) best = { squad: next, score: s };
                            }
                        }
                    }
                }
            }

            if (!best) break;
            squad = best.squad;
            score = best.score;
        }

        return { squad, score };
    },

    // Wildcard (best squad over the horizon), Free Hit (best squad for the next gameweek) and a team rating
    // (your squad's value as a share of the Wildcard squad's), all with your budget: bank + selling prices.
    async getSquadReport(currentTeam, allPlayers, bank) {
        const ctx = await this.getContext();
        const state = await this.getTransferState(currentTeam, allPlayers, bank, ctx);
        if (!ctx.horizon.length) return null;
        await this.loadRecentHistory(state.squad);

        const budget = Math.round((state.bank + state.squad.reduce((s, p) => s + state.sellingPrice[p.id], 0)) * 10) / 10;
        const all = ctx.horizon.map((gw, k) => k);
        const current = state.squad.map(p => this.projectPlayerSync(p, ctx));

        // Selling prices count as the price of the players you already own
        const start = state.squad.map(p => this.projectPlayerSync({ ...p, price: state.sellingPrice[p.id] }, ctx));
        const wildcard = this.optimizeSquad(allPlayers, budget, ctx, all, { start });
        const freeHit = this.optimizeSquad(allPlayers, budget, ctx, [0], { benchWeight: 0, start });
        const value = (sq, gws) => this.squadScore(sq, gws, 0);
        const changes = sq => {
            const keep = new Set(state.squad.map(p => p.id));
            const incoming = sq.squad.filter(pr => !keep.has(pr.player.id)).map(pr => pr.player);
            const outgoing = state.squad.filter(p => !sq.squad.some(pr => pr.player.id === p.id));
            return { incoming, outgoing };
        };

        const currentValue = value(current, all);
        const wildcardValue = wildcard ? value(wildcard.squad, all) : currentValue;
        return {
            budget,
            horizon: ctx.horizon,
            rating: Math.round(100 * Math.min(1, currentValue / Math.max(1e-9, wildcardValue))),
            currentValue,
            wildcard: wildcard && { ...wildcard, value: wildcardValue, gain: wildcardValue - currentValue, ...changes(wildcard) },
            freeHit: freeHit && {
                ...freeHit,
                gameweek: ctx.horizon[0].id,
                value: value(freeHit.squad, [0]),
                gain: value(freeHit.squad, [0]) - value(current, [0]),
                ...changes(freeHit)
            }
        };
    },

    // ── Chip calendar ────────────────────────────────────────────────────────
    // Value of each chip you still have, per gameweek until the current chip window closes, with your
    // current squad: Bench Boost = bench points, Triple Captain = the captain's points once more,
    // Free Hit = best one-week squad minus your XI. Later weeks assume no transfers: treat them as a guide.
    async getChipCalendar(currentTeam, allPlayers, bank, { freeHit = true } = {}) {
        const base = await this.getContext();
        if (!base.horizon.length) return null;
        const next = base.horizon[0].id;
        const chips = base.bootstrap.chips || [];
        const open = chips.filter(c => c.start_event <= next && next <= c.stop_event);
        if (!open.length) return null;
        const stop = Math.min(...open.map(c => c.stop_event));
        const ctx = await this.getContext(Math.max(1, stop - next + 1));

        const state = await this.getTransferState(currentTeam, allPlayers, bank, base);
        let used = [];
        try {
            used = (await FPL_API.getManagerHistory()).chips || [];
        } catch (error) {
            console.error('Chip history unavailable:', error.message);
        }
        const available = [...new Set(open
            .filter(c => !used.some(u => u.name === c.name && u.event >= c.start_event && u.event <= c.stop_event))
            .map(c => c.name))];

        await this.loadRecentHistory(state.squad);
        const current = state.squad.map(p => this.projectPlayerSync(p, ctx));
        const start = state.squad.map(p => this.projectPlayerSync({ ...p, price: state.sellingPrice[p.id] }, ctx));
        const budget = Math.round((state.bank + state.squad.reduce((s, p) => s + state.sellingPrice[p.id], 0)) * 10) / 10;
        const teamIds = ctx.bootstrap.teams.map(t => t.id);

        const weeks = ctx.horizon.map((gw, k) => {
            const lineup = this.bestLineup(current, k);
            const captainPts = lineup.captain ? lineup.captain.perGW[k] : 0;
            const xi = lineup.points - captainPts;
            const total = current.reduce((sum, pr) => sum + pr.perGW[k], 0);
            const counts = teamIds.map(id => ((ctx.fixturesByTeam[id] || {})[gw.id] || []).length);
            let freeHitGain = null;
            if (freeHit && available.includes('freehit')) {
                const fh = this.optimizeSquad(allPlayers, budget, ctx, [k], { benchWeight: 0, start });
                if (fh) freeHitGain = this.bestLineup(fh.squad, k).points - lineup.points;
            }
            return {
                gameweek: gw.id,
                xiPoints: lineup.points,
                captain: lineup.captain ? lineup.captain.player : null,
                bboost: total - xi,
                '3xc': captainPts,
                freehit: freeHitGain,
                doubleTeams: counts.filter(n => n > 1).length,
                blankTeams: counts.filter(n => n === 0).length,
                squadDoubles: current.filter(pr => pr.fixtures.filter(f => f.event === gw.id).length > 1).length,
                squadBlanks: current.filter(pr => !pr.fixtures.some(f => f.event === gw.id)).length
            };
        });

        // Best week per chip
        const best = {};
        for (const chip of ['bboost', '3xc', 'freehit']) {
            if (!available.includes(chip)) continue;
            const ranked = weeks.filter(w => w[chip] !== null).sort((a, b) => b[chip] - a[chip]);
            if (ranked.length) best[chip] = ranked[0].gameweek;
        }
        return { available, used, deadline: stop, weeks, best };
    },

    // ── Multi-week transfer planner ──────────────────────────────────────────
    PLAN_BEAM: 12,          // plans kept after each gameweek
    PLAN_SHORTLIST: 10,     // players considered per position
    PLAN_PAIRS_FROM: 12,    // best single moves combined into two-transfer weeks
    FT_VALUE: 2,            // points credited per free transfer still banked (keeps rolling an option)

    // Search over the horizon: each gameweek roll, make one transfer or make two, paying hits beyond
    // the free transfers. The best plans are kept after every gameweek (beam search).
    // Locked players are never sold, banned players never bought. Prices are assumed not to change.
    async planTransfers(currentTeam, allPlayers, bank, { locked = [], banned = [] } = {}) {
        const ctx = await this.getContext();
        const state = await this.getTransferState(currentTeam, allPlayers, bank, ctx);
        const result = { ...state, horizon: ctx.horizon, steps: [], gain: 0 };
        const H = ctx.horizon.length;
        if (!H) return result;

        const lockedIds = new Set(locked);
        const shortlist = this.buildShortlist(state, allPlayers, ctx, this.PLAN_SHORTLIST, new Set(banned));
        const pool = [...state.squad, ...Object.values(shortlist).flat()];
        await this.loadRecentHistory(pool);
        const proj = new Map(pool.map(p => [p.id, this.projectPlayerSync(p, ctx)]));

        const clubLimit = (ctx.bootstrap.game_settings || {}).squad_team_limit || 3;
        const weight = k => Math.pow(this.DECAY, k);
        const lineup = (squad, k) => this.bestLineup(squad.map(p => proj.get(p.id)), k);
        // Weighted points of gameweeks k.. if the squad is kept as it is
        const holdFrom = (squad, k) => {
            let value = 0;
            for (let j = k; j < H; j++) value += weight(j) * lineup(squad, j).points;
            return value;
        };
        const clubCounts = squad => squad.reduce((c, p) => ((c[p.teamId] = (c[p.teamId] || 0) + 1), c), {});

        // Single transfers worth considering this gameweek, best first
        const singleMoves = (st, k) => {
            const ids = new Set(st.squad.map(p => p.id));
            const clubs = clubCounts(st.squad);
            const base = holdFrom(st.squad, k);
            const moves = [];
            st.squad.forEach((out, idx) => {
                if (lockedIds.has(out.id)) return;
                for (const candidate of shortlist[out.position]) {
                    if (ids.has(candidate.id) || candidate.price > st.bank + st.sell[out.id] + 1e-9) continue;
                    if (candidate.teamId !== out.teamId && (clubs[candidate.teamId] || 0) + 1 > clubLimit) continue;
                    const squad = st.squad.slice();
                    squad[idx] = candidate;
                    const gain = holdFrom(squad, k) - base;
                    if (gain > 0) moves.push({ out, in: candidate, gain });
                }
            });
            return moves.sort((a, b) => b.gain - a.gain);
        };

        const applyMoves = (st, moves, k) => {
            let squad = st.squad;
            let bank = st.bank;
            const sell = { ...st.sell };
            for (const m of moves) {
                squad = squad.map(p => (p.id === m.out.id ? m.in : p));
                bank = Math.round((bank + sell[m.out.id] - m.in.price) * 10) / 10;
                sell[m.in.id] = m.in.price;
            }
            const hit = Math.max(0, moves.length - st.ft) * this.HIT_COST;
            const ft = Math.min(state.maxFree, Math.max(0, st.ft - moves.length) + 1);
            const gw = lineup(squad, k);
            const banked = st.banked + weight(k) * gw.points - hit;
            return {
                squad, bank, sell, ft, banked,
                score: banked + holdFrom(squad, k + 1) + ft * this.FT_VALUE,
                steps: [...st.steps, {
                    gw: ctx.horizon[k].id, moves: moves.map(m => ({ out: m.out, in: m.in })), hit,
                    freeTransfers: st.ft, points: Math.round(gw.points * 10) / 10,
                    captain: gw.captain ? gw.captain.player : null
                }]
            };
        };

        let beam = [{ squad: state.squad, bank: state.bank, sell: { ...state.sellingPrice }, ft: state.freeTransfers, banked: 0, steps: [] }];
        for (let k = 0; k < H; k++) {
            const children = new Map();
            const keep = child => {
                const key = child.squad.map(p => p.id).sort((a, b) => a - b).join(',') + '|' + child.ft;
                if (!children.has(key) || children.get(key).score < child.score) children.set(key, child);
            };
            for (const st of beam) {
                keep(applyMoves(st, [], k));
                const singles = singleMoves(st, k);
                for (const m of singles) keep(applyMoves(st, [m], k));

                // Two transfers in one week: combine the best singles that fit together
                const top = singles.slice(0, this.PLAN_PAIRS_FROM);
                for (let i = 0; i < top.length; i++) {
                    for (let j = i + 1; j < top.length; j++) {
                        const [a, b] = [top[i], top[j]];
                        if (a.out.id === b.out.id || a.in.id === b.in.id) continue;
                        if (st.bank + st.sell[a.out.id] + st.sell[b.out.id] - a.in.price - b.in.price < -1e-9) continue;
                        const after = st.squad.map(p => (p.id === a.out.id ? a.in : p.id === b.out.id ? b.in : p));
                        if (Math.max(...Object.values(clubCounts(after))) > clubLimit) continue;
                        keep(applyMoves(st, [a, b], k));
                    }
                }
            }
            beam = [...children.values()].sort((a, b) => b.score - a.score).slice(0, this.PLAN_BEAM);
        }

        // Compare with rolling every week
        const holdValue = holdFrom(state.squad, 0) + Math.min(state.maxFree, state.freeTransfers + H) * this.FT_VALUE;
        const best = beam[0];
        result.steps = best.steps;
        result.gain = Math.round((best.score - holdValue) * 10) / 10;
        result.finalBank = best.bank;
        result.finalFreeTransfers = best.ft;
        return result;
    },

    // Kept for callers that only need the list
    async findBestTransfers(currentTeam, allPlayers, budget) {
        return (await this.getTransferPlan(currentTeam, allPlayers, budget)).transfers;
    },

    // Reasons for a transfer: model-based first (availability, minutes, fixtures, projection), then stats
    getTransferReason(playerOut, playerIn, option, ctx) {
        const reasons = [];
        if (option && ctx) {
            const outProj = option.outProjection;
            const inProj = option.inProjection;
            const first = ctx.horizon[0];
            const last = ctx.horizon[ctx.horizon.length - 1];
            const range = first === last ? `GW${first.id}` : `GW${first.id}-${last.id}`;

            if (this.getAvailabilityForGW(playerOut, 0, first.deadline) < 0.5) {
                reasons.push(`${playerOut.name} unavailable${playerOut.news ? ` (${playerOut.news})` : ''}`);
            }
            if (option.outStartsGWs === 0) {
                reasons.push(`${playerOut.name} would not make your XI`);
            }
            if (inProj.minutes.pStart > outProj.minutes.pStart + 0.25) {
                reasons.push(`Starts more often (${Math.round(inProj.minutes.pStart * 100)}% vs ${Math.round(outProj.minutes.pStart * 100)}%)`);
            }
            const fixtureCount = pr => ctx.horizon.map(gw => pr.fixtures.filter(f => f.event === gw.id).length);
            const outCount = fixtureCount(outProj);
            const inCount = fixtureCount(inProj);
            ctx.horizon.forEach((gw, k) => {
                if (inCount[k] > 1 && outCount[k] <= 1) reasons.push(`Double gameweek in GW${gw.id}`);
                if (outCount[k] === 0 && inCount[k] > 0) reasons.push(`${playerOut.name} blanks in GW${gw.id}`);
            });
            reasons.push(`Projects ${inProj.total.toFixed(1)} vs ${outProj.total.toFixed(1)} pts (${range})`);
        }
        if (reasons.length >= 3) return reasons.slice(0, 3).join('; ');

        const outForm = parseFloat(playerOut.form) || 0;
        const outChance = this.getAvailability(playerOut) * 100;
        const inForm = parseFloat(playerIn.form) || 0;
        const inSelectedBy = parseFloat(playerIn.selectedBy) || 0;
        const inPPG = parseFloat(playerIn.pointsPerGame) || 0;
        const outPPG = parseFloat(playerOut.pointsPerGame) || 0;
        const inXGI = parseFloat(playerIn.expectedGoalInvolvementsPer90) || 0;
        const outXGI = parseFloat(playerOut.expectedGoalInvolvementsPer90) || 0;
        const inBPS = parseFloat(playerIn.bps) || 0;
        const outBPS = parseFloat(playerOut.bps) || 0;
        const inMinutes = parseFloat(playerIn.minutes) || 0;
        const outMinutes = parseFloat(playerOut.minutes) || 0;

        // Defensive-specific reasons (DEF / GKP)
        if (playerOut.position === 'DEF' || playerOut.position === 'GKP') {
            const outXGC = parseFloat(playerOut.expectedGoalsConcededPer90) || 0;
            const inXGC = parseFloat(playerIn.expectedGoalsConcededPer90) || 0;
            const outCS = parseFloat(playerOut.cleanSheets) || 0;
            const inCS = parseFloat(playerIn.cleanSheets) || 0;
            const outStarts = Math.max(1, parseFloat(playerOut.starts) || 1);
            const inStarts = Math.max(1, parseFloat(playerIn.starts) || 1);
            const outCSRate = outCS / outStarts;
            const inCSRate = inCS / inStarts;

            if (outXGC > 0 && inXGC > 0 && inXGC < outXGC * 0.80) {
                reasons.push(`Better defensive record (xGC/90: ${inXGC.toFixed(2)} vs ${outXGC.toFixed(2)})`);
            }
            if (inCSRate > outCSRate + 0.10) {
                reasons.push(`Higher clean sheet rate (${(inCSRate * 100).toFixed(0)}% vs ${(outCSRate * 100).toFixed(0)}%)`);
            }
            if (playerOut.position === 'GKP') {
                const outSaves = parseFloat(playerOut.saves) || 0;
                const inSaves = parseFloat(playerIn.saves) || 0;
                const outSavesPerGame = outSaves / outStarts;
                const inSavesPerGame = inSaves / inStarts;
                if (inSavesPerGame > outSavesPerGame * 1.2 && inSavesPerGame > 3) {
                    reasons.push(`More saves per game (${inSavesPerGame.toFixed(1)} vs ${outSavesPerGame.toFixed(1)})`);
                }

                // GKP-specific: minutes reliability
                const outMins = parseFloat(playerOut.minutes) || 0;
                const inMins = parseFloat(playerIn.minutes) || 0;
                if (inMins > outMins * 1.15 && inMins > 900) {
                    reasons.push(`More reliable starter (${Math.round(inMins)} vs ${Math.round(outMins)} mins)`);
                }
            }
        }

        // Form-based reasons
        if (outForm < 3) {
            reasons.push(`${playerOut.name} poor form (${outForm.toFixed(1)})`);
        }

        if (inForm > 6) {
            reasons.push(`${playerIn.name} excellent form (${inForm.toFixed(1)})`);
        }

        // Injury/availability
        if (outChance < 75) {
            reasons.push('Injury/rotation risk');
        }

        // Performance metrics
        if (inPPG > outPPG + 1.5) {
            reasons.push(`Better PPG: ${inPPG.toFixed(1)} vs ${outPPG.toFixed(1)}`);
        }

        // Expected stats
        if (inXGI > outXGI * 1.3 && inXGI > 0.1) {
            reasons.push(`Higher xGI per 90: ${inXGI.toFixed(2)} vs ${outXGI.toFixed(2)}`);
        }

        // Bonus points potential
        const inBPSPerGame = inMinutes > 0 ? inBPS / (inMinutes / 90) : 0;
        const outBPSPerGame = outMinutes > 0 ? outBPS / (outMinutes / 90) : 0;
        if (inBPSPerGame > outBPSPerGame * 1.2 && inBPSPerGame > 20) {
            reasons.push('Better bonus potential');
        }

        // Minutes/rotation
        if (outMinutes < 500 && inMinutes > 1000) {
            reasons.push('More nailed-on starter');
        }

        // Differential
        if (inSelectedBy < 10 && inForm > 5) {
            reasons.push(`Differential pick (${inSelectedBy.toFixed(1)}% TSB)`);
        }

        // Value
        const inValue = inPPG / (parseFloat(playerIn.price) || 1);
        const outValue = outPPG / (parseFloat(playerOut.price) || 1);
        if (inValue > outValue * 1.2) {
            reasons.push('Better value');
        }

        return reasons.slice(0, 3).join('; ') || 'Statistical upgrade based on xG, xA, and BPS metrics';
    },

    // Calculate form trend (last 5 games performance)
    calculateFormTrend(player) {
        const form = parseFloat(player.form) || 0;
        const ppg = parseFloat(player.pointsPerGame) || 0;

        if (isNaN(form) || isNaN(ppg)) return 'Stable';

        if (form > ppg + 1) return 'Rising';
        if (form < ppg - 1) return 'Falling';
        return 'Stable';
    },

    // Get player value score (points per million)
    getValueScore(player) {
        const points = parseFloat(player.points) || 0;
        const price = parseFloat(player.price) || 1;

        if (price === 0 || isNaN(price)) return 0;

        const score = (points / price) * 10;
        const rounded = Math.round(score) / 10;
        return isNaN(rounded) ? 0 : rounded;
    },

    // Predict captain choice for next gameweek
    async suggestCaptain(team) {
        const predictions = await this.predictTeamPoints(team);

        // Sort by expected points
        predictions.sort((a, b) => b.expectedPoints - a.expectedPoints);

        return {
            captain: predictions[0],
            viceCaptain: predictions[1],
            alternatives: predictions.slice(2, 5)
        };
    }
};

if (typeof module !== 'undefined') module.exports = Predictor;
