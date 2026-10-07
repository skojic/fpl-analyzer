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

    // A player on the pitch: kit, name, points, availability flag and next fixture
    fieldPlayer(player, fixtureMap) {
        const captainClass = player.isCaptain ? 'captain' : (player.isViceCaptain ? 'vice-captain' : '');
        const avail = FPL_API.getAvailability(player);
        const flagHtml = avail
            ? `<div class="player-flag player-flag-${avail.level}" title="${UI.esc(avail.news)}">${avail.isKey ? t(avail.label) : avail.label}</div>`
            : '';
        const points = player.eventPoints || 0;
        const kitSuffix = player.position === 'GKP' ? '_1' : '';
        const kitImg = player.teamCode
            ? `<img class="player-kit-img" src="https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${player.teamCode}${kitSuffix}-66.png" alt="" onerror="this.style.display='none'" referrerpolicy="no-referrer">`
            : '';

        const fixHtml = ((fixtureMap && fixtureMap[player.teamId]) || []).map(f => {
            const badgeImg = f.oppCode ? `<img class="fp-badge" src="https://resources.premierleague.com/premierleague/badges/50/t${f.oppCode}.png" alt="" onerror="this.style.display='none'">` : '';
            return `<span class="fp-fix fp-fdr-${f.diff} ${f.isHome ? 'fp-ha-home' : 'fp-ha-away'}" title="${f.isHome ? 'Home' : 'Away'} vs ${f.opp}">${badgeImg}<span class="fp-opp">${f.opp}</span><span class="fp-ha">${f.isHome ? 'H' : 'A'}</span></span>`;
        }).join('');

        return `
            <div class="field-player player-clickable" onclick="UI.go('player.html?id=${player.id}')" title="View ${player.name} profile">
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
};

// ── App navigation: tabs on top (bottom bar on phones), sub-pages as pills, same-tab links ──
UI.TABS = [
    { key: 'home', icon: '🏠', label: 'navHome', pages: [['index.html', 'navHome']] },
    { key: 'team', icon: '⚽', label: 'navTeam', pages: [['team.html', 'cardMyTeam'], ['prediction.html', 'cardPrediction']] },
    { key: 'transfers', icon: '🔄', label: 'navTransfers', pages: [['transfers.html', 'cardTransfers'], ['optimizer.html', 'cardOptimizer']] },
    { key: 'league', icon: '🏆', label: 'navLeague', pages: [['league.html', 'cardLeague'], ['live.html', 'cardLive'], ['performance.html', 'cardPerformance']] },
    { key: 'players', icon: '🗂️', label: 'navPlayers', pages: [['database.html', 'cardDatabase'], ['comparison.html', 'cardComparison'], ['prices.html', 'cardPrices'], ['player.html', null]] },
    { key: 'fixtures', icon: '📅', label: 'navFixtures', pages: [['fixtures.html', 'cardFixtures']] }
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
                <span class="app-nav-icon" aria-hidden="true">${tab.icon}</span><span class="app-nav-label" data-i18n="${tab.label}">${t(tab.label)}</span></a>`).join('')}
        </div>
        <button class="app-nav-guide" type="button" onclick="UI.openGuide()" aria-label="${t('navGuide')}">
            <span aria-hidden="true">?</span><span class="app-nav-label" data-i18n="navGuide">${t('navGuide')}</span>
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
    document.querySelectorAll('.ui-info[aria-expanded="true"]').forEach(el => el.setAttribute('aria-expanded', 'false'));
};

UI.toggleInfo = function (button, key) {
    const open = button.getAttribute('aria-expanded') === 'true';
    UI.closeInfo();
    if (open) return;
    const pop = document.createElement('div');
    pop.className = 'ui-popover';
    pop.setAttribute('role', 'dialog');
    pop.innerHTML = UI.guideText(key);
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
