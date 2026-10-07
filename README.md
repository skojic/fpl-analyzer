# Fantasy Premier League Team Analyzer

A comprehensive web application for analyzing and optimizing your Fantasy Premier League team using real-time data from the official FPL API.

Link to the APP: https://fpl-analyzer-eosin.vercel.app/

## Features

### 🏆 My Team
- **Graphical football field visualization** similar to the official FPL website
- View your current FPL squad with formation display (GKP, DEF, MID, FWD)
- **Gameweek points** displayed below each player (not total points)
- Captain (C) and vice-captain (VC) badges on player shirts
- Bench/substitutes section with all 4 substitute players
- Team value, bank balance, and current gameweek performance
- Dynamic team name fetched live from the FPL API
- **Upcoming fixture badge** per player showing next opponent and difficulty
- **Kit colour picker** — choose from 9 kit colour schemes (Red, Blue, Black, Yellow, and two-tone combos); preference saved in browser

### 📊 Performance Analytics
- Overall points and rank tracking
- Gameweek-by-gameweek performance history visualised with **Chart.js**
- Season statistics (average points, best/worst gameweeks)
- Transfer history and trends

### 🔍 Player Database
- Searchable database of all FPL players
- Filter by position, team, or name
- Sortable columns (name, team, price, points, form, etc.)
- **Interactive tooltips** on column headers explaining each statistic
- **Extended statistics** columns including:
  - Basic: Name, Team, Position, Price
  - Performance: Total Points, Form (last 5 games), Goals, Assists
  - **Expected stats**: xGI (Expected Goal Involvements)
  - **Advanced metrics**: Tackles, Ownership %

### 🎯 Points Prediction
- AI-powered predictions for next gameweek
- Expected points for next 5 gameweeks
- Captain and vice-captain recommendations
- Fixture difficulty analysis
- Form trend indicators (Rising, Stable, Falling)
- Detailed fixture-by-fixture breakdown for top players

### 🔄 Transfer Suggestions
- Every single transfer is scored by how much it improves your **best XI plus captain** over the next 5 gameweeks, so swapping a bench player only counts if the new player would start
- Uses your real **selling prices** (half of any price rise), bank, the **3-per-club limit** and transfers already made for the next deadline
- Shows your **free transfers** and a verdict per option: *Make it*, *Worth a −4* or *Marginal: consider rolling*
- Reasons based on the projection: availability, minutes, blank and double gameweeks, projected points
- Fixture-by-fixture projected points for the outgoing and incoming player
- "Players to Watch" section by position
- Value score calculations (points per million)

### ⚖️ Player Comparison
- Compare **up to 3 players** side-by-side in a dedicated full-page view
- Inline search with live autocomplete for fast player lookup
- Visual stat bars across all key FPL metrics (points, form, price, xGI, ICT, BPS, ownership, etc.)
- Highlighted "winner" column for each metric at a glance

## Technology Stack

- **HTML5**: Semantic markup and structure
- **CSS3**: Custom responsive design (no frameworks)
- **Vanilla JavaScript**: No heavy dependencies
- **Chart.js 4.4**: Gameweek performance charts
- **FPL API**: Official Fantasy Premier League API
- **Vercel**: Hosts the static site and a small serverless proxy (`api/proxy.js`) for the FPL API, which can't be called from the browser directly (no CORS)
- **PWA**: Progressive Web App — installable on iOS, Android, and desktop (manifest + service-worker ready)

## UI / UX Features

### 🌙 Dark / Light Theme
- Toggle between dark and light mode with the moon/sun button in the header
- Preference is saved in the browser and applied instantly on next visit with no flash

### 🌐 Bilingual Support (English / Serbian)
- Full translation of the entire UI via `lang.js`
- Switch languages with the 🇬🇧 / 🇷🇸 flag buttons — available both on the onboarding screen and in the main header

### 🛡️ FPL Guardian Onboarding
- First-visit animated splash screen with a stadium background and moving light beams
- Prompts the user to enter their FPL Team ID (stored in `localStorage`)
- Built-in "How to find your Team ID" guide
- On subsequent visits the splash is skipped automatically

### 🔄 Runtime Team ID Switching
- **Change ID** button in the header opens a modal without requiring a page reload
- Clears the API cache and re-fetches all data for the new team

### 🎨 Kit Colour Picker
- 9 kit colour themes for the pitch view: Red, Blue, Black, Yellow, Red & White, Black & White, Blue & White, Red & Black, and Purple & White (default)
- Selection persists across sessions via `localStorage`

## How to Use

1. **Open the Application**
   - Go to the hosted app (link above)
   - To run it locally, start `npx vercel dev` in the project folder and open the URL it prints. Opening `index.html` straight from disk won't load data, because the pages call the `/api/proxy` function. See [VERCEL_SETUP.md](VERCEL_SETUP.md)

2. **Enter Your FPL Team ID**
   - The Guardian splash screen will ask for your Team ID on first visit
   - Find it at `fantasy.premierleague.com` → Points → the number in your URL
   - Your ID is saved in the browser; subsequent visits go straight to the dashboard

3. **Navigate the Dashboard**
   - The main page displays 6 cards in a responsive grid
   - Each card shows a live summary of that section

4. **Expand Cards**
   - Click the expand button (⤢) in the top-right of any card
   - Opens that section in a full-page view with complete details

5. **Search Players**
   - Use the Player Database card to search and filter
   - Click column headers to sort
   - Use filters for position and team

6. **Compare Players**
   - Use the Player Comparison card to search and select up to 3 players
   - Stat bars highlight the leader in each category

7. **Get Transfer Suggestions**
   - View AI-generated transfer recommendations
   - See expected points gain for next 5 gameweeks
   - Compare fixtures between incoming and outgoing players

8. **Switch Team / Language / Theme**
   - Use **Change ID** in the header to analyse a different team
   - Use 🇬🇧 / 🇷🇸 to toggle language
   - Use 🌙 / ☀️ to toggle dark/light mode

## File Structure

```
fpl-analyzer/
├── index.html              # Main dashboard — 6-card grid + Guardian onboarding
├── styles.css              # All CSS styling (dark/light themes, responsive)
├── app.js                  # Main application logic
├── fpl-api.js              # FPL API integration & caching
├── prediction.js           # Points prediction algorithm
├── lang.js                 # Bilingual translations (English / Serbian)
├── theme.js                # Dark/light theme manager (runs before render)
├── kits.js                 # Kit colour picker (9 themes, persisted)
├── team.html               # Expanded team / pitch view
├── performance.html        # Expanded performance & charts view
├── database.html           # Expanded player database view
├── prediction.html         # Expanded predictions view
├── transfers.html          # Expanded transfers view
├── comparison.html         # Full-page player comparison view
├── manifest.json           # PWA manifest (installable app)
├── api/proxy.js            # Vercel serverless proxy for the FPL API
├── vercel.json             # Vercel project config
├── package.json            # Node version for Vercel, `npm test`
├── test-api.js             # Checks the API client and proxy (`npm test`)
├── VERCEL_SETUP.md         # Deployment guide
└── README.md               # This file
```

## FPL Scoring Rules (Used in Predictions)

The prediction algorithm follows official FPL scoring (2026/27, as returned by the API's `game_config.scoring`):

### Minutes Played
- 1 point for playing up to 60 minutes
- 2 points for playing 60+ minutes

### Goals Scored
- Goalkeeper: 10 points
- Defender: 6 points
- Midfielder: 5 points
- Forward: 4 points

### Assists
- 3 points per assist

### Clean Sheets
- Goalkeeper: 4 points
- Defender: 4 points
- Midfielder: 1 point

### Other Scoring
- Saves: 1 point per 3 saves (GKP only)
- Penalty saved: 5 points
- Penalty missed: -2 points
- Yellow card: -1 point
- Red card: -3 points
- Own goal: -2 points
- Goals conceded: -1 point per 2 goals (GKP/DEF only)

### Defensive Contribution
- Defender: 2 points for 10+ clearances, blocks, interceptions and tackles in a match
- Midfielder / Forward: 2 points for 12+ of the same actions plus ball recoveries
- Predicted from each player's defensive actions per 90

## Available Statistics

### ✅ Available in FPL API (Used by this app)
- **Basic stats**: Goals, Assists, Clean Sheets, Saves, Minutes, Starts
- **Expected stats**: xG, xA, xGI (Expected Goal Involvements), xGC (Expected Goals Conceded)
- **Per 90 stats**: xG/90, xA/90, xGI/90, xGC/90, Saves/90
- **Defensive actions**: Clearances/blocks/interceptions, tackles, recoveries, defensive contribution (total and per 90)
- **Performance metrics**: Form, Points Per Game, Bonus Points earned
- **Advanced metrics**: BPS (Bonus Points System score), ICT Index (Influence/Creativity/Threat)
- **Availability**: Injury status, chance of playing, news updates
- **Set pieces**: Penalty order, direct free kick order, corners & indirect free kicks order
- **Cards**: Yellow cards, red cards
- **Other**: Own goals, penalties saved/missed

### ❌ NOT Available in Public FPL API
- **Aerial duels**: Headers won/lost
- **Passing stats**: Pass completion %, key passes
- **Dribbling stats**: Successful dribbles, dispossessed

**Note**: The unavailable stats (headers, passing, dribbling) are Opta statistics used internally by FPL for BPS calculations but not exposed in the public API.

## Prediction Algorithm

Code: `prediction.js`. Projections cover the next 5 gameweeks from the next deadline; a blank gameweek scores 0 and a double gameweek counts both matches.

1. **Minutes**: chance of starting, of a substitute appearance and of 60+ minutes, from starts and minutes per team match this season blended with the last 5 matches (60% weight on recent matches)
2. **Availability**: FPL's chance of playing for the next gameweek; later gameweeks use the return date in the injury news ("Expected back 18 Oct"), otherwise a gradual return. Players who left the club score 0
3. **Team strength**: each club's xG for and against per 90 this season, relative to the league average, blended with FPL's own 1–5 strength rating while the sample is small (6 matches of prior). Home advantage ±10%
4. **Per-90 rates**: xG, xA, saves, defensive actions, bonus and yellow cards per 90, steadied with 270 minutes of position-average data so players with few minutes don't get extreme rates
5. **Points per match** (2026/27 scoring):
   - Appearance: 2 points for 60+ minutes, 1 for less
   - Goals and assists: per-90 rate × opponent defence × home/away × expected minutes
   - Clean sheet: P(60+ minutes) × e^−(goals his team is expected to concede)
   - Goals conceded (GKP/DEF): −1 per 2, saves (GKP): 1 per 3, both as Poisson expectations
   - Defensive contribution: 2 points × P(reaching 10 actions for DEF, 12 for MID/FWD)
   - Bonus from his own bonus rate, yellow cards −1
6. **Squad value**: best valid XI (1 GKP, 3–5 DEF, 2–5 MID, 1–3 FWD) plus captain for each gameweek, with each gameweek weighted 0.9× the one before

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (responsive design)

## Privacy & Data

- All data comes from the official FPL API, fetched through the app's own proxy on Vercel
- No user data is stored or transmitted to third parties
- Your FPL Team ID is saved in your own browser (`localStorage`); it is only sent as part of the FPL API requests the proxy forwards
- Theme, language, and kit preferences are also stored locally in your browser

## Customization

### Switching Teams
Use the **Change ID** button in the app header — no code changes needed.

### Default Team ID (optional, for self-hosted deployments)
If you want to pre-fill a Team ID for a specific deployment:
1. Open `fpl-api.js`
2. Set the `TEAM_ID` default value:
   ```javascript
   TEAM_ID: YOUR_TEAM_ID_HERE,
   ```
3. The Guardian onboarding will still let users override this with their own ID.

## Known Limitations

- Predictions are estimates based on historical data and may not account for:
  - Unexpected team news
  - Weather conditions
  - Tactical changes
  - Player transfers between clubs
- API rate limits may apply during heavy usage
- Some features require active gameweeks

## Future Enhancements

Potential features for future versions:
- League standings integration
- Price change predictions
- Chip strategy recommendations (Wildcard, Free Hit, Bench Boost, Triple Captain)
- Historical season data analysis
- Export / share functionality for reports
- Service worker for full offline support

## API Credits

This application uses the official Fantasy Premier League API:
- Base URL: `https://fantasy.premierleague.com/api`
- All player data, teams, and fixtures are © Premier League

## License

This is a personal project for educational and analytical purposes.
Fantasy Premier League data and trademarks belong to the Premier League.

## Support

For issues or questions:
1. Check that you have an active internet connection
2. Ensure the FPL API is accessible
3. Try refreshing the page
4. Check browser console for error messages

---

**Disclaimer**: This tool provides predictions and suggestions based on statistical analysis. Fantasy football involves unpredictability, and actual results may vary significantly from predictions. Always trust your own judgment when making team decisions.
