export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { adminSwapDays } from '@/lib/adminDb'

export async function POST(request: NextRequest) {
  const { idA, idB } = await request.json()

  if (!Number.isInteger(idA) || !Number.isInteger(idB)) {
    return NextResponse.json({ error: 'idA and idB must be integers' }, { status: 400 })
  }

  try {
    adminSwapDays(idA, idB)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 404 })
  }
}
