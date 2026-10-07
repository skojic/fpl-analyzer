// Main Application Logic
let appData = {
    allPlayers: [],
    myTeam: [],
    managerData: null,
    filteredPlayers: [],
    sortColumn: 'points',
    sortDirection: 'desc'
};

// Helper function to safely format numbers and avoid NaN
function safeNumber(value, decimals = 0, defaultValue = 0) {
    const num = parseFloat(value);
    if (isNaN(num) || num === null || num === undefined) {
        return decimals > 0 ? defaultValue.toFixed(decimals) : defaultValue;
    }
    return decimals > 0 ? num.toFixed(decimals) : Math.round(num);
}

// Initialize the application
async function initializeApp() {
    try {
        // Load team name first
        await loadTeamName();

        // Load all data
        await Promise.all([
            loadMyTeam(),
            loadPlayerDatabase(),
            loadPerformance(),
            loadPredictions(),
            loadTransferSuggestions(),
            loadLeagueCard(),
            loadFixturesCard(),
            loadOptimizerCard(),
            loadLiveCard(),
            loadPricesCard()
        ]);
    } catch (error) {
        console.error('Error initializing app:', error);
        showError(error.message);
    }
}

// Load and display team name in header
async function loadTeamName() {
    try {
        const managerData = await FPL_API.getManagerTeam();
        const teamName = managerData.name || 'My FPL Team';

        // Update page title and header
        document.title = `${teamName} ${t('analysis')} - FPL`;
        document.getElementById('team-name-header').textContent = `${teamName} ${t('analysis')}`;
        document.getElementById('team-subtitle').textContent = '';
        const tidBadge = document.getElementById('tid-badge');
        if (tidBadge) tidBadge.textContent = `id:${FPL_API.TEAM_ID}`;
    } catch (error) {
        console.error('Error loading team name:', error);
    }
}

// Load My Team Card
async function loadMyTeam() {
    const content = document.getElementById('team-content');

    try {
        const [teamData, fixtures, bootstrap] = await Promise.all([
            FPL_API.getTeamComposition(),
            FPL_API.getFixtures(),
            FPL_API.getBootstrapStatic()
        ]);
        appData.myTeam = teamData.picks;

        // Build fixture map: teamId → next 1 upcoming fixture
        appData.fixtureMap = {};
        bootstrap.teams.forEach(team => {
            const upcoming = FPL_API.getUpcomingFixtures(team.id, fixtures, 1);
            appData.fixtureMap[team.id] = upcoming.map(f => {
                const isHome = f.team_h === team.id;
                const oppId  = isHome ? f.team_a : f.team_h;
                const diff   = isHome ? f.team_h_difficulty : f.team_a_difficulty;
                const opp    = bootstrap.teams.find(team => team.id === oppId);
                return { opp: opp ? opp.short_name : '?', oppCode: opp ? opp.code : null, isHome, diff };
            });
        });

        // Sort by position order
        teamData.picks.sort((a, b) => a.pickOrder - b.pickOrder);

        // Separate starting XI and bench
        const startingXI = teamData.picks.slice(0, 11);
        const bench = teamData.picks.slice(11);

        // Field visualization
        const currentGW = teamData.entryHistory ? teamData.entryHistory.event : '–';
        let html = `<div class="team-gw-banner">${t('gameweek')} ${currentGW}</div>`;
        html += '<div class="football-field">';

        // Group starting XI by position
        const gkp = startingXI.filter(p => p.position === 'GKP');
        const def = startingXI.filter(p => p.position === 'DEF');
        const mid = startingXI.filter(p => p.position === 'MID');
        const fwd = startingXI.filter(p => p.position === 'FWD');

        // Render formation (goalkeeper at top, forwards at bottom)
        if (gkp.length > 0) {
            html += '<div class="field-line">';
            gkp.forEach(player => {
                html += renderFieldPlayer(player);
            });
            html += '</div>';
        }

        if (def.length > 0) {
            html += '<div class="field-line">';
            def.forEach(player => {
                html += renderFieldPlayer(player);
            });
            html += '</div>';
        }

        if (mid.length > 0) {
            html += '<div class="field-line">';
            mid.forEach(player => {
                html += renderFieldPlayer(player);
            });
            html += '</div>';
        }

        if (fwd.length > 0) {
            html += '<div class="field-line">';
            fwd.forEach(player => {
                html += renderFieldPlayer(player);
            });
            html += '</div>';
        }

        // Bench
        if (bench.length > 0) {
            html += '<div class="bench-section">';
            html += `<div class="bench-title">${t('substitutes')}</div>`;
            html += '<div class="bench-players">';
            bench.forEach(player => {
                html += `<div class="bench-player">${renderFieldPlayer(player)}</div>`;
            });
            html += '</div>';
            html += '</div>';
        }

        html += '</div>';

        // Team statistics
        if (teamData.entryHistory) {
            html += `
                <div class="stats-grid" style="margin-top: 20px;">
                    <div class="stat-card">
                        <div class="stat-card-value">${teamData.entryHistory.points}</div>
                        <div class="stat-card-label">${t('gwPoints')}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-value">£${(teamData.entryHistory.bank / 10).toFixed(1)}m</div>
                        <div class="stat-card-label">${t('bank')}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-value">£${(teamData.entryHistory.value / 10).toFixed(1)}m</div>
                        <div class="stat-card-label">${t('teamValue')}</div>
                    </div>
                </div>
            `;
        }

        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = `<div class="loading">${t('errorTeam')}</div>`;
        console.error(error);
    }
}

// Helper function to render a player on the field
function renderFieldPlayer(player) {
    const captainClass = player.isCaptain ? 'captain' : (player.isViceCaptain ? 'vice-captain' : '');
    const avail = FPL_API.getAvailability(player);
    const flagHtml = avail
        ? `<div class="player-flag player-flag-${avail.level}" title="${(avail.news || '').replace(/"/g, '&quot;')}">${avail.isKey ? t(avail.label) : avail.label}</div>`
        : '';
    const points = player.eventPoints || 0;
    const isGK = player.position === 'GKP';
    const kitSuffix = isGK ? '_1' : '';
    const kitUrl = player.teamCode
        ? `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${player.teamCode}${kitSuffix}-66.png`
        : '';
    const kitImg = kitUrl
        ? `<img class="player-kit-img" src="${kitUrl}" onerror="this.style.display='none'" referrerpolicy="no-referrer">`
        : '';

    const fixList = (appData.fixtureMap && appData.fixtureMap[player.teamId]) || [];
    const fixHtml = fixList.map(f => {
        const haClass = f.isHome ? 'fp-ha-home' : 'fp-ha-away';
        const badgeUrl = f.oppCode ? `https://resources.premierleague.com/premierleague/badges/50/t${f.oppCode}.png` : '';
        const badgeImg = badgeUrl ? `<img class="fp-badge" src="${badgeUrl}" onerror="this.style.display='none'">` : '';
        return `<span class="fp-fix fp-fdr-${f.diff} ${haClass}" title="${f.isHome ? 'Home' : 'Away'} vs ${f.opp}">${badgeImg}<span class="fp-opp">${f.opp}</span><span class="fp-ha">${f.isHome ? 'H' : 'A'}</span></span>`;
    }).join('');

    return `
        <div class="field-player player-clickable" onclick="window.open('player.html?id=${player.id}','_blank')" title="View ${player.name} profile">
            <div class="player-shirt-box${avail ? ` flag-${avail.level}` : ''}">
                <div class="player-shirt ${captainClass}">${kitImg}</div>
                <div class="player-name-field">${player.name}</div>
                <div class="player-points-field">${points} pts</div>
                ${flagHtml}
            </div>
            <div class="player-fixtures-row">${fixHtml}</div>
        </div>
    `;
}

// Get jersey number for player
function getJerseyNumber(player) {
    const positionNumbers = {
        'GKP': 1,
        'DEF': 2,
        'MID': 6,
        'FWD': 9
    };

    // Start with base number for position
    let number = positionNumbers[player.position] || 1;

    // Add variation based on pick order to make unique-ish
    if (player.pickOrder) {
        const offset = (player.pickOrder - 1) % 11;
        number = number + offset;
        if (number > 11) number = number - 11;
    }

    return number;
}

// Get player initials from name
function getPlayerInitials(name) {
    if (!name) return '??';

    const parts = name.split(' ');
    if (parts.length === 1) {
        return name.substring(0, 2).toUpperCase();
    }

    // Take first letter of first name and first letter of last name
    const firstInitial = parts[0].charAt(0);
    const lastInitial = parts[parts.length - 1].charAt(0);

    return `${firstInitial}${lastInitial}`.toUpperCase();
}

// Load Performance Card
async function loadPerformance() {
    const content = document.getElementById('performance-content');

    try {
        const managerData = await FPL_API.getManagerTeam();
        const history = await FPL_API.getManagerHistory();
        appData.managerData = managerData;

        let html = `
            <h3>${managerData.name}</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-value">${managerData.summary_overall_points}</div>
                    <div class="stat-card-label">${t('totalPoints')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${managerData.summary_overall_rank?.toLocaleString()}</div>
                    <div class="stat-card-label">${t('overallRank')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${managerData.summary_event_points || 0}</div>
                    <div class="stat-card-label">${t('gwPointsLabel')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${history.current.length}</div>
                    <div class="stat-card-label">${t('gwsPlayed')}</div>
                </div>
            </div>
        `;

        let gwLabels = [];
        let gwPoints = [];
        let gwAvgLine = [];

        if (history.current.length > 0) {
            const avgPts = Math.round(
                history.current.reduce((s, gw) => s + gw.points, 0) / history.current.length
            );
            gwLabels = history.current.slice(-10).map(gw => 'GW' + gw.event);
            gwPoints = history.current.slice(-10).map(gw => gw.points);
            gwAvgLine = history.current.slice(-10).map(() => avgPts);

            html += `
                <h4 style="margin-top: 20px; margin-bottom: 6px;">${t('last')} ${gwPoints.length} ${t('gameweeks')}</h4>
                <div style="position:relative; width:100%; height:200px;">
                    <canvas id="mini-gw-chart"></canvas>
                </div>
            `;

            const recentGWs = history.current.slice(-5).reverse();
            html += '<div class="fixtures-list">';
            for (const gw of recentGWs) {
                html += `
                    <div class="fixture-item">
                        <span class="fixture-teams">${t('gameweek')} ${gw.event}</span>
                        <span><strong>${gw.points} ${t('pts')}</strong></span>
                        <span>${t('rank')}: ${gw.overall_rank.toLocaleString()}</span>
                    </div>
                `;
            }
            html += '</div>';
        }

        content.innerHTML = html;

        if (gwPoints.length > 0 && typeof Chart !== 'undefined') {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const gridColor  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(55,0,60,0.08)';
            const labelColor = isDark ? '#9a88bc' : '#5a5070';
            const lineColor  = isDark ? '#00ff87' : '#37003c';
            const lineFill   = isDark ? 'rgba(0,255,135,0.10)' : 'rgba(55,0,60,0.08)';
            const dotColor   = isDark ? '#00cc6a' : '#37003c';
            const ctx = document.getElementById('mini-gw-chart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: gwLabels,
                    datasets: [
                        {
                            label: t('gwPointsLabel'),
                            data: gwPoints,
                            borderColor: lineColor,
                            backgroundColor: lineFill,
                            borderWidth: 2,
                            pointRadius: 3,
                            pointHoverRadius: 6,
                            pointBackgroundColor: gwPoints.map(p =>
                                p === Math.max(...gwPoints) ? '#00ff87' :
                                p === Math.min(...gwPoints) ? '#ff2882' : dotColor
                            ),
                            pointBorderColor: '#fff',
                            pointBorderWidth: 1,
                            tension: 0.35,
                            fill: true
                        },
                        {
                            label: t('average'),
                            data: gwAvgLine,
                            borderColor: '#00cc6a',
                            borderWidth: 1.5,
                            borderDash: [5, 4],
                            pointRadius: 0,
                            tension: 0,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: { color: labelColor, font: { size: 11 }, usePointStyle: true, boxWidth: 7 }
                        },
                        tooltip: {
                            backgroundColor: isDark ? '#1c1436' : '#37003c',
                            titleColor: '#00ff87',
                            bodyColor: '#fff',
                            borderColor: '#00ff87',
                            borderWidth: 1,
                            callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y} pts` }
                        }
                    },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 10 }, maxRotation: 45 } },
                        y: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 10 } } }
                    }
                }
            });
        }
    } catch (error) {
        content.innerHTML = '<div class="loading">Error loading performance data</div>';
        console.error(error);
    }
}

// Load Player Database Card
async function loadPlayerDatabase() {
    const content = document.getElementById('database-content');

    try {
        const players = await FPL_API.getAllPlayers();
        appData.allPlayers = players;
        appData.filteredPlayers = players;

        // Populate team filter
        const teams = [...new Set(players.map(p => p.team))].sort();
        const teamFilter = document.getElementById('team-filter');
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            teamFilter.appendChild(option);
        });

        // Sort by total points descending on first load
        appData.allPlayers.sort((a, b) => (b.points || 0) - (a.points || 0));
        appData.filteredPlayers = [...appData.allPlayers];

        // Render players table
        renderPlayersTable();

        // Add event listeners
        document.getElementById('player-search').addEventListener('input', filterPlayers);
        document.getElementById('position-filter').addEventListener('change', filterPlayers);
        document.getElementById('team-filter').addEventListener('change', filterPlayers);

    } catch (error) {
        content.innerHTML = '<div class="loading">Error loading player database</div>';
        console.error(error);
    }
}

// Filter players based on search and filters
function filterPlayers() {
    const searchTerm = document.getElementById('player-search').value.toLowerCase();
    const positionFilter = document.getElementById('position-filter').value;
    const teamFilter = document.getElementById('team-filter').value;

    appData.filteredPlayers = appData.allPlayers.filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(searchTerm) ||
                            player.fullName.toLowerCase().includes(searchTerm) ||
                            player.team.toLowerCase().includes(searchTerm);
        const matchesPosition = !positionFilter || player.position === positionFilter;
        const matchesTeam = !teamFilter || player.team === teamFilter;

        return matchesSearch && matchesPosition && matchesTeam;
    });

    renderPlayersTable();
}

// Sort players table
function sortTable(column) {
    if (appData.sortColumn === column) {
        appData.sortDirection = appData.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        appData.sortColumn = column;
        appData.sortDirection = 'desc';
    }

    appData.filteredPlayers.sort((a, b) => {
        let aVal = a[column] ?? 0;
        let bVal = b[column] ?? 0;

        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = (b[column] ?? '').toLowerCase();
            return appData.sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;

        if (appData.sortDirection === 'asc') {
            return aVal - bVal;
        } else {
            return bVal - aVal;
        }
    });

    renderPlayersTable();
}

// Render players table
function renderPlayersTable() {
    const tbody = document.getElementById('players-tbody');

    if (appData.filteredPlayers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 20px;">No players found</td></tr>';
        return;
    }

    // Limit to top 100 for performance
    const displayPlayers = appData.filteredPlayers.slice(0, 100);

    let html = '';
    for (const player of displayPlayers) {
        const pts = safeNumber(player.points, 0);
        const form = safeNumber(player.form, 1);
        const goals = safeNumber(player.goalsScored, 0);
        const assists = safeNumber(player.assists, 0);
        const xGI = safeNumber(player.expectedGoalInvolvements, 1);
        const tackles = safeNumber(player.tackles, 0);
        const tsb = safeNumber(player.selectedBy, 1);
        const price = safeNumber(player.price, 1);

        // Row highlight + form badge based on form score
        const formVal = parseFloat(player.form) || 0;
        let rowClass = '';
        let formBadgeClass = 'form-badge';
        if (formVal >= 8) {
            rowClass = 'row-form-elite';
            formBadgeClass = 'form-badge form-badge-elite';
        } else if (formVal >= 6) {
            rowClass = 'row-form-good';
            formBadgeClass = 'form-badge form-badge-good';
        } else if (formVal >= 4) {
            rowClass = 'row-form-avg';
            formBadgeClass = 'form-badge form-badge-avg';
        } else if (formVal >= 2) {
            rowClass = 'row-form-low';
            formBadgeClass = 'form-badge form-badge-low';
        } else {
            rowClass = 'row-form-poor';
            formBadgeClass = 'form-badge form-badge-poor';
        }

        html += `
            <tr class="${rowClass} row-clickable" onclick="window.open('player.html?id=${player.id}','_blank')" title="View ${player.name} profile">
                <td><strong>${player.name}</strong></td>
                <td class="col-hide-sm">${player.team}</td>
                <td class="col-hide-sm">${player.position}</td>
                <td class="col-hide-sm">£${price}m</td>
                <td><strong>${pts}</strong></td>
                <td><span class="${formBadgeClass}">${form}</span></td>
                <td class="col-hide-md">${goals}</td>
                <td class="col-hide-md">${assists}</td>
                <td class="col-hide-lg">${xGI}</td>
                <td class="col-hide-lg">${tackles}</td>
                <td class="col-hide-lg">${tsb}%</td>
            </tr>
        `;
    }

    tbody.innerHTML = html;
}

// Load Predictions Card
async function loadPredictions() {
    const content = document.getElementById('prediction-content');

    try {
        if (appData.myTeam.length === 0) {
            await loadMyTeam();
        }

        const predictions = await Predictor.predictTeamPoints(appData.myTeam);

        let html = `<h4>${t('nextGWPredictions')}</h4>`;

        // Expected points: starting XI, captain doubled
        const totalExpected = Predictor.teamExpectedTotal(predictions);

        html += `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-value">${safeNumber(totalExpected, 0)}</div>
                    <div class="stat-card-label">${t('expectedPoints')}</div>
                </div>
            </div>
        `;

        html += `<h4 style="margin-top: 20px; margin-bottom: 10px;">${t('topPerformers')}</h4>`;

        // Sort by expected points
        predictions.sort((a, b) => {
            const aPoints = parseFloat(a.expectedPoints) || 0;
            const bPoints = parseFloat(b.expectedPoints) || 0;
            return bPoints - aPoints;
        });

        html += '<div class="team-grid">';

        const topPredictions = predictions.slice(0, 5);
        for (const pred of topPredictions) {
            html += `
                <div class="player-row">
                    <div class="player-info">
                        <div class="player-name">${pred.player.name}</div>
                        <div class="player-meta">${pred.player.team} • ${pred.player.position}</div>
                    </div>
                    <div class="player-stats">
                        <div class="stat">
                            <div class="stat-value">${safeNumber(pred.expectedPoints, 1)}</div>
                            <div class="stat-label">xPts</div>
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>';

        // Captain suggestion
        const captainSuggestion = await Predictor.suggestCaptain(appData.myTeam);

        html += `<h4 style="margin-top: 20px; margin-bottom: 10px;">${t('captainRec')}</h4>`;
        html += `
            <div class="player-row captain">
                <div class="player-info">
                    <div class="player-name">${captainSuggestion.captain.player.name} (C)</div>
                    <div class="player-meta">${captainSuggestion.captain.player.team} • ${captainSuggestion.captain.player.position}</div>
                </div>
                <div class="player-stats">
                    <div class="stat">
                        <div class="stat-value">${safeNumber(captainSuggestion.captain.expectedPoints, 1)}</div>
                        <div class="stat-label">xPts</div>
                    </div>
                </div>
            </div>
        `;

        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = `<div class="loading">${t('errorPredictions')}</div>`;
        console.error(error);
    }
}

// Load Transfer Suggestions Card
async function loadTransferSuggestions() {
    const content = document.getElementById('transfers-content');

    try {
        if (appData.myTeam.length === 0 || appData.allPlayers.length === 0) {
            await Promise.all([loadMyTeam(), loadPlayerDatabase()]);
        }

        const teamData = await FPL_API.getTeamComposition();
        const bank = teamData.entryHistory ? teamData.entryHistory.bank / 10 : 0;

        content.innerHTML = `<div class="loading">${t('loadingTransfers')}</div>`;

        const [plan, weekPlan] = await Promise.all([
            Predictor.getTransferPlan(appData.myTeam, appData.allPlayers, bank),
            Predictor.planTransfers(appData.myTeam, appData.allPlayers, bank, FPL_API.getPlanPrefs())
        ]);
        const transfers = plan.transfers;

        if (transfers.length === 0) {
            content.innerHTML = `<div style="text-align: center; padding: 40px;">${t('noTransfers')}</div>`;
            return;
        }

        const positionColors = { GKP: '#f59e0b', DEF: '#3b82f6', MID: '#8b5cf6', FWD: '#ef4444' };
        const positionEmojis = { GKP: '🧤', DEF: '🛡️', MID: '⚡', FWD: '⚽' };
        const positionNames  = { GKP: t('gkpFull'), DEF: t('defFull'), MID: t('midFull'), FWD: t('fwdFull') };
        const verdictLabels  = { make: t('verdictMake'), hit: t('verdictHit'), marginal: t('verdictMarginal') };
        const horizon = plan.horizon.length ? `GW${plan.horizon[0].id}–${plan.horizon[plan.horizon.length - 1].id}` : '';

        let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <h4 style="margin:0; font-size:0.9em;">${t('sortedByGain')} · ${horizon}</h4>
            <span style="font-size:0.75em; color:var(--text-muted);">${t('budget')}: £${safeNumber(plan.bank, 1)}m · ${t('freeTransfers')}: ${plan.freeTransfers}</span>
        </div>
        <div style="font-size:0.7em; color:var(--text-muted); margin-bottom:8px;">${t('alternativesNote')}</div>`;

        // Multi-week plan in one line: GW6 A → B · GW7 roll · ...
        if (weekPlan.steps.length) {
            const steps = weekPlan.steps.map(st => `<strong>GW${st.gw}</strong> ${st.moves.length
                ? st.moves.map(m => `${m.out.name} → ${m.in.name}`).join(', ') + (st.hit ? ` <span style="color:#e0004d;">−${st.hit}</span>` : '')
                : t('planRoll')}`).join(' · ');
            html = `<div style="font-size:0.75em; padding:6px 8px; margin-bottom:8px; border-radius:8px; background:rgba(0,255,135,0.12); line-height:1.5;">
                <strong>${t('planNext')} (+${safeNumber(weekPlan.gain, 1)} pts ${t('planVsRoll')}):</strong> ${steps}
            </div>` + html;
        }

        // Already sorted by projected gain
        for (const tr of transfers) {
            const gain     = safeNumber(tr.expectedPointsGain, 1);
            const costSign = tr.cost >= 0 ? '+' : '';
            const pos      = tr.position || tr.in?.position || 'MID';
            const color    = positionColors[pos] || '#22c55e';
            const emoji    = positionEmojis[pos] || '🔄';
            const posLabel = positionNames[pos]  || pos;
            const outSub   = `xPts:${safeNumber(tr.outProjection.total,1)}`;
            const inSub    = `xPts:${safeNumber(tr.inProjection.total,1)} ${costSign}£${safeNumber(tr.cost,1)}m`;

            html += `
                <div style="margin-bottom:5px; border-radius:8px; border:1.5px solid ${color}22; overflow:hidden;">
                    <div style="background:${color}18; border-left:4px solid ${color}; padding:3px 8px; display:flex; align-items:center;">
                        <span style="font-size:0.75em; font-weight:700; color:${color};">${emoji} ${posLabel}</span>
                        <span style="font-size:0.68em; color:var(--text-muted); margin-left:auto; margin-right:6px;">${verdictLabels[tr.verdict] || ''}</span>
                        <span style="background:${tr.verdict === 'marginal' ? '#9ca3af' : color}; color:white; padding:1px 7px; border-radius:12px; font-size:0.72em; font-weight:700;">+${gain} pts</span>
                    </div>
                    <div style="padding:4px 8px; display:flex; align-items:center; gap:6px; font-size:0.78em;">
                        <div style="flex:1; min-width:0;">
                            <span style="font-weight:700; color:#dc2626; font-size:0.72em; text-transform:uppercase; margin-right:3px;">${t('transferOut')}</span>
                            <span style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:inline-block; max-width:80px; vertical-align:bottom;">${tr.out.name}</span>
                            <div style="color:var(--text-muted); font-size:0.8em;">${t('sellPrice')} £${safeNumber(tr.out.sellingPrice,1)}m · ${outSub}</div>
                        </div>
                        <div style="color:var(--text-muted); flex-shrink:0; font-size:1.1em;">→</div>
                        <div style="flex:1; min-width:0;">
                            <span style="font-weight:700; color:#16a34a; font-size:0.72em; text-transform:uppercase; margin-right:3px;">${t('transferIn')}</span>
                            <span style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:inline-block; max-width:80px; vertical-align:bottom;">${tr.in.name}</span>
                            <div style="color:var(--text-muted); font-size:0.8em;">£${safeNumber(tr.in.price,1)}m · ${inSub}</div>
                        </div>
                    </div>
                </div>`;
        }

        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = `<div class="loading">${t('errorTransfers')}</div>`;
        console.error(error);
    }
}

// Load Mini-League Card: your position and the biggest EO threats in your first private league
async function loadLeagueCard() {
    const content = document.getElementById('league-content');
    if (!content) return;

    try {
        const leagues = await League.getMyLeagues();
        if (!leagues.length) {
            content.innerHTML = `<div class="loading">${t('leagueNone')}</div>`;
            return;
        }
        const a = await League.analyze(leagues[0].id);
        const esc = text => FPL_API.escapeHtml(text);
        const leader = a.standings[0];
        const gap = a.me && leader && leader.entry !== a.me.entry ? a.me.total - leader.total : null;
        const row = r => `
            <div class="player-row">
                <div class="player-info">
                    <div class="player-name">${r.player.name}</div>
                    <div class="player-meta">${r.player.team} • EO ${Math.round(r.eo * 100)}% • ${t('leagueYours')} ${r.yours ? `×${r.yours}` : '–'}</div>
                </div>
                <div class="player-stats">
                    <div class="stat">
                        <div class="stat-value" style="color:${r.exposure < 0 ? '#e0004d' : '#16a34a'};">${r.exposure > 0 ? '+' : ''}${safeNumber(r.exposure, 1)}</div>
                        <div class="stat-label">${t('leagueSwing')}</div>
                    </div>
                </div>
            </div>`;

        let html = `<h4 style="margin:0 0 8px;">${esc(a.league.name)}</h4>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-value">${a.me ? a.me.rank : '–'} / ${a.standings.length}</div>
                    <div class="stat-card-label">${t('leagueRank')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${gap === null ? '–' : gap}</div>
                    <div class="stat-card-label">${t('leagueGap')}</div>
                </div>
            </div>`;
        if (a.threats.length) {
            html += `<h4 style="margin:14px 0 6px;">${t('leagueThreats')}</h4><div class="team-grid">${a.threats.slice(0, 3).map(row).join('')}</div>`;
        }
        if (a.differentials.length) {
            html += `<h4 style="margin:14px 0 6px;">${t('leagueDiffs')}</h4><div class="team-grid">${a.differentials.slice(0, 2).map(row).join('')}</div>`;
        }
        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = `<div class="loading">${t('errorLeague')}</div>`;
        console.error(error);
    }
}

// Load Fixture Analyser Card: best attacking and defensive runs over the next 5 gameweeks
async function loadFixturesCard() {
    const content = document.getElementById('fixtures-content');
    if (!content) return;

    try {
        const ticker = await Predictor.getFixtureTicker(5);
        if (!ticker.events.length) {
            content.innerHTML = `<div class="loading">${t('fxNone')}</div>`;
            return;
        }
        const total = (row, fn) => row.cells.reduce((sum, cell) => sum + cell.reduce((s, c) => s + fn(c), 0), 0);
        const run = row => row.cells.map(cell => (cell.length ? cell.map(c => `${c.opponent}${c.isHome ? '' : '*'}`).join('+') : '–')).join(' ');
        const list = (title, fn, fmt) => {
            const best = ticker.teams.slice().sort((a, b) => total(b, fn) - total(a, fn)).slice(0, 5);
            return `<h4 style="margin:10px 0 6px;">${title}</h4><div class="team-grid">${best.map(row => `
                <div class="player-row">
                    <div class="player-info">
                        <div class="player-name">${row.team.shortName}</div>
                        <div class="player-meta">${run(row)}</div>
                    </div>
                    <div class="player-stats"><div class="stat"><div class="stat-value">${fmt(total(row, fn))}</div></div></div>
                </div>`).join('')}</div>`;
        };
        content.innerHTML = `<div style="font-size:0.75em; color:var(--text-muted);">GW${ticker.events[0]}–${ticker.events[ticker.events.length - 1]} · * = away</div>`
            + list(t('fxBestAttack'), c => c.xgFor, v => `${v.toFixed(1)} xG`)
            + list(t('fxBestDefence'), c => c.csProb, v => `${v.toFixed(1)} CS`);
    } catch (error) {
        content.innerHTML = `<div class="loading">${t('errorFixtures')}</div>`;
        console.error(error);
    }
}

// Load AI Team & Chips Card: team rating, Wildcard gain and the best week per chip
async function loadOptimizerCard() {
    const content = document.getElementById('optimizer-content');
    if (!content) return;

    try {
        const [teamData, allPlayers] = await Promise.all([FPL_API.getTeamComposition(), FPL_API.getAllPlayers()]);
        const bank = teamData.entryHistory ? teamData.entryHistory.bank / 10 : 0;
        const [report, calendar] = await Promise.all([
            Predictor.getSquadReport(teamData.picks, allPlayers, bank),
            Predictor.getChipCalendar(teamData.picks, allPlayers, bank)
        ]);
        if (!report) {
            content.innerHTML = `<div class="loading">${t('fxNone')}</div>`;
            return;
        }
        const names = { freehit: t('chipFreeHit'), bboost: t('chipBenchBoost'), '3xc': t('chipTripleCaptain') };
        let html = `<div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-value">${report.rating}/100</div>
                    <div class="stat-card-label">${t('opRating')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">+${safeNumber(report.wildcard ? report.wildcard.gain : 0, 1)}</div>
                    <div class="stat-card-label">${t('chipWildcard')} (${report.wildcard ? report.wildcard.incoming.length : 0} ${t('opChanges')})</div>
                </div>
            </div>`;
        if (calendar && Object.keys(calendar.best).length) {
            html += `<h4 style="margin:14px 0 6px;">${t('opBestWeeks')}</h4><div class="team-grid">${Object.entries(calendar.best).map(([chip, gw]) => {
                const week = calendar.weeks.find(w => w.gameweek === gw);
                return `<div class="player-row">
                    <div class="player-info"><div class="player-name">${names[chip]}</div><div class="player-meta">GW${gw}</div></div>
                    <div class="player-stats"><div class="stat"><div class="stat-value">+${safeNumber(week[chip], 1)}</div><div class="stat-label">${t('opPts')}</div></div></div>
                </div>`;
            }).join('')}</div>`;
        }
        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = `<div class="loading">${t('errorOptimizer')}</div>`;
        console.error(error);
    }
}

// Load Live Gameweek Card: your live points and live position in your first league
async function loadLiveCard() {
    const content = document.getElementById('live-content');
    if (!content) return;

    try {
        const [gw, leagues] = await Promise.all([Live.getGameweek(), League.getMyLeagues()]);
        const mine = Live.scorePicks(await FPL_API.getEntryPicks(FPL_API.TEAM_ID, gw.gameweek), gw);
        const table = leagues.length ? await Live.leagueTable(leagues[0].id, gw) : [];
        const me = table.find(r => r.entry === FPL_API.TEAM_ID);
        const status = gw.inProgress ? t('lvInProgress') : gw.finished ? t('lvFinished') : gw.started ? t('lvBetween') : t('lvNotStarted');
        content.innerHTML = `<div style="font-size:0.75em; color:var(--text-muted); margin-bottom:6px;">GW${gw.gameweek} · ${status}</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-value">${mine.points}${mine.hits ? ` −${mine.hits}` : ''}</div>
                    <div class="stat-card-label">${t('lvPoints')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${me ? `${me.liveRank} / ${table.length}` : '–'}</div>
                    <div class="stat-card-label">${leagues.length ? FPL_API.escapeHtml(leagues[0].name) : t('leagueRank')}</div>
                </div>
            </div>`;
        if (gw.inProgress) setTimeout(loadLiveCard, 60000);
    } catch (error) {
        content.innerHTML = `<div class="loading">${t('errorLive')}</div>`;
        console.error(error);
    }
}

// Load Price Changes Card: your players expected to change tonight and the likeliest risers
async function loadPricesCard() {
    const content = document.getElementById('prices-content');
    if (!content) return;

    try {
        const allPlayers = appData.allPlayers.length ? appData.allPlayers : await FPL_API.getAllPlayers();
        const team = appData.myTeam.length ? appData.myTeam : (await FPL_API.getTeamComposition()).picks;
        const byId = new Map(allPlayers.map(p => [p.id, p]));
        const tonight = p => (p.priceChangeProjections[0] ? p.priceChangeProjections[0].percent : p.priceChangePercent);
        const squad = team.map(p => byId.get(p.id)).filter(Boolean)
            .sort((a, b) => Math.abs(tonight(b)) - Math.abs(tonight(a))).slice(0, 4);
        const risers = allPlayers.filter(p => !team.some(m => m.id === p.id))
            .sort((a, b) => tonight(b) - tonight(a)).slice(0, 3);
        const row = p => {
            const v = tonight(p);
            return `<div class="player-row">
                <div class="player-info"><div class="player-name">${p.name}</div><div class="player-meta">${p.team} • £${safeNumber(p.price, 1)}m</div></div>
                <div class="player-stats"><div class="stat"><div class="stat-value" style="color:${v >= 0 ? '#16a34a' : '#e0004d'};">${v > 0 ? '+' : ''}${safeNumber(v, 0)}%</div><div class="stat-label">${t('pcTonight')}</div></div></div>
            </div>`;
        };
        content.innerHTML = `<h4 style="margin:0 0 6px;">${t('pcYourSquad')}</h4><div class="team-grid">${squad.map(row).join('')}</div>
            <h4 style="margin:12px 0 6px;">${t('pcRisers')}</h4><div class="team-grid">${risers.map(row).join('')}</div>`;
    } catch (error) {
        content.innerHTML = `<div class="loading">${t('errorPrices')}</div>`;
        console.error(error);
    }
}

// Open card in new tab
function openCardPage(page) {
    window.open(page, '_blank');
}

// ─── Player Comparison (dashboard card) ──────────────────────────────────────
const cmpState = { players: [null, null, null] };

// Stats definition: [key, label, higherIsBetter]
const CMP_STATS = [
    ['price',                       '£ Price (m)',      false],
    ['points',                      'Total Points',     true],
    ['form',                        'Form',             true],
    ['pointsPerGame',               'Pts / Game',       true],
    ['minutes',                     'Minutes',          true],
    ['goalsScored',                 'Goals',            true],
    ['assists',                     'Assists',          true],
    ['cleanSheets',                 'Clean Sheets',     true],
    ['expectedGoals',               'xG',               true],
    ['expectedAssists',             'xA',               true],
    ['expectedGoalInvolvements',    'xGI (xG+xA)',      true],
    ['saves',                       'Saves',            true],
    ['bonus',                       'Bonus Pts',        true],
    ['ictIndex',                    'ICT Index',        true],
    ['selectedBy',                  'Selected By %',    null], // null = don't highlight
];

function handleCompareSearch(idx) {
    const input = document.getElementById(`cmp-input-${idx}`);
    const dd    = document.getElementById(`cmp-dd-${idx}`);
    const q     = (input.value || '').trim().toLowerCase();

    if (q.length < 2 || appData.allPlayers.length === 0) {
        dd.innerHTML = '';
        dd.classList.remove('open');
        return;
    }

    const matches = appData.allPlayers
        .filter(p => p.name.toLowerCase().includes(q) || (p.fullName || '').toLowerCase().includes(q))
        .slice(0, 8);

    if (matches.length === 0) {
        dd.innerHTML = '<div class="cmp-dropdown-item" style="color:var(--text-muted)">No players found</div>';
    } else {
        dd.innerHTML = matches.map(p =>
            `<div class="cmp-dropdown-item" onclick="selectComparePlayer(${idx}, '${p.id}')">
                <strong>${p.name}</strong> <span>${p.team} · ${p.position} · £${safeNumber(p.price,1)}m</span>
            </div>`
        ).join('');
    }
    dd.classList.add('open');
}

function selectComparePlayer(idx, playerId) {
    const player = appData.allPlayers.find(p => String(p.id) === String(playerId));
    if (!player) return;
    cmpState.players[idx] = player;

    const input = document.getElementById(`cmp-input-${idx}`);
    const dd    = document.getElementById(`cmp-dd-${idx}`);
    input.value = player.name;
    dd.innerHTML = '';
    dd.classList.remove('open');

    renderComparisonTable();
}

function removeComparePlayer(idx) {
    cmpState.players[idx] = null;
    const input = document.getElementById(`cmp-input-${idx}`);
    if (input) input.value = '';
    renderComparisonTable();
}

function renderComparisonTable() {
    const result  = document.getElementById('cmp-result');
    const active  = cmpState.players.filter(Boolean);

    if (active.length < 2) {
        result.innerHTML = '<p class="cmp-hint">Select at least 2 players to compare.</p>';
        return;
    }

    // Build header row
    let thead = '<tr><th>Stat</th>';
    cmpState.players.forEach((p, i) => {
        if (!p) return;
        thead += `<th>
            <div class="cmp-player-header">
                <div class="cmp-player-name">${p.name}</div>
                <div class="cmp-player-meta">${p.team} · ${p.position}</div>
                <button class="cmp-remove-btn" onclick="removeComparePlayer(${i})" title="Remove">✕</button>
            </div>
        </th>`;
    });
    thead += '</tr>';

    // Build stat rows with highlights
    let tbody = '';
    for (const [key, label, higherBetter] of CMP_STATS) {
        const vals = cmpState.players
            .filter(Boolean)
            .map(p => parseFloat(p[key]) || 0);

        const maxVal = Math.max(...vals);
        const minVal = Math.min(...vals);
        const allSame = maxVal === minVal;

        let row = `<tr><td>${label}</td>`;
        let pIdx = 0;
        cmpState.players.forEach(p => {
            if (!p) return;
            const v = parseFloat(p[key]) || 0;
            const decimals = ['price','form','pointsPerGame','expectedGoals','expectedAssists','expectedGoalInvolvements','ictIndex','selectedBy'].includes(key) ? 1 : 0;
            const display = v.toFixed(decimals);

            let cls = '';
            if (!allSame && higherBetter !== null) {
                if (higherBetter  && v === maxVal) cls = 'cmp-best';
                if (higherBetter  && v === minVal) cls = 'cmp-worst';
                if (!higherBetter && v === minVal) cls = 'cmp-best';
                if (!higherBetter && v === maxVal) cls = 'cmp-worst';
            }
            row += `<td class="${cls}">${key === 'price' ? '£' + display + 'm' : key === 'selectedBy' ? display + '%' : display}</td>`;
            pIdx++;
        });
        row += '</tr>';
        tbody += row;
    }

    result.innerHTML = `
        <div class="cmp-table-wrap">
            <table class="cmp-table">
                <thead>${thead}</thead>
                <tbody>${tbody}</tbody>
            </table>
        </div>`;
}

// Close dropdowns on outside click
document.addEventListener('click', e => {
    if (!e.target.closest('#comparison-content') && !e.target.closest('.cmp-dropdown')) {
        document.querySelectorAll('.cmp-dropdown').forEach(d => d.classList.remove('open'));
    }
});

// Show error message
function showError(message) {
    alert(message);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only auto-start if a team ID has been saved (guardian handles first-time setup)
    if (localStorage.getItem('fpl_team_id')) initializeApp();
});
