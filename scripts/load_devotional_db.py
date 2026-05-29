from __future__ import annotations

import json
import sqlite3
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_IN = Path('/home/gerges-boctor/Documents/imitation-365-devotional.json')
JSON_OUT = ROOT / 'data' / 'imitation_daily_quotes.json'
SQLITE_OUT = ROOT / 'data' / 'imitation_daily_quotes.sqlite'


def calendar_date(day: int) -> str:
    # 2025 is not a leap year; day 1 = Jan 1, day 365 = Dec 31
    return (date(2025, 1, 1) + timedelta(days=day - 1)).strftime('%m-%d')


def main() -> None:
    data = json.loads(JSON_IN.read_text(encoding='utf8'))
    devs = data['devotional']

    if len(devs) != 365:
        raise SystemExit(f'Expected 365 entries, got {len(devs)}')

    records = [
        {
            'id': d['day'],
            'day': d['day'],
            'calendar_date': calendar_date(d['day']),
            'title': d['title'],
            'source': d['source'],
            'body': d['body'],
            'prayer': d['prayer'],
        }
        for d in devs
    ]

    # Write JSON (used by the Next.js app at runtime)
    JSON_OUT.write_text(
        json.dumps(
            {
                'source': 'Thomas A Kempis, The Imitation of Christ',
                'calendar': '365-day non-leap devotional calendar',
                'devotionals': records,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding='utf8',
    )
    print(f'Wrote {len(records)} devotionals → {JSON_OUT.relative_to(ROOT)}')

    # Write SQLite (used by admin bulk operations / future tooling)
    if SQLITE_OUT.exists():
        SQLITE_OUT.unlink()

    con = sqlite3.connect(SQLITE_OUT)
    con.executescript("""
        CREATE TABLE devotionals (
            id            INTEGER PRIMARY KEY,
            day           INTEGER NOT NULL UNIQUE,
            calendar_date TEXT    NOT NULL,
            title         TEXT    NOT NULL,
            source        TEXT    NOT NULL,
            body          TEXT    NOT NULL,
            prayer        TEXT    NOT NULL
        );
        CREATE INDEX idx_cal_date ON devotionals(calendar_date);
    """)
    con.executemany(
        'INSERT INTO devotionals(id, day, calendar_date, title, source, body, prayer) '
        'VALUES(?, ?, ?, ?, ?, ?, ?)',
        [
            (r['id'], r['day'], r['calendar_date'],
             r['title'], r['source'], r['body'], r['prayer'])
            for r in records
        ],
    )
    con.commit()
    con.close()
    print(f'Wrote SQLite db  → {SQLITE_OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
