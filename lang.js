/**
 * lang.js — Bilingual support: English / Serbian (Latin)
 * Usage:  t('key')          → translated string in active language
 *         setLang('sr')     → switch to Serbian + re-render
 *         applyI18n()       → update all [data-i18n] elements in DOM
 */

const TRANSLATIONS = {
    en: {
        /* ── App shell ── */
        appTitle:           'FPL Team Analyzer',
        appEyebrow:         'Fantasy Premier League',
        analysis:           'Analysis',
        footerText:         'Made with',
        footerBy:           'for you by',
        footerHtml:         'Made with <span class="heart">&#x2665;</span> for you by <a class="footer-author" href="https://github.com/skojic" target="_blank" rel="noopener">Srdjan Kojic</a> · <a class="footer-guide" href="guide.html">How it works</a>',
        dark:               'Dark',
        light:              'Light',
        close:              'Close',
        back:               '←',

        /* ── Card titles ── */
        cardMyTeam:         'My Team',
        cardPerformance:    'Performance Analytics',
        cardDatabase:       'Player Database',
        cardPrediction:     'Points Prediction',
        cardTransfers:      'Transfer Suggestions',
        cardComparison:     'Player Comparison',

        /* ── Loading / error ── */
        loading:            'Loading...',
        loadingTeam:        'Loading team data...',
        loadingPerf:        'Loading performance data...',
        loadingPlayers:     'Loading players...',
        loadingPredictions: 'Calculating predictions...',
        loadingTransfers:   'Analyzing transfers...',
        loadingComparison:  'Loading comparison...',
        errorTeam:          'Error loading team data',
        errorDatabase:      'Error loading the player database',
        errorPerf:          'Error loading performance data',
        errorTransfers:     'Error loading transfer suggestions',
        errorPredictions:   'Error calculating predictions',

        /* ── My Team / pitch ── */
        gameweek:           'Gameweek',
        substitutes:        'Substitutes',
        flagInjured:        'Injured',
        flagSuspended:      'Suspended',
        flagUnavailable:    'Unavailable',
        flagDoubtful:       'Doubtful',
        gwPoints:           'GW Points',
        bank:               'Bank',
        teamValue:          'Team Value',
        captain:            'C',
        viceCaptain:        'VC',
        pts:                'pts',

        /* ── Player Database table ── */
        searchPlaceholder:  'Search players by name, team, or position...',
        allPositions:       'All Positions',
        allTeams:           'All Teams',
        goalkeeper:         'Goalkeeper',
        defender:           'Defender',
        midfielder:         'Midfielder',
        forward:            'Forward',
        colName:            'Name',
        colTeam:            'Team',
        colPosition:        'Position',
        colPrice:           'Price',
        colPoints:          'Points',
        colForm:            'Form',
        colGoals:           'Goals',
        colAssists:         'Assists',
        colXGI:             'Exp. G+A',
        colTackles:         'Tackles',
        colOwned:           'Owned By%',
        showingPlayers:     'Showing',
        players:            'players',
        noPlayersFound:     'No players found',

        /* ── Performance Analytics ── */
        perfTitle:          'Performance Analytics',
        perfSubtitle:       'Season Overview',
        gwHistory:          'Gameweek History',
        gwPointsChart:      'Points per Gameweek',
        totalPoints:        'Total Points',
        overallRank:        'Overall Rank',
        bestGW:             'Best GW',
        worstGW:            'Worst GW',
        totalTransfers:     'Total Transfers',
        rank:               'Rank',
        transfers:          'Transfers',
        gwsPlayed:          'GWs Played',
        seasonStats:        'Season Statistics',

        /* ── Predictions ── */
        predTitle:          'Points Prediction',
        predSubtitle:       'Next 5 Gameweeks Analysis',
        expectedPoints:     'Expected Points',
        captainRec:         'Captain Recommendation',
        nextGWPredictions:  'Next Gameweek Predictions',
        topPerformers:      'Top Expected Performers',
        allPlayersPred:     'All Players - Expected Points',
        top3Fixture:        'Top 3 Players - Fixture Analysis',
        xPts:               'xPts',
        form:               'Form',
        rising:             'Rising',
        falling:            'Falling',
        stable:             'Stable',

        /* ── Transfers ── */
        transferTitle:      'Transfer Suggestions',
        transferSubtitle:   'Optimize Your Team',
        transferAnalysis:   'Transfer Analysis',
        budgetAvail:        'Budget Available',
        transfersGW:        'Transfers This GW',
        freeTransfers:      'Free Transfers',
        verdictMake:        'Make it',
        verdictHit:         'Worth a −4',
        verdictMarginal:    'Marginal: consider rolling',
        alternativesNote:   'Alternatives: each uses one transfer',
        sellPrice:          'sell',
        fixturesXPts:       'Fixtures & Projected Points',
        planTitle:          'Transfer Plan',
        planVsRoll:         'vs rolling every week',
        planRoll:           'Roll transfer',
        planFT:             'FT',
        planXI:             'XI',
        planCaptain:        'Captain',
        planBan:            'Never buy this player',
        planLockHint:       'Lock players to keep (never sold):',
        planBanned:         'Never bought (click to allow again):',
        singleTransfers:    'Best Single Transfers',
        planNext:           'Plan',
        cardLeague:         'Mini-League',
        leagueSelect:       'League',
        leagueStandings:    'Standings',
        leagueThreats:      'Threats: owned by rivals, not (enough) by you',
        leagueDiffs:        'Your Differentials',
        leagueCaptains:     'Rivals\' Captains',
        leagueTemplate:     'Template: owned by half the league or more',
        leagueExplain:      '<strong>EO (effective ownership)</strong> = how much of a player\'s points the average rival collects: 100% per starting owner, 200% per captain, divided by the number of rivals. Every point a player scores moves you by <em>your multiplier − EO</em> against the average rival; <strong>swing</strong> is that times his projected points for the next gameweek.',
        leagueBasedOn:      'Lineups from GW',
        leagueSampled:      'rivals analysed',
        leagueTop50:        'large league: top 50 only',
        leagueNone:         'You are not in any classic league yet.',
        leagueYou:          'You',
        leagueGap:          'Gap',
        leagueGW:           'GW',
        leagueTotal:        'Total',
        leagueRank:         'Rank',
        leagueManager:      'Manager',
        leagueSwing:        'Swing',
        leagueYours:        'You',
        leagueChips:        'Chips played',
        errorLeague:        'Error loading league data',
        loadingLeague:      'Loading league...',
        leagueTopOverall:   'Overall top {n} managers (updated each gameweek)',
        cardFixtures:       'Fixture Analyser',
        fxAttack:           'Attack: expected goals',
        fxDefence:          'Defence: clean sheet %',
        fxFdr:              'FPL difficulty',
        fxSortNext:         'Sort by next',
        fxBlank:            'Blank',
        fxNone:             'No upcoming fixtures.',
        fxExplain:          'Expected goals and clean-sheet chances come from each team\'s xG for and against this season (blended with FPL\'s rating early on) and home advantage, so they separate a good fixture for attackers from a good one for defenders, which the 1–5 FPL difficulty cannot. Doubles add up; a blank gameweek counts as nothing. • = blended with that match\'s bookmaker odds; later matches use team ratings moved towards the bookmakers\' view of each team.',
        fxBestAttack:       'Best attacking runs',
        fxBestDefence:      'Best defensive runs',
        errorFixtures:      'Error loading fixtures',
        loadingFixtures:    'Loading fixtures...',
        cardOptimizer:      'AI Team & Chips',
        opLoading:          'Optimizing squads...',
        opRating:           'AI Team Rating',
        opRatingExplain:    'Your squad\'s projected points ({range}, best XI + captain each week) as a share of the best squad the optimizer finds for your budget of £{budget}m (bank + selling prices).',
        opPts:              'pts',
        opVsYours:          'vs your squad',
        opChanges:          'changes',
        opOut:              'Out',
        opCalendar:         'Chip Calendar',
        opCalendarExplain:  'Value of each chip you still have, per gameweek, with your current squad: Bench Boost = your bench\'s points, Triple Captain = your captain\'s points once more, Free Hit = best one-week squad minus your XI. Later weeks assume no transfers, so use them as a guide. The first set of chips must be used by GW{deadline}. Best week per chip is highlighted.',
        opNoSpecial:        'No blank or double gameweeks are scheduled in this window yet; chip values are similar from week to week. Doubles usually appear when cup fixtures move matches.',
        opXI:               'Your XI',
        opDoubles:          'Doubles',
        opBlanks:           'Blanks',
        opYours:            'yours',
        opBestWeeks:        'Best weeks',
        chipWildcard:       'Wildcard',
        chipFreeHit:        'Free Hit',
        chipBenchBoost:     'Bench Boost',
        chipTripleCaptain:  'Triple Captain',
        errorOptimizer:     'Error running the optimizer',
        cardPrices:         'Price Changes',
        pcExplain:          'From FPL\'s own price predictor: each player\'s progress towards the next price change, where +100% means a rise and −100% a fall. <em>Tonight</em> is the projection for the next change window (around midnight UK time). A price can change at most once a day. Your selling price only rises by half of any increase.',
        pcYourSquad:        'Your Squad',
        pcSquadAlert:       'Expected to change tonight',
        pcRisers:           'Likely to rise',
        pcFallers:          'Likely to fall',
        pcRose:             'Rose this gameweek',
        pcFell:             'Fell this gameweek',
        pcNow:              'Now',
        pcTonight:          'Tonight',
        pcThisGW:           'This GW',
        pcNetTransfers:     'Net transfers',
        pcNone:             'None at the moment.',
        pcWatch:            'Watch tonight',
        errorPrices:        'Error loading prices',
        loadingPrices:      'Loading prices...',
        cardLive:           'Live Gameweek',
        lvInProgress:       'matches in progress, refreshing every minute',
        lvFinished:         'gameweek finished',
        lvBetween:          'between matches',
        lvNotStarted:       'not started yet',
        lvUpdated:          'updated',
        lvExplain:          'Live points with <strong>provisional bonus</strong> (*) from the bonus point system while a match\'s bonus isn\'t confirmed, and <strong>automatic substitutions</strong> once a starter\'s matches are over without him playing (↑ in, ↓ out). League totals include hits; ▲▼ is the change since the gameweek started.',
        lvYourTeam:         'Your Team',
        lvLeague:           'Live League Table',
        lvMins:             'Mins',
        lvProvisional:      'provisional bonus',
        lvPoints:           'Live points',
        errorLive:          'Error loading live points',
        loadingLive:        'Loading live points...',
        navHome:            'Home',
        navTeam:            'My Team',
        navTransfers:       'Transfers',
        navLeague:          'League',
        navPlayers:         'Players',
        navFixtures:        'Fixtures',
        navGuide:           'Guide',
        mtTitle:            'Transfers I\'ve made',
        mtExplain:          'FPL only publishes transfers after the deadline. Add the ones you\'ve already made in the FPL app here: they are saved in this browser and used everywhere (plan, suggested lineup, chips, rating) until the deadline, then replaced by FPL\'s official data.',
        mtNone:             'None entered.',
        mtAdd:              'Add transfer',
        mtRemove:           'Remove',
        mtPick:             'Pick a player to sell and one to buy.',
        mtBudget:           'Not enough money: £{need}m short.',
        mtClub:             'You\'d have more than 3 players from {team}.',
        mtBanner:           'Includes {n} transfer(s) you entered for GW{gw}',
        teamIdChecking:     'Checking team…',
        teamIdNotFound:     'No FPL team with ID {id}. Check the number in your FPL Points page URL.',
        cardNextGW:         'Next Gameweek',
        nxDraw:             'Draw',
        nxNoOdds:           'no odds yet for this match',
        nxFavBooks:         'Bookmakers favour',
        nxExplain:          'For every match of the next gameweek: which team the <strong>bookmakers</strong> favour and how likely they think it is (average of about 20 bookmakers, margin removed). Your players in each match are listed underneath.',
        luViewNextGW:       'Next GW',
        guide_nextgw_what:  'Every match of the next gameweek with the team the bookmakers favour, its winning chance, and your players in each match.',
        guide_nextgw_how:   'The favourite and its chance come from the average of about 20 bookmakers with their margin removed, refreshed daily. If no odds are published yet, the match is shown without a favourite.',
        accOddsPending:     'Bookmaker odds are saved before every match from GW6; after two gameweeks the backtest measures how much weight they deserve, and the app uses the measured weights.',
        accOddsResult:      '{what} on {range}: model alone {model}, best with {best} odds weight {mae} (avg. error).',
        accOddsMatch:       'Match odds',
        accOddsRatings:     'Bookmaker team ratings',
        cardLineup:         'Suggested Lineup',
        luSuggested:        'Suggested XI (xPts)',
        luCurrent:          'Your current XI (xPts)',
        luGain:             'Gain',
        luChanges:          'Changes to make',
        luStart:            'Start',
        luBench:            'bench',
        luCaptain:          'Captain',
        luVice:             'Vice-captain',
        luInsteadOf:        'instead of',
        luNoChanges:        'Your lineup already matches the suggestion.',
        luBenchOrder:       'Bench order follows FPL\'s automatic substitutions: the backup goalkeeper first, then outfield players by projected points, so the likeliest scorer comes on first if a starter doesn\'t play.',
        luViewCurrent:      'Current',
        luSameAsYours:      'same as your lineup',
        luViewSuggested:    'Suggested',
        guide_lineup_what:  'The best starting XI, captain, vice-captain and bench order from the players you own, for the next gameweek, with what to change compared with your current lineup.',
        guide_lineup_how:   'Every player\'s projected points for the next match (minutes, opponent, odds, availability) pick the best valid XI; the two highest become captain and vice-captain. The bench is ordered for automatic substitutions: backup goalkeeper first, then outfield players by projected points.',
        alertTitle:         'Blank and double gameweeks ahead',
        alertDouble:        'double',
        alertBlank:         'blank',
        alertYours:         '{n} of your players',
        alertPostponed:     '{n} postponed matches without a new date (they usually become doubles)',
        lvOverall:          'Overall rank',
        lvOverallEst:       'Overall rank (estimate)',
        lvRankHow:          'Estimated from about 30 pages of the overall table and 150 managers\' live scores, refreshed every 10 minutes. FPL publishes the official rank after the gameweek.',
        glossaryTitle:      'Glossary',
        gl_xpts_term:       'xPts',
        gl_xpts_def:        'Projected (expected) FPL points from this app\'s model, for a match or a gameweek.',
        gl_xg_term:         'xG / xA',
        gl_xg_def:          'Expected goals / expected assists: how many goals or assists a player\'s chances are usually worth, from Opta data published by FPL.',
        gl_xgc_term:        'xGC',
        gl_xgc_def:         'Expected goals conceded by the player\'s team while he is on the pitch; lower is better for defenders and goalkeepers.',
        gl_eo_term:         'EO',
        gl_eo_def:          'Effective ownership: the share of a player\'s points the average manager in a group collects. Starting owners count once, captains twice, triple captains three times, so it can exceed 100%.',
        gl_swing_term:      'Swing',
        gl_swing_def:       'Points you gain (+) or lose (−) against the average rival next gameweek because of one player: (your multiplier − EO) × his projected points.',
        gl_multiplier_term: 'Multiplier',
        gl_multiplier_def:  'How many times a player\'s points count for you: 0 on the bench, 1 in the XI, 2 as captain, 3 with Triple Captain.',
        gl_fdr_term:        'FDR',
        gl_fdr_def:         'FPL\'s fixture difficulty rating from 1 (easiest) to 5 (hardest). The Fixture Analyser also shows the model\'s expected goals and clean-sheet chance, which split attack from defence.',
        gl_bps_term:        'BPS',
        gl_bps_def:         'Bonus Points System: FPL\'s per-match score from Opta actions. The top three in each match get 3, 2 and 1 bonus points.',
        gl_defcon_term:     'Defensive contribution',
        gl_defcon_def:      '2 points for 10+ clearances, blocks, interceptions and tackles in a match (defenders), or 12+ including recoveries (midfielders and forwards).',
        gl_ft_term:         'FT',
        gl_ft_def:          'Free transfer: you get one per gameweek and can bank up to 5. Wildcard and Free Hit don\'t use them.',
        gl_hit_term:        'Hit (−4)',
        gl_hit_def:         'Each transfer beyond your free transfers costs 4 points.',
        gl_sell_term:       'Selling price',
        gl_sell_def:        'What you get for a player: his purchase price plus half of any rise (rounded down), or the current price if it fell.',
        gl_blank_term:      'Blank / double gameweek',
        gl_blank_def:       'A blank gameweek is one where a team has no match (its players score 0); in a double gameweek it plays twice and both matches count.',
        loadingText:        'Loading…',
        retry:              'Try again',
        ftToday:            'today',
        ftFpl:              'FPL data',
        ftForm:             'recent form',
        ftOdds:             'odds',
        ftPredictor:        'FPL price predictor',
        ftRefresh:          'refreshes every minute',
        cardCaptain:        'Captain & Predictions',
        cardPlan:           'Transfer Plan',
        guideHowPage:       'How this page works',
        guideTitle:         'Guide: what each card shows and how it works',
        guideIntro:         'Every number comes from the official FPL API, plus a daily job that adds recent form, top-manager ownership and bookmaker odds. Projections cover the next 5 gameweeks.',
        guideWhat:          'Shows',
        guideHow:           'How it works',
        guideOpen:          'Open',
        guideClose:         'Close',
        guidePlayerTitle:   'Player Profile',
        guide_live_what:    'Your points as matches are played, and a live table of your mini-league.',
        guide_live_how:     'Uses FPL\'s live points, adds provisional bonus from the bonus point system until it is confirmed, makes automatic substitutions when a starter\'s matches end without him playing, and counts hits and chips. Refreshes every minute while matches are on.',
        guide_team_what:    'Your squad on a pitch with each player\'s next opponent and any injury or suspension flag.',
        guide_team_how:     'Shirt and points from your latest gameweek picks. The coloured strip shows FPL\'s chance of playing (yellow 75%, orange 50/25%, red out); the fixture pill is coloured by difficulty.',
        guide_prediction_what:'Projected points for each of your players next gameweek and the captain pick.',
        guide_prediction_how:'Per match: chance of starting and minutes (season + last 5 matches), goals and assists from xG/xA, clean sheets from team strength and bookmaker odds, saves, defensive contributions, bonus and cards, using this season\'s scoring. Accuracy against past gameweeks is at the bottom of the page.',
        guide_transfers_what:'A 5-gameweek transfer plan and the best single transfers for your squad.',
        guide_transfers_how:'Each option is scored by how much your best XI plus captain improves over the next 5 gameweeks, within your bank, selling prices and the 3-per-club limit. The plan tries rolling, one or two transfers each week, pays −4 for extra transfers and lets you lock or ban players.',
        guide_optimizer_what:'Your team rating, the best Wildcard and Free Hit squads, and the week each chip is worth most.',
        guide_optimizer_how:'An optimizer searches for the best 15 within your budget, formation and club limit. Rating = your squad\'s projected points ÷ the best squad\'s. The chip calendar values Bench Boost, Triple Captain and Free Hit per week with your current squad.',
        guide_league_what:  'Your mini-league standings, threats and differentials.',
        guide_league_how:   'EO (effective ownership) = how much of a player\'s points the average rival collects, captains counting double. Threats are players your rivals own and you don\'t; swing = (your multiplier − EO) × projected points. The overall top 1,000 is available as a comparison.',
        guide_performance_what:'Your season so far: points, overall rank and the last gameweeks.',
        guide_performance_how:'Straight from your FPL history; the chart compares each gameweek with your average.',
        guide_prices_what:  'Players likely to rise or fall in price tonight, and your squad\'s selling prices.',
        guide_prices_how:   'From FPL\'s own price predictor: progress towards the next change, where ±100% means the price moves. Prices change at most once a day, around midnight UK time; you keep half of any rise.',
        guide_fixtures_what:'Every team\'s next 8 gameweeks, and the best runs for attackers and defenders.',
        guide_fixtures_how: 'Expected goals and clean-sheet chances from each team\'s xG for and against, home advantage, bookmaker odds for the next matches (marked •) and, for later weeks, team ratings moved towards the bookmakers\' view. Blank and double gameweeks are shown.',
        guide_database_what:'Every player with season stats, sortable and filterable.',
        guide_database_how: 'Straight from the FPL API: price, points, form, goals, assists, expected stats, defensive actions and ownership. Click a player for the full profile.',
        guide_comparison_what:'Two or three players side by side.',
        guide_comparison_how:'Pick players to compare their FPL stats; the better value in each row is highlighted.',
        guide_player_what:  'Everything about one player: stats, availability, fixtures and match history.',
        guide_player_how:   'Season totals and per-90 figures from the FPL API, the availability flag and news, upcoming fixtures and points per gameweek.',
        accTitle:           'Model Accuracy',
        accExplain:         'Backtest on {range} ({n} player-gameweeks): each gameweek is projected from the matches before it and compared with the points actually scored. Lower error and higher correlation are better.',
        accMae:             'Avg. error (pts)',
        accCorr:            'Correlation',
        accModel:           'This model',
        accPPG:             'Points per game',
        accForm:            'Recent form',
        accTop10:           'The model\'s top-10 projected players scored <strong>{model}</strong> pts on average per gameweek, vs <strong>{form}</strong> for the top 10 by form.',
        gkpOptions:         'GKP Options',
        outfieldOptions:    'Outfield Options',
        sortedByGain:       'Sorted by Expected Pts Gain',
        budget:             'Budget',
        noTransfers:        'No transfer suggestions at this time. Your team looks good!',
        perfectTeam:        '🎉 Perfect Team!',
        perfectTeamDesc:    'No significant transfer improvements found. Your squad is excellently optimized!',
        howCalc:            'How suggestions are calculated',
        howCalcBlock:       `<strong>How suggestions are calculated</strong><ul style="margin:6px 0 6px 18px; padding:0;"><li><strong>Projected points per gameweek</strong> for the next 5 deadlines (blanks score 0, doubles count both matches). Each match combines minutes (starts and minutes in recent matches and the season, injury news), goals and assists from xG/xA per 90, clean sheets and goals conceded from team strength, saves, defensive contributions, bonus and cards, using this season's FPL scoring.</li><li><strong>Team strength</strong> comes from each club's xG for and against this season, blended with FPL's own rating while the sample is small.</li><li><strong>Gain</strong> = how much your best XI plus captain improves over those gameweeks, with nearer gameweeks counting more. A bench player only adds points if he would start.</li></ul>Transfers respect your selling prices (you keep half of any price rise), your bank and the 3-per-club limit. Each option uses one transfer: with a free transfer it is worth making above ~2 pts; without one it must also cover the −4 hit.`,
        dbStatsBlock:       `<h4>📊 Comprehensive Player Statistics - 48 Data Points</h4><p><strong>How to use:</strong> Scroll horizontally to see all columns. Hover over any column header for detailed explanations. Click headers to sort.</p><p><strong>Data sources:</strong> Official FPL API + Opta Sports Analytics (trusted by Premier League, FIFA, UEFA)</p><p><strong>Categories:</strong> Basic Stats (8) • Performance Metrics (12) • Expected Stats (9) • Opta Advanced (7) • Set Pieces (3) • Transfer Trends (4) • Value Analysis (2) • Availability (1)</p><p style="margin-top:8px;"><strong>Color coding:</strong> <span class="legend-pill legend-green">Green = High performer</span> <span class="legend-pill legend-red">Red = Low form/injured</span> <span class="legend-pill legend-purple">Purple = High xGI</span> <span class="legend-pill legend-yellow">Yellow = Elite per 90</span> <span class="legend-pill legend-blue">Blue = ICT leader</span></p>`,
        topScorerLabel:     '🏆 TOP SCORER',
        bestFormLabel:      '🔥 BEST FORM',
        mostMinsLabel:      '⏱️ MOST MINUTES',
        mostGoalsLabel:     '⚽ MOST GOALS',
        mostAssistsLabel:   '🎯 MOST ASSISTS',
        mostKeyPassLabel:   '🔑 MOST KEY PASSES',
        mostTacklesLabel:   '🛡️ MOST TACKLES',
        bestXGILabel:       '📊 BEST xGI',
        goalsLabel:         'goals',
        assistsLabel:       'assists',
        passesLabel:        'passes',
        tacklesLabel:       'tackles',
        transferOut:        'OUT',
        transferIn:         'IN',
        transferReason:     'Reason',
        transferCost:       'Transfer Cost',
        newBudget:          'New Budget',
        next3Fixtures:      'Next 3 Fixtures Comparison',
        playersToWatch:     'Players to Watch',
        highPerformers:     'High-performing players across all positions:',
        option:             'Option',
        gkpFull:            'Goalkeepers',
        defFull:            'Defenders',
        midFull:            'Midfielders',
        fwdFull:            'Forwards',
        transferSuggHeader: 'Transfer Suggestions',
        transferSuggSuffix: ' Transfer Suggestions',
        valueLabel:         'Value',

        /* ── Player Comparison ── */
        cmpHint:            'Search and select up to 3 players to compare their FPL stats.',
        cmpPlayer1:         'Player 1...',
        cmpPlayer2:         'Player 2...',
        cmpPlayer3:         'Player 3 (optional)',
        cmpTitle:           'Player Comparison',

        /* ── Player page ── */
        playerTitle:        'Player Profile',
        upcomingFixtures:   'Upcoming Fixtures',
        recentGWPoints:     'Recent Gameweek Points',
        last10GWs:          'Last 10 Gameweeks',
        gwCol:              'GW',
        opponent:           'Opponent',
        homeAway:           'H/A',
        score:              'Score',
        mins:               'Mins',
        goals:              'G',
        assists2:           'A',
        cleanSheets:        'CS',
        yellow:             'Yel',
        ptsCol:             'Pts',
        attackStats:        'Attack',
        defenceStats:       'Defence',
        valueTransfers:     'Value & Transfers',
        price:              'Price',
        valueSeason:        'Value (Season)',
        valueForm:          'Value (Form)',
        gwTransIn:          'GW Transfers In',
        gwTransOut:         'GW Transfers Out',
        seasonIn:           'Season In',

        /* ── Guardian / Onboarding ── */
        guardianSubtitle:   'Your personal Fantasy Premier League intelligence hub',
        guardianInputLabel: 'Enter your FPL Team ID',
        guardianInputPlaceholder: 'e.g. 1234567',
        guardianContinue:   'Continue →',
        guardianHowTitle:   'How to find your Team ID',
        guardianStep1:      'Go to <strong>fantasy.premierleague.com</strong> and log in to your account',
        guardianStep2:      'Click <strong>“Points”</strong> in the top navigation menu',
        guardianStep3:      'Look at the URL bar — it will look like <code>/entry/<strong>1234567</strong>/event/1/</code>',
        guardianStep4:      'The number between <code>/entry/</code> and <code>/event/</code> is your Team ID',
        guardianTip:        '💡 Tip: Your Team ID is a 7-digit number visible in the URL on your FPL points page.',
        changeTeamId:       'Change ID',
        changeTeamIdTitle:  'Change FPL Team ID',
        changeTeamIdSave:   'Save & Reload',
        changeTeamIdCancel: 'Cancel',

        /* ── Misc ── */
        home:               'HOME',
        away:               'AWAY',
        h:                  'H',
        a:                  'A',
        diff:               'Diff',
        vs:                 'vs',
        at:                 '@',
        average:            'Avg',
        seasonAvg:          'Season Average',
        gwPointsLabel:      'GW Points',
        noInjuryNews:       'No injury news',
        last:               'Last',
        gameweeks:          'Gameweeks',

        /* ── Full guide page (guide.html) ── */
        guideFull:          'Full guide: how the website works',
        guardianGuide:      'How does this work?',
        gp_title:           'How FPL Analyzer works',
        gp_contents:        'Contents',
        gp_top:             'Back to top',
        gp_intro:           `<p>FPL Analyzer reads your Fantasy Premier League team from the official FPL API and adds its own projections: expected points for the next five gameweeks, the best lineup and captain, transfer plans, chip timing and where you stand in your mini-leagues. It is free and needs no login. This page explains how each part works, where the numbers come from and what their limits are.</p>`,
        gp_start_title:     'Getting started',
        gp_start:           `<h3>Your FPL team ID</h3>
<p>Log in at <strong>fantasy.premierleague.com</strong> and open <strong>Points</strong>. In the address bar, <code>/entry/1234567/event/1/</code>, the number after <code>/entry/</code> is your team ID.</p>
<h3>First visit and Change ID</h3>
<p>On your first visit Home asks for the ID, checks with FPL that the team exists, saves it and reloads; a wrong number shows an error instead. Until an ID is saved, the other pages send you back to Home (this guide is the exception). <strong>Change ID</strong> in the Home header switches to another team, for example a rival's.</p>
<h3>Where it is stored</h3>
<p><strong>In this browser only</strong>, together with your language, theme, plan locks and bans and the transfers you enter yourself. Another browser or device asks for the ID again.</p>`,
        gp_nav_title:       'Finding your way around',
        gp_nav:             `<ul>
<li><strong>Six tabs</strong> at the top: Home, My Team, Transfers, League, Players and Fixtures. On a phone they become a bar with icons at the bottom of the screen.</li>
<li><strong>Sub-pages</strong> of a tab appear as buttons under the page title.</li>
<li><strong>Guide</strong> in the top bar opens a short explanation of every page and the glossary, with a link to this page.</li>
<li>The round <strong>i</strong> buttons on the Home cards and <em>How this page works</em> under a page title explain it in place. Words with a dotted underline (xPts, EO, FT, hit…) explain themselves when tapped.</li>
<li><strong>Light or dark</strong>: the moon / sun button. Until you choose, the site follows your device. <strong>Language</strong>: the flags; both choices are remembered.</li>
</ul>`,
        gp_pages_title:     'The pages',
        gp_pages:           `<h3>Home</h3>
<p>Eight summary cards, each with an <strong>i</strong> button and an <em>Open</em> link to its full page. The My Team card switches between <strong>Current</strong> (your lineup as set), <strong>Suggested</strong> (the suggested lineup for the next gameweek) and <strong>Next GW</strong> (the next gameweek's matches with the bookmakers' favourite and your players in each). A banner warns about blank and double gameweeks ahead.</p>
<h3>My Team</h3>
<ul>
<li><strong>My Team</strong>: your squad with each player's next opponent, coloured by FPL difficulty, and availability flags: yellow 75%, orange 50 or 25%, red out.</li>
<li><strong>Suggested Lineup</strong>: the best XI, captain, vice-captain and bench order from your players, and what to change.</li>
<li><strong>Next Gameweek</strong>: every match with the team the bookmakers favour, its chance of winning and your players.</li>
<li><strong>Points Prediction</strong>: projected points per player and match, the captain pick and, at the bottom, <em>Model Accuracy</em> on past gameweeks.</li>
</ul>
<h3>Transfers</h3>
<ul>
<li><strong>Transfers I've made</strong>: FPL publishes transfers only after the deadline, so enter the ones you've already made in the FPL app. They are checked against your money and the 3-per-club limit, saved in this browser and used by every page until the deadline, then replaced by FPL's data.</li>
<li><strong>Transfer Plan</strong>: five weeks of rolling, one or two transfers, with free transfers and hits. Tap a squad player to <em>lock</em> him (never sold); ⛔ next to a suggested buy <em>bans</em> him (never bought).</li>
<li><strong>Best Single Transfers</strong>: the best options per position with the gain and a verdict: <em>Make it</em>, <em>Worth a −4</em> or <em>Marginal: consider rolling</em>.</li>
<li><strong>AI Team &amp; Chips</strong>: your team rating, the best Wildcard and Free Hit squads and the chip calendar.</li>
</ul>
<h3>League</h3>
<ul>
<li><strong>Mini-League</strong>: standings, threats (players your rivals own and you don't), your differentials, rivals' captains and the template, from effective ownership. You can also compare with the overall top 1,000 managers.</li>
<li><strong>Live Gameweek</strong>: live points with provisional bonus and automatic substitutions, a live league table and your overall rank.</li>
<li><strong>Performance</strong>: your season's points and rank, and every gameweek against your average.</li>
</ul>
<h3>Players and Fixtures</h3>
<ul>
<li><strong>Player Database</strong>: every player's season stats; search, filter and sort. <strong>Player Comparison</strong>: up to three players side by side.</li>
<li><strong>Price Changes</strong>: likely rises and falls tonight, from FPL's price predictor. Tap any player for his <strong>profile</strong>: stats, news, fixtures and match history.</li>
<li><strong>Fixture Analyser</strong>: every team's next 3, 5 or 8 gameweeks with expected goals, clean-sheet chance and FPL difficulty, and the best runs for attackers and defenders.</li>
</ul>`,
        gp_model_title:     'How the predictions work',
        gp_model:           `<p>Every player gets projected points (xPts) for each match of the next five gameweeks under this season's FPL scoring. A blank gameweek scores 0; a double counts both matches.</p>
<ul>
<li><strong>Minutes</strong>: his chances of starting, coming off the bench and playing 60+ minutes, from this season and his last five matches, the recent ones counting more.</li>
<li><strong>Availability</strong>: FPL's chance of playing applies to the next gameweek. Later weeks use return dates in the news (“Expected back 18 Oct”); without a date, an injured or suspended player misses another week and then returns gradually.</li>
<li><strong>Goals and assists</strong> from his xG and xA per 90 minutes, steadied with his position's average when he has played few minutes.</li>
<li><strong>Team strength</strong> from each club's xG for and against this season, blended with FPL's own rating while few matches have been played. Home teams get 10% more goals.</li>
<li><strong>Bookmaker odds</strong>: when a match is priced, its expected goals are 70% the bookmakers' and 30% the model's. Later matches use team ratings moved halfway towards the bookmakers' view of each team. Odds older than four days are ignored.</li>
<li><strong>The rest</strong>: clean sheets and goals conceded from the goals his team should concede, saves (more against strong attacks), defensive contribution, bonus and yellow cards from his own rates.</li>
</ul>
<p>A squad is worth its best valid XI plus the captain counted twice, every week; each gameweek counts 90% of the one before, so nearer weeks matter more.</p>
<h3>How the odds weights are measured</h3>
<p>70% and 50% are starting values. The daily job keeps the last odds before every kickoff, and a backtest replays the finished gameweeks with several weights, comparing each projection with the points actually scored. Once two gameweeks with saved odds are measured, the site uses the weights that did best. The same backtest produces Model Accuracy.</p>`,
        gp_decide_title:    'How transfers, plans and chips are decided',
        gp_decide:          `<ul>
<li><strong>Single transfers</strong>: every sale for an affordable player in the same position is scored by how much your best XI + captain improves over five weeks, within your selling prices (you keep half of a rise), bank and 3 players per club. With a free transfer a move above about 2 points is worth making; without one it must also cover the −4.</li>
<li><strong>Transfer plan</strong>: each week the planner tries rolling, one or two transfers, paying 4 points beyond your free ones (one more each week, up to five). It keeps the 12 best plans after every week (beam search) and compares the best with rolling every week. Prices are assumed not to change.</li>
<li><strong>AI Team</strong>: the optimizer looks for the best 15 within your budget (bank plus selling prices), swapping one or two players at a time until nothing improves. Wildcard = best squad over five weeks, Free Hit = best for the next week, rating = your squad's points as a share of the Wildcard squad's.</li>
<li><strong>Chip calendar</strong>: for each chip you still have, per week: Bench Boost = your bench's points, Triple Captain = your captain's points once more, Free Hit = best one-week squad minus your XI. Later weeks assume no transfers, so treat them as a guide.</li>
<li><strong>Mini-league</strong>: EO = how much of a player's points the average rival collects (captains count double); swing = (your multiplier − EO) × his projected points.</li>
</ul>`,
        gp_data_title:      'Where the data comes from',
        gp_data:            `<ul>
<li><strong>Official FPL API</strong> through the site's own proxy: answers are cached for 5 minutes, live points for 60 seconds, and the Live page refreshes every minute during matches.</li>
<li><strong>Daily data job at 05:30 UTC</strong>: recent form for the minutes model, the ownership of the overall top 1,000 managers (once per gameweek), bookmaker odds, the odds history and the accuracy backtest.</li>
<li><strong>Bookmaker odds</strong> from The Odds API, once a day: about 20 bookmakers, margin removed, averaged and turned into expected goals for both teams.</li>
<li><strong>Overall rank estimate</strong>: about 30 pages of the overall table and 150 managers' live scores, refreshed every 10 minutes.</li>
</ul>
<p>The line at the bottom of each card shows its sources and how fresh they are, for example <em>FPL data today 10:42 · recent form today 05:53 · odds today 05:53</em>.</p>`,
        gp_faq_title:       'Questions and limitations',
        gp_faq:             `<h3>My transfer isn't showing</h3>
<p>FPL publishes transfers only after the deadline. Until then, add them under <strong>Transfers I've made</strong> on the Transfers page; a ✎ note shows they are included.</p>
<h3>Why is my overall rank marked ≈?</h3>
<p>During a live gameweek it is an estimate. FPL's official rank replaces it once the gameweek is processed.</p>
<h3>Why do the numbers change during the day?</h3>
<p>Every page load fetches FPL data again (cached for up to 5 minutes), so news, prices and live points move. Odds and form are refreshed each morning, and prices change around midnight UK time.</p>
<h3>Is my data stored anywhere?</h3>
<p>Only in this browser. There are no accounts; the only requests go to the FPL API through the site's proxy and to the site's own data files.</p>
<h3>Do I need to pay or log in?</h3>
<p>No. It is free and never asks for your FPL password.</p>
<h3>How accurate are the predictions?</h3>
<p>They are averages, not certainties: 5 projected points can easily become 2 or 15. Early in the season they lean on FPL's ratings and players have few minutes, so they are less reliable, and late team news can surprise them. Model Accuracy on the Points Prediction page shows how the model has done.</p>`,
    },

    sr: {
        /* ── App shell ── */
        appTitle:           'FPL Analizator Tima',
        appEyebrow:         'Fantasy Premier Liga',
        analysis:           'Analiza',
        footerText:         'Napravljeno s',
        footerBy:           'za tebe od strane',
        footerHtml:         'Napravljeno sa <span class="heart">&#x2665;</span> za tebe, autor <a class="footer-author" href="https://github.com/skojic" target="_blank" rel="noopener">Srdjan Kojic</a> · <a class="footer-guide" href="guide.html">Kako radi</a>',
        dark:               'Tamna',
        light:              'Svetla',
        close:              'Zatvori',
        back:               '←',

        /* ── Card titles ── */
        cardMyTeam:         'Moj Tim',
        cardPerformance:    'Analitika Performansi',
        cardDatabase:       'Baza Igrača',
        cardPrediction:     'Predikcija Poena',
        cardTransfers:      'Predlozi Transfera',
        cardComparison:     'Poređenje Igrača',

        /* ── Loading / error ── */
        loading:            'Učitavanje...',
        loadingTeam:        'Učitavanje podataka tima...',
        loadingPerf:        'Učitavanje analitike...',
        loadingPlayers:     'Učitavanje igrača...',
        loadingPredictions: 'Računanje predikcija...',
        loadingTransfers:   'Analiza transfera...',
        loadingComparison:  'Učitavanje poređenja...',
        errorTeam:          'Greška pri učitavanju tima',
        errorDatabase:      'Greška pri učitavanju baze igrača',
        errorPerf:          'Greška pri učitavanju analitike',
        errorTransfers:     'Greška pri učitavanju transfera',
        errorPredictions:   'Greška pri računanju predikcija',

        /* ── My Team / pitch ── */
        gameweek:           'Kolo',
        substitutes:        'Rezervni',
        flagInjured:        'Povređen',
        flagSuspended:      'Suspendovan',
        flagUnavailable:    'Nedostupan',
        flagDoubtful:       'Neizvestan',
        gwPoints:           'Poeni Kola',
        bank:               'Budžet',
        teamValue:          'Vrednost Tima',
        captain:            'K',
        viceCaptain:        'PK',
        pts:                'poi',

        /* ── Player Database table ── */
        searchPlaceholder:  'Pretraži igrače po imenu, timu ili poziciji...',
        allPositions:       'Sve Pozicije',
        allTeams:           'Svi Timovi',
        goalkeeper:         'Golman',
        defender:           'Odbrambeni igrač',
        midfielder:         'Vezni igrač',
        forward:            'Napadač',
        colName:            'Ime',
        colTeam:            'Tim',
        colPosition:        'Pozicija',
        colPrice:           'Cena',
        colPoints:          'Poeni',
        colForm:            'Forma',
        colGoals:           'Golovi',
        colAssists:         'Asistencije',
        colXGI:             'Očekivani G+A',
        colTackles:         'Dueli',
        colOwned:           'U timu%',
        showingPlayers:     'Prikazano',
        players:            'igrača',
        noPlayersFound:     'Nema pronađenih igrača',

        /* ── Performance Analytics ── */
        perfTitle:          'Analitika Performansi',
        perfSubtitle:       'Pregled Sezone',
        gwHistory:          'Istorija Kola',
        gwPointsChart:      'Poeni po Kolu',
        totalPoints:        'Ukupni Poeni',
        overallRank:        'Ukupna Rang Lista',
        bestGW:             'Najbolje Kolo',
        worstGW:            'Najlošije Kolo',
        totalTransfers:     'Ukupno Transfera',
        rank:               'Rang',
        transfers:          'Transferi',
        gwsPlayed:          'Kola Odigrana',
        seasonStats:        'Statistike Sezone',

        /* ── Predictions ── */
        predTitle:          'Predikcija Poena',
        predSubtitle:       'Analiza Sledećih 5 Kola',
        expectedPoints:     'Očekivani Poeni',
        captainRec:         'Preporuka Kapitena',
        nextGWPredictions:  'Predikcije za Sledeće Kolo',
        topPerformers:      'Igrači s Najviše Očekivanih Poena',
        allPlayersPred:     'Svi Igrači - Očekivani Poeni',
        top3Fixture:        'Top 3 Igrača - Analiza Utakmica',
        xPts:               'oPoeni',
        form:               'Forma',
        rising:             'Raste',
        falling:            'Pada',
        stable:             'Stabilan',

        /* ── Transfers ── */
        transferTitle:      'Predlozi Transfera',
        transferSubtitle:   'Optimizuj Tvoj Tim',
        transferAnalysis:   'Analiza Transfera',
        budgetAvail:        'Dostupni Budžet',
        transfersGW:        'Transferi Ovog Kola',
        freeTransfers:      'Besplatni Transferi',
        verdictMake:        'Isplati se',
        verdictHit:         'Vredi −4',
        verdictMarginal:    'Marginalno: razmisli o čuvanju',
        alternativesNote:   'Alternative: svaka troši jedan transfer',
        sellPrice:          'prodaja',
        fixturesXPts:       'Utakmice i Projektovani Poeni',
        planTitle:          'Plan Transfera',
        planVsRoll:         'u odnosu na čuvanje transfera',
        planRoll:           'Sačuvaj transfer',
        planFT:             'BT',
        planXI:             'Tim',
        planCaptain:        'Kapiten',
        planBan:            'Nikad ne kupuj ovog igrača',
        planLockHint:       'Zaključaj igrače koje zadržavaš (nikad se ne prodaju):',
        planBanned:         'Nikad se ne kupuju (klikni da dozvoliš):',
        singleTransfers:    'Najbolji Pojedinačni Transferi',
        planNext:           'Plan',
        cardLeague:         'Mini-Liga',
        leagueSelect:       'Liga',
        leagueStandings:    'Tabela',
        leagueThreats:      'Pretnje: imaju ih rivali, ti ne (dovoljno)',
        leagueDiffs:        'Tvoji Diferencijali',
        leagueCaptains:     'Kapiteni Rivala',
        leagueTemplate:     'Šablon: ima ih pola lige ili više',
        leagueExplain:      '<strong>EO (efektivno vlasništvo)</strong> = koliko poena igrača u proseku dobija rival: 100% po vlasniku u startnih 11, 200% po kapitenu, podeljeno brojem rivala. Svaki poen igrača te pomera za <em>tvoj množilac − EO</em> u odnosu na prosečnog rivala; <strong>razlika</strong> je to puta njegovi projektovani poeni za sledeće kolo.',
        leagueBasedOn:      'Postave iz kola',
        leagueSampled:      'rivala analizirano',
        leagueTop50:        'velika liga: samo prvih 50',
        leagueNone:         'Još nisi ni u jednoj klasičnoj ligi.',
        leagueYou:          'Ti',
        leagueGap:          'Razlika',
        leagueGW:           'Kolo',
        leagueTotal:        'Ukupno',
        leagueRank:         'Mesto',
        leagueManager:      'Menadžer',
        leagueSwing:        'Razlika',
        leagueYours:        'Ti',
        leagueChips:        'Odigrani čipovi',
        errorLeague:        'Greška pri učitavanju lige',
        loadingLeague:      'Učitavanje lige...',
        leagueTopOverall:   'Najboljih {n} menadžera ukupno (ažurira se svako kolo)',
        cardFixtures:       'Analiza Rasporeda',
        fxAttack:           'Napad: očekivani golovi',
        fxDefence:          'Odbrana: čista mreža %',
        fxFdr:              'FPL težina',
        fxSortNext:         'Sortiraj po narednih',
        fxBlank:            'Bez utakmice',
        fxNone:             'Nema predstojećih utakmica.',
        fxExplain:          'Očekivani golovi i šanse za čistu mrežu dolaze iz xG za i protiv svakog tima ove sezone (uz FPL ocenu na početku) i prednosti domaćeg terena, pa razdvajaju dobru utakmicu za napadače od dobre za odbranu, što FPL težina 1–5 ne može. Dupla kola se sabiraju; kolo bez utakmice se ne računa. • = uz kvote kladionica za tu utakmicu; kasnije utakmice koriste ocene timova pomerene ka viđenju kladionica.',
        fxBestAttack:       'Najbolji raspored za napad',
        fxBestDefence:      'Najbolji raspored za odbranu',
        errorFixtures:      'Greška pri učitavanju rasporeda',
        loadingFixtures:    'Učitavanje rasporeda...',
        cardOptimizer:      'AI Tim i Čipovi',
        opLoading:          'Optimizacija tima...',
        opRating:           'AI Ocena Tima',
        opRatingExplain:    'Projektovani poeni tvog tima ({range}, najboljih 11 + kapiten svako kolo) kao udeo najboljeg tima koji optimizator nađe za tvoj budžet od £{budget}m (banka + prodajne cene).',
        opPts:              'poena',
        opVsYours:          'u odnosu na tvoj tim',
        opChanges:          'izmena',
        opOut:              'Izlaze',
        opCalendar:         'Kalendar Čipova',
        opCalendarExplain:  'Vrednost svakog čipa koji još imaš, po kolu, sa tvojim trenutnim timom: Bench Boost = poeni klupe, Triple Captain = poeni kapitena još jednom, Free Hit = najbolji tim za jedno kolo minus tvojih 11. Kasnija kola pretpostavljaju da nema transfera, pa ih koristi kao smernicu. Prvi set čipova mora se iskoristiti do kola {deadline}. Najbolje kolo za svaki čip je istaknuto.',
        opNoSpecial:        'U ovom periodu još nema kola bez utakmica ni duplih kola; vrednosti čipova su slične iz kola u kolo. Dupla kola se obično pojave kada se utakmice pomere zbog kupa.',
        opXI:               'Tvojih 11',
        opDoubles:          'Dupla',
        opBlanks:           'Bez utakmice',
        opYours:            'tvojih',
        opBestWeeks:        'Najbolja kola',
        chipWildcard:       'Wildcard',
        chipFreeHit:        'Free Hit',
        chipBenchBoost:     'Bench Boost',
        chipTripleCaptain:  'Triple Captain',
        errorOptimizer:     'Greška pri optimizaciji',
        cardPrices:         'Promene Cena',
        pcExplain:          'Iz FPL-ovog predviđanja cena: napredak svakog igrača ka sledećoj promeni cene, gde +100% znači rast a −100% pad. <em>Večeras</em> je projekcija za sledeći termin promena (oko ponoći po UK vremenu). Cena se može promeniti najviše jednom dnevno. Tvoja prodajna cena raste samo za polovinu povećanja.',
        pcYourSquad:        'Tvoj Tim',
        pcSquadAlert:       'Očekuje se promena večeras',
        pcRisers:           'Verovatno poskupljuju',
        pcFallers:          'Verovatno pojeftinjuju',
        pcRose:             'Poskupeli ovog kola',
        pcFell:             'Pojeftinili ovog kola',
        pcNow:              'Sada',
        pcTonight:          'Večeras',
        pcThisGW:           'Ovo kolo',
        pcNetTransfers:     'Neto transferi',
        pcNone:             'Trenutno nijedan.',
        pcWatch:            'Prati večeras',
        errorPrices:        'Greška pri učitavanju cena',
        loadingPrices:      'Učitavanje cena...',
        cardLive:           'Kolo Uživo',
        lvInProgress:       'utakmice u toku, osvežava se svakog minuta',
        lvFinished:         'kolo završeno',
        lvBetween:          'između utakmica',
        lvNotStarted:       'još nije počelo',
        lvUpdated:          'ažurirano',
        lvExplain:          'Poeni uživo sa <strong>privremenim bonusom</strong> (*) iz sistema bonus poena dok bonus utakmice nije potvrđen, i <strong>automatskim izmenama</strong> kada se utakmice startera završe a on nije igrao (↑ ulazi, ↓ izlazi). Ukupni poeni u ligi uključuju minuse za transfere; ▲▼ je promena od početka kola.',
        lvYourTeam:         'Tvoj Tim',
        lvLeague:           'Tabela Lige Uživo',
        lvMins:             'Min',
        lvProvisional:      'privremeni bonus',
        lvPoints:           'Poeni uživo',
        errorLive:          'Greška pri učitavanju poena uživo',
        loadingLive:        'Učitavanje poena uživo...',
        navHome:            'Početna',
        navTeam:            'Moj Tim',
        navTransfers:       'Transferi',
        navLeague:          'Liga',
        navPlayers:         'Igrači',
        navFixtures:        'Raspored',
        navGuide:           'Vodič',
        mtTitle:            'Transferi koje sam napravio',
        mtExplain:          'FPL objavljuje transfere tek posle roka. Dodaj ovde one koje si već napravio u FPL aplikaciji: čuvaju se u ovom pregledaču i koriste svuda (plan, predložena postava, čipovi, ocena) do roka, a onda ih zamenjuju zvanični FPL podaci.',
        mtNone:             'Nijedan nije unet.',
        mtAdd:              'Dodaj transfer',
        mtRemove:           'Ukloni',
        mtPick:             'Izaberi igrača koga prodaješ i koga kupuješ.',
        mtBudget:           'Nema dovoljno novca: nedostaje £{need}m.',
        mtClub:             'Imao bi više od 3 igrača iz kluba {team}.',
        mtBanner:           'Uključuje transfere koje si uneo za kolo {gw}: {n}',
        teamIdChecking:     'Provera tima…',
        teamIdNotFound:     'Ne postoji FPL tim sa ID {id}. Proveri broj u URL-u svoje FPL stranice Points.',
        cardNextGW:         'Sledeće Kolo',
        nxDraw:             'Nerešeno',
        nxNoOdds:           'još nema kvota za ovu utakmicu',
        nxFavBooks:         'Kladionice favorizuju',
        nxExplain:          'Za svaku utakmicu sledećeg kola: koju ekipu <strong>kladionice</strong> favorizuju i kolike su joj šanse (prosek oko 20 kladionica, bez marže). Tvoji igrači u svakoj utakmici su navedeni ispod.',
        luViewNextGW:       'Sledeće kolo',
        guide_nextgw_what:  'Sve utakmice sledećeg kola sa ekipom koju kladionice favorizuju, njenim šansama za pobedu i tvojim igračima u svakoj utakmici.',
        guide_nextgw_how:   'Favorit i njegove šanse dobijeni su kao prosek oko 20 kladionica bez marže, osvežavaju se dnevno. Ako kvote još nisu objavljene, utakmica se prikazuje bez favorita.',
        accOddsPending:     'Kvote kladionica se čuvaju pre svake utakmice od 6. kola; posle dva kola provera meri koliku težinu zaslužuju, i aplikacija koristi izmerene težine.',
        accOddsResult:      '{what} na {range}: sam model {model}, najbolje sa težinom kvota {best}: {mae} (prosečna greška).',
        accOddsMatch:       'Kvote utakmica',
        accOddsRatings:     'Ocene timova iz kvota',
        cardLineup:         'Predložena Postava',
        luSuggested:        'Predloženih 11 (xPts)',
        luCurrent:          'Tvojih trenutnih 11 (xPts)',
        luGain:             'Dobitak',
        luChanges:          'Izmene',
        luStart:            'Startuj',
        luBench:            'na klupu',
        luCaptain:          'Kapiten',
        luVice:             'Zamenik kapitena',
        luInsteadOf:        'umesto',
        luNoChanges:        'Tvoja postava se već poklapa sa predlogom.',
        luBenchOrder:       'Redosled na klupi prati FPL automatske izmene: prvo rezervni golman, pa igrači iz polja po projektovanim poenima, tako da najverovatniji strelac ulazi prvi ako starter ne zaigra.',
        luViewCurrent:      'Trenutna',
        luSameAsYours:      'ista kao tvoja postava',
        luViewSuggested:    'Predložena',
        guide_lineup_what:  'Najboljih 11, kapiten, zamenik i redosled na klupi od igrača koje imaš, za sledeće kolo, uz izmene u odnosu na tvoju trenutnu postavu.',
        guide_lineup_how:   'Projektovani poeni svakog igrača za sledeću utakmicu (minuti, protivnik, kvote, dostupnost) biraju najboljih 11; dva najbolja su kapiten i zamenik. Klupa je poređana za automatske izmene: prvo rezervni golman, pa igrači iz polja po projektovanim poenima.',
        alertTitle:         'Predstoje kola bez utakmica i dupla kola',
        alertDouble:        'duplo kolo',
        alertBlank:         'bez utakmice',
        alertYours:         'tvojih igrača: {n}',
        alertPostponed:     'odloženih utakmica bez novog termina: {n} (obično postanu dupla kola)',
        lvOverall:          'Ukupan plasman',
        lvOverallEst:       'Ukupan plasman (procena)',
        lvRankHow:          'Procena iz oko 30 strana ukupne tabele i poena uživo 150 menadžera, osvežava se na 10 minuta. FPL objavljuje zvaničan plasman posle kola.',
        glossaryTitle:      'Rečnik',
        gl_xpts_term:       'xPts',
        gl_xpts_def:        'Projektovani (očekivani) FPL poeni iz modela ove aplikacije, za utakmicu ili kolo.',
        gl_xg_term:         'xG / xA',
        gl_xg_def:          'Očekivani golovi / asistencije: koliko golova ili asistencija šanse igrača obično vrede, iz Opta podataka koje objavljuje FPL.',
        gl_xgc_term:        'xGC',
        gl_xgc_def:         'Očekivani primljeni golovi tima dok je igrač na terenu; manje je bolje za odbranu i golmane.',
        gl_eo_term:         'EO',
        gl_eo_def:          'Efektivno vlasništvo: udeo poena igrača koji prosečan menadžer u grupi dobija. Startni vlasnici se računaju jednom, kapiteni dvaput, triple captain triput, pa može biti preko 100%.',
        gl_swing_term:      'Razlika',
        gl_swing_def:       'Poeni koje dobijaš (+) ili gubiš (−) u odnosu na prosečnog rivala u sledećem kolu zbog jednog igrača: (tvoj množilac − EO) × njegovi projektovani poeni.',
        gl_multiplier_term: 'Množilac',
        gl_multiplier_def:  'Koliko puta se poeni igrača računaju za tebe: 0 na klupi, 1 u timu, 2 kao kapiten, 3 sa Triple Captain.',
        gl_fdr_term:        'FDR',
        gl_fdr_def:         'FPL ocena težine utakmice od 1 (najlakša) do 5 (najteža). Analiza rasporeda prikazuje i očekivane golove i šansu za čistu mrežu iz modela, koji razdvajaju napad od odbrane.',
        gl_bps_term:        'BPS',
        gl_bps_def:         'Sistem bonus poena: FPL ocena po utakmici iz Opta akcija. Prva tri u svakoj utakmici dobijaju 3, 2 i 1 bonus poen.',
        gl_defcon_term:     'Defanzivni doprinos',
        gl_defcon_def:      '2 poena za 10+ izbijanja, blokada, presečenih lopti i startova u utakmici (odbrana), ili 12+ uz osvojene lopte (vezni i napadači).',
        gl_ft_term:         'BT',
        gl_ft_def:          'Besplatni transfer: dobijaš jedan po kolu i možeš sačuvati do 5. Wildcard i Free Hit ih ne troše.',
        gl_hit_term:        'Minus (−4)',
        gl_hit_def:         'Svaki transfer preko besplatnih košta 4 poena.',
        gl_sell_term:       'Prodajna cena',
        gl_sell_def:        'Koliko dobijaš za igrača: kupovna cena plus polovina rasta (zaokruženo naniže), ili trenutna cena ako je pala.',
        gl_blank_term:      'Kolo bez utakmice / duplo kolo',
        gl_blank_def:       'U kolu bez utakmice tim ne igra (njegovi igrači imaju 0); u duplom kolu igra dvaput i obe utakmice se računaju.',
        loadingText:        'Učitavanje…',
        retry:              'Pokušaj ponovo',
        ftToday:            'danas',
        ftFpl:              'FPL podaci',
        ftForm:             'forma',
        ftOdds:             'kvote',
        ftPredictor:        'FPL predviđanje cena',
        ftRefresh:          'osvežava se svakog minuta',
        cardCaptain:        'Kapiten i Projekcije',
        cardPlan:           'Plan Transfera',
        guideHowPage:       'Kako radi ova stranica',
        guideTitle:         'Vodič: šta prikazuje svaka kartica i kako radi',
        guideIntro:         'Svi brojevi dolaze iz zvaničnog FPL API-ja, uz dnevni posao koji dodaje trenutnu formu, vlasništvo najboljih menadžera i kvote kladionica. Projekcije pokrivaju narednih 5 kola.',
        guideWhat:          'Prikazuje',
        guideHow:           'Kako radi',
        guideOpen:          'Otvori',
        guideClose:         'Zatvori',
        guidePlayerTitle:   'Profil Igrača',
        guide_live_what:    'Tvoji poeni dok se utakmice igraju i tabela tvoje mini-lige uživo.',
        guide_live_how:     'Koristi FPL poene uživo, dodaje privremeni bonus iz sistema bonus poena dok se ne potvrdi, pravi automatske izmene kada se utakmice startera završe a on nije igrao, i računa minuse i čipove. Osvežava se svakog minuta dok traju utakmice.',
        guide_team_what:    'Tvoj tim na terenu sa sledećim protivnikom svakog igrača i oznakom povrede ili suspenzije.',
        guide_team_how:     'Dres i poeni iz tvoje poslednje postave. Obojena traka pokazuje FPL šansu za nastup (žuta 75%, narandžasta 50/25%, crvena van); oznaka utakmice je obojena po težini.',
        guide_prediction_what:'Projektovani poeni svakog tvog igrača za sledeće kolo i izbor kapitena.',
        guide_prediction_how:'Po utakmici: šansa za start i minuti (sezona + poslednjih 5 utakmica), golovi i asistencije iz xG/xA, čiste mreže iz snage timova i kvota, odbrane, defanzivni doprinos, bonus i kartoni, po pravilima ove sezone. Tačnost na prošlim kolima je na dnu stranice.',
        guide_transfers_what:'Plan transfera za 5 kola i najbolji pojedinačni transferi za tvoj tim.',
        guide_transfers_how:'Svaka opcija se ocenjuje po tome koliko se poboljšava tvojih najboljih 11 plus kapiten u narednih 5 kola, u okviru banke, prodajnih cena i limita od 3 po klubu. Plan probava čuvanje, jedan ili dva transfera svake nedelje, plaća −4 za dodatne i dozvoljava zaključavanje ili zabranu igrača.',
        guide_optimizer_what:'Ocena tvog tima, najbolji Wildcard i Free Hit timovi i kolo u kome svaki čip najviše vredi.',
        guide_optimizer_how:'Optimizator traži najboljih 15 u okviru budžeta, formacije i limita po klubu. Ocena = projektovani poeni tvog tima ÷ poeni najboljeg tima. Kalendar čipova vrednuje Bench Boost, Triple Captain i Free Hit po kolu sa tvojim trenutnim timom.',
        guide_league_what:  'Tabela tvoje mini-lige, pretnje i diferencijali.',
        guide_league_how:   'EO (efektivno vlasništvo) = koliko poena igrača u proseku dobija rival, kapiteni se računaju duplo. Pretnje su igrači koje rivali imaju a ti ne; razlika = (tvoj množilac − EO) × projektovani poeni. Najboljih 1.000 ukupno je dostupno za poređenje.',
        guide_performance_what:'Tvoja sezona do sada: poeni, ukupan plasman i poslednja kola.',
        guide_performance_how:'Direktno iz tvoje FPL istorije; grafikon poredi svako kolo sa tvojim prosekom.',
        guide_prices_what:  'Igrači kojima će cena verovatno porasti ili pasti večeras i prodajne cene tvog tima.',
        guide_prices_how:   'Iz FPL-ovog predviđanja cena: napredak ka sledećoj promeni, gde ±100% znači da se cena menja. Cene se menjaju najviše jednom dnevno, oko ponoći po UK vremenu; zadržavaš polovinu rasta.',
        guide_fixtures_what:'Narednih 8 kola za svaki tim i najbolji rasporedi za napadače i odbranu.',
        guide_fixtures_how: 'Očekivani golovi i šanse za čistu mrežu iz xG za i protiv svakog tima, prednosti domaćeg terena, kvota kladionica za naredne utakmice (oznaka •) i, za kasnija kola, ocena timova pomerenih ka viđenju kladionica. Prikazana su kola bez utakmica i dupla kola.',
        guide_database_what:'Svi igrači sa statistikom sezone, uz sortiranje i filtere.',
        guide_database_how: 'Direktno iz FPL API-ja: cena, poeni, forma, golovi, asistencije, očekivane statistike, defanzivne akcije i vlasništvo. Klikni na igrača za ceo profil.',
        guide_comparison_what:'Dva ili tri igrača jedan pored drugog.',
        guide_comparison_how:'Izaberi igrače da uporediš njihove FPL statistike; bolja vrednost u svakom redu je istaknuta.',
        guide_player_what:  'Sve o jednom igraču: statistika, dostupnost, raspored i istorija utakmica.',
        guide_player_how:   'Ukupno za sezonu i po 90 minuta iz FPL API-ja, oznaka dostupnosti i vesti, predstojeće utakmice i poeni po kolu.',
        accTitle:           'Tačnost Modela',
        accExplain:         'Provera na {range} ({n} igrač-kola): svako kolo se projektuje iz utakmica pre njega i poredi sa stvarno osvojenim poenima. Manja greška i veća korelacija su bolje.',
        accMae:             'Prosečna greška (poeni)',
        accCorr:            'Korelacija',
        accModel:           'Ovaj model',
        accPPG:             'Poeni po utakmici',
        accForm:            'Trenutna forma',
        accTop10:           'Top 10 igrača po projekciji modela osvojilo je u proseku <strong>{model}</strong> poena po kolu, naspram <strong>{form}</strong> za top 10 po formi.',
        gkpOptions:         'Opcije za Golmana',
        outfieldOptions:    'Opcije za Igrače',
        sortedByGain:       'Sortirano po očekivanim dobijenim poenima',
        budget:             'Budžet',
        noTransfers:        'Nema predloga transfera. Tvoj tim izgleda odlično!',
        perfectTeam:        '🎉 Savršen Tim!',
        perfectTeamDesc:    'Nisu pronađena poboljšanja. Tvoj tim je odlično optimizovan!',
        howCalc:            'Kako se predlozi računaju',
        howCalcBlock:       `<strong>Kako se izračunavaju predlozi</strong><ul style="margin:6px 0 6px 18px; padding:0;"><li><strong>Projektovani poeni po kolu</strong> za narednih 5 rokova (kolo bez utakmice donosi 0, duplo kolo računa obe utakmice). Svaka utakmica kombinuje minute (startovi i minuti u poslednjim utakmicama i u sezoni, vesti o povredama), golove i asistencije iz xG/xA per 90, čiste mreže i primljene golove iz snage timova, odbrane, defanzivni doprinos, bonus i kartone, po pravilima bodovanja ove sezone.</li><li><strong>Snaga timova</strong> se računa iz xG za i protiv svakog kluba ove sezone, uz FPL ocenu dok je uzorak mali.</li><li><strong>Dobitak</strong> = koliko se poboljšava tvojih najboljih 11 plus kapiten u tim kolima, pri čemu bliža kola više vrede. Rezervni igrač donosi poene samo ako bi startovao.</li></ul>Transferi poštuju tvoje prodajne cene (zadržavaš polovinu rasta cene), budžet i limit od 3 igrača po klubu. Svaka opcija troši jedan transfer: sa besplatnim transferom isplati se iznad ~2 poena; bez njega mora da pokrije i −4.`,
        dbStatsBlock:       `<h4>📊 Sveobuhvatne statistike igrača - 48 podataka</h4><p><strong>Kako koristiti:</strong> Skroluj horizontalno da vidiš sve kolone. Pređi mišem iznad zaglavlja za detaljna objašnjenja. Klikni na zaglavlje za sortiranje.</p><p><strong>Izvori podataka:</strong> Zvanični FPL API + Opta Sports Analytics (koriste Premier liga, FIFA, UEFA)</p><p><strong>Kategorije:</strong> Osnovne (8) • Metrike učinka (12) • Očekivane (9) • Opta napredne (7) • Mrtve lopte (3) • Trendovi transfera (4) • Analiza vrednosti (2) • Dostupnost (1)</p><p style="margin-top:8px;"><strong>Kodiranje bojama:</strong> <span class="legend-pill legend-green">Zelena = Visok učinak</span> <span class="legend-pill legend-red">Crvena = Slaba forma/povreda</span> <span class="legend-pill legend-purple">Ljubičasta = Visoki xGI</span> <span class="legend-pill legend-yellow">Žuta = Elita per 90</span> <span class="legend-pill legend-blue">Plava = ICT lider</span></p>`,
        topScorerLabel:     '🏆 VRHOVNI STRELAC',
        bestFormLabel:      '🔥 NAJBOLJA FORMA',
        mostMinsLabel:      '⏱️ NAJVIŠE MINUTA',
        mostGoalsLabel:     '⚽ NAJVIŠE GOLOVA',
        mostAssistsLabel:   '🎯 NAJVIŠE ASISTENCIJA',
        mostKeyPassLabel:   '🔑 NAJVIŠE KLJUČNIH DODAVANJA',
        mostTacklesLabel:   '🛡️ NAJVIŠE DUELA',
        bestXGILabel:       '📊 NAJBOLJI xGI',
        goalsLabel:         'golova',
        assistsLabel:       'asistencija',
        passesLabel:        'dodavanja',
        tacklesLabel:       'duela',
        transferOut:        'PRODAJ',
        transferIn:         'KUPI',
        transferReason:     'Razlog',
        transferCost:       'Cena Transfera',
        newBudget:          'Novi Budžet',
        next3Fixtures:      'Poređenje Sledećih 3 Utakmice',
        playersToWatch:     'Igrači za Praćenje',
        highPerformers:     'Igrači u formi po svim pozicijama:',
        option:             'Opcija',
        gkpFull:            'Golman',
        defFull:            'Odbrana',
        midFull:            'Vezni Red',
        fwdFull:            'Napad',
        transferSuggHeader: 'Predlozi Transfera',
        transferSuggSuffix: '',
        valueLabel:         'Vrednost',

        /* ── Player Comparison ── */
        cmpHint:            'Pretraži i odaberi do 3 igrača za poređenje FPL statistika.',
        cmpPlayer1:         'Igrač 1...',
        cmpPlayer2:         'Igrač 2...',
        cmpPlayer3:         'Igrač 3 (opcionalno)',
        cmpTitle:           'Poređenje Igrača',

        /* ── Player page ── */
        playerTitle:        'Profil Igrača',
        upcomingFixtures:   'Predstojeće Utakmice',
        recentGWPoints:     'Poeni po Poslednjem Kolu',
        last10GWs:          'Poslednjih 10 Kola',
        gwCol:              'Kolo',
        opponent:           'Protivnik',
        homeAway:           'D/G',
        score:              'Rezultat',
        mins:               'Min',
        goals:              'G',
        assists2:           'A',
        cleanSheets:        'NM',
        yellow:             'ŽK',
        ptsCol:             'Poi',
        attackStats:        'Napad',
        defenceStats:       'Odbrana',
        valueTransfers:     'Vrednost i Transferi',
        price:              'Cena',
        valueSeason:        'Vrednost (Sezona)',
        valueForm:          'Vrednost (Forma)',
        gwTransIn:          'Transferi Unutra (Kolo)',
        gwTransOut:         'Transferi Van (Kolo)',
        seasonIn:           'Sezona Unutra',

        /* ── Guardian / Onboarding ── */
        guardianSubtitle:   'Tvoj lični centar za FPL inteligenciju',
        guardianInputLabel: 'Unesi tvoj FPL Tim ID',
        guardianInputPlaceholder: 'npr. 1234567',
        guardianContinue:   'Nastavi →',
        guardianHowTitle:   'Kako pronaći Tim ID',
        guardianStep1:      'Idi na <strong>fantasy.premierleague.com</strong> i prijavi se na nalog',
        guardianStep2:      'Klikni na <strong>„Points“</strong> u gornjem navigacionom meniju',
        guardianStep3:      'Pogledaj adresnu traku — biće prikazano <code>/entry/<strong>1234567</strong>/event/1/</code>',
        guardianStep4:      'Broj između <code>/entry/</code> i <code>/event/</code> je tvoj Tim ID',
        guardianTip:        '💡 Savet: Tim ID je sedmocifreni broj vidljiv u URL adresi na stranici tvojih FPL poena.',
        changeTeamId:       'Promeni ID',
        changeTeamIdTitle:  'Promeni FPL Tim ID',
        changeTeamIdSave:   'Sačuvaj i Osveži',
        changeTeamIdCancel: 'Otkaži',

        /* ── Misc ── */
        home:               'DOMAĆIN',
        away:               'GOST',
        h:                  'D',
        a:                  'G',
        diff:               'Težina',
        vs:                 'vs',
        at:                 '@',
        average:            'Prosek',
        seasonAvg:          'Prosek Sezone',
        gwPointsLabel:      'Poeni Kola',
        noInjuryNews:       'Bez vesti o povredama',
        last:               'Poslednjih',
        gameweeks:          'Kola',

        /* ── Full guide page (guide.html) ── */
        guideFull:          'Ceo vodič: kako sajt radi',
        guardianGuide:      'Kako ovo radi?',
        gp_title:           'Kako radi FPL Analyzer',
        gp_contents:        'Sadržaj',
        gp_top:             'Na vrh',
        gp_intro:           `<p>FPL Analyzer čita tvoj Fantasy Premier League tim iz zvaničnog FPL API-ja i dodaje svoje projekcije: očekivane poene za narednih pet kola, najbolju postavu i kapitena, planove transfera, pravo vreme za čipove i tvoj položaj u mini-ligama. Besplatan je i ne traži prijavu. Ova stranica objašnjava kako radi svaki deo, odakle dolaze brojevi i koja su im ograničenja.</p>`,
        gp_start_title:     'Prvi koraci',
        gp_start:           `<h3>Tvoj FPL Tim ID</h3>
<p>Prijavi se na <strong>fantasy.premierleague.com</strong> i otvori <strong>Points</strong>. U adresnoj traci, <code>/entry/1234567/event/1/</code>, broj posle <code>/entry/</code> je tvoj Tim ID.</p>
<h3>Prva poseta i Promeni ID</h3>
<p>Pri prvoj poseti Početna traži ID, proverava kod FPL-a da tim postoji, čuva ga i osvežava stranicu; za pogrešan broj prikazuje grešku. Dok ID nije sačuvan, ostale stranice te vraćaju na Početnu (izuzetak je ovaj vodič). <strong>Promeni ID</strong> u zaglavlju Početne prebacuje na drugi tim, na primer rivalov.</p>
<h3>Gde se čuva</h3>
<p><strong>Samo u ovom pregledaču</strong>, zajedno sa jezikom, temom, zaključanim i zabranjenim igračima u planu i transferima koje sam uneseš. Drugi pregledač ili uređaj ponovo traži ID.</p>`,
        gp_nav_title:       'Snalaženje na sajtu',
        gp_nav:             `<ul>
<li><strong>Šest kartica</strong> na vrhu: Početna, Moj Tim, Transferi, Liga, Igrači i Raspored. Na telefonu postaju traka sa ikonama na dnu ekrana.</li>
<li><strong>Podstranice</strong> kartice su dugmad ispod naslova stranice.</li>
<li><strong>Vodič</strong> u gornjoj traci otvara kratko objašnjenje svake stranice i rečnik, sa linkom ka ovoj stranici.</li>
<li>Okrugla dugmad <strong>i</strong> na karticama Početne i <em>Kako radi ova stranica</em> ispod naslova stranice objašnjavaju je na licu mesta. Reči podvučene tačkicama (xPts, EO, BT, minus…) objašnjavaju se kada ih dodirneš.</li>
<li><strong>Svetla ili tamna tema</strong>: dugme mesec / sunce. Dok ne izabereš, sajt prati tvoj uređaj. <strong>Jezik</strong>: zastavice; oba izbora se pamte.</li>
</ul>`,
        gp_pages_title:     'Stranice',
        gp_pages:           `<h3>Početna</h3>
<p>Osam kartica sa pregledom, svaka sa dugmetom <strong>i</strong> i linkom <em>Otvori</em> ka punoj stranici. Kartica Moj Tim se prebacuje između prikaza <strong>Trenutna</strong> (tvoja postava kako je namešteno), <strong>Predložena</strong> (predložena postava za sledeće kolo) i <strong>Sledeće kolo</strong> (utakmice sledećeg kola sa favoritom kladionica i tvojim igračima u svakoj). Obaveštenje upozorava na predstojeća kola bez utakmica i dupla kola.</p>
<h3>Moj Tim</h3>
<ul>
<li><strong>Moj Tim</strong>: tvoj tim sa sledećim protivnikom svakog igrača, obojenim po FPL težini, i oznakama dostupnosti: žuta 75%, narandžasta 50 ili 25%, crvena ne igra.</li>
<li><strong>Predložena Postava</strong>: najboljih 11, kapiten, zamenik i redosled na klupi od tvojih igrača, i šta treba promeniti.</li>
<li><strong>Sledeće Kolo</strong>: svaka utakmica sa ekipom koju kladionice favorizuju, njenim šansama za pobedu i tvojim igračima.</li>
<li><strong>Predikcija Poena</strong>: projektovani poeni po igraču i utakmici, izbor kapitena i, na dnu, <em>Tačnost Modela</em> u prošlim kolima.</li>
</ul>
<h3>Transferi</h3>
<ul>
<li><strong>Transferi koje sam napravio</strong>: FPL objavljuje transfere tek posle roka, pa ovde unesi one koje si već napravio u FPL aplikaciji. Proveravaju se prema tvom novcu i limitu od 3 igrača po klubu, čuvaju se u ovom pregledaču i koriste na svim stranicama do roka, a onda ih zamenjuju FPL podaci.</li>
<li><strong>Plan Transfera</strong>: pet kola čuvanja transfera, jednog ili dva transfera, sa besplatnim transferima i minusima. Dodirni igrača iz tima da ga <em>zaključaš</em> (nikad se ne prodaje); ⛔ pored predložene kupovine ga <em>zabranjuje</em> (nikad se ne kupuje).</li>
<li><strong>Najbolji Pojedinačni Transferi</strong>: najbolje opcije po poziciji sa dobitkom i ocenom: <em>Isplati se</em>, <em>Vredi −4</em> ili <em>Marginalno: razmisli o čuvanju</em>.</li>
<li><strong>AI Tim i Čipovi</strong>: ocena tvog tima, najbolji Wildcard i Free Hit timovi i kalendar čipova.</li>
</ul>
<h3>Liga</h3>
<ul>
<li><strong>Mini-Liga</strong>: tabela, pretnje (igrači koje imaju rivali, a ti ne), tvoji diferencijali, kapiteni rivala i šablon, iz efektivnog vlasništva. Možeš se porediti i sa najboljih 1.000 menadžera ukupno.</li>
<li><strong>Kolo Uživo</strong>: poeni uživo sa privremenim bonusom i automatskim izmenama, tabela lige uživo i tvoj ukupan plasman.</li>
<li><strong>Analitika Performansi</strong>: poeni i plasman u sezoni i svako kolo u odnosu na tvoj prosek.</li>
</ul>
<h3>Igrači i Raspored</h3>
<ul>
<li><strong>Baza Igrača</strong>: statistika sezone za sve igrače; pretraga, filteri i sortiranje. <strong>Poređenje Igrača</strong>: do tri igrača jedan pored drugog.</li>
<li><strong>Promene Cena</strong>: verovatna poskupljenja i pojeftinjenja večeras, iz FPL-ovog predviđanja cena. Dodirni bilo kog igrača za njegov <strong>profil</strong>: statistiku, vesti, raspored i istoriju utakmica.</li>
<li><strong>Analiza Rasporeda</strong>: naredna 3, 5 ili 8 kola svakog tima sa očekivanim golovima, šansom za čistu mrežu i FPL težinom, i najbolji raspored za napad i za odbranu.</li>
</ul>`,
        gp_model_title:     'Kako rade projekcije',
        gp_model:           `<p>Svaki igrač dobija projektovane poene (xPts) za svaku utakmicu narednih pet kola, po FPL bodovanju ove sezone. Kolo bez utakmice donosi 0; u duplom kolu se računaju obe utakmice.</p>
<ul>
<li><strong>Minuti</strong>: šanse da startuje, uđe sa klupe i odigra 60+ minuta, iz ove sezone i njegovih poslednjih pet utakmica, pri čemu skorije vrede više.</li>
<li><strong>Dostupnost</strong>: FPL šansa da igra važi za sledeće kolo. Kasnija kola koriste datume povratka iz vesti („Expected back 18 Oct”); bez datuma, povređen ili suspendovan igrač propušta još jedno kolo i zatim se postepeno vraća.</li>
<li><strong>Golovi i asistencije</strong> iz njegovog xG i xA na 90 minuta, ublaženi prosekom njegove pozicije kada je odigrao malo minuta.</li>
<li><strong>Snaga timova</strong> iz xG za i protiv svakog kluba ove sezone, uz FPL ocenu dok je odigrano malo utakmica. Domaćin dobija 10% više golova.</li>
<li><strong>Kvote kladionica</strong>: kada utakmica ima kvote, njeni očekivani golovi su 70% od kladionica i 30% od modela. Kasnije utakmice koriste ocene timova pomerene do pola puta ka viđenju kladionica. Kvote starije od četiri dana se ne koriste.</li>
<li><strong>Ostalo</strong>: čiste mreže i primljeni golovi iz golova koje bi njegov tim trebalo da primi, odbrane (više protiv jakih napada), defanzivni doprinos, bonus i žuti kartoni iz njegovih stopa.</li>
</ul>
<p>Tim vredi koliko njegovih najboljih 11 po važećoj formaciji plus kapiten računat dvaput, svako kolo; svako kolo vredi 90% prethodnog, pa bliža kola više znače.</p>
<h3>Kako se mere težine kvota</h3>
<p>70% i 50% su početne vrednosti. Dnevni posao čuva poslednje kvote pre svake utakmice, a provera ponavlja završena kola sa više težina i poredi svaku projekciju sa stvarno osvojenim poenima. Kada se izmere dva kola sa sačuvanim kvotama, sajt koristi težine koje su se najbolje pokazale. Ista provera daje Tačnost Modela.</p>`,
        gp_decide_title:    'Kako se biraju transferi, plan i čipovi',
        gp_decide:          `<ul>
<li><strong>Pojedinačni transferi</strong>: svaka prodaja za igrača iste pozicije koga možeš da priuštiš ocenjuje se po tome koliko se tvojih najboljih 11 + kapiten poboljša u pet kola, uz tvoje prodajne cene (zadržavaš polovinu rasta), budžet i 3 igrača po klubu. Sa besplatnim transferom isplati se potez iznad oko 2 poena; bez njega mora da pokrije i −4.</li>
<li><strong>Plan transfera</strong>: za svako kolo planer probava čuvanje, jedan ili dva transfera, uz 4 poena za svaki preko besplatnih (jedan novi svako kolo, najviše pet). Posle svakog kola zadržava 12 najboljih planova (beam search) i poredi najbolji sa čuvanjem transfera svako kolo. Pretpostavlja se da se cene ne menjaju.</li>
<li><strong>AI Tim</strong>: optimizator traži najboljih 15 u okviru tvog budžeta (banka plus prodajne cene), menjajući jednog ili dva igrača odjednom dok ništa više ne poboljšava. Wildcard = najbolji tim za pet kola, Free Hit = najbolji za sledeće kolo, ocena = poeni tvog tima kao udeo poena Wildcard tima.</li>
<li><strong>Kalendar čipova</strong>: za svaki čip koji još imaš, po kolu: Bench Boost = poeni klupe, Triple Captain = poeni kapitena još jednom, Free Hit = najbolji tim za jedno kolo minus tvojih 11. Kasnija kola pretpostavljaju da nema transfera, pa ih koristi kao smernicu.</li>
<li><strong>Mini-liga</strong>: EO = koliko poena igrača u proseku dobija rival (kapiteni se računaju dvaput); razlika = (tvoj množilac − EO) × njegovi projektovani poeni.</li>
</ul>`,
        gp_data_title:      'Odakle dolaze podaci',
        gp_data:            `<ul>
<li><strong>Zvanični FPL API</strong> preko proksija samog sajta: odgovori se keširaju 5 minuta, poeni uživo 60 sekundi, a stranica Kolo Uživo se osvežava svakog minuta dok traju utakmice.</li>
<li><strong>Dnevni posao u 05:30 UTC</strong>: trenutna forma za model minuta, vlasništvo najboljih 1.000 menadžera ukupno (jednom po kolu), kvote kladionica, istorija kvota i provera tačnosti.</li>
<li><strong>Kvote kladionica</strong> sa The Odds API, jednom dnevno: oko 20 kladionica, bez marže, uprosečene i pretvorene u očekivane golove za oba tima.</li>
<li><strong>Procena ukupnog plasmana</strong>: oko 30 strana ukupne tabele i poeni uživo 150 menadžera, osvežava se na 10 minuta.</li>
</ul>
<p>Red na dnu svake kartice pokazuje izvore i koliko su sveži, na primer <em>FPL podaci danas 10:42 · forma danas 05:53 · kvote danas 05:53</em>.</p>`,
        gp_faq_title:       'Pitanja i ograničenja',
        gp_faq:             `<h3>Moj transfer se ne vidi</h3>
<p>FPL objavljuje transfere tek posle roka. Do tada ih dodaj u delu <strong>Transferi koje sam napravio</strong> na stranici Transferi; napomena ✎ pokazuje da su uključeni.</p>
<h3>Zašto je moj ukupan plasman označen sa ≈?</h3>
<p>Tokom kola uživo to je procena. Zvaničan FPL plasman je zameni kada se kolo obradi.</p>
<h3>Zašto se brojevi menjaju tokom dana?</h3>
<p>Svako učitavanje stranice ponovo uzima FPL podatke (keširane najviše 5 minuta), pa se menjaju vesti, cene i poeni uživo. Kvote i forma se osvežavaju svako jutro, a cene se menjaju oko ponoći po UK vremenu.</p>
<h3>Da li se moji podaci negde čuvaju?</h3>
<p>Samo u ovom pregledaču. Nema naloga; jedini zahtevi idu ka FPL API-ju preko proksija sajta i ka fajlovima sa podacima samog sajta.</p>
<h3>Da li moram da platim ili se prijavim?</h3>
<p>Ne. Besplatan je i nikad ne traži tvoju FPL lozinku.</p>
<h3>Koliko su projekcije tačne?</h3>
<p>To su proseci, ne sigurnost: 5 projektovanih poena lako postane 2 ili 15. Na početku sezone oslanjaju se na FPL ocene, a igrači imaju malo minuta, pa su manje pouzdane, a kasne vesti o sastavu mogu ih iznenaditi. Tačnost Modela na stranici Predikcija Poena pokazuje kako je model prošao.</p>`,
    }
};

// ── Core API ──────────────────────────────────────────────────────────────────

window.LANG = localStorage.getItem('fpl_lang') || 'en';

function t(key) {
    const dict = TRANSLATIONS[window.LANG] || TRANSLATIONS.en;
    return dict[key] !== undefined ? dict[key] : (TRANSLATIONS.en[key] || key);
}

function setLang(lang) {
    window.LANG = lang;
    localStorage.setItem('fpl_lang', lang);
    applyI18n();
    document.documentElement.lang = lang;
    _updateLangButtons();
    // Trigger full re-render if initializeApp is defined (main dashboard)
    if (typeof initializeApp === 'function') {
        // Don't re-init while the guardian/onboarding overlay is visible
        const guard = document.getElementById('fpl-guardian');
        if (guard && !guard.classList.contains('guardian-hidden')) return;
        initializeApp();
        return; // individual loaders are called inside initializeApp
    }
    // Trigger standalone page re-renders
    if (typeof loadPerformance          === 'function')  loadPerformance();
    if (typeof loadTransfers            === 'function')  loadTransfers();
    if (typeof loadTransferSuggestions  === 'function')  loadTransferSuggestions();
    if (typeof loadPredictions          === 'function')  loadPredictions();
    if (typeof loadDatabase             === 'function')  loadDatabase();
    if (typeof loadTeamPage             === 'function')  loadTeamPage();
    if (typeof loadTeam                 === 'function')  loadTeam();
    if (typeof loadPlayerPage  === 'function')  loadPlayerPage();
    if (typeof loadLeague               === 'function')  loadLeague();
    if (typeof loadFixtures             === 'function')  loadFixtures();
    if (typeof loadOptimizer            === 'function')  loadOptimizer();
    if (typeof loadPrices               === 'function')  loadPrices();
    if (typeof loadLineup               === 'function')  loadLineup();
    if (typeof loadNextGW               === 'function')  loadNextGW();
    if (typeof loadLive                 === 'function')  loadLive();
    if (typeof loadGuidePage            === 'function')  loadGuidePage();
}

// Update all elements with [data-i18n] attribute
function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const attr = el.getAttribute('data-i18n-attr');
        const val = t(key);
        if (attr) {
            el.setAttribute(attr, val);
        } else {
            el.textContent = val;
        }
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
}

function _updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('lang-btn--active', btn.dataset.lang === window.LANG);
    });
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.lang = window.LANG;
    applyI18n();
    _updateLangButtons();
});
