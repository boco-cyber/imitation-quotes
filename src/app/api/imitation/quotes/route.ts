export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { corsOptions, withCors } from '@/lib/apiResponse'
import { queryDevotionals, DevotionalFilters } from '@/lib/imitationDb'

function intParam(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isInteger(n) ? n : undefined
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const filters: DevotionalFilters = {
    day: intParam(params.get('day')),
    date: params.get('date') || undefined,
    q: params.get('q') || undefined,
    limit: intParam(params.get('limit')),
    offset: intParam(params.get('offset')),
  }

  if (params.get('day') && (!filters.day || filters.day < 1 || filters.day > 365)) {
    return withCors(request, { error: 'day must be an integer from 1 to 365' }, { status: 400 })
  }

  if (filters.date && !/^\d{2}-\d{2}$/.test(filters.date)) {
    return withCors(request, { error: 'date must use MM-DD format' }, { status: 400 })
  }

  return withCors(request, queryDevotionals(filters))
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request)
}
