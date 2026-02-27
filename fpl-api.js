// FPL API Integration Module
const FPL_API = {
    BASE_URL: 'https://fantasy.premierleague.com/api',
    CORS_PROXY: 'https://corsproxy.io/?',
    TEAM_ID: parseInt(localStorage.getItem('fpl_team_id'), 10) || 1146081,

    // Cached data
    cache: {
        bootstrap: null,
        teamData: null,
        fixtures: null,
        managerHistory: null
    },

    // Helper to build URL with CORS proxy
    buildUrl(endpoint) {
        return this.CORS_PROXY + encodeURIComponent(endpoint);
    },

    // Fetch bootstrap-static data (all players, teams, gameweeks)
    async getBootstrapStatic() {
        if (this.cache.bootstrap) return this.cache.bootstrap;

        try {
            const url = this.buildUrl(`${this.BASE_URL}/bootstrap-static/`);
            const response = await fetch(url);
            const data = await response.json();
            this.cache.bootstrap = data;
            return data;
        } catch (error) {
            console.error('Error fetching bootstrap data:', error);
            throw error;
        }
    },

    // Fetch manager's team data
    async getManagerTeam() {
        if (this.cache.teamData) return this.cache.teamData;

        try {
            const url = this.buildUrl(`${this.BASE_URL}/entry/${this.TEAM_ID}/`);
            const response = await fetch(url);
            const data = await response.json();
            this.cache.teamData = data;
            return data;
        } catch (error) {
            console.error('Error fetching team data:', error);
            throw error;
        }
    },

    // Fetch manager's team for current gameweek
    async getCurrentTeamPicks(gameweek) {
        try {
            const url = this.buildUrl(`${this.BASE_URL}/entry/${this.TEAM_ID}/event/${gameweek}/picks/`);
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching team picks:', error);
            throw error;
        }
    },

    // Fetch manager's history
    async getManagerHistory() {
        if (this.cache.managerHistory) return this.cache.managerHistory;

        try {
            const url = this.buildUrl(`${this.BASE_URL}/entry/${this.TEAM_ID}/history/`);
            const response = await fetch(url);
            const data = await response.json();
            this.cache.managerHistory = data;
            return data;
        } catch (error) {
            console.error('Error fetching manager history:', error);
            throw error;
        }
    },

    // Fetch all fixtures
    async getFixtures() {
        if (this.cache.fixtures) return this.cache.fixtures;

        try {
            const url = this.buildUrl(`${this.BASE_URL}/fixtures/`);
            const response = await fetch(url);
            const data = await response.json();
            this.cache.fixtures = data;
            return data;
        } catch (error) {
            console.error('Error fetching fixtures:', error);
            throw error;
        }
    },

    // Fetch player detailed data
    async getPlayerDetails(playerId) {
        try {
            const url = this.buildUrl(`${this.BASE_URL}/element-summary/${playerId}/`);
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching player details:', error);
            throw error;
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
