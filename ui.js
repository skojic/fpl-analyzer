// Shared UI helpers for every page: number formatting, escaping, small widgets and the pitch player.
// Loaded before the page scripts; uses FPL_API and t() only when called.

// Number formatting that never shows NaN (used throughout the pages)
function safeNumber(value, decimals = 0, defaultValue = 0) {
    const num = parseFloat(value);
    if (isNaN(num)) {
        return decimals > 0 ? defaultValue.toFixed(decimals) : defaultValue;
    }
    return decimals > 0 ? num.toFixed(decimals) : Math.round(num);
}

const UI = {
    // Team, manager and league names are free text set by FPL users
    esc(text) {
        return String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    // +1.2 / −1.2 coloured by sign
    signed(value, decimals = 1, { colour = true } = {}) {
        const v = parseFloat(value) || 0;
        const text = `${v > 0 ? '+' : v < 0 ? '−' : ''}${safeNumber(Math.abs(v), decimals)}`;
        return colour && v !== 0 ? `<span class="${v > 0 ? 'ui-up' : 'ui-down'}">${text}</span>` : text;
    },

    // +£0.1m / −£0.1m from tenths of a million
    money(tenths) {
        if (!tenths) return '–';
        return `<span class="${tenths > 0 ? 'ui-up' : 'ui-down'}">${tenths > 0 ? '+' : '−'}£${safeNumber(Math.abs(tenths) / 10, 1)}m</span>`;
    },

    // Bar from -100% to +100% with the value next to it
    progress(percent) {
        const p = Math.max(-100, Math.min(100, percent));
        const bar = p >= 0 ? `<span class="up" style="width:${p / 2}%;"></span>` : `<span class="down" style="width:${-p / 2}%;"></span>`;
        return `<span class="ui-progress">${bar}</span><span class="${p >= 0 ? 'ui-up' : 'ui-down'}">${p > 0 ? '+' : ''}${safeNumber(percent, 0)}%</span>`;
    },

    // Row of stat tiles: [[value, label], ...]
    stats(tiles) {
        return `<div class="stats-grid ui-stats">${tiles.map(([value, label]) =>
            `<div class="stat-card"><div class="stat-card-value">${value}</div><div class="stat-card-label">${label}</div></div>`).join('')}</div>`;
    },

    // One list line: title and detail on the left, a value on the right ('up' / 'down' colours it)
    row({ title, meta = '', value = '', label = '', tone = '', href = null }) {
        const link = href ? ` row-link" role="link" tabindex="0" onclick="UI.go('${href}')" onkeydown="if(event.key==='Enter')UI.go('${href}')` : '';
        return `<div class="player-row${link}">
            <div class="player-info"><div class="player-name">${title}</div>${meta ? `<div class="player-meta">${meta}</div>` : ''}</div>
            ${value !== '' ? `<div class="player-stats"><div class="stat"><div class="stat-value${tone ? ` ui-${tone}` : ''}">${value}</div>${label ? `<div class="stat-label">${label}</div>` : ''}</div></div>` : ''}
        </div>`;
    },

    // "today 05:53" / "7 Oct 05:53" in the current language
    when(date) {
        if (!date) return '';
        const d = new Date(date);
        const locale = window.LANG === 'sr' ? 'sr-Latn' : 'en-GB';
        const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        return d.toDateString() === new Date().toDateString()
            ? `${t('ftToday')} ${time}`
            : `${d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} ${time}`;
    },

    // Where a card's numbers come from and how fresh they are
    footer(parts) {
        const text = parts.filter(Boolean).join(' · ');
        return text ? `<div class="card-footer">${text}</div>` : '';
    },

    // Freshness of the projection inputs (recent form and bookmaker odds), for cards built on projections
    projectionSources() {
        const info = (typeof Predictor !== 'undefined' && Predictor.dataInfo) || {};
        return [
            `${t('ftFpl')} ${UI.when(new Date())}`,
            info.form ? `${t('ftForm')} ${UI.when(info.form)}` : '',
            info.odds ? `${t('ftOdds')} ${UI.when(info.odds.generated)}` : ''
        ];
    },

    // Placeholder while a card or page loads
    skeleton(lines = 3) {
        return `<div class="ui-skeleton" aria-busy="true"><span class="sr-only">${t('loadingText')}</span>${'<i></i>'.repeat(lines)}</div>`;
    },

    // Empty or error message; errors offer a retry
    state(kind, message) {
        const icon = kind === 'error' ? '!' : 'i';
        const retry = kind === 'error' ? ` <button class="ui-chip" type="button" onclick="location.reload()">${t('retry')}</button>` : '';
        return `<div class="ui-state ui-state-${kind}" role="${kind === 'error' ? 'alert' : 'status'}"><span class="ui-state-icon" aria-hidden="true">${icon}</span><div>${message}${retry}</div></div>`;
    },

    // "≈ 1,234,567" / "1,234,567" with a coloured arrow for the change since the last gameweek
    rankText(info) {
        if (!info || !info.rank) return '–';
        const move = info.before ? info.before - info.rank : 0;
        const arrow = move > 0 ? ` <span class="ui-up ui-rank-move">▲${move.toLocaleString()}</span>` : move < 0 ? ` <span class="ui-down ui-rank-move">▼${(-move).toLocaleString()}</span>` : '';
        return `${info.official ? '' : '≈ '}${info.rank.toLocaleString()}${arrow}`;
    },

    // Banner for upcoming blank / double gameweeks and postponed matches (empty when there are none)
    gameweekAlert(special, { link = true } = {}) {
        if (!special || (!special.weeks.length && !special.postponed.length)) return '';
        const yours = names => (names.length ? ` — ${t('alertYours').replace('{n}', names.length)}: ${names.map(UI.esc).join(', ')}` : '');
        const lines = special.weeks.flatMap(w => [
            w.doubleTeams.length ? `<li><strong>GW${w.gameweek} ${t('alertDouble')}</strong>: ${w.doubleTeams.join(', ')}${yours(w.yourDouble)}</li>` : '',
            w.blankTeams.length ? `<li><strong>GW${w.gameweek} ${t('alertBlank')}</strong>: ${w.blankTeams.join(', ')}${yours(w.yourBlank)}</li>` : ''
        ]).filter(Boolean);
        if (special.postponed.length) lines.push(`<li>${t('alertPostponed').replace('{n}', special.postponed.length)}: ${special.postponed.join(', ')}</li>`);
        return `<div class="ui-alert" role="status">${UI.icon('calendar')}<div><strong>${t('alertTitle')}</strong><ul>${lines.join('')}</ul>
            ${link ? `<a href="fixtures.html">${t('cardFixtures')} →</a>` : ''}</div></div>`;
    },

    // Small heading inside a card
    subtitle(text) {
        return `<h4 class="card-subtitle">${text}</h4>`;
    },

    // Next fixture per team for the pitch: teamId -> [{ opp, oppCode, isHome, diff }]
    nextFixtureMap(bootstrap, fixtures) {
        const map = {};
        bootstrap.teams.forEach(team => {
            const upcoming = FPL_API.getUpcomingFixtures(team.id, fixtures, 1);
            map[team.id] = upcoming.map(f => {
                const isHome = f.team_h === team.id;
                const opp = bootstrap.teams.find(tm => tm.id === (isHome ? f.team_a : f.team_h));
                return { opp: opp ? opp.short_name : '?', oppCode: opp ? opp.code : null, isHome, diff: isHome ? f.team_h_difficulty : f.team_a_difficulty };
            });
        });
        return map;
    },

    // A pitch: starting XI in lines (GKP at the top, FWD at the bottom) and the bench in order.
    // `label(player)` is the text under the name (points by default).
    pitch(xi, bench, fixtureMap, { label = null } = {}) {
        const line = pos => {
            const players = xi.filter(p => p.position === pos);
            return players.length ? `<div class="field-line">${players.map(p => UI.fieldPlayer(p, fixtureMap, label)).join('')}</div>` : '';
        };
        return `<div class="football-field">${['GKP', 'DEF', 'MID', 'FWD'].map(line).join('')}
            ${bench.length ? `<div class="bench-section"><div class="bench-title">${t('substitutes')}</div><div class="bench-players">
                ${bench.map(p => `<div class="bench-player">${UI.fieldPlayer(p, fixtureMap, label)}</div>`).join('')}
            </div></div>` : ''}
        </div>`;
    },

    // A player on the pitch: kit, name, points, availability flag and next fixture
    fieldPlayer(player, fixtureMap, label = null) {
        const captainClass = player.isCaptain ? 'captain' : (player.isViceCaptain ? 'vice-captain' : '');
        const avail = FPL_API.getAvailability(player);
        const flagHtml = avail
            ? `<div class="player-flag player-flag-${avail.level}" title="${UI.esc(avail.news)}">${avail.isKey ? t(avail.label) : avail.label}</div>`
            : '';
        const points = player.eventPoints || 0;
        const labelText = label ? label(player) : `${points} pts`;
        const kitSuffix = player.position === 'GKP' ? '_1' : '';
        const kitImg = player.teamCode
            ? `<img class="player-kit-img" src="https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${player.teamCode}${kitSuffix}-66.png" alt="" onerror="this.style.display='none'" referrerpolicy="no-referrer">`
            : '';

        const fixHtml = ((fixtureMap && fixtureMap[player.teamId]) || []).map(f => {
            const badgeImg = f.oppCode ? `<img class="fp-badge" src="https://resources.premierleague.com/premierleague/badges/50/t${f.oppCode}.png" alt="" onerror="this.style.display='none'">` : '';
            return `<span class="fp-fix fp-fdr-${f.diff} ${f.isHome ? 'fp-ha-home' : 'fp-ha-away'}" title="${f.isHome ? 'Home' : 'Away'} vs ${f.opp}">${badgeImg}<span class="fp-opp">${f.opp}</span><span class="fp-ha">${f.isHome ? 'H' : 'A'}</span></span>`;
        }).join('');

        return `
            <div class="field-player player-clickable" role="link" tabindex="0" aria-label="${UI.esc(player.name)}, ${UI.esc(labelText)}"
                 onclick="UI.go('player.html?id=${player.id}')" onkeydown="if(event.key==='Enter')UI.go('player.html?id=${player.id}')" title="View ${player.name} profile">
                <div class="player-shirt-box${avail ? ` flag-${avail.level}` : ''}">
                    <div class="player-shirt ${captainClass}">${kitImg}</div>
                    <div class="player-name-field">${player.name}</div>
                    <div class="player-points-field">${labelText}</div>
                    ${flagHtml}
                </div>
                <div class="player-fixtures-row">${fixHtml}</div>
            </div>
        `;
    }
};

// ── Icons: simple line icons drawn for this app (24×24, stroke = current text colour) ──
UI.ICONS = {
    home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    shirt: '<path d="M8 3L3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z"/>',
    transfers: '<path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
    players: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14a5 5 0 0 1 4.5 5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    plan: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>',
    live: '<circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    chips: '<path d="M11 3l1.8 4.7 4.7 1.8-4.7 1.8L11 16l-1.8-4.7L4.5 9.5l4.7-1.8zM18 14l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>',
    prices: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    guide: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17.2v.1"/>'
};

UI.icon = function (name) {
    return `<svg class="ui-icon" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
};

// Sprite with every icon, added once per page
UI.addIconSprite = function () {
    if (document.getElementById('ui-icons')) return;
    const sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    sprite.id = 'ui-icons';
    sprite.setAttribute('aria-hidden', 'true');
    sprite.style.display = 'none';
    sprite.innerHTML = Object.entries(UI.ICONS).map(([name, body]) =>
        `<symbol id="i-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</symbol>`).join('');
    document.body.insertBefore(sprite, document.body.firstChild);
};

// ── App navigation: tabs on top (bottom bar on phones), sub-pages as pills, same-tab links ──
UI.TABS = [
    { key: 'home', icon: 'home', label: 'navHome', pages: [['index.html', 'navHome']] },
    { key: 'team', icon: 'shirt', label: 'navTeam', pages: [['team.html', 'cardMyTeam'], ['lineup.html', 'cardLineup'], ['prediction.html', 'cardPrediction']] },
    { key: 'transfers', icon: 'transfers', label: 'navTransfers', pages: [['transfers.html', 'cardTransfers'], ['optimizer.html', 'cardOptimizer']] },
    { key: 'league', icon: 'trophy', label: 'navLeague', pages: [['league.html', 'cardLeague'], ['live.html', 'cardLive'], ['performance.html', 'cardPerformance']] },
    { key: 'players', icon: 'players', label: 'navPlayers', pages: [['database.html', 'cardDatabase'], ['comparison.html', 'cardComparison'], ['prices.html', 'cardPrices'], ['player.html', null]] },
    { key: 'fixtures', icon: 'calendar', label: 'navFixtures', pages: [['fixtures.html', 'cardFixtures']] }
];

UI.currentPage = function () {
    const file = (typeof location !== 'undefined' ? location.pathname.split('/').pop() : '') || 'index.html';
    return file.endsWith('.html') ? file : 'index.html';
};

UI.renderNav = function () {
    if (document.querySelector('.app-nav')) return;
    const page = UI.currentPage();
    const active = UI.TABS.find(tab => tab.pages.some(([file]) => file === page)) || UI.TABS[0];

    const nav = document.createElement('nav');
    nav.className = 'app-nav';
    nav.setAttribute('aria-label', 'Main');
    nav.innerHTML = `
        <a class="app-nav-brand" href="index.html">FPL Analyzer</a>
        <div class="app-nav-tabs">
            ${UI.TABS.map(tab => `<a class="app-nav-tab${tab === active ? ' active' : ''}" href="${tab.pages[0][0]}"${tab === active ? ' aria-current="page"' : ''}>
                <span class="app-nav-icon">${UI.icon(tab.icon)}</span><span class="app-nav-label" data-i18n="${tab.label}">${t(tab.label)}</span></a>`).join('')}
        </div>
        <button class="app-nav-guide" type="button" onclick="UI.openGuide()" aria-label="${t('navGuide')}">
            ${UI.icon('guide')}<span class="app-nav-label" data-i18n="navGuide">${t('navGuide')}</span>
        </button>`;
    document.body.insertBefore(nav, document.body.firstChild);
    document.body.classList.add('has-app-nav');

    // Under the page header: sub-pages of the active tab and "How this page works"
    const subPages = active.pages.filter(([, label]) => label);
    const guide = UI.GUIDE.find(([, , file]) => file === page);
    const header = document.querySelector('.container > header');
    if (header && (subPages.length > 1 || guide)) {
        const sub = document.createElement('div');
        sub.className = 'app-subnav';
        sub.innerHTML = (subPages.length > 1 ? subPages.map(([file, label]) =>
            `<a class="ui-chip${file === page ? ' on' : ''}" href="${file}"${file === page ? ' aria-current="page"' : ''} data-i18n="${label}">${t(label)}</a>`).join('') : '')
            + (guide ? `<button class="ui-chip app-subnav-info" type="button" aria-expanded="false" onclick="event.stopPropagation(); UI.toggleInfo(this, '${guide[0]}')">
                <span class="ui-info" aria-hidden="true">i</span> <span data-i18n="guideHowPage">${t('guideHowPage')}</span></button>` : '');
        header.insertAdjacentElement('afterend', sub);
    }
};

// ── Guide: what each card / page shows and how it works ─────────────────────
// key -> [title key, page]; texts are guide_<key>_what / guide_<key>_how in lang.js
UI.GUIDE = [
    ['live', 'cardLive', 'live.html'],
    ['team', 'cardMyTeam', 'team.html'],
    ['lineup', 'cardLineup', 'lineup.html'],
    ['prediction', 'cardPrediction', 'prediction.html'],
    ['transfers', 'cardTransfers', 'transfers.html'],
    ['optimizer', 'cardOptimizer', 'optimizer.html'],
    ['league', 'cardLeague', 'league.html'],
    ['performance', 'cardPerformance', 'performance.html'],
    ['prices', 'cardPrices', 'prices.html'],
    ['fixtures', 'cardFixtures', 'fixtures.html'],
    ['database', 'cardDatabase', 'database.html'],
    ['comparison', 'cardComparison', 'comparison.html'],
    ['player', 'guidePlayerTitle', 'player.html']
];

UI.guideText = function (key) {
    return `<p><strong>${t('guideWhat')}:</strong> ${t(`guide_${key}_what`)}</p><p><strong>${t('guideHow')}:</strong> ${t(`guide_${key}_how`)}</p>`;
};

// ⓘ button that opens a short explanation next to it
UI.infoButton = function (key) {
    return `<button class="ui-info" type="button" aria-label="${t('guideHow')}" aria-expanded="false" onclick="event.stopPropagation(); UI.toggleInfo(this, '${key}')">i</button>`;
};

UI.closeInfo = function () {
    document.querySelectorAll('.ui-popover').forEach(el => el.remove());
    document.querySelectorAll('[aria-expanded="true"]').forEach(el => {
        if (el.matches('.ui-info, .ui-term, .app-subnav-info')) el.setAttribute('aria-expanded', 'false');
    });
};

UI.toggleInfo = function (button, key) {
    UI.popover(button, UI.guideText(key));
};

// Glossary terms: key -> lang keys gl_<key>_term / gl_<key>_def
UI.GLOSSARY = ['xpts', 'xg', 'xgc', 'eo', 'swing', 'multiplier', 'fdr', 'bps', 'defcon', 'ft', 'hit', 'sell', 'blank'];

UI.termText = function (key) {
    return `<p><strong>${t(`gl_${key}_term`)}</strong>: ${t(`gl_${key}_def`)}</p>`;
};

// A term (e.g. a table header) that explains itself when tapped
UI.term = function (key, label = null) {
    return `<button class="ui-term" type="button" aria-expanded="false" onclick="event.stopPropagation(); UI.toggleTerm(this, '${key}')">${label || t(`gl_${key}_term`)}</button>`;
};

UI.toggleTerm = function (button, key) {
    UI.popover(button, UI.termText(key));
};

// Popover anchored under a button; a second click on the same button closes it
UI.popover = function (button, html) {
    const open = button.getAttribute('aria-expanded') === 'true';
    UI.closeInfo();
    if (open) return;
    const pop = document.createElement('div');
    pop.className = 'ui-popover';
    pop.setAttribute('role', 'dialog');
    pop.innerHTML = html;
    document.body.appendChild(pop);
    const r = button.getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - 24);
    pop.style.width = `${width}px`;
    pop.style.left = `${Math.max(12, Math.min(window.innerWidth - width - 12, r.left + r.width / 2 - width / 2)) + window.scrollX}px`;
    pop.style.top = `${r.bottom + 8 + window.scrollY}px`;
    button.setAttribute('aria-expanded', 'true');
};

// The whole guide in one dialog, opened from the navigation bar
UI.openGuide = function () {
    UI.closeInfo();
    let overlay = document.getElementById('ui-guide');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'ui-guide';
    overlay.className = 'ui-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `<div class="ui-modal-box">
            <div class="ui-modal-head"><h2>${t('guideTitle')}</h2>
                <button class="ui-modal-close" type="button" onclick="UI.closeGuide()" aria-label="${t('guideClose')}">×</button></div>
            <p class="ui-meta">${t('guideIntro')}</p>
            ${UI.GUIDE.map(([key, title, page]) => `<section class="ui-guide-item">
                <h3>${t(title)}${page !== 'player.html' ? ` <a href="${page}">${t('guideOpen')} →</a>` : ''}</h3>
                ${UI.guideText(key)}
            </section>`).join('')}
            <section class="ui-guide-item"><h3>${t('glossaryTitle')}</h3>
                ${UI.GLOSSARY.map(key => UI.termText(key)).join('')}
            </section>
        </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) UI.closeGuide(); });
    document.body.appendChild(overlay);
    overlay.querySelector('.ui-modal-close').focus();
};

UI.closeGuide = function () {
    const overlay = document.getElementById('ui-guide');
    if (overlay) overlay.remove();
};


// Same-tab navigation (the browser's Back button keeps working)
UI.go = function (href) {
    location.href = href;
};

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        UI.addIconSprite();
        UI.renderNav();
    });
    document.addEventListener('click', e => { if (!e.target.closest('.ui-popover')) UI.closeInfo(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            UI.closeInfo();
            UI.closeGuide();
        }
    });
}

if (typeof module !== 'undefined') module.exports = UI;
