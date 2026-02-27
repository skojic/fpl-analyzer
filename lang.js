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
        footerHtml:         'Made with <span class="heart">&#x2665;</span> for you by <strong>Srdjan Kojic</strong>',
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
        errorPerf:          'Error loading performance data',
        errorTransfers:     'Error loading transfer suggestions',
        errorPredictions:   'Error calculating predictions',

        /* ── My Team / pitch ── */
        gameweek:           'Gameweek',
        substitutes:        'Substitutes',
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
        gkpOptions:         'GKP Options',
        outfieldOptions:    'Outfield Options',
        sortedByGain:       'Sorted by Expected Pts Gain',
        budget:             'Budget',
        noTransfers:        'No transfer suggestions at this time. Your team looks good!',
        perfectTeam:        '🎉 Perfect Team!',
        perfectTeamDesc:    'No significant transfer improvements found. Your squad is excellently optimized!',
        howCalc:            'How suggestions are calculated',
        howCalcBlock:       `<strong>How suggestions are calculated</strong><br>Each player is scored across two dimensions:<ul style="margin:6px 0 6px 18px; padding:0;"><li><strong>5-GW projected points</strong> — fixture difficulty (FDR 1–5) applied to each of the next 5 gameweeks, adjusted for the player's form, minutes played and starting probability.</li><li><strong>Comprehensive score</strong> — position-weighted blend of: form &amp; points-per-game (40%), expected stats per 90 — xG, xA, xGI, CS rate, saves (30%), BPS &amp; ICT index (20%), bonus points (10%). Multiplied by a minutes reliability factor and start-probability.</li></ul><strong>Expected pts gain</strong> = replacement's 5-GW projection minus your current player's 5-GW projection.<br>Only transfers with a gain of <strong>≥ 1.0 pts</strong> are shown. Candidates must be available (no injury/suspension), within your budget and have a ≥ 75% chance of playing.`,
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
    },

    sr: {
        /* ── App shell ── */
        appTitle:           'FPL Analizator Tima',
        appEyebrow:         'Fantasy Premier Liga',
        analysis:           'Analiza',
        footerText:         'Napravljeno s',
        footerBy:           'za tebe od strane',
        footerHtml:         'Napravio za tebe od <span class="heart">&#x2665;</span> <strong>Srdjan Kojic</strong>',
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
        errorPerf:          'Greška pri učitavanju analitike',
        errorTransfers:     'Greška pri učitavanju transfera',
        errorPredictions:   'Greška pri računanju predikcija',

        /* ── My Team / pitch ── */
        gameweek:           'Kolo',
        substitutes:        'Rezervni',
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
        gkpOptions:         'Opcije za Golmana',
        outfieldOptions:    'Opcije za Igrače',
        sortedByGain:       'Sortirano po očekivanim dobijenim poenima',
        budget:             'Budžet',
        noTransfers:        'Nema predloga transfera. Tvoj tim izgleda odlično!',
        perfectTeam:        '🎉 Savršen Tim!',
        perfectTeamDesc:    'Nisu pronađena poboljšanja. Tvoj tim je odlično optimizovan!',
        howCalc:            'Kako se predlozi računaju',
        howCalcBlock:       `<strong>Kako se izračunavaju predlozi</strong><br>Svaki igrač ocenjuje se u dve dimenzije:<ul style="margin:6px 0 6px 18px; padding:0;"><li><strong>Projektovani poeni za 5 kola</strong> — težina rasporeda (FDR 1–5) za narednih 5 kola, uz korekciju forme, odigranih minuta i verovatnoće startnog nastupa.</li><li><strong>Sveobuhvatni skor</strong> — mešavina ponderisana pozicijom: forma i poeni/utakmica (40%), očekivane statistike per 90 — xG, xA, xGI, stopa CS, odbrane (30%), BPS i ICT indeks (20%), bonus poeni (10%). Pomnoženo faktorom pouzdanosti minuta.</li></ul><strong>Očekivani dobitak poena</strong> = projekcija novog igrača za 5 kola minus projekcija trenutnog igrača za 5 kola.<br>Prikazuju se samo transferi sa dobitkom od <strong>≥ 1,0 poena</strong>. Kandidati moraju biti dostupni (bez povrede/suspenzije), u okviru budžeta i imati ≥ 75% šanse za nastup.`,
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
