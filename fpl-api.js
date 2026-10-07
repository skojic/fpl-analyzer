// FPL API Integration Module
const FPL_API = {
    BASE_URL: 'https://fantasy.premierleague.com/api',
    TEAM_ID: (typeof localStorage !== 'undefined' && parseInt(localStorage.getItem('fpl_team_id'), 10)) || 1146081,
    MAX_RETRIES: 2,
    RETRY_DELAY: 1000, // ms
    IS_BROWSER: typeof window !== 'undefined',
    // Node only: proxy to fall back to when the FPL API refuses direct requests (e.g. from CI servers),
    // set with FPL_PROXY=https://<site>/api/proxy?url=
    NODE_PROXY: typeof window === 'undefined' && typeof process !== 'undefined' ? process.env.FPL_PROXY || null : null,

    // Cached data
    cache: {
        bootstrap: null,
        teamData: null,
        fixtures: null,
        managerHistory: null,
        entryTransfers: null,
        playerDetails: {},
        leagues: {},
        entryPicks: {}
    },

    // Empty every cache (a server function reuses this module between requests)
    resetCache() {
        this.cache = { bootstrap: null, teamData: null, fixtures: null, managerHistory: null, entryTransfers: null, playerDetails: {}, leagues: {}, entryPicks: {} };
    },

    // Helper to build URL - uses the same-origin Vercel proxy (api/proxy.js) in browser, direct in Node.js
    buildUrl(endpoint) {
        if (!this.IS_BROWSER) return endpoint;
        return `/api/proxy?url=${encodeURIComponent(endpoint)}`;
    },

    // Enhanced fetch with retry logic. Only network errors, 429 and 5xx are retried;
    // other 4xx responses (e.g. 404, 410 from a removed deployment) fail immediately.
    async fetchWithRetry(endpoint, options = {}) {
        let lastError;

        for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
            let retryable = true;
            // In Node, retries after a failed direct request go through NODE_PROXY when it is set
            const viaNodeProxy = this.NODE_PROXY && attempt > 0;
            try {
                const url = viaNodeProxy ? this.NODE_PROXY + encodeURIComponent(endpoint) : this.buildUrl(endpoint);
                console.log(`Attempt ${attempt + 1}: Fetching ${this.IS_BROWSER || viaNodeProxy ? 'via proxy' : 'direct API'}`);

                let response;
                try {
                    response = await fetch(url, options);
                } catch (networkError) {
                    // Blocked by CORS (e.g. redirect to Vercel login) or host unreachable
                    throw new Error(this.IS_BROWSER ? 'Could not reach the data proxy' : networkError.message);
                }

                if (!response.ok) {
                    retryable = response.status === 429 || response.status >= 500;
                    // The proxy answers with JSON { error }; anything else came from the hosting platform
                    const body = await response.json().catch(() => null);
                    const reason = body && body.error
                        ? body.error
                        : `${this.IS_BROWSER ? 'Proxy unavailable' : 'Request failed'} (HTTP ${response.status})`;
                    throw new Error(reason);
                }

                const data = await response.json();
                console.log(`✅ Success! Data received`);
                return data;
            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt + 1} failed:`, error.message);

                // A refused direct request is still worth one try through the Node proxy
                if (!retryable && !(this.NODE_PROXY && attempt === 0)) break;

                // If this is not the last attempt, retry with delay
                if (attempt < this.MAX_RETRIES) {
                    console.log(`⏳ Retrying in ${this.RETRY_DELAY}ms...`);
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                }
            }
        }

        throw lastError;
    },


    // Transfer planner preferences (locked / banned player ids), saved per team in the browser
    getPlanPrefs() {
        try {
            return { locked: [], banned: [], ...JSON.parse(localStorage.getItem(`fpl_plan_prefs_${this.TEAM_ID}`) || '{}') };
        } catch (e) {
            return { locked: [], banned: [] };
        }
    },

    savePlanPrefs(prefs) {
        localStorage.setItem(`fpl_plan_prefs_${this.TEAM_ID}`, JSON.stringify(prefs));
    },

    // Fetch bootstrap-static data (all players, teams, gameweeks)
    async getBootstrapStatic() {
        if (this.cache.bootstrap) return this.cache.bootstrap;

        try {
            const url = `${this.BASE_URL}/bootstrap-static/`;
            const data = await this.fetchWithRetry(url);
            this.cache.bootstrap = data;
            return data;
        } catch (error) {
            console.error('Error fetching bootstrap data:', error);
            throw new Error(`Failed to load FPL data: ${error.message}`);
        }
    },

    // Fetch manager's team data
    async getManagerTeam() {
        if (this.cache.teamData) return this.cache.teamData;

        try {
            const url = `${this.BASE_URL}/entry/${this.TEAM_ID}/`;
            const data = await this.fetchWithRetry(url);
            this.cache.teamData = data;
            return data;
        } catch (error) {
            console.error('Error fetching team data:', error);
            throw new Error(`Failed to load your team data (Team ID may be invalid): ${error.message}`);
        }
    },

    // Fetch manager's team for current gameweek
    async getCurrentTeamPicks(gameweek) {
        try {
            const url = `${this.BASE_URL}/entry/${this.TEAM_ID}/event/${gameweek}/picks/`;
            const data = await this.fetchWithRetry(url);
            return data;
        } catch (error) {
            console.error('Error fetching team picks:', error);
            throw new Error(`Failed to load picks for gameweek ${gameweek}: ${error.message}`);
        }
    },

    // Fetch manager's history
    async getManagerHistory() {
        if (this.cache.managerHistory) return this.cache.managerHistory;

        try {
            const url = `${this.BASE_URL}/entry/${this.TEAM_ID}/history/`;
            const data = await this.fetchWithRetry(url);
            this.cache.managerHistory = data;
            return data;
        } catch (error) {
            console.error('Error fetching manager history:', error);
            throw new Error(`Failed to load your team history: ${error.message}`);
        }
    },

    // Fetch all fixtures
    async getFixtures() {
        if (this.cache.fixtures) return this.cache.fixtures;

        try {
            const url = `${this.BASE_URL}/fixtures/`;
            const data = await this.fetchWithRetry(url);
            this.cache.fixtures = data;
            return data;
        } catch (error) {
            console.error('Error fetching fixtures:', error);
            throw new Error(`Failed to load fixture data: ${error.message}`);
        }
    },

    // Live points for a gameweek (not cached: refreshed while matches are on)
    async getEventLive(gameweek) {
        try {
            return await this.fetchWithRetry(`${this.BASE_URL}/event/${gameweek}/live/`);
        } catch (error) {
            console.error('Error fetching live points:', error);
            throw new Error(`Failed to load live points: ${error.message}`);
        }
    },

    // One gameweek's fixtures with live scores and bonus point system (BPS) values (not cached)
    async getEventFixtures(gameweek) {
        try {
            return await this.fetchWithRetry(`${this.BASE_URL}/fixtures/?event=${gameweek}`);
        } catch (error) {
            console.error('Error fetching gameweek fixtures:', error);
            throw new Error(`Failed to load fixtures for gameweek ${gameweek}: ${error.message}`);
        }
    },

    // Classic league standings, 50 managers per page
    async getLeagueStandings(leagueId, page = 1) {
        const key = `${leagueId}:${page}`;
        if (this.cache.leagues[key]) return this.cache.leagues[key];

        try {
            const url = `${this.BASE_URL}/leagues-classic/${leagueId}/standings/${page > 1 ? `?page_standings=${page}` : ''}`;
            const data = await this.fetchWithRetry(url);
            this.cache.leagues[key] = data;
            return data;
        } catch (error) {
            console.error('Error fetching league:', error);
            throw new Error(`Failed to load league ${leagueId}: ${error.message}`);
        }
    },

    // Any manager's picks for a gameweek (rivals in a league)
    async getEntryPicks(entryId, gameweek) {
        const key = `${entryId}:${gameweek}`;
        if (this.cache.entryPicks[key]) return this.cache.entryPicks[key];

        try {
            const url = `${this.BASE_URL}/entry/${entryId}/event/${gameweek}/picks/`;
            const data = await this.fetchWithRetry(url);
            this.cache.entryPicks[key] = data;
            return data;
        } catch (error) {
            console.error('Error fetching picks:', error);
            throw new Error(`Failed to load picks of manager ${entryId}: ${error.message}`);
        }
    },

    // Fetch the manager's transfer history (all gameweeks, newest first)
    async getEntryTransfers() {
        if (this.cache.entryTransfers) return this.cache.entryTransfers;

        try {
            const url = `${this.BASE_URL}/entry/${this.TEAM_ID}/transfers/`;
            const data = await this.fetchWithRetry(url);
            this.cache.entryTransfers = data;
            return data;
        } catch (error) {
            console.error('Error fetching transfers:', error);
            throw new Error(`Failed to load your transfer history: ${error.message}`);
        }
    },

    // Fetch player detailed data (match history, upcoming fixtures)
    async getPlayerDetails(playerId) {
        if (this.cache.playerDetails[playerId]) return this.cache.playerDetails[playerId];

        try {
            const url = `${this.BASE_URL}/element-summary/${playerId}/`;
            const data = await this.fetchWithRetry(url);
            this.cache.playerDetails[playerId] = data;
            return data;
        } catch (error) {
            console.error('Error fetching player details:', error);
            throw new Error(`Failed to load details for player ${playerId}: ${error.message}`);
        }
    },

    // Get current gameweek
    getCurrentGameweek(bootstrapData) {
        const currentEvent = bootstrapData.events.find(event => event.is_current);
        return currentEvent ? currentEvent.id : bootstrapData.events[0].id;
    },

    // Get team name by ID
    getTeamName(teamId, teams) {
        const team = teams.find(tm => tm.id === teamId);
        return team ? team.short_name : 'Unknown';
    },

    // Get position name
    getPositionName(typeId, elementTypes) {
        const type = elementTypes.find(et => et.id === typeId);
        return type ? type.singular_name_short : 'Unknown';
    },

    // Format player data with extended statistics
    formatPlayer(player, teams, elementTypes) {
        return {
            id: player.id,
            name: player.web_name,
            fullName: `${player.first_name} ${player.second_name}`,
            team: this.getTeamName(player.team, teams),
            teamId: player.team,
            teamCode: (teams.find(tm => tm.id === player.team) || {}).code || null,
            position: this.getPositionName(player.element_type, elementTypes),
            positionId: player.element_type,
            price: player.now_cost / 10,
            points: player.total_points,
            form: parseFloat(player.form),
            selectedBy: parseFloat(player.selected_by_percent),
            pointsPerGame: parseFloat(player.points_per_game),
            minutes: player.minutes,
            goalsScored: player.goals_scored,
            assists: player.assists,
            cleanSheets: player.clean_sheets,
            goalsConceded: player.goals_conceded,
            ownGoals: player.own_goals,
            yellowCards: player.yellow_cards,
            redCards: player.red_cards,
            saves: player.saves,
            bonus: player.bonus,
            bps: player.bps,
            influence: parseFloat(player.influence),
            creativity: parseFloat(player.creativity),
            threat: parseFloat(player.threat),
            ictIndex: parseFloat(player.ict_index),

            // Expected stats (xG, xA, xGI, xGC)
            expectedGoals: parseFloat(player.expected_goals),
            expectedAssists: parseFloat(player.expected_assists),
            expectedGoalInvolvements: parseFloat(player.expected_goal_involvements),
            expectedGoalsConceded: parseFloat(player.expected_goals_conceded),

            // Per 90 stats
            expectedGoalsPer90: parseFloat(player.expected_goals_per_90),
            expectedAssistsPer90: parseFloat(player.expected_assists_per_90),
            expectedGoalInvolvementsPer90: parseFloat(player.expected_goal_involvements_per_90),
            expectedGoalsConcededPer90: parseFloat(player.expected_goals_conceded_per_90),
            savesPer90: parseFloat(player.saves_per_90),
            defensiveContribution: player.defensive_contribution,
            tackles: player.tackles,
            clearancesBlocksInterceptions: player.clearances_blocks_interceptions,
            recoveries: player.recoveries,
            defensiveContributionPer90: parseFloat(player.defensive_contribution_per_90),

            // Additional stats
            starts: player.starts,
            startsPercentage: player.minutes > 0 ? (player.starts / (player.minutes / 90)) * 100 : 0,
            penaltiesOrder: player.penalties_order,
            penaltiesSaved: player.penalties_saved,
            penaltiesMissed: player.penalties_missed,
            directFreekicksOrder: player.direct_freekicks_order,
            cornersAndIndirectFreekicksOrder: player.corners_and_indirect_freekicks_order,

            // Availability
            chanceOfPlayingNextRound: player.chance_of_playing_next_round,
            chanceOfPlayingThisRound: player.chance_of_playing_this_round,
            news: player.news,
            newsAdded: player.news_added,
            status: player.status,

            // Form and value
            costChangeEvent: player.cost_change_event,
            costChangeEventFall: player.cost_change_event_fall,
            costChangeStart: player.cost_change_start,
            costChangeStartFall: player.cost_change_start_fall,
            // FPL's price predictor: progress towards the next change (±100% = change), now and for the next nights
            priceChangePercent: parseFloat(player.price_change_percent) || 0,
            priceChangeProjections: (player.price_change_projections || []).map(p => ({ offset: p.offset, percent: parseFloat(p.projected_percent) || 0 })),
            valueForm: parseFloat(player.value_form),
            valueSeason: parseFloat(player.value_season),

            // Transfer data
            transfersIn: player.transfers_in,
            transfersOut: player.transfers_out,
            transfersInEvent: player.transfers_in_event,
            transfersOutEvent: player.transfers_out_event,

            // Photo
            photo: player.photo
        };
    },

    // Availability flag shown on the pitch, mirroring the FPL site colours:
    // 75% yellow, 50/25% orange, 0% or injured/suspended/unavailable red. null when fully available.
    getAvailability(player) {
        const chance = player.chanceOfPlayingNextRound;
        if (player.status === 'a' && (chance === null || chance === undefined || chance === 100)) return null;
        let level = 'out';
        if (chance >= 75) level = 'doubt';
        else if (chance > 0) level = 'risk';
        else if (player.status === 'd') level = 'doubt';  // doubtful without a percentage
        const labelKey = { i: 'flagInjured', s: 'flagSuspended', u: 'flagUnavailable', d: 'flagDoubtful' }[player.status];
        return {
            level,
            label: chance > 0 ? `${chance}%` : labelKey,
            isKey: !(chance > 0),
            news: player.news || ''
        };
    },

    // Get all players formatted
    async getAllPlayers() {
        const bootstrap = await this.getBootstrapStatic();
        return bootstrap.elements.map(player =>
            this.formatPlayer(player, bootstrap.teams, bootstrap.element_types)
        );
    },

    // Get team composition
    async getTeamComposition() {
        const bootstrap = await this.getBootstrapStatic();
        const currentGW = this.getCurrentGameweek(bootstrap);
        const teamPicks = await this.getCurrentTeamPicks(currentGW);
        const allPlayers = await this.getAllPlayers();

        const picks = teamPicks.picks.map(pick => {
            const player = allPlayers.find(p => p.id === pick.element);
            // Get the player's event points from bootstrap data
            const bootstrapPlayer = bootstrap.elements.find(p => p.id === pick.element);
            const eventPoints = bootstrapPlayer ? bootstrapPlayer.event_points : 0;

            return {
                ...player,
                multiplier: pick.multiplier,
                isCaptain: pick.is_captain,
                isViceCaptain: pick.is_vice_captain,
                squadPosition: pick.position, // 1-15 position in squad
                pickOrder: pick.position,
                eventPoints: eventPoints, // Gameweek points
                totalPoints: player.points // Total season points
            };
        });

        return {
            picks,
            activeChip: teamPicks.active_chip,
            entryHistory: teamPicks.entry_history,
            managerName: (await this.getManagerTeam()).name,
            teamName: (await this.getManagerTeam()).name
        };
    },

    // Get upcoming fixtures for a team
    getUpcomingFixtures(teamId, fixtures, count = 5) {
        const now = new Date();
        const upcoming = fixtures
            .filter(fixture =>
                !fixture.finished &&
                (fixture.team_h === teamId || fixture.team_a === teamId)
            )
            .sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time))
            .slice(0, count);

        return upcoming;
    },

    // Calculate fixture difficulty for next 5 games
    async getPlayerFixtureDifficulty(playerId) {
        const bootstrap = await this.getBootstrapStatic();
        const fixtures = await this.getFixtures();
        const player = bootstrap.elements.find(p => p.id === playerId);

        if (!player) return [];

        const teamFixtures = this.getUpcomingFixtures(player.team, fixtures, 5);

        return teamFixtures.map(fixture => {
            const isHome = fixture.team_h === player.team;
            const opponentId = isHome ? fixture.team_a : fixture.team_h;
            const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
            const opponent = bootstrap.teams.find(tm => tm.id === opponentId);

            return {
                opponent: opponent ? opponent.short_name : 'Unknown',
                isHome,
                difficulty,
                kickoffTime: fixture.kickoff_time
            };
        });
    }
};

if (typeof module !== 'undefined') module.exports = FPL_API;
