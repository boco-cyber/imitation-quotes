export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminGetAll } from '@/lib/adminDb'

export async function GET() {
  return NextResponse.json({ items: adminGetAll() })
}
