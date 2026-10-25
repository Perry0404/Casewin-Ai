import { NextRequest, NextResponse } from 'next/server'
import { toolGetLawSection, toolListLaws, toolSearchLaws } from '@/lib/tools'

export const dynamic = 'force-dynamic'

// GET /api/v1/laws                      → list statutes
// GET /api/v1/laws?q=fair+hearing       → search sections
// GET /api/v1/laws?law=constitution-1999&section=36 → one section
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const headers = { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' }
  try {
    if (p.get('law') && p.get('section')) {
      const s = await toolGetLawSection({ law_id: p.get('law')!, section: p.get('section')! })
      return s ? NextResponse.json(s, { headers }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (p.get('q')) return NextResponse.json(await toolSearchLaws({ query: p.get('q')!, law: p.get('law') ?? undefined, limit: Number(p.get('limit')) || undefined }), { headers })
    return NextResponse.json(await toolListLaws(), { headers })
  } catch {
    return NextResponse.json({ error: 'Temporarily unavailable' }, { status: 503 })
  }
}
