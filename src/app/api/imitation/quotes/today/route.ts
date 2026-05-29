export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { corsOptions, withCors } from '@/lib/apiResponse'
import { getDailyDevotional } from '@/lib/imitationDb'

function dateFromParam(value: string | null): Date | undefined {
  if (!value) return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get('date')
  const date = dateFromParam(dateParam)

  if (dateParam && !date) {
    return withCors(request, { error: 'date must use YYYY-MM-DD format' }, { status: 400 })
  }

  return withCors(request, { item: getDailyDevotional(date) })
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request)
}
