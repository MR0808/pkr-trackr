# Optional environment variables

Add these to `.env` when you want to override defaults.

## Default group (single group for the whole site)

- **`DEFAULT_GROUP_ID`** – Fix the group used for dashboard, games list, and imports. If unset, the first group in the database (by creation date) is used.

## Leaderboard / stats limits

Used when you add leaderboards or “minimum activity” filters. Right now there are **no limits** (everyone included). To add limits later, set:

- **`MIN_NIGHTS_PLAYED`** – Include only players with at least this many games (e.g. `5`). Default: `0` (no limit).
- **`MIN_TOTAL_BUY_IN_CENTS`** – Include only players with at least this much total buy-in in cents (e.g. `10000` = $100). Default: `0` (no limit).

Values are read at runtime; restart the app after changing.
