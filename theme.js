/**
 * theme.js — FPL Analyser theme manager
 * Runs immediately (before render) to apply saved theme and prevent flash.
 * Exposes window.toggleTheme() for the button onclick handlers.
 */
(function () {
    const STORAGE_KEY = 'fpl-theme';
    const DARK = 'dark';
    const LIGHT = 'light';

    function getSaved() {
        try { return localStorage.getItem(STORAGE_KEY) || LIGHT; }
        catch (e) { return LIGHT; }
    }

    function apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
        updateButton(theme);
    }

    function updateButton(theme) {
        // Button may not be in DOM yet when this runs in <head> — safe to skip
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        if (theme === DARK) {
            btn.textContent = '☀️';
            btn.title = 'Switch to light mode';
            btn.setAttribute('aria-label', 'Switch to light mode');
        } else {
            btn.textContent = '🌙';
            btn.title = 'Switch to dark mode';
            btn.setAttribute('aria-label', 'Switch to dark mode');
        }
    }

    // Apply immediately (suppresses flash of wrong theme)
    apply(getSaved());

    // After DOM is ready, sync the button label (it wasn't in DOM during the
    // initial apply() call above since this script is in <head>)
    document.addEventListener('DOMContentLoaded', function () {
        updateButton(getSaved());
    });

    // Public toggle function called by all toggle buttons
    window.toggleTheme = function () {
        const current = document.documentElement.getAttribute('data-theme') || LIGHT;
        apply(current === DARK ? LIGHT : DARK);
    };
}());
