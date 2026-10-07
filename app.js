// Main Application Logic
let appData = {
    allPlayers: [],
    myTeam: [],
    fixtureMap: {}
};


// Initialize the application
async function initializeApp() {
    try {
        // Load team name first
        await loadTeamName();

        // Load all data
        await Promise.all([
            loadMyTeam(),
            loadPredictions(),
            loadTransferSuggestions(),
            loadLeagueCard(),
            loadFixturesCard(),
            loadOptimizerCard(),
            loadLiveCard(),
            loadPricesCard(),
            loadGameweekAlert()
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

        // Next fixture per team for the pitch
        appData.fixtureMap = UI.nextFixtureMap(bootstrap, fixtures);

        // Pitch: your current lineup, or the suggested one for the next gameweek
        teamData.picks.sort((a, b) => a.pickOrder - b.pickOrder);
        const currentGW = teamData.entryHistory ? teamData.entryHistory.event : '–';
        const view = appData.teamView || 'current';
        let pitch;
        let banner = `${t('gameweek')} ${currentGW}`;
        if (view === 'suggested') {
            if (appData.allPlayers.length === 0) appData.allPlayers = await FPL_API.getAllPlayers();
            const s = await Predictor.suggestLineup(teamData.picks, appData.allPlayers, teamData.entryHistory ? teamData.entryHistory.bank / 10 : 0);
            if (s) {
                banner = `${t('cardLineup')} · GW${s.gameweek} · ${s.gain > 0.05 ? `${UI.signed(s.gain)} xPts` : t('luSameAsYours')}`;
                banner += UI.manualNote(s.manual, s.gameweek);
                pitch = UI.pitch(s.xi, s.bench, appData.fixtureMap, { label: p => `${safeNumber(p.xPts, 1)} xPts` });
            }
        }
        if (view === 'nextgw') {
            const r = await Predictor.getMatchPredictions();
            if (r && r.matches.length) {
                banner = `${t('cardNextGW')} · GW${r.gameweek}`;
                pitch = r.matches.map(m => {
                    const yours = teamData.picks.filter(p => p.teamId === m.home.id || p.teamId === m.away.id);
                    return UI.row({
                        title: `${m.home.shortName} v ${m.away.shortName}${yours.length ? ` <span class="ui-muted">★ ${yours.map(p => UI.esc(p.name)).join(', ')}</span>` : ''}`,
                        meta: m.bookmakers ? UI.favourite(m) : t('nxNoOdds'),
                        value: '',
                        href: 'nextgw.html'
                    });
                }).join('');
            }
        }
        if (!pitch) pitch = UI.pitch(teamData.picks.slice(0, 11), teamData.picks.slice(11), appData.fixtureMap);
        let html = `<div class="ui-chips team-view">
                <button class="ui-chip${view === 'current' ? ' on' : ''}" type="button" onclick="setTeamView('current')">${t('luViewCurrent')}</button>
                <button class="ui-chip${view === 'suggested' ? ' on' : ''}" type="button" onclick="setTeamView('suggested')">${t('luViewSuggested')}</button>
                <button class="ui-chip${view === 'nextgw' ? ' on' : ''}" type="button" onclick="setTeamView('nextgw')">${t('luViewNextGW')}</button>
            </div>
            <div class="team-gw-banner">${banner}</div>` + pitch;

        // Team statistics
        if (teamData.entryHistory) {
            html += UI.stats([
                [teamData.entryHistory.points, t('gwPoints')],
                [`£${safeNumber(teamData.entryHistory.bank / 10, 1)}m`, t('bank')],
                [`£${safeNumber(teamData.entryHistory.value / 10, 1)}m`, t('teamValue')]
            ]);
        }
        html += UI.footer([`${t('ftFpl')} ${UI.when(new Date())}`]);

        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = `${UI.state('error', t('errorTeam'))}`;
        console.error(error);
    }
}









// My Team card: switch between the current and the suggested lineup
function setTeamView(view) {
    appData.teamView = view;
    loadMyTeam();
}

// Blank / double gameweek banner above the cards (hidden when none are coming)
async function loadGameweekAlert() {
    const box = document.getElementById('gw-alert');
    if (!box) return;
    try {
        if (appData.myTeam.length === 0) await loadMyTeam();
        box.innerHTML = UI.gameweekAlert(await Predictor.getSpecialGameweeks(appData.myTeam));
    } catch (error) {
        console.error('Gameweek alert unavailable:', error.message);
    }
}

// ── Home cards below: each shows a few key numbers; the full page has the rest ──

// Captain & Predictions: expected points, captain pick and your top projected players
async function loadPredictions() {
    const content = document.getElementById('prediction-content');
    if (!content) return;

    try {
        if (appData.myTeam.length === 0) await loadMyTeam();
        const predictions = await Predictor.predictTeamPoints(appData.myTeam);
        const ranked = predictions.slice().sort((a, b) => b.expectedPoints - a.expectedPoints);
        const [captain, vice] = ranked;

        content.innerHTML = UI.stats([
            [safeNumber(Predictor.teamExpectedTotal(predictions), 0), t('expectedPoints')],
            [captain ? captain.player.name : '–', t('captainRec')]
        ])
            + UI.subtitle(t('topPerformers'))
            + ranked.slice(0, 3).map(p => UI.row({
                title: `${p.player.name}${p === captain ? ' (C)' : p === vice ? ' (V)' : ''}`,
                meta: `${p.player.team} • ${p.player.position}`,
                value: safeNumber(p.expectedPoints, 1),
                label: UI.term('xpts'),
                href: `player.html?id=${p.player.id}`
            })).join('')
            + UI.footer(UI.projectionSources());
    } catch (error) {
        content.innerHTML = `${UI.state('error', t('errorPredictions'))}`;
        console.error(error);
    }
}

// Transfer Plan: gain over rolling, free transfers and the week-by-week moves
async function loadTransferSuggestions() {
    const content = document.getElementById('transfers-content');
    if (!content) return;

    try {
        if (appData.myTeam.length === 0) await loadMyTeam();
        if (appData.allPlayers.length === 0) appData.allPlayers = await FPL_API.getAllPlayers();
        const teamData = await FPL_API.getTeamComposition();
        const bank = teamData.entryHistory ? teamData.entryHistory.bank / 10 : 0;
        const plan = await Predictor.planTransfers(appData.myTeam, appData.allPlayers, bank, FPL_API.getPlanPrefs());

        if (!plan.steps.length) {
            content.innerHTML = `${UI.state('empty', t('noTransfers'))}`;
            return;
        }
        content.innerHTML = UI.manualNote(plan.manual, plan.horizon.length ? plan.horizon[0].id : '') + UI.stats([
            [UI.signed(plan.gain), t('planVsRoll')],
            [plan.freeTransfers, UI.term('ft', t('freeTransfers'))],
            [`£${safeNumber(plan.bank, 1)}m`, t('budget')]
        ])
            + plan.steps.map(step => UI.row({
                title: `GW${step.gw}`,
                meta: step.moves.length ? step.moves.map(m => `${m.out.name} → ${m.in.name}`).join(', ') : t('planRoll'),
                value: step.hit ? `−${step.hit}` : '',
                tone: step.hit ? 'down' : ''
            })).join('')
            + UI.footer(UI.projectionSources());
    } catch (error) {
        content.innerHTML = `${UI.state('error', t('errorTransfers'))}`;
        console.error(error);
    }
}

// Mini-League: your position in your first private league and the biggest swings
async function loadLeagueCard() {
    const content = document.getElementById('league-content');
    if (!content) return;

    try {
        const leagues = await League.getMyLeagues();
        if (!leagues.length) {
            content.innerHTML = `${UI.state('empty', t('leagueNone'))}`;
            return;
        }
        const a = await League.analyze(leagues[0].id);
        const leader = a.standings[0];
        const gap = a.me && leader && leader.entry !== a.me.entry ? a.me.total - leader.total : null;
        const row = r => UI.row({
            title: r.player.name,
            meta: `${r.player.team} • EO ${Math.round(r.eo * 100)}% • ${t('leagueYours')} ${r.yours ? `×${r.yours}` : '–'}`,
            value: UI.signed(r.exposure, 1, { colour: false }),
            tone: r.exposure < 0 ? 'down' : 'up',
            label: UI.term('swing', t('leagueSwing'))
        });

        content.innerHTML = UI.stats([
            [a.me ? `${a.me.rank} / ${a.standings.length}` : '–', UI.esc(a.league.name)],
            [gap === null ? '–' : gap, t('leagueGap')]
        ])
            + (a.threats.length ? UI.subtitle(t('leagueThreats')) + a.threats.slice(0, 3).map(row).join('') : '')
            + (a.differentials.length ? UI.subtitle(t('leagueDiffs')) + a.differentials.slice(0, 1).map(row).join('') : '')
            + UI.footer([`${t('leagueBasedOn')} ${a.gameweek}`, `${a.rivalsSampled} ${t('leagueSampled')}`]);
    } catch (error) {
        content.innerHTML = `${UI.state('error', t('errorLeague'))}`;
        console.error(error);
    }
}

// Fixture Analyser: best attacking and defensive runs over the next 5 gameweeks, side by side
async function loadFixturesCard() {
    const content = document.getElementById('fixtures-content');
    if (!content) return;

    try {
        const ticker = await Predictor.getFixtureTicker(5);
        if (!ticker.events.length) {
            content.innerHTML = `${UI.state('empty', t('fxNone'))}`;
            return;
        }
        const total = (row, fn) => row.cells.reduce((sum, cell) => sum + cell.reduce((s, c) => s + fn(c), 0), 0);
        const run = row => row.cells.map(cell => (cell.length ? cell.map(c => `${c.opponent}${c.isHome ? '' : '*'}`).join('+') : '–')).join(' ');
        const list = (title, fn, unit) => UI.subtitle(title) + ticker.teams.slice()
            .sort((a, b) => total(b, fn) - total(a, fn)).slice(0, 5)
            .map(row => UI.row({ title: row.team.shortName, meta: run(row), value: total(row, fn).toFixed(1), label: unit })).join('');

        content.innerHTML = `<div class="ui-meta">GW${ticker.events[0]}–${ticker.events[ticker.events.length - 1]} · * = away</div>
            <div class="ui-grid-2">
                <div>${list(t('fxBestAttack'), c => c.xgFor, 'xG')}</div>
                <div>${list(t('fxBestDefence'), c => c.csProb, 'CS')}</div>
            </div>`
            + UI.footer(UI.projectionSources().slice(0, 1).concat(Predictor.dataInfo.odds
                ? `${t('ftOdds')} ${UI.when(Predictor.dataInfo.odds.generated)} (${Predictor.dataInfo.odds.matches})` : []));
    } catch (error) {
        content.innerHTML = `${UI.state('error', t('errorFixtures'))}`;
        console.error(error);
    }
}

// AI Team & Chips: team rating, Wildcard gain and the best week per chip
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
            content.innerHTML = `${UI.state('empty', t('fxNone'))}`;
            return;
        }
        const names = { freehit: t('chipFreeHit'), bboost: t('chipBenchBoost'), '3xc': t('chipTripleCaptain') };
        content.innerHTML = UI.stats([
            [`${report.rating}/100`, t('opRating')],
            [UI.signed(report.wildcard ? report.wildcard.gain : 0), `${t('chipWildcard')} · ${report.wildcard ? report.wildcard.incoming.length : 0} ${t('opChanges')}`]
        ])
            + (calendar && Object.keys(calendar.best).length
                ? UI.subtitle(t('opBestWeeks')) + Object.entries(calendar.best).map(([chip, gw]) => {
                    const week = calendar.weeks.find(w => w.gameweek === gw);
                    return UI.row({ title: names[chip], meta: `GW${gw}`, value: `+${safeNumber(week[chip], 1)}`, label: t('opPts') });
                }).join('')
                : '')
            + UI.footer(UI.projectionSources());
    } catch (error) {
        content.innerHTML = `${UI.state('error', t('errorOptimizer'))}`;
        console.error(error);
    }
}

// Live Gameweek: your live points, live league position and your top scorers
async function loadLiveCard() {
    const content = document.getElementById('live-content');
    if (!content) return;

    try {
        const [gw, leagues, allPlayers] = await Promise.all([Live.getGameweek(), League.getMyLeagues(), FPL_API.getAllPlayers()]);
        const mine = Live.scorePicks(await FPL_API.getEntryPicks(FPL_API.TEAM_ID, gw.gameweek), gw);
        const table = leagues.length ? await Live.leagueTable(leagues[0].id, gw) : [];
        const me = table.find(r => r.entry === FPL_API.TEAM_ID);
        const byId = new Map(allPlayers.map(p => [p.id, p]));
        const status = gw.inProgress ? t('lvInProgress') : gw.finished ? t('lvFinished') : gw.started ? t('lvBetween') : t('lvNotStarted');
        const top = mine.rows.filter(r => r.multiplier > 0).sort((a, b) => b.points * b.multiplier - a.points * a.multiplier).slice(0, 3);
        const rank = await Live.overallRank(gw, mine, await FPL_API.getEntryPicks(FPL_API.TEAM_ID, gw.gameweek));

        content.innerHTML = `<div class="ui-meta">GW${gw.gameweek} · ${status}</div>`
            + UI.stats([
                [`${mine.points}${mine.hits ? ` −${mine.hits}` : ''}`, t('lvPoints')],
                [UI.rankText(rank), rank && !rank.official ? t('lvOverallEst') : t('lvOverall')],
                [me ? `${me.liveRank} / ${table.length}` : '–', leagues.length ? UI.esc(leagues[0].name) : t('leagueRank')]
            ])
            + top.map(r => {
                const p = byId.get(r.element);
                return UI.row({
                    title: `${p ? p.name : r.element}${r.isCaptain ? ' (C)' : ''}`,
                    meta: `${r.minutes}'`,
                    value: r.points * r.multiplier,
                    label: t('colPoints')
                });
            }).join('')
            + UI.footer([`${t('ftFpl')} ${UI.when(new Date())}`, gw.inProgress ? t('ftRefresh') : '']);
        if (gw.inProgress) setTimeout(loadLiveCard, 60000);
    } catch (error) {
        content.innerHTML = `${UI.state('error', t('errorLive'))}`;
        console.error(error);
    }
}

// Price Changes: your players closest to a change tonight and the likeliest risers
async function loadPricesCard() {
    const content = document.getElementById('prices-content');
    if (!content) return;

    try {
        const allPlayers = appData.allPlayers.length ? appData.allPlayers : await FPL_API.getAllPlayers();
        const team = appData.myTeam.length ? appData.myTeam : (await FPL_API.getTeamComposition()).picks;
        const byId = new Map(allPlayers.map(p => [p.id, p]));
        const tonight = p => (p.priceChangeProjections[0] ? p.priceChangeProjections[0].percent : p.priceChangePercent);
        const squad = team.map(p => byId.get(p.id)).filter(Boolean)
            .sort((a, b) => Math.abs(tonight(b)) - Math.abs(tonight(a))).slice(0, 3);
        const risers = allPlayers.filter(p => !team.some(m => m.id === p.id))
            .sort((a, b) => tonight(b) - tonight(a)).slice(0, 3);
        const row = p => UI.row({
            title: p.name,
            meta: `${p.team} • £${safeNumber(p.price, 1)}m`,
            value: `${tonight(p) > 0 ? '+' : ''}${safeNumber(tonight(p), 0)}%`,
            tone: tonight(p) >= 0 ? 'up' : 'down',
            label: t('pcTonight'),
            href: `player.html?id=${p.id}`
        });
        content.innerHTML = UI.subtitle(t('pcYourSquad')) + squad.map(row).join('')
            + UI.subtitle(t('pcRisers')) + risers.map(row).join('')
            + UI.footer([`${t('ftPredictor')} ${UI.when(new Date())}`]);
    } catch (error) {
        content.innerHTML = `${UI.state('error', t('errorPrices'))}`;
        console.error(error);
    }
}

// Show error message
function showError(message) {
    alert(message);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only auto-start if a team ID has been saved (guardian handles first-time setup)
    if (FPL_API.hasTeamId()) initializeApp();
});
