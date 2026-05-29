export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { corsOptions, withCors } from '@/lib/apiResponse'
import { getBooks, getDevotionalCount, getUniqueSources } from '@/lib/imitationDb'

export async function GET(request: NextRequest) {
  return withCors(request, {
    name: 'The Imitation of Christ Daily Devotionals API',
    source: 'Thomas A Kempis, The Imitation of Christ',
    calendar: '365-day non-leap devotional calendar',
    counts: {
      books: getBooks().length,
      chapters: getUniqueSources().length,
      devotionals: getDevotionalCount(),
    },
    endpoints: {
      books: '/api/imitation/books',
      chapters: '/api/imitation/articles',
      devotionals: '/api/imitation/quotes',
      today: '/api/imitation/quotes/today',
    },
  })
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request)
}
