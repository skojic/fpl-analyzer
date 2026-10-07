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
- **Always provides at least 3 transfer suggestions** regardless of team quality
- Enhanced AI algorithm using comprehensive player scoring:
  - **Extended statistics**: xG per 90, xA per 90, xGI per 90
  - **Performance metrics**: Form, PPG, BPS, ICT Index
  - **Playing time**: Minutes, starts, rotation risk analysis
  - **Set pieces**: Penalty taker order, free kick taker
  - **Bonus potential**: BPS per game analysis
- Smart transfer recommendations based on:
  - Multi-factor player comprehensive score
  - Fixture difficulty for next 5 gameweeks
  - Expected points following official FPL scoring rules
  - Budget constraints with flexible allowances
- Detailed transfer reasons with specific metrics
- Fixture comparison between incoming and outgoing players
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

The enhanced points prediction system uses:

1. **Expected Stats per 90**: xG/90, xA/90 for more accurate projections
2. **Player Form**: Recent performance (last 5 games) weighted heavily
3. **Fixture Difficulty**: Adjusts expectations based on opponent strength
4. **Historical Statistics**: Goals, assists, clean sheets, bonus points, saves
5. **Bonus Potential**: BPS per game to estimate bonus point probability
6. **Playing Time Analysis**: Start probability based on minutes and starts data
7. **Rotation Risk**: Calculated from starts percentage and consecutive games
8. **Set Piece Role**: Penalty taker order for additional expected points
9. **Availability**: Injury concerns and chance of playing percentage
10. **Position-Specific Factors**: Different calculations for GKP/DEF/MID/FWD

### Difficulty Multipliers
- Difficulty 1 (Easiest): +30% for attackers, -30% for clean sheets
- Difficulty 2: +15% for attackers, -15% for clean sheets
- Difficulty 3 (Medium): No adjustment
- Difficulty 4: -15% for attackers, +15% for clean sheets
- Difficulty 5 (Hardest): -30% for attackers, +30% for clean sheets

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
