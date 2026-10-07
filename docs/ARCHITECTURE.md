# Architecture

A developer's overview of FPL Analyzer. For features and usage see the [README](../README.md); for hosting see [VERCEL_SETUP.md](../VERCEL_SETUP.md).

## Overview

A static multi-page site in plain JavaScript: no framework, no bundler, no build step. Every page is an HTML file that loads shared scripts with `<script>` tags. Two small Vercel functions sit next to the pages. A daily GitHub Actions job pre-computes the data that is too heavy to fetch in a browser.

```
                    ┌──────────────────────────── browser ────────────────────────────┐
  index.html,       │  theme.js → lang.js → ui.js          (head: theme, t(), nav)     │
  team.html, ...    │  styles.css + components.css         (tokens, shared components) │
  (one per page)    │  fpl-api.js → prediction.js → league.js / live.js → page script  │
                    └───────────────┬───────────────────────────────┬─────────────────┘
                                    │ /api/proxy?url=...            │ data/*.json (static)
                                    ▼                               │
                    Vercel function api/proxy.js ──▶ FPL API        │
                    Vercel function api/rank.js  ──▶ FPL API        │
                                                                    │
  GitHub Actions (daily 05:30 UTC, .github/workflows/data.yml)      │
    scripts/build-data.js ─┐                                        │
    scripts/build-odds.js ─┼─▶ data/*.json ─▶ commit to main ─▶ Vercel redeploy
    scripts/backtest.js  ──┘        ▲
                                    └── The Odds API (build-odds.js only)
```

The same modules (`fpl-api.js`, `prediction.js`, `live.js`) run in the browser and in Node, where scripts, tests and `api/rank.js` use them. Each one ends with `if (typeof module !== 'undefined') module.exports = ...`. Node code sets `global.FPL_API = require('../fpl-api.js')` before requiring the modules that depend on it.

## Modules

| File | Responsibility |
|---|---|
| `fpl-api.js` | `FPL_API`: the FPL client. `fetchWithRetry` retries network errors, 429 and 5xx. `buildUrl` routes browser requests through `/api/proxy`; Node calls the API directly and falls back to `FPL_PROXY`. Keeps an in-memory cache per page load (`cache`, `resetCache`). `TEAM_ID` is a getter: in the browser it reads `localStorage.fpl_team_id` (no fallback team, `null` when unset); in Node it reads `FPL_TEAM_ID` or a sample team. `verifyTeamId` / `setTeamId` check and save a new ID. It also stores the per-team plan preferences (`fpl_plan_prefs_<id>`: locked / banned) and the manually entered transfers (`fpl_manual_transfers_<id>`), and formats players (`formatPlayer`, `getAllPlayers`, `getTeamComposition`). |
| `prediction.js` | `Predictor`: the model and everything built on it. `SCORING_RULES`, model constants (`HORIZON`, `DECAY`, `ODDS_WEIGHT`, `MARKET_WEIGHT`, ...), loading of `data/odds.json`, `data/recent-form.json` and `data/model-settings.json`, `buildContext`, `fitMarketRatings`, `projectPlayerSync`, `bestLineup` / `squadValue`, `getTransferState`, `getTransferPlan`, `planTransfers`, `optimizeSquad` / `getSquadReport`, `getChipCalendar`, `suggestLineup`, `getMatchPredictions`, `getFixtureTicker`, `getSpecialGameweeks`. |
| `league.js` | `League`: your classic leagues (`getMyLeagues`), rivals' picks and effective ownership (`analyze`), the overall top 1,000 from `data/ownership.json` (`analyzeTop`), and rows with projected swing (`buildRows`). |
| `live.js` | `Live`: provisional bonus from BPS, live scoring with automatic substitutions and vice-captain cover (`scorePicks`), live league tables, and the overall rank estimate. The estimate is split into a heavy server part (`buildRankSample`, used by `api/rank.js`) and a light browser part (`estimateRank`, `overallRank`). |
| `ui.js` | `UI`: formatting and escaping (`esc`, `signed`, `money`, `when`), widgets (`stats`, `row`, `state`, `skeleton`, `footer`, `gameweekAlert`, `favourite`, `manualNote`), the pitch player, the icon sprite, navigation (`UI.TABS`, `renderNav`), the guide (`UI.GUIDE`, `openGuide`, `infoButton`) and the glossary (`UI.GLOSSARY`, `term`). It also redirects pages other than Home to `index.html` when no team ID is saved. |
| `lang.js` | `TRANSLATIONS.en` / `TRANSLATIONS.sr`, `t(key)` (falls back to English, then to the key), `applyI18n()` for `data-i18n` / `data-i18n-html` / `data-i18n-attr`, and `setLang()`. |
| `theme.js` | Applies the light / dark theme (`data-theme` on `<html>`) before first paint, following the system setting until the user toggles. Exposes `toggleTheme()`. |
| `app.js` | The Home page: `initializeApp()` and the eight card loaders (`loadLiveCard`, `loadMyTeam`, `loadPredictions`, ...). |
| `api/proxy.js` | Only `GET` and only `https://fantasy.premierleague.com/api/...`. Sets `Cache-Control` to 300 s (60 s for live points and per-gameweek fixtures) with `stale-while-revalidate`. |
| `api/rank.js` | Runs `Live.buildRankSample` with a fresh cache; CDN-cached for 10 minutes. |
| `scripts/build-data.js` | Writes `data/recent-form.json` and `data/ownership.json`, rewriting a file only when its content changes. |
| `scripts/build-odds.js` | Fetches The Odds API (h2h + totals, UK region), maps events to FPL fixtures, converts the odds to expected goals, writes `data/odds.json` and updates `data/odds-history.json`. Skips when `ODDS_API_KEY` is missing. |
| `scripts/backtest.js` | Rebuilds each finished gameweek from earlier match history and scores the model against points-per-game and form baselines. It also calibrates the odds weights on saved odds and writes `data/accuracy.json` and `data/model-settings.json`. |
| `scripts/contrast.js` | Reads the tokens in `styles.css` and checks WCAG AA contrast pairs in both themes. It is also used by `npm test`. |
| `scripts/check-odds-markets.js` | One-off check for anytime-goalscorer odds (about 2 credits); reports findings as GitHub annotations. |


## Data files

All files are written by the daily job and read by the pages with `fetch(..., { cache: 'no-cache' })`. Node code reads them from disk.

| File | Shape (brief) | Used by |
|---|---|---|
| `data/recent-form.json` | `{ generated, lastFinishedEvent, players: { <id>: { pStart, p60, minutesPerMatch } } }`, the last 5 matches per player | Minutes model. Used only if `lastFinishedEvent` equals the latest finished gameweek; otherwise players are fetched one by one (`loadRecentHistory`) |
| `data/ownership.json` | `{ generated, gameweek, sample, chips: { freehit, 3xc, wildcard, bboost }, players: { <id>: { eo, owned, captained } } }` | League page "overall top 1,000" |
| `data/odds.json` | `{ generated, source, fixtures: { <fixtureId>: { event, home, away, goalsHome, goalsAway, pHome, pDraw, pAway, pOver25, bookmakers } } }` | Model blend, bookmaker team ratings, Next Gameweek favourite. Ignored when older than 4 days |
| `data/odds-history.json` | `{ generated, fixtures: { <fixtureId>: { ...as odds.json, kickoff, takenAt } } }`, the last pre-kickoff odds per match | Backtest odds calibration |
| `data/accuracy.json` | `{ generated, note, overall: { model, baselinePPG, baselineForm, top10Actual }, gameweeks: [...], oddsCalibration: { odds, market } }`; metrics are `n, mae, rmse, corr, bias` | Predictions page |
| `data/model-settings.json` | `{ generated, oddsWeight, marketWeight, measuredGameweeks: { odds, market }, minGameweeks }` | `Predictor.loadSettings`: each weight replaces the default once its measured gameweeks reach `minGameweeks` (2) |

## Model pipeline

```
getContext(length = 5)
  ├─ FPL_API.getBootstrapStatic(), getFixtures()
  ├─ loadOdds()          data/odds.json
  ├─ loadSettings()      data/model-settings.json  → ODDS_WEIGHT / MARKET_WEIGHT
  ├─ loadPublishedForm() data/recent-form.json     → recentForm
  └─ buildContext()      horizon, fixtures per team per gameweek (blank = none, double = two),
                         team attack / defence (xG blended with FPL strength), position rates,
                         odds, market = fitMarketRatings(odds)
        │
        ▼
projectPlayerSync(player, ctx)
  getMinutesProfile → getAvailabilityForGW → calculateFixturePoints (uses fixtureGoals: odds blend,
  or ratings moved towards market) → perGW[], weighted (0.9 decay), fixtures[]
        │
        ▼
bestLineup(projections, k)   best valid XI + captain for gameweek k
squadValue(projections, ctx) sum over the horizon with decay
        │
        ├─ getTransferState   squad after FPL-published and manually entered transfers, bank,
        │                     selling prices, free transfers
        ├─ suggestLineup      next gameweek XI, captain, vice, bench order, changes
        ├─ getTransferPlan    best single transfers
        ├─ planTransfers      5-week beam search with locks / bans / hits
        ├─ getSquadReport     optimizer: rating, Wildcard, Free Hit
        ├─ getChipCalendar    Bench Boost / Triple Captain / Free Hit per week
        └─ getMatchPredictions, getFixtureTicker, getSpecialGameweeks
```

Contexts are cached per horizon length in `Predictor.contexts` for the page load. `getMatchPredictions` builds a separate model-only context (no odds) so it can be shown next to the bookmakers' numbers. The backtest calls `buildContext` with a past `nextEventId` and rebuilt bootstrap data, so it runs exactly the same code as the app.

## Caching layers

1. **Vercel CDN and browser HTTP cache**: proxy responses for 300 s (60 s for live data); `/api/rank` for 600 s on the CDN.
2. **In-memory, per page load**: `FPL_API.cache` (bootstrap, team, fixtures, history, transfers, player details, leagues, picks), `Predictor.contexts`, `Predictor.recentForm`, and single-flight promises for odds and settings. Live points and per-gameweek fixtures are deliberately not cached in memory.
3. **Pre-computed files**: `data/*.json`, rebuilt once a day and committed only on change.
4. **localStorage**: user state only (team ID, language, theme, plan preferences and manual transfers per team), never API data.

## Translations

- Every user-visible string lives in `lang.js` under the same key in **both** `en` and `sr`. Add or change both together. Keys missing from `sr` fall back to English, which shows up as untranslated text.
- Static HTML uses `data-i18n="key"` (text), `data-i18n-html="key"` (markup) and `data-i18n-attr="placeholder"` (attributes). Dynamic HTML calls `t('key')`; placeholders such as `{n}` / `{gw}` are filled with `.replace()`.
- Key prefixes group strings by area: `card*` (page and card titles), `nav*`, `guide_<key>_what` / `guide_<key>_how`, `gl_<key>_term` / `gl_<key>_def`, and page prefixes such as `lu*` (lineup), `nx*` (next gameweek), `mt*` (manual transfers), `pc*` (prices), `fx*` (fixtures), `lv*` (live), `ft*` (card footers).
- `setLang()` re-renders the page by calling its loader (see below).

## Design tokens

- `styles.css` `:root` defines the light-theme tokens: brand colours, surfaces, text, borders, semantic colours (`--positive`, `--negative`, `--warning`, `--highlight`, `--header-bg`), position and availability-flag colours, spacing (`--space-1`…`--space-6`), radii and font sizes (`--fs-*`). `[data-theme="dark"]` overrides them.
- `components.css` builds the shared components (page layout under `body.page`, navigation, sub-navigation, `ui-chip`, `ui-panel`, `ui-alert`, `ui-state`, `ui-skeleton`, popovers, guide dialog, tables) only from those tokens, so they work in both themes without page-specific overrides.
- Use tokens instead of hard-coded colours. After changing a colour, run `node scripts/contrast.js`.

## Adding a page

1. **HTML head**: copy it from an existing page such as `lineup.html`. It includes the manifest and meta tags, `styles.css`, `components.css`, then `theme.js`, `lang.js` and `ui.js` in the head. Load `fpl-api.js` (and `prediction.js`, `league.js` or `live.js` as needed) at the end of the body, before the page script.
2. **Body**: `<body class="page">` (add `page-wide` or `page-full` for wider layouts), a `.container` with a `<header>` (title with `data-i18n`, language buttons, theme toggle) and a `.card` > `.card-content` that starts with a skeleton. End with the shared site footer.
3. **Navigation**: add `['newpage.html', 'cardNewPage']` to the right tab's `pages` in `UI.TABS` (`ui.js`). The first page of a tab is its tab link; a `null` label keeps a page in the tab without a sub-nav button (as with `player.html`).
4. **Guide**: add `['newpage', 'cardNewPage', 'newpage.html']` to `UI.GUIDE` and the texts `guide_newpage_what` / `guide_newpage_how` in both languages. This adds "How this page works" under the header and an entry in the Guide dialog. Update `guide.html` too.
5. **Strings**: add `cardNewPage` and every other key to both `en` and `sr` in `lang.js`.
6. **Language switch**: name the page loader `loadNewPage()` and add `if (typeof loadNewPage === 'function') loadNewPage();` to `setLang()` in `lang.js`, so switching language re-renders the page.
7. **Docs and tests**: add the page to the README (features and project structure). If it adds model logic, add a test to `test-api.js`.

## Testing and verification

- **`npm test`** (`test-api.js`): 27 checks that use the real modules against the live FPL API, covering the client, scoring rules, model, transfers, planner, optimizer, chips, lineup, matches, league EO, live bonus / table / rank, odds maths and blending, theme contrast and the proxy handler. Set `FPL_TEAM_ID` to test with a particular team. Some live checks depend on the gameweek state (for example, they need a finished gameweek).
- **`node scripts/contrast.js`**: WCAG AA contrast of the theme tokens in light and dark mode; exits with 1 on failure.
- **`npm run backtest`**: run it after any model change and compare `data/accuracy.json` (MAE, RMSE, correlation, bias, top-10 actual points) with the previous version and the baselines. It also rewrites `data/model-settings.json`. Commit data files only if you mean to override the daily job's output.
- **Manual check**: `npx vercel dev`, then go through the pages in both languages and both themes, on a phone-sized window as well (the navigation becomes a bottom bar).
