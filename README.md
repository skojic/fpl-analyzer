# Fantasy Premier League Team Analyzer

A comprehensive web application for analyzing and optimizing your Fantasy Premier League team using real-time data from the official FPL API.

## Features

### 🏆 My Team
- **Graphical football field visualization** similar to the official FPL website
- View your current FPL squad with formation display (GKP, DEF, MID, FWD)
- **Gameweek points** displayed below each player (not total points)
- Captain (C) and vice-captain (VC) badges on player shirts
- Bench/substitutes section with all 4 substitute players
- Team value, bank balance, and current gameweek performance
- Dynamic team name from FPL API

### 📊 Performance Analytics
- Overall points and rank tracking
- Gameweek-by-gameweek performance history
- Season statistics (average points, best/worst gameweeks)
- Transfer history and trends

### 🔍 Player Database
- Searchable database of all FPL players
- Filter by position, team, or name
- Sortable columns (name, team, price, points, form, etc.)
- **Interactive tooltips** on column headers explaining each statistic
- **Extended statistics** (16 columns) including:
  - Basic: Name, Team, Position, Price
  - Performance: Total Points, Form (last 5 games), Minutes, Points Per Game
  - **Expected stats**: xG (Expected Goals), xA (Expected Assists), xGI (Expected Goal Involvements)
  - **Advanced metrics**: Starts, Bonus Points, BPS (Bonus Points System), ICT Index (Influence/Creativity/Threat)
  - Ownership: TSB% (Team Selection By percentage)

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

## Technology Stack

- **HTML5**: Semantic markup and structure
- **CSS3**: Custom responsive design (no frameworks)
- **Vanilla JavaScript**: No heavy dependencies
- **FPL API**: Official Fantasy Premier League API

## How to Use

1. **Open the Application**
   - Simply open `index.html` in any modern web browser
   - No server setup or installation required

2. **Navigate the Dashboard**
   - The main page displays all cards in a responsive grid
   - Each card shows a summary of that section

3. **Expand Cards**
   - Click the expand button (⤢) in the top-right of any card
   - Opens that section in a new tab with full details

4. **Search Players**
   - Use the Player Database card to search and filter
   - Click column headers to sort
   - Use filters for position and team

5. **Get Transfer Suggestions**
   - View AI-generated transfer recommendations
   - See expected points gain for next 5 gameweeks
   - Compare fixtures between incoming and outgoing players

## File Structure

```
fpl/
├── index.html              # Main dashboard page
├── styles.css              # All CSS styling
├── app.js                  # Main application logic
├── fpl-api.js             # FPL API integration
├── prediction.js          # Points prediction algorithm
├── team.html              # Expanded team view
├── performance.html       # Expanded performance view
├── database.html          # Expanded player database
├── prediction.html        # Expanded predictions view
├── transfers.html         # Expanded transfers view
└── README.md              # This file
```

## FPL Scoring Rules (Used in Predictions)

The prediction algorithm follows official FPL scoring:

### Minutes Played
- 1 point for playing up to 60 minutes
- 2 points for playing 60+ minutes

### Goals Scored
- Goalkeeper/Defender: 6 points
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

## Available Statistics

### ✅ Available in FPL API (Used by this app)
- **Basic stats**: Goals, Assists, Clean Sheets, Saves, Minutes, Starts
- **Expected stats**: xG, xA, xGI (Expected Goal Involvements), xGC (Expected Goals Conceded)
- **Per 90 stats**: xG/90, xA/90, xGI/90, xGC/90, Saves/90
- **Performance metrics**: Form, Points Per Game, Bonus Points earned
- **Advanced metrics**: BPS (Bonus Points System score), ICT Index (Influence/Creativity/Threat)
- **Availability**: Injury status, chance of playing, news updates
- **Set pieces**: Penalty order, direct free kick order, corners & indirect free kicks order
- **Cards**: Yellow cards, red cards
- **Other**: Own goals, penalties saved/missed

### ❌ NOT Available in Public FPL API
- **Defensive actions**: Tackles, Interceptions, Clearances, Blocked shots
- **Aerial duels**: Headers won/lost
- **Passing stats**: Pass completion %, key passes
- **Dribbling stats**: Successful dribbles, dispossessed

**Note**: The unavailable stats (tackles, interceptions, headers) are Opta statistics used internally by FPL for BPS calculations but not exposed in the public API. Our BPS metric is a composite score that already factors in these defensive contributions.

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

- All data is fetched directly from the official FPL API
- No user data is stored or transmitted to third parties
- Team ID (1146081) is hardcoded but can be changed in `fpl-api.js`

## Customization

To use with a different FPL team:

1. Open `fpl-api.js`
2. Change the `TEAM_ID` value on line 3:
   ```javascript
   TEAM_ID: YOUR_TEAM_ID_HERE,
   ```
3. Update the team ID in HTML files (search for "1146081")

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
- Multiple team comparison
- League standings integration
- Price change predictions
- Chip strategy recommendations
- Historical season data analysis
- Export functionality for reports

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
