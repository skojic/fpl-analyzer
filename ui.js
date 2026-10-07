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
};

if (typeof module !== 'undefined') module.exports = UI;
