# CSV import for historical games

Use this to upload paper history into PkrTrackr (e.g. Season 2024 and Season 2025).

## CSV format

- **Headers required** (first row). Column names are case-insensitive.
- **One row per player per game.** A game with 5 players = 5 rows with the same `game_date` and `game_name`.

| Column       | Required | Description |
|-------------|----------|-------------|
| season_name | Yes      | Season label, e.g. `2024` or `Season 2025`. Creates or reuses a season for the default group. |
| game_date   | Yes      | Date of the game: `YYYY-MM-DD` (e.g. `2024-03-15`). |
| game_name   | Yes      | Name for the game night (e.g. `Friday Night`, `March 15`). |
| player_name | Yes      | Player display name. Created if missing in the group. |
| buy_in      | Yes      | Total buy-in in **dollars** (e.g. `100` or `50.50`). |
| cash_out    | Yes      | Cash-out in **dollars** (e.g. `150` or `0`). Use `0` for bust. |
| adjustment  | No       | Optional adjustment in dollars (positive or negative). |

### Example

```csv
season_name,game_date,game_name,player_name,buy_in,cash_out
2024,2024-01-12,Jan 12,Alice,100,150
2024,2024-01-12,Jan 12,Bob,100,80
2024,2024-01-12,Jan 12,Cam,100,0
2024,2024-02-02,Feb 2,Alice,50,120
2024,2024-02-02,Feb 2,Bob,50,0
```

## How to import

1. **Prepare your CSV** with the columns above. Save as UTF-8 (e.g. from Excel: “Save As” → “CSV UTF-8”).
2. Go to **Settings → Import** (or `/import`) in the app.
3. Paste the CSV or upload the file, choose options if any, and run **Import**.

Imported games are created as **CLOSED** and linked to the **default group** and the matching **season** (by name). Season stats (e.g. for leaderboards) are updated from the imported data.

## Notes

- The **default group** is used (see “Single default group” in the app). Ensure your group exists and, if needed, set `DEFAULT_GROUP_ID` in `.env`.
- Duplicate rows (same game + player) are treated as one: later row wins for that player in that game.
- Dates are parsed as local date (no time). Use `YYYY-MM-DD` for reliable results.
