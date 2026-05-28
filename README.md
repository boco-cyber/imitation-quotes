# Imitation of Christ — Daily Quotes API

Read-only JSON API serving 365 daily quotes from *The Imitation of Christ* by Thomas à Kempis.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/imitation` | API metadata and counts |
| GET | `/api/imitation/books` | Books with article counts |
| GET | `/api/imitation/articles?book=1` | Articles, optionally filtered by book |
| GET | `/api/imitation/topics` | Topics with quote counts |
| GET | `/api/imitation/quotes` | Paginated quotes |
| GET | `/api/imitation/quotes/today` | Quote for today's date |
| GET | `/api/imitation/quotes/today?date=2026-05-28` | Quote for a specific date |
| GET | `/api/imitation/quotes/42` | Quote by id |

### Quote filters

`GET /api/imitation/quotes` accepts: `book`, `article`, `topic`, `day`, `date`, `q`, `limit` (max 100), `offset`

## Setup

```bash
npm install
npm run dev   # http://localhost:3000
```

## Environment

```env
API_CORS_ORIGIN=*          # or comma-separated allowed origins
IMITATION_QUOTES_JSON=     # optional override for data file path
```

## Deployment

Deployed via Docker on Coolify. Build pack: `Dockerfile`. Port: `3000`. Health check: `/api/imitation`.

## Data

- `data/imitation_daily_quotes.json` — 365 quotes (source of truth at runtime)
- `data/imitation_daily_quotes.sqlite` — SQLite artifact
- `data/imitation-of-christ.raw.txt` — original source text
- `scripts/extract_imitation_text.mjs` — extracts raw text from source
- `scripts/build_imitation_quotes_db.py` — builds the JSON and SQLite from raw text
