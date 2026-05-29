'use client'

import { useEffect, useState, useCallback } from 'react'
import React from 'react'

interface Devotional {
  id: number
  day: number
  calendar_date: string
  title: string
  source: string
  body: string
  prayer: string
}

type Draft = Pick<Devotional, 'title' | 'source' | 'body' | 'prayer'>

function fmtDate(mmdd: string): string {
  const [m, d] = mmdd.split('-').map(Number)
  return new Date(2025, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function bookLabel(source: string): string {
  if (source.startsWith('Book One')) return 'B1'
  if (source.startsWith('Book Two')) return 'B2'
  if (source.startsWith('Book Three')) return 'B3'
  if (source.startsWith('Book Four')) return 'B4'
  return '—'
}

export default function AdminPage() {
  const [all, setAll] = useState<Devotional[]>([])
  const [search, setSearch] = useState('')
  const [bookFilter, setBookFilter] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>({ title: '', source: '', body: '', prayer: '' })
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/devotionals')
    const data = await res.json()
    setAll(data.items)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const visible = all.filter(d => {
    if (bookFilter && bookLabel(d.source) !== bookFilter) return false
    if (search.trim()) {
      const s = search.toLowerCase()
      return (
        d.title.toLowerCase().includes(s) ||
        d.body.toLowerCase().includes(s) ||
        d.source.toLowerCase().includes(s)
      )
    }
    return true
  })

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

  async function swap(idA: number, idB: number) {
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
    return (
      <div style={s.loading}>
        <span>Loading devotionals…</span>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>Imitation of Christ — Admin</h1>
          <p style={s.subtitle}>
            {visible.length === all.length
              ? `${all.length} devotionals`
              : `${visible.length} of ${all.length} devotionals`}
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <input
          style={s.searchInput}
          type="text"
          placeholder="Search title, body, or source…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={s.select} value={bookFilter} onChange={e => setBookFilter(e.target.value)}>
          <option value="">All Books</option>
          <option value="B1">Book 1 — Thoughts Helpful in the Life of the Soul</option>
          <option value="B2">Book 2 — The Interior Life</option>
          <option value="B3">Book 3 — Internal Consolation</option>
          <option value="B4">Book 4 — An Invitation to Holy Communion</option>
        </select>
        {(search || bookFilter) && (
          <button style={s.clearBtn} onClick={() => { setSearch(''); setBookFilter('') }}>
            Clear filters
          </button>
        )}
      </div>

      {error && <div style={s.errorBanner}>{error}</div>}

      {/* Table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: 48 }}>#</th>
              <th style={{ ...s.th, width: 64 }}>Date</th>
              <th style={{ ...s.th, width: 36 }}>Bk</th>
              <th style={{ ...s.th, minWidth: 180 }}>Title</th>
              <th style={s.th}>Body excerpt</th>
              <th style={{ ...s.th, width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((d, idx) => (
              <React.Fragment key={d.id}>
                <tr
                  style={editId === d.id ? s.rowActive : (idx % 2 === 0 ? s.rowEven : s.rowOdd)}
                >
                  <td style={{ ...s.td, ...s.cellMuted, fontWeight: 600 }}>{d.day}</td>
                  <td style={{ ...s.td, ...s.cellMuted, whiteSpace: 'nowrap' }}>{fmtDate(d.calendar_date)}</td>
                  <td style={{ ...s.td, ...s.cellMuted, textAlign: 'center' }}>{bookLabel(d.source)}</td>
                  <td style={{ ...s.td, fontWeight: 500 }}>{d.title}</td>
                  <td style={{ ...s.td, color: '#475569', fontSize: 13 }}>
                    {d.body.replace(/\n/g, ' ').slice(0, 90)}…
                  </td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                    <button
                      style={editId === d.id ? s.btnCancel : s.btnEdit}
                      onClick={() => editId === d.id ? setEditId(null) : startEdit(d)}
                    >
                      {editId === d.id ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      style={s.btnMove}
                      disabled={idx === 0 || busy}
                      title={`Move to day ${visible[idx - 1]?.day}`}
                      onClick={() => swap(d.id, visible[idx - 1].id)}
                    >
                      ↑
                    </button>
                    <button
                      style={s.btnMove}
                      disabled={idx === visible.length - 1 || busy}
                      title={`Move to day ${visible[idx + 1]?.day}`}
                      onClick={() => swap(d.id, visible[idx + 1].id)}
                    >
                      ↓
                    </button>
                  </td>
                </tr>

                {editId === d.id && (
                  <tr>
                    <td colSpan={6} style={s.editTd}>
                      <div style={s.editPanel}>
                        <div style={s.editGrid}>
                          <label style={s.fieldLabel}>
                            Title
                            <input
                              style={s.fieldInput}
                              value={draft.title}
                              onChange={e => setDraft(p => ({ ...p, title: e.target.value }))}
                            />
                          </label>
                          <label style={s.fieldLabel}>
                            Source
                            <input
                              style={s.fieldInput}
                              value={draft.source}
                              onChange={e => setDraft(p => ({ ...p, source: e.target.value }))}
                            />
                          </label>
                        </div>
                        <label style={s.fieldLabel}>
                          Body
                          <textarea
                            style={{ ...s.fieldInput, ...s.bodyTextarea }}
                            value={draft.body}
                            onChange={e => setDraft(p => ({ ...p, body: e.target.value }))}
                          />
                        </label>
                        <label style={s.fieldLabel}>
                          Prayer
                          <textarea
                            style={{ ...s.fieldInput, ...s.prayerTextarea }}
                            value={draft.prayer}
                            onChange={e => setDraft(p => ({ ...p, prayer: e.target.value }))}
                          />
                        </label>
                        <div style={s.editActions}>
                          <button
                            style={s.btnSave}
                            disabled={busy}
                            onClick={() => save(d.id)}
                          >
                            {busy ? 'Saving…' : 'Save changes'}
                          </button>
                          <button style={s.btnCancelLg} onClick={() => setEditId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------- styles ----------

const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '24px 20px 60px',
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
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 16,
  },
  h1: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    margin: '4px 0 0',
    color: '#64748b',
    fontSize: 13,
  },
  toolbar: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: 220,
    maxWidth: 380,
    padding: '7px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
  },
  select: {
    padding: '7px 10px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 14,
    background: 'white',
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '7px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 13,
    background: 'white',
    cursor: 'pointer',
    color: '#475569',
  },
  errorBanner: {
    marginBottom: 12,
    padding: '10px 14px',
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: 6,
    color: '#dc2626',
    fontSize: 13,
  },
  tableWrap: {
    overflowX: 'auto',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    background: '#1e293b',
    color: '#e2e8f0',
    padding: '10px 12px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: '9px 12px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
  },
  cellMuted: {
    color: '#64748b',
    fontSize: 13,
  },
  rowEven: { background: '#ffffff' },
  rowOdd: { background: '#f8fafc' },
  rowActive: { background: '#eff6ff' },

  // Action buttons in table row
  btnEdit: {
    marginRight: 4,
    padding: '4px 10px',
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    color: '#0f172a',
  },
  btnCancel: {
    marginRight: 4,
    padding: '4px 10px',
    border: '1px solid #bfdbfe',
    borderRadius: 4,
    background: '#eff6ff',
    cursor: 'pointer',
    fontSize: 12,
    color: '#2563eb',
  },
  btnMove: {
    marginRight: 2,
    padding: '4px 8px',
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    color: '#475569',
  },

  // Edit panel
  editTd: {
    padding: 0,
    background: '#f0f9ff',
    borderBottom: '2px solid #bfdbfe',
  },
  editPanel: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  editGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: 14,
  },
  fieldLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  fieldInput: {
    padding: '8px 10px',
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
  bodyTextarea: {
    minHeight: 160,
    resize: 'vertical',
    lineHeight: 1.6,
  },
  prayerTextarea: {
    minHeight: 80,
    resize: 'vertical',
    lineHeight: 1.6,
  },
  editActions: {
    display: 'flex',
    gap: 8,
    paddingTop: 4,
  },
  btnSave: {
    padding: '9px 22px',
    border: 'none',
    borderRadius: 6,
    background: '#2563eb',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnCancelLg: {
    padding: '9px 18px',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    background: '#fff',
    color: '#475569',
    fontSize: 14,
    cursor: 'pointer',
  },
}
