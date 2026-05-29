export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { corsOptions, withCors } from '@/lib/apiResponse'

// Topics are not part of the new devotional format.
export async function GET(request: NextRequest) {
  return withCors(request, { items: [] })
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request)
}
