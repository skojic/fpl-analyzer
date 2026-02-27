/**
 * kits.js — FPL kit colour picker
 * Applies a data-kit attribute to .football-field containers and persists
 * the choice in localStorage.
 */
(function () {
    const STORAGE_KEY = 'fpl-kit';
    const DEFAULT_KIT = 'purple-white';   // original FPL-branded look

    const KITS = [
        { id: 'red',         label: 'Red',          swatch: '#dc2626',
          bg: '#dc2626', border: '#991b1b', textColor: '#fff' },
        { id: 'black',       label: 'Black',         swatch: '#1a1a1a',
          bg: '#1a1a1a', border: '#000',    textColor: '#fff' },
        { id: 'blue',        label: 'Blue',          swatch: '#1d4ed8',
          bg: '#1d4ed8', border: '#1e3a8a', textColor: '#fff' },
        { id: 'yellow',      label: 'Yellow',        swatch: '#fbbf24',
          bg: '#fbbf24', border: '#d97706', textColor: '#1a1a1a' },
        { id: 'red-white',   label: 'Red & White',   swatch: 'linear-gradient(90deg,#dc2626 50%,#fff 50%)',
          stripe: ['#dc2626','#ffffff'], border: '#991b1b', textColor: '#991b1b' },
        { id: 'black-white', label: 'Black & White', swatch: 'linear-gradient(90deg,#1a1a1a 50%,#fff 50%)',
          stripe: ['#1a1a1a','#ffffff'], border: '#000',    textColor: '#000' },
        { id: 'blue-white',  label: 'Blue & White',  swatch: 'linear-gradient(90deg,#1d4ed8 50%,#fff 50%)',
          stripe: ['#1d4ed8','#ffffff'], border: '#1e3a8a', textColor: '#1e3a8a' },
        { id: 'red-black',   label: 'Red & Black',   swatch: 'linear-gradient(90deg,#dc2626 50%,#1a1a1a 50%)',
          stripe: ['#1a1a1a','#dc2626'], border: '#7f1d1d', textColor: '#fff' },
        { id: 'purple-white', label: 'Purple & White (default)', swatch: 'linear-gradient(90deg,#37003c 50%,#fff 50%)',
          stripe: ['#37003c','#ffffff'], border: '#37003c', textColor: '#37003c' },
    ];

    /* Build the CSS for a kit and inject it into a <style> tag */
    function buildKitCSS() {
        let css = '';
        KITS.forEach(k => {
            const sel = `.football-field[data-kit="${k.id}"]`;
            let bg, num;
            if (k.stripe) {
                const [c1, c2] = k.stripe;
                // Symmetric: lighter(c2) on edges, darker(c1) as the two inner bands
                bg  = `linear-gradient(90deg,
                    ${c2} 0% 15%,
                    ${c1} 15% 38%,
                    ${c2} 38% 62%,
                    ${c1} 62% 85%,
                    ${c2} 85% 100%)`;
                num = k.textColor;
            } else {
                bg  = k.bg;
                num = k.textColor;
            }
            css += `
                ${sel} .player-shirt {
                    background: ${bg} !important;
                    border-color: ${k.border} !important;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.30);
                }
                ${sel} .player-shirt::before {
                    background: transparent !important;
                }
                ${sel} .player-shirt.captain::before {
                    background: rgba(220, 30, 90, 0.44) !important;
                }
                ${sel} .player-shirt.vice-captain::before {
                    background: rgba(0, 210, 100, 0.44) !important;
                }
                ${sel} .player-shirt .shirt-number {
                    color: ${num} !important;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.4);
                }
            `;
        });
        return css;
    }

    /* Inject CSS once */
    const style = document.createElement('style');
    style.id = 'fpl-kit-styles';
    style.textContent = buildKitCSS();
    document.head.appendChild(style);

    /* Read saved kit */
    function getSaved() {
        try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_KIT; }
        catch (e) { return DEFAULT_KIT; }
    }

    /* Apply kit to all field containers present in DOM */
    function applyKit(kitId) {
        document.querySelectorAll('.football-field').forEach(f => {
            f.dataset.kit = kitId;
        });
        // Update picker swatch active state
        document.querySelectorAll('.kit-swatch').forEach(s => {
            s.classList.toggle('kit-swatch-active', s.dataset.kit === kitId);
        });
        try { localStorage.setItem(STORAGE_KEY, kitId); } catch (e) {}
    }

    /* Build the picker HTML string */
    function pickerHTML() {
        const saved = getSaved();
        let html = '<div class="kit-picker" id="kit-picker">';
        html += '<span class="kit-picker-label">Kit:</span>';
        KITS.forEach(k => {
            const active = k.id === saved ? ' kit-swatch-active' : '';
            if (k.stripe) {
                // Two inner spans guarantee a perfect 50/50 split with no gradient artifacts
                html += `<button class="kit-swatch${active}" data-kit="${k.id}"
                        title="${k.label}" aria-label="${k.label}"
                        onclick="window.__kitSelect('${k.id}')">
                    <span class="swatch-l" style="background:${k.stripe[0]}"></span>
                    <span class="swatch-r" style="background:${k.stripe[1]}"></span>
                </button>`;
            } else {
                html += `<button class="kit-swatch${active}" data-kit="${k.id}"
                        title="${k.label}" aria-label="${k.label}"
                        style="background:${k.bg};"
                        onclick="window.__kitSelect('${k.id}')"></button>`;
            }
        });
        html += '</div>';
        return html;
    }

    /* Insert picker before a given football-field element */
    function injectPicker(fieldEl) {
        // Avoid double-inject
        if (fieldEl.previousElementSibling && fieldEl.previousElementSibling.id === 'kit-picker') return;
        const div = document.createElement('div');
        div.innerHTML = pickerHTML();
        fieldEl.parentNode.insertBefore(div.firstElementChild, fieldEl);
        applyKit(getSaved());
    }

    /* Public: call after inserting the field HTML */
    window.__kitSelect = function (kitId) {
        applyKit(kitId);
    };

    window.KitPicker = {
        /**
         * Find all .football-field elements and inject/re-apply kits.
         * Call this after setting innerHTML that contains a .football-field.
         */
        init() {
            document.querySelectorAll('.football-field').forEach(f => {
                injectPicker(f);
            });
        },
        applyKit,
        getSaved,
    };
}());
