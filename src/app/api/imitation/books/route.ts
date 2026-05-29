export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { corsOptions, withCors } from '@/lib/apiResponse'
import { getBooks, getUniqueSources, getBookNumber } from '@/lib/imitationDb'

export async function GET(request: NextRequest) {
  const allSources = getUniqueSources()
  const items = getBooks().map(book => ({
    ...book,
    chapterCount: allSources.filter(s => getBookNumber(s) === book.id).length,
  }))
  return withCors(request, { items })
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request)
}
