export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { corsOptions, withCors } from '@/lib/apiResponse'
import { getUniqueSources, getBookNumber } from '@/lib/imitationDb'

export async function GET(request: NextRequest) {
  const book = request.nextUrl.searchParams.get('book')
  const bookId = book ? Number(book) : undefined

  if (book && (!Number.isInteger(bookId) || bookId! < 1 || bookId! > 4)) {
    return withCors(request, { error: 'book must be a number from 1 to 4' }, { status: 400 })
  }

  const sources = getUniqueSources(bookId)
  const items = sources.map((source, idx) => ({
    id: idx + 1,
    source,
    book_number: getBookNumber(source),
  }))

  return withCors(request, { items })
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request)
}
