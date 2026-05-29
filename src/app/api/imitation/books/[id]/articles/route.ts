export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { corsOptions, withCors } from '@/lib/apiResponse'
import { getBooks, getUniqueSources, getBookNumber } from '@/lib/imitationDb'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const bookId = Number(id)
  const book = getBooks().find(b => b.id === bookId)

  if (!book) {
    return withCors(request, { error: 'Book not found' }, { status: 404 })
  }

  const sources = getUniqueSources(bookId)
  const items = sources.map((source, idx) => ({
    id: idx + 1,
    source,
    book_number: bookId,
    book_title: book.title,
  }))

  return withCors(request, { book, items })
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request)
}
