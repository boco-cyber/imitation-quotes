import fs from 'fs'
import path from 'path'

export interface Devotional {
  id: number
  day: number
  calendar_date: string
  title: string
  source: string
  body: string
  prayer: string
}

export interface DevotionalFilters {
  day?: number
  date?: string
  q?: string
  limit?: number
  offset?: number
}

export interface PaginatedDevotionals {
  items: Devotional[]
  total: number
  limit: number
  offset: number
}

interface Dataset {
  source: string
  calendar: string
  devotionals: Devotional[]
}

// ---------- Book helpers (derived from source field) ----------

const BOOK_TITLES: Record<number, string> = {
  1: 'Thoughts Helpful in the Life of the Soul',
  2: 'The Interior Life',
  3: 'Internal Consolation',
  4: 'An Invitation to Holy Communion',
}

const BOOK_PREFIXES: [string, number][] = [
  ['Book One', 1],
  ['Book Two', 2],
  ['Book Three', 3],
  ['Book Four', 4],
]

export function getBookNumber(source: string): number {
  for (const [prefix, num] of BOOK_PREFIXES) {
    if (source.startsWith(prefix)) return num
  }
  return 0
}

export function getBooks(): { id: number; title: string }[] {
  return Object.entries(BOOK_TITLES).map(([id, title]) => ({ id: Number(id), title }))
}

// ---------- JSON cache ----------

let cached: Dataset | null = null

function jsonPath(): string {
  return process.env.IMITATION_QUOTES_JSON
    ? path.resolve(process.env.IMITATION_QUOTES_JSON)
    : path.join(process.cwd(), 'data', 'imitation_daily_quotes.json')
}

function getDataset(): Dataset {
  if (!cached) cached = JSON.parse(fs.readFileSync(jsonPath(), 'utf8')) as Dataset
  return cached
}

export function clearCache(): void {
  cached = null
}

// ---------- Public read functions ----------

export function getDevotionalCount(): number {
  return getDataset().devotionals.length
}

export function getUniqueSources(bookId?: number): string[] {
  const seen = new Set<string>()
  for (const d of getDataset().devotionals) {
    if (!bookId || getBookNumber(d.source) === bookId) seen.add(d.source)
  }
  return Array.from(seen).sort()
}

export function getDailyDevotional(inputDate = new Date()): Devotional {
  const mm = String(inputDate.getMonth() + 1).padStart(2, '0')
  const dd = String(inputDate.getDate()).padStart(2, '0')
  const calDate = mm === '02' && dd === '29' ? '02-28' : `${mm}-${dd}`

  return (
    getDataset().devotionals.find(d => d.calendar_date === calDate) ??
    getDataset().devotionals[0]
  )
}

export function getDevotionalById(id: number): Devotional | undefined {
  return getDataset().devotionals.find(d => d.id === id)
}

export function queryDevotionals(filters: DevotionalFilters): PaginatedDevotionals {
  const limit = Math.max(1, Math.min(filters.limit ?? 30, 100))
  const offset = Math.max(0, filters.offset ?? 0)

  let all = getDataset().devotionals

  if (filters.day !== undefined) {
    all = all.filter(d => d.day === filters.day)
  }
  if (filters.date) {
    all = all.filter(d => d.calendar_date === filters.date)
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase()
    all = all.filter(
      d =>
        d.title.toLowerCase().includes(q) ||
        d.body.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q),
    )
  }

  return { items: all.slice(offset, offset + limit), total: all.length, limit, offset }
}
