# Optional environment variables

Add these to `.env` when you want to override defaults.

## Default group (single group for the whole site)

- **`DEFAULT_GROUP_ID`** – Fix the group used for dashboard, games list, and imports. If unset, the first group in the database (by creation date) is used.

## Leaderboard / stats limits (overall / all-time only)

These apply only to **overall** and **all-time** stats (Dashboard “who’s hot”, balance, big moments; Stats page all-time leaderboard and awards). Season tables and per-night data **include everyone** (no minimum).

- **`MIN_NIGHTS_PLAYED`** – Minimum nights played to appear in all-time leaderboard, dashboard overall stats, and all-time awards. Default: **`3`** if unset. Set to `0` to include everyone.
- **`MIN_TOTAL_BUY_IN_CENTS`** – Minimum total buy-in (cents) for all-time; e.g. `10000` = $100. Default: `0` (no limit).

Values are read at runtime; restart the app after changing.
