# FPL Analyzer

A Fantasy Premier League assistant for your own team. It reads live data from the official FPL API, projects every player's points for the next five gameweeks, and uses those projections to suggest your lineup, captain, transfers, Wildcard and Free Hit squads and chip weeks. It also tracks your mini-leagues and live gameweek. It is a static site in plain JavaScript with no build step, hosted on Vercel, and runs in English and Serbian.

**Live app:** https://fpl-analyzer-eosin.vercel.app

## Highlights

- **Points projections** for every player over the next 5 gameweeks: minutes, availability, xG/xA, team strength, bookmaker odds and 2026/27 scoring
- **Suggested lineup** with captain, vice-captain and bench order, and a **5-gameweek transfer plan** with locks, bans and −4 hits
- **Squad optimizer**: team rating, Wildcard and Free Hit squads, and a chip calendar
- **Mini-league** effective ownership, threats and differentials, plus the overall top 1,000 for comparison
- **Live gameweek** with provisional bonus, automatic substitutions, a live league table and an overall rank estimate
- **Transfers you've already made** in the FPL app can be entered and are used everywhere until the deadline
- Light and dark themes (WCAG AA contrast), English and Serbian, installable as a home-screen app

## Using the app

### Your team ID

1. On fantasy.premierleague.com, open the **Points** page. Your team ID is the number in the address: `.../entry/1234567/event/5`.
2. Enter it on the first-visit screen. To switch teams later, use **Change ID** in the Home header.
3. The ID is checked against FPL before it is saved, so a mistyped ID is caught straight away.
4. It is saved only in this browser (`localStorage`). There is no account or login. On a new browser or device you enter it again.

Pages other than Home send you to Home if no team ID has been saved yet.

### Finding your way around

- **Six tabs** across the top (a bottom bar on phones): **Home**, **My Team**, **Transfers**, **League**, **Players** and **Fixtures**.
- Tabs with more than one page show their sub-pages as buttons under the page header:

  | Tab | Pages |
  |---|---|
  | Home | Overview of 8 cards |
  | My Team | My Team, Suggested Lineup, Next Gameweek, Predictions |
  | Transfers | Transfer Plan, AI Team & Chips |
  | League | Mini-League, Live Gameweek, Performance |
  | Players | Player Database, Player Comparison, Price Changes (plus a profile page for each player) |
  | Fixtures | Fixture Analyser |

- Links open in the same browser tab, so the Back button works.
- **Guide** in the navigation bar opens a dialog with what every page shows and how it is calculated, plus a glossary (xPts, xG, xGC, EO, swing, multiplier, FDR, BPS, defensive contribution, free transfers, hits, selling price, blanks and doubles). It links to **How it works** (`guide.html`), the full in-app guide, which is also linked from the page footer.
- **ⓘ** on a Home card, or **How this page works** under a page header, shows the same short explanation in place.
- Underlined terms in tables (for example **EO**, **Swing**, **xPts**) show their definition when tapped.
- Each Home card ends with where its numbers come from and when they were last updated (live FPL data, the daily recent-form build, bookmaker odds).
- The header has the language switch (🇬🇧 / 🇷🇸) and the light/dark toggle. The theme follows your system setting until you pick one.

### Transfers I've made

FPL publishes your transfers only after the deadline. Until then the app can't see transfers you've made in the FPL app. You can enter them on the **Transfers** page (player out → player in, checked against your budget and the 3-per-club limit). They are then used everywhere until the deadline: squad, bank, free transfers, transfer plan, suggested lineup, chips and team rating. A note shows on each page where they are included. They are cleared automatically once the deadline passes or FPL publishes your transfers.

## Features

### Home

Eight cards in priority order, each with **Open →** to its full page:

- **Live Gameweek**: live points, live overall rank (an estimate while matches are on), your position in your first league, and your top scorers.
- **My Team**: three views. **Current** is your lineup as set for the last deadline, **Suggested** is the best lineup for the next gameweek, and **Next GW** lists the next gameweek's matches with your players.
- **Captain & Predictions**, **Transfer Plan** (one-line plan and gain over rolling), **Mini-League**, **AI Team & Chips**, **Price Changes** and **Fixture Analyser**.
- A **blank / double gameweek banner** when a team plays twice or not at all in the next 8 gameweeks. It lists your affected players and any matches postponed without a new date.

### My Team

- **My Team**: your squad on a pitch with club shirts, gameweek points, captain and vice-captain badges, the bench, each player's next opponent coloured by difficulty, and FPL's availability flag (yellow 75%, orange 50/25%, red out). Shows team value and bank.
- **Suggested Lineup**: the best valid XI, captain, vice-captain and bench order for the next gameweek from the players you own, including transfers already made for the deadline. The bench follows FPL's automatic substitution order: backup goalkeeper first, then outfield players by projected points. The page lists what to change compared with your current lineup and how many points that gains.
- **Next Gameweek**: every match of the next gameweek with the bookmakers' favourite and its winning chance (average of about 20 bookmakers, margin removed), and your players in each match. Matches without published odds are shown without a favourite.
- **Predictions**: projected points for each of your players, the captain pick, fixture-by-fixture projections over 5 gameweeks and form trends. The model's measured accuracy is shown at the bottom (see [Model accuracy](#model-accuracy)).

### Transfers

- **Transfer Plan**: a 5-gameweek plan. Each week it tries rolling, one transfer or two transfers, pays −4 per transfer beyond your free ones, and keeps the best plans (beam search). Each banked free transfer is credited at about 2 points, so rolling stays an option. You can **lock** players you want to keep and **ban** players you never want to buy; these choices are saved in your browser per team.
- **Best single transfers**: each one is scored by how much it improves your best XI plus captain over the next 5 gameweeks, so replacing a bench player only counts if the new player would start. Uses your real selling prices (you keep half of any rise), bank, the 3-per-club limit, free transfers and transfers already made. Each option gets a verdict (*Make it*, *Worth a −4* or *Marginal: consider rolling*), reasons from the projection (availability, minutes, blanks and doubles) and fixture-by-fixture points for both players.
- **Players to Watch** by position, with a value score (points per million).
- **Transfers I've made** entry (see above).
- **AI Team & Chips**:
  - **Team rating**: your squad's projected points over 5 gameweeks as a share of the best squad the optimizer finds for your budget (bank plus selling prices).
  - **Wildcard** squad for the next 5 gameweeks and **Free Hit** squad for the next one, with the changes from your squad. The optimizer picks the best 15 (2 GKP, 5 DEF, 5 MID, 3 FWD) within budget and the club limit, scored on best XI plus captain each gameweek. It runs a local search with one- and two-player swaps, starting from both the cheapest valid squad and your own.
  - **Chip calendar** to the end of the current chip window (GW19 / GW38). It shows Bench Boost, Triple Captain and Free Hit value per gameweek with your squad, marks blank and double gameweeks, and picks the best week per chip. Chips you've already used are crossed out.

### League

- **Mini-League**: standings of your classic leagues (private ones first; large public leagues use their top 50). **Effective ownership (EO)** among your rivals counts 100% per starting owner and 200% per captain. The page shows **threats** (players your rivals own and you don't), **differentials**, rivals' captains and the league template, each with the projected point swing for the next gameweek. You can compare with the **overall top 1,000** managers instead, whose ownership is sampled once per gameweek by the daily data job.
- **Live Gameweek**: live points with **provisional bonus** from the bonus point system (it matches the confirmed bonus once FPL adds it), **automatic substitutions** once a starter's matches end without him playing, and vice-captain cover. A **live league table** for your classic leagues (first 50 managers) includes hits and chips and shows places gained or lost. The page refreshes every minute while matches are on.
- **Overall rank**: FPL's official rank once the gameweek is processed. While it is live, the rank is estimated from about 30 pages of the overall table and 150 managers' live scores (`/api/rank`, shared by all visitors and refreshed every 10 minutes). Checked against official ranks after a gameweek, the median error was about 1–4%.
- **Performance**: season points, overall rank, transfers and gameweek history, with a chart of each gameweek against your average.

### Players

- **Player Database**: every player with season stats (price, points, form, points per game, ownership, minutes, starts, goals, assists, clean sheets, cards, saves, expected stats and per-90 figures, defensive actions). You can search, filter by position and team, and sort any column; column headers explain themselves.
- **Player Comparison**: up to 3 players side by side with search-as-you-type, stat bars and the best value in each row highlighted.
- **Price Changes**: from FPL's own price predictor. Shows each player's progress towards the next change (±100% means the price moves), now and for tonight's change window. Includes your squad with selling prices, the likeliest risers and fallers, and this gameweek's changes.
- **Player profile** (`player.html?id=...`): season totals and per-90 figures, availability and news, upcoming fixtures and points per gameweek.

### Fixtures

- **Fixture Analyser**: the next 8 gameweeks for every team, coloured by the model's expected goals (attack), clean-sheet chance (defence) or FPL difficulty. Sort by the next 3, 5 or 8 gameweeks. Blank and double gameweeks are shown, and matches with bookmaker odds are marked •.

### Model accuracy

`scripts/backtest.js` rebuilds each finished gameweek from the matches played before it, projects it with the real model, and compares the projection with the points actually scored. Two baselines are used for comparison: points per game and recent form. The daily job publishes the results in `data/accuracy.json`, and the Predictions page shows them.

## How predictions work

The model lives in `prediction.js`. Projections cover the next 5 gameweeks from the next deadline. A blank gameweek scores 0 and a double gameweek counts both matches.

1. **Minutes**: chance of starting, of a substitute appearance and of 60+ minutes. It comes from starts and minutes per team match this season, blended with the last 5 matches (60% weight on the recent ones; the daily job publishes these for every player in `data/recent-form.json`).
2. **Availability**: FPL's chance of playing for the next gameweek. Later gameweeks use the return date in the injury news ("Expected back 18 Oct"); without a date, the player returns gradually. Players who have left the club score 0.
3. **Per-90 rates**: xG, xA, saves, defensive actions, bonus and yellow cards per 90 minutes. Each rate is blended with 270 minutes of the position average, so players with few minutes don't get extreme rates.
4. **Team strength**: each club's xG for and against per 90 this season, relative to the league average. While the sample is small this is blended with FPL's own strength rating, which counts as 6 matches. Home advantage is ±10% on goals.
5. **Bookmaker odds**: for matches with published odds, the daily job turns 1X2 and over/under 2.5 odds (margin removed, averaged over bookmakers) into expected goals for both teams. These are blended with the model's team ratings at **70% odds**. For matches without odds, each team's attack and defence are fitted to the bookmakers' expected goals across all priced matches (**bookmaker team ratings**; the model's own rating counts as one extra match) and blended in at **50%**. Odds older than 4 days are ignored.
6. **Measured weights**: pre-kickoff odds are saved for every match (`data/odds-history.json`). Once 2 gameweeks with saved odds have been measured, the backtest picks the best weight for each blend (0 means "don't use") and writes it to `data/model-settings.json`. The app then uses those weights instead of 70% / 50%.
7. **Points per match** (2026/27 scoring):
   - Appearance: 2 points for 60+ minutes, 1 for less.
   - Goals and assists: per-90 rate × how this match compares with the team's average (opponent, home or away, odds) × expected minutes.
   - Clean sheet: P(60+ minutes) × P(0 goals conceded), with Poisson goals.
   - Goals conceded (GKP/DEF, −1 per 2) and saves (GKP, 1 per 3), both as Poisson expectations; a small allowance for penalty saves.
   - Defensive contribution: 2 points × P(reaching 10 actions for DEF, 12 for MID/FWD).
   - Bonus from the player's own bonus rate, nudged by his team's expected goals; yellow cards −1.
8. **Squad value**: the best valid XI (1 GKP, 3–5 DEF, 2–5 MID, 1–3 FWD) plus captain for each gameweek, with each gameweek weighted 0.9× the one before. The lineup, transfer plan, optimizer and chip calendar all use this measure.

### FPL scoring rules used (2026/27)

These match `Predictor.SCORING_RULES`. A test checks them against the live game's `game_config.scoring`.

| Event | GKP | DEF | MID | FWD |
|---|---|---|---|---|
| Played up to 60 minutes | 1 | 1 | 1 | 1 |
| Played 60+ minutes | 2 | 2 | 2 | 2 |
| Goal | 10 | 6 | 5 | 4 |
| Assist | 3 | 3 | 3 | 3 |
| Clean sheet (60+ minutes) | 4 | 4 | 1 | 0 |
| Every 2 goals conceded | −1 | −1 | 0 | 0 |
| Every 3 saves | 1 | – | – | – |
| Defensive contribution | – | 2 (10+ CBIT) | 2 (12+ CBIRT) | 2 (12+ CBIRT) |
| Penalty saved | 5 | – | – | – |
| Penalty missed | −2 | −2 | −2 | −2 |
| Yellow / red card | −1 / −3 | −1 / −3 | −1 / −3 | −1 / −3 |
| Own goal | −2 | −2 | −2 | −2 |
| Bonus | +1 per bonus point | | | |

CBIT = clearances, blocks, interceptions and tackles. CBIRT adds ball recoveries. The thresholds are not in the API and are set in the code.

## Data and freshness

- **FPL data** comes from the official API (`https://fantasy.premierleague.com/api`) through the site's own proxy, `api/proxy.js`, because the FPL API can't be called from a browser directly (it sends no CORS headers). Responses are cached for 5 minutes in the browser and on Vercel's CDN. Live gameweek data (live points and a gameweek's fixtures) is cached for 60 seconds.
- **Daily job** (`.github/workflows/data.yml`, 05:30 UTC, also runnable by hand). It runs three scripts and commits `data/` only when something changed; the push redeploys the site:
  - `scripts/build-data.js` writes `data/recent-form.json` (recent starts and minutes for every player) and `data/ownership.json` (top-1,000 effective ownership, once per gameweek).
  - `scripts/build-odds.js` writes `data/odds.json` (bookmaker odds turned into expected goals) and updates `data/odds-history.json` (last pre-kickoff odds per match). Odds are fetched once a day.
  - `scripts/backtest.js` writes `data/accuracy.json` (model accuracy and odds calibration) and `data/model-settings.json` (measured odds weights).
- **Odds markets check** (`.github/workflows/odds-check.yml`) is a manual, one-off check of whether the free odds plan includes anytime-goalscorer odds. Findings appear as annotations on the run.
- **What visitors trigger**: page loads read the static `data/*.json` files and make FPL requests through `/api/proxy`, which the CDN mostly answers from cache. During a live gameweek, `/api/rank` builds the rank sample at most once per 10 minutes for everyone. Visitors never call The Odds API and never start GitHub jobs.
- **Free-tier usage**:
  - The Odds API: about 60 of the 500 free monthly credits (2 per daily run). The goalscorer check costs about 2 credits per manual run.
  - GitHub Actions: free for public repositories.
  - Vercel: Hobby (free) plan; CDN caching keeps function invocations low.

## Running locally

Requires Node 22 and the Vercel CLI (`npx vercel`).

```bash
npx vercel dev                              # serves the pages, /api/proxy and /api/rank on http://localhost:3000
npm test                                    # 27 checks against the live FPL API (see Tests)
npm run backtest                            # model accuracy -> data/accuracy.json and data/model-settings.json
node scripts/build-data.js                  # data/recent-form.json and data/ownership.json
ODDS_API_KEY=your-key node scripts/build-odds.js   # data/odds.json and data/odds-history.json (skips without a key)
ODDS_API_KEY=your-key node scripts/check-odds-markets.js   # one-off goalscorer odds check (about 2 credits)
node scripts/contrast.js                    # WCAG AA contrast of the theme colours (exit code 1 on failure)
```

- Opening `index.html` straight from disk won't load data, because the pages call `/api/proxy`.
- In Node, scripts and tests call the FPL API directly. They use `FPL_TEAM_ID=1234567` as the team, or a built-in sample team if it isn't set. If FPL refuses direct requests (as it can from CI servers), set `FPL_PROXY=https://fpl-analyzer-eosin.vercel.app/api/proxy?url=` to retry through the proxy.

Deployment details are in [VERCEL_SETUP.md](VERCEL_SETUP.md), and a developer overview is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Project structure

```
fpl-analyzer/
├── index.html              # Home: 8 overview cards, first-visit team ID screen, Change ID
├── team.html               # My Team pitch
├── lineup.html             # Suggested lineup for the next gameweek
├── nextgw.html             # Next gameweek matches with the bookmakers' favourite
├── prediction.html         # Projected points, captain, model accuracy
├── transfers.html          # Transfer plan, best transfers, transfers I've made
├── optimizer.html          # Team rating, Wildcard / Free Hit squads, chip calendar
├── league.html             # Mini-league EO, threats, differentials
├── live.html               # Live gameweek, live league table, overall rank
├── performance.html        # Season history and chart
├── database.html           # Player database
├── comparison.html         # Player comparison (up to 3)
├── prices.html             # Price changes
├── fixtures.html           # Fixture analyser
├── player.html             # Player profile
├── guide.html              # "How it works": the full in-app guide
├── styles.css              # Design tokens (light / dark) and base styles
├── components.css          # Shared components: page layout, navigation, chips, tables, guide
├── theme.js                # Light / dark theme, applied before render
├── lang.js                 # English / Serbian translations, t(), setLang()
├── ui.js                   # Shared helpers, pitch player, navigation tabs, guide and glossary
├── fpl-api.js              # FPL API client, caching, team ID, saved preferences
├── prediction.js           # Projection model, lineup, transfer plan, optimizer, chip calendar
├── league.js               # Mini-league effective ownership
├── live.js                 # Live points, provisional bonus, auto-subs, rank estimate
├── app.js                  # Home page cards
├── manifest.json, icon.svg, icon-generator.html   # Home-screen app manifest and icon (source)
├── apple-touch-icon.png, icon-192.png, icon-512.png  # Home-screen icons rendered from icon.svg
├── api/
│   ├── proxy.js            # Serverless proxy for the FPL API (Vercel function)
│   └── rank.js             # Live overall rank sample (CDN-cached 10 minutes)
├── scripts/
│   ├── build-data.js       # Recent form + top-1,000 ownership
│   ├── build-odds.js       # Bookmaker odds -> expected goals, odds history
│   ├── backtest.js         # Model accuracy, odds calibration, model settings
│   ├── contrast.js         # WCAG contrast check of the theme colours
│   └── check-odds-markets.js  # One-off goalscorer odds check
├── data/                   # recent-form, ownership, odds, odds-history, accuracy, model-settings (.json)
├── .github/workflows/
│   ├── data.yml            # Daily data refresh (05:30 UTC)
│   └── odds-check.yml      # Manual odds markets check
├── docs/ARCHITECTURE.md    # Developer overview
├── test-api.js             # Test suite (npm test)
├── package.json            # Node 22, npm scripts
├── vercel.json             # Vercel config (no build, function timeouts)
├── VERCEL_SETUP.md         # Deployment guide
└── README.md
```

## Tests

`npm test` runs `test-api.js`: 27 checks that use the real modules against the live FPL API (with `FPL_TEAM_ID` as the team). They cover:

- **API client**: bootstrap-static, manager team, fixtures.
- **Model**: scoring rules match the live game's, unavailable players project 0, return-date parsing, Poisson probability helpers, blank and double gameweek detection and projection.
- **Transfers**: suggestions respect budget, club limit and formation; the multi-week plan respects locks, bans, budget and club limit; entered transfers are applied until FPL publishes them.
- **Optimizer**: Wildcard and Free Hit squads are valid and beat your squad; the chip calendar works.
- **Lineup and matches**: the suggested XI, captain and bench order are valid; next-gameweek match predictions are consistent.
- **League and live**: EO adds up per rival; provisional bonus matches confirmed bonus; the live league table matches official totals; the overall rank estimate matches official ranks after a gameweek.
- **Odds**: market maths and team-name mapping; a sample market maps to a fixture and is blended into the model; bookmaker team ratings are recovered and used for unpriced matches.
- **Design**: theme colours meet WCAG AA contrast in light and dark.
- **Proxy**: forwards FPL requests; rejects a missing `url`, other hosts and non-GET methods.

## Privacy

- No accounts and no tracking. Your team ID, language and theme are stored only in your browser (`localStorage`).
- Transfers you enter and your locked and banned players are also stored in your browser, separately for each team ID.
- FPL data is requested through the site's proxy, which forwards only `GET` requests to `fantasy.premierleague.com/api/` and stores nothing. Your team ID is sent only as part of those FPL requests.

## Known limitations

- **Transfers before the deadline**: FPL doesn't publish them until the deadline passes, so they must be entered by hand to be counted.
- **Overall rank during a live gameweek** is an estimate from a sample (median error about 1–4%). There is no live rank for every manager, and the live league table covers the first 50 managers of a league.
- **Early-season accuracy**: with few matches played, team strength leans on FPL's ratings and player rates lean on position averages. The odds weights are measured only after 2 gameweeks with saved odds.
- **Bookmaker odds** usually cover only the next 1–2 gameweeks. Later weeks use the model's ratings, moved towards the bookmakers' view.
- **Team news**: projections can't anticipate unannounced injuries, rotation or tactical changes. Availability uses FPL's flags and news text.
- **Later gameweeks in the chip calendar** assume no transfers, so treat them as a guide.

## Credits

- Player, team, fixture and live data: the official [Fantasy Premier League](https://fantasy.premierleague.com) API.
- Bookmaker odds: [The Odds API](https://the-odds-api.com) (free tier).
- Club badges, shirts and player photos are loaded from the Premier League's and FPL's own image servers.
- Charts: [Chart.js](https://www.chartjs.org).

## License

This is a personal project for educational and analytical purposes. Fantasy Premier League data and trademarks belong to the Premier League.

## Author

Srdjan Kojic, https://github.com/skojic

---

**Disclaimer**: the projections and suggestions are statistical estimates. Football is unpredictable and actual results can differ a lot from projections. Use your own judgement when making team decisions.
