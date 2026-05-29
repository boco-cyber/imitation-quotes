export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { corsOptions, withCors } from '@/lib/apiResponse'
import { getDevotionalById } from '@/lib/imitationDb'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const devId = Number(id)

  if (!Number.isInteger(devId)) {
    return withCors(request, { error: 'id must be an integer' }, { status: 400 })
  }

  const item = getDevotionalById(devId)

  if (!item) {
    return withCors(request, { error: 'Devotional not found' }, { status: 404 })
  }

  return withCors(request, { item })
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request)
}
