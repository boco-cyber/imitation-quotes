import fs from 'fs'
import path from 'path'
import { clearCache, Devotional } from './imitationDb'

function jsonPath(): string {
  return process.env.IMITATION_QUOTES_JSON
    ? path.resolve(process.env.IMITATION_QUOTES_JSON)
    : path.join(process.cwd(), 'data', 'imitation_daily_quotes.json')
}

function readDataset(): { source: string; calendar: string; devotionals: Devotional[] } {
  return JSON.parse(fs.readFileSync(jsonPath(), 'utf8'))
}

function writeDataset(dataset: { source: string; calendar: string; devotionals: Devotional[] }): void {
  fs.writeFileSync(jsonPath(), JSON.stringify(dataset, null, 2), 'utf8')
  clearCache()
}

export function adminGetAll(): Devotional[] {
  return readDataset().devotionals
}

export function adminUpdateDevotional(
  id: number,
  patch: { title?: string; source?: string; body?: string; prayer?: string },
): void {
  const dataset = readDataset()
  const idx = dataset.devotionals.findIndex(d => d.id === id)
  if (idx === -1) throw new Error(`Devotional ${id} not found`)

  const d = dataset.devotionals[idx]
  if (patch.title !== undefined) d.title = patch.title
  if (patch.source !== undefined) d.source = patch.source
  if (patch.body !== undefined) d.body = patch.body
  if (patch.prayer !== undefined) d.prayer = patch.prayer

  writeDataset(dataset)
}

export function adminSwapDays(idA: number, idB: number): void {
  const dataset = readDataset()
  const a = dataset.devotionals.find(d => d.id === idA)
  const b = dataset.devotionals.find(d => d.id === idB)
  if (!a || !b) throw new Error('Devotional not found')

  // Swap only the scheduling fields (day + calendar_date), not the content
  const [dayA, calA] = [a.day, a.calendar_date]
  a.day = b.day
  a.calendar_date = b.calendar_date
  b.day = dayA
  b.calendar_date = calA

  dataset.devotionals.sort((x, y) => x.day - y.day)
  writeDataset(dataset)
}
