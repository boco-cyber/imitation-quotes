export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { adminUpdateDevotional } from '@/lib/adminDb'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const devId = Number(id)

  if (!Number.isInteger(devId)) {
    return NextResponse.json({ error: 'id must be an integer' }, { status: 400 })
  }

  const body = await request.json()
  const patch: { title?: string; source?: string; body?: string; prayer?: string } = {}
  if (typeof body.title === 'string') patch.title = body.title
  if (typeof body.source === 'string') patch.source = body.source
  if (typeof body.body === 'string') patch.body = body.body
  if (typeof body.prayer === 'string') patch.prayer = body.prayer

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  try {
    adminUpdateDevotional(devId, patch)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 404 })
  }
}
