// Colour contrast check for the theme tokens in styles.css, in light and dark mode.
// WCAG AA: 4.5:1 for normal text, 3:1 for large / bold text and UI parts.
//
// Usage: node scripts/contrast.js        (exit code 1 when a pair fails)
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

// Custom properties of the first block matching `selector { ... }`
function tokens(selector) {
    const start = css.indexOf(`${selector} {`);
    if (start < 0) throw new Error(`${selector} not found in styles.css`);
    const body = css.slice(start, css.indexOf('\n}', start));
    const out = {};
    for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
    return out;
}

function hex(value) {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value || '');
    if (!m) return null;
    const h = m[1].length === 3 ? m[1].split('').map(c => c + c).join('') : m[1];
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

function luminance(rgb) {
    const [r, g, b] = rgb.map(c => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
    const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
}

// [foreground token or #hex, background token or #hex, minimum ratio, what it is]
const PAIRS = [
    ['text-color', 'card-bg', 4.5, 'body text on cards'],
    ['text-muted', 'card-bg', 4.5, 'muted text on cards'],
    ['text-color', 'bg-surface', 4.5, 'body text on surfaces'],
    ['positive', 'card-bg', 4.5, 'gains (small bold numbers)'],
    ['negative', 'card-bg', 4.5, 'losses (small bold numbers)'],
    ['warning', 'card-bg', 3, 'warnings (bold)'],
    ['#ffffff', 'header-bg', 4.5, 'white text on table headers / nav'],
    ['secondary-color', 'header-bg', 4.5, 'green text on the nav bar'],
    ['on-accent', 'secondary-color', 4.5, 'text on the green buttons']
];

function check() {
    const light = tokens(':root');
    const dark = { ...light, ...tokens('[data-theme="dark"]') };
    const results = [];
    for (const [theme, set] of [['light', light], ['dark', dark]]) {
        for (const [fg, bg, min, what] of PAIRS) {
            const a = hex(fg.startsWith('#') ? fg : set[fg]);
            const b = hex(bg.startsWith('#') ? bg : set[bg]);
            if (!a || !b) {
                results.push({ theme, what, fg, bg, ratio: null, min, ok: false, note: 'not a plain hex colour' });
                continue;
            }
            const r = ratio(a, b);
            results.push({ theme, what, fg, bg, ratio: Math.round(r * 100) / 100, min, ok: r >= min });
        }
    }
    return results;
}

if (require.main === module) {
    const results = check();
    for (const r of results) {
        console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.theme.padEnd(5)} ${String(r.ratio ?? '-').padStart(5)} (min ${r.min})  ${r.what}${r.note ? ` (${r.note})` : ''}`);
    }
    process.exit(results.every(r => r.ok) ? 0 : 1);
}

module.exports = { check, ratio, hex };
