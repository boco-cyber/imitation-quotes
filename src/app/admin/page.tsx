'use client'

import { useEffect, useState, useCallback } from 'react'
import React from 'react'

// ---------- types ----------

interface Devotional {
  id: number
  day: number
  calendar_date: string
  title: string
  source: string
  body: string
  prayer: string
}

interface Chapter {
  num: number
  title: string
  devotionals: Devotional[]
}

interface Book {
  num: number
  name: string
  fullTitle: string
  chapters: Chapter[]
}

type Draft = Pick<Devotional, 'title' | 'source' | 'body' | 'prayer'>

// ---------- constants ----------

const BOOK_FULL_TITLES: Record<number, string> = {
  0: 'Conclusion',
  1: 'Thoughts Helpful in the Life of the Soul',
  2: 'The Interior Life',
  3: 'Internal Consolation',
  4: 'An Invitation to Holy Communion',
}

const BOOK_NAMES: Record<number, string> = {
  0: 'Conclusion',
  1: 'Book One',
  2: 'Book Two',
  3: 'Book Three',
  4: 'Book Four',
}

// ---------- helpers ----------

function parseSource(source: string): { bookNum: number; chapterNum: number; chapterTitle: string } {
  const bookMap: [string, number][] = [
    ['Book One', 1], ['Book Two', 2], ['Book Three', 3], ['Book Four', 4],
  ]
  const found = bookMap.find(([k]) => source.startsWith(k))
  const bookNum = found ? found[1] : 0
  const chMatch = source.match(/Chapter (\d+)\s*[—\-–]\s*(.+)/)
  if (chMatch) return { bookNum, chapterNum: Number(chMatch[1]), chapterTitle: chMatch[2].trim() }
  const titleMatch = source.match(/[—\-–]\s*(.+)/)
  return { bookNum, chapterNum: 0, chapterTitle: titleMatch?.[1]?.trim() ?? source }
}

function buildHierarchy(devotionals: Devotional[]): Book[] {
  const bookMap = new Map<number, Map<number, { title: string; devs: Devotional[] }>>()

  for (const d of devotionals) {
    const { bookNum, chapterNum, chapterTitle } = parseSource(d.source)
    if (!bookMap.has(bookNum)) bookMap.set(bookNum, new Map())
    const chapters = bookMap.get(bookNum)!
    if (!chapters.has(chapterNum)) chapters.set(chapterNum, { title: chapterTitle, devs: [] })
    chapters.get(chapterNum)!.devs.push(d)
  }

  return Array.from(bookMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([num, chapters]) => ({
      num,
      name: BOOK_NAMES[num] ?? `Book ${num}`,
      fullTitle: BOOK_FULL_TITLES[num] ?? '',
      chapters: Array.from(chapters.entries())
        .sort(([a], [b]) => a - b)
        .map(([chNum, { title, devs }]) => ({
          num: chNum,
          title,
          devotionals: devs.slice().sort((a, b) => a.day - b.day),
        })),
    }))
}

function fmtDate(mmdd: string): string {
  const [m, d] = mmdd.split('-').map(Number)
  return new Date(2025, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---------- component ----------

export default function AdminPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [total, setTotal] = useState(0)
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(new Set([1]))
  const [selectedBook, setSelectedBook] = useState<number | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>({ title: '', source: '', body: '', prayer: '' })
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/devotionals')
    const data = await res.json()
    setBooks(buildHierarchy(data.items))
    setTotal(data.items.length)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const currentBook = books.find(b => b.num === selectedBook) ?? null
  const currentChapter = currentBook?.chapters.find(c => c.num === selectedChapter) ?? null

  function toggleBook(num: number) {
    setExpandedBooks(prev => {
      const next = new Set(prev)
      if (next.has(num)) { next.delete(num) } else { next.add(num) }
      return next
    })
  }

  function selectChapter(bookNum: number, chapterNum: number) {
    if (!expandedBooks.has(bookNum)) {
      setExpandedBooks(prev => new Set([...prev, bookNum]))
    }
    setSelectedBook(bookNum)
    setSelectedChapter(chapterNum)
    setEditId(null)
    setError('')
  }

  function startEdit(d: Devotional) {
    setEditId(d.id)
    setDraft({ title: d.title, source: d.source, body: d.body, prayer: d.prayer })
    setError('')
  }

  async function save(id: number) {
    setBusy(true)
    setError('')
    const res = await fetch(`/api/admin/devotionals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Save failed')
    } else {
      setEditId(null)
      await load()
    }
    setBusy(false)
  }

  async function swapDevotionals(idA: number, idB: number) {
    setBusy(true)
    await fetch('/api/admin/devotionals/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idA, idB }),
    })
    await load()
    setBusy(false)
  }

  if (loading) {
    return <div style={s.loading}>Loading devotionals…</div>
  }

  return (
    <div style={s.layout}>

      {/* ── Sidebar ── */}
      <nav style={s.sidebar}>
        <div style={s.sidebarHead}>
          <div style={s.sidebarLogo}>✦ Imitation of Christ</div>
          <div style={s.sidebarMeta}>{total} devotionals</div>
        </div>

        <div style={s.sidebarScroll}>
          {books.map(book => {
            const devCount = book.chapters.reduce((n, c) => n + c.devotionals.length, 0)
            const isExpanded = expandedBooks.has(book.num)
            const isActiveBook = selectedBook === book.num

            return (
              <div key={book.num}>
                <button
                  style={{ ...s.bookBtn, ...(isActiveBook ? s.bookBtnActive : {}) }}
                  onClick={() => toggleBook(book.num)}
                >
                  <span style={s.chevron}>{isExpanded ? '▾' : '▸'}</span>
                  <span style={s.bookBtnInner}>
                    <span style={s.bookBtnName}>{book.name}</span>
                    <span style={s.bookBtnCount}>{devCount}</span>
                  </span>
                </button>

                {isExpanded && book.chapters.map(ch => {
                  const isActive = selectedBook === book.num && selectedChapter === ch.num
                  return (
                    <button
                      key={ch.num}
                      style={{ ...s.chapterBtn, ...(isActive ? s.chapterBtnActive : {}) }}
                      onClick={() => selectChapter(book.num, ch.num)}
                      title={ch.title}
                    >
                      <span style={s.chLabel}>
                        {ch.num === 0 ? 'Summ.' : `Ch ${ch.num}`}
                      </span>
                      <span style={s.chTitle}>{ch.title}</span>
                      <span style={s.chCount}>{ch.devotionals.length}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </nav>

      {/* ── Main panel ── */}
      <main style={s.main}>
        {!currentChapter ? (
          /* Welcome state */
          <div style={s.welcome}>
            <div style={s.welcomeIcon}>✦</div>
            <h2 style={s.welcomeTitle}>Select a chapter to begin</h2>
            <p style={s.welcomeSub}>
              {books.length} books · {books.reduce((n, b) => n + b.chapters.length, 0)} chapters · {total} devotionals
            </p>
          </div>
        ) : (
          <>
            {/* Chapter header */}
            <div style={s.mainHead}>
              <div style={s.breadcrumb}>
                {currentBook!.name}
                {currentChapter.num > 0 && <> › Chapter {currentChapter.num}</>}
              </div>
              <h1 style={s.mainTitle}>{currentChapter.title}</h1>
              <div style={s.mainMeta}>{currentChapter.devotionals.length} devotionals</div>
              {error && <div style={s.errorBox}>{error}</div>}
            </div>

            {/* Devotionals */}
            <div style={s.devList}>
              {currentChapter.devotionals.map((d, idx) => (
                <React.Fragment key={d.id}>
                  {/* Card row */}
                  <div style={{ ...s.card, ...(editId === d.id ? s.cardActive : {}) }}>
                    <div style={s.cardMeta}>
                      <span style={s.dayNum}>Day {d.day}</span>
                      <span style={s.dateStr}>{fmtDate(d.calendar_date)}</span>
                    </div>
                    <div style={s.cardBody}>
                      <div style={s.cardTitle}>{d.title}</div>
                      <div style={s.cardExcerpt}>
                        {d.body.replace(/\n/g, ' ').slice(0, 110)}…
                      </div>
                    </div>
                    <div style={s.cardActions}>
                      <button
                        style={editId === d.id ? s.btnCancelSm : s.btnEditSm}
                        onClick={() => editId === d.id ? setEditId(null) : startEdit(d)}
                      >
                        {editId === d.id ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        style={s.btnArrow}
                        disabled={idx === 0 || busy}
                        onClick={() => swapDevotionals(d.id, currentChapter.devotionals[idx - 1].id)}
                        title="Move up"
                      >↑</button>
                      <button
                        style={s.btnArrow}
                        disabled={idx === currentChapter.devotionals.length - 1 || busy}
                        onClick={() => swapDevotionals(d.id, currentChapter.devotionals[idx + 1].id)}
                        title="Move down"
                      >↓</button>
                    </div>
                  </div>

                  {/* Inline editor */}
                  {editId === d.id && (
                    <div style={s.editor}>
                      <div style={s.editorGrid}>
                        <label style={s.label}>
                          Title
                          <input
                            style={s.input}
                            value={draft.title}
                            onChange={e => setDraft(p => ({ ...p, title: e.target.value }))}
                          />
                        </label>
                        <label style={s.label}>
                          Source
                          <input
                            style={s.input}
                            value={draft.source}
                            onChange={e => setDraft(p => ({ ...p, source: e.target.value }))}
                          />
                        </label>
                      </div>
                      <label style={s.label}>
                        Body
                        <textarea
                          style={{ ...s.input, minHeight: 180, resize: 'vertical', lineHeight: 1.65 }}
                          value={draft.body}
                          onChange={e => setDraft(p => ({ ...p, body: e.target.value }))}
                        />
                      </label>
                      <label style={s.label}>
                        Prayer
                        <textarea
                          style={{ ...s.input, minHeight: 80, resize: 'vertical', lineHeight: 1.65 }}
                          value={draft.prayer}
                          onChange={e => setDraft(p => ({ ...p, prayer: e.target.value }))}
                        />
                      </label>
                      <div style={s.editorActions}>
                        <button style={s.btnSave} disabled={busy} onClick={() => save(d.id)}>
                          {busy ? 'Saving…' : 'Save changes'}
                        </button>
                        <button style={s.btnCancelLg} onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// ---------- styles ----------

const s: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    color: '#0f172a',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: 16,
    color: '#64748b',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  // sidebar
  sidebar: {
    width: 268,
    minWidth: 268,
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #1e293b',
  },
  sidebarHead: {
    padding: '18px 16px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  sidebarLogo: {
    color: '#f1f5f9',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.02em',
    marginBottom: 3,
  },
  sidebarMeta: {
    color: '#475569',
    fontSize: 11,
  },
  sidebarScroll: {
    flex: 1,
    overflowY: 'auto',
    paddingTop: 6,
    paddingBottom: 20,
  },

  bookBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '7px 14px',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  bookBtnActive: { color: '#e2e8f0' },
  bookBtnInner: { display: 'flex', alignItems: 'center', gap: 6, flex: 1 },
  bookBtnName: { flex: 1 },
  bookBtnCount: { fontSize: 11, color: '#334155', fontWeight: 400, textTransform: 'none' },
  chevron: { fontSize: 9, color: '#334155', width: 10, flexShrink: 0 },

  chapterBtn: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    width: '100%',
    padding: '4px 14px 4px 28px',
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 12,
    lineHeight: 1.4,
  },
  chapterBtnActive: {
    background: 'rgba(96,165,250,0.12)',
    color: '#93c5fd',
    borderRadius: 4,
  },
  chLabel: { fontWeight: 700, flexShrink: 0, minWidth: 36, fontSize: 11 },
  chTitle: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chCount: { flexShrink: 0, fontSize: 10, color: '#334155' },

  // main panel
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#f8fafc',
  },

  welcome: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    color: '#94a3b8',
  },
  welcomeIcon: { fontSize: 32, marginBottom: 4 },
  welcomeTitle: { margin: 0, fontSize: 20, fontWeight: 600, color: '#334155' },
  welcomeSub: { margin: 0, fontSize: 14, color: '#94a3b8' },

  mainHead: {
    padding: '18px 24px 14px',
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0,
  },
  breadcrumb: { fontSize: 12, color: '#94a3b8', marginBottom: 5 },
  mainTitle: { margin: '0 0 3px', fontSize: 20, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 },
  mainMeta: { fontSize: 12, color: '#94a3b8' },
  errorBox: {
    marginTop: 10,
    padding: '8px 12px',
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: 6,
    color: '#dc2626',
    fontSize: 13,
  },

  devList: { flex: 1, overflowY: 'auto', padding: '16px 24px 40px' },

  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '13px 16px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    marginBottom: 6,
    transition: 'border-color 0.15s',
  },
  cardActive: { borderColor: '#93c5fd', background: '#f0f9ff' },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 52, flexShrink: 0 },
  dayNum: { fontSize: 13, fontWeight: 700, color: '#0f172a' },
  dateStr: { fontSize: 11, color: '#94a3b8' },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontWeight: 600, fontSize: 14, marginBottom: 4, color: '#0f172a' },
  cardExcerpt: { fontSize: 13, color: '#64748b', lineHeight: 1.5 },
  cardActions: { display: 'flex', gap: 4, flexShrink: 0, alignItems: 'flex-start', paddingTop: 1 },

  btnEditSm: {
    padding: '4px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 5,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    color: '#0f172a',
  },
  btnCancelSm: {
    padding: '4px 12px',
    border: '1px solid #bfdbfe',
    borderRadius: 5,
    background: '#eff6ff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    color: '#2563eb',
  },
  btnArrow: {
    padding: '4px 8px',
    border: '1px solid #e2e8f0',
    borderRadius: 5,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    color: '#64748b',
  },

  // inline editor
  editor: {
    background: '#f0f9ff',
    border: '1px solid #bfdbfe',
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 6,
    marginTop: -2,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  editorGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: 12,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  input: {
    padding: '7px 10px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'inherit',
    color: '#0f172a',
    background: '#fff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  editorActions: { display: 'flex', gap: 8, paddingTop: 2 },
  btnSave: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: 6,
    background: '#2563eb',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnCancelLg: {
    padding: '8px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    background: '#fff',
    color: '#475569',
    fontSize: 14,
    cursor: 'pointer',
  },
}
