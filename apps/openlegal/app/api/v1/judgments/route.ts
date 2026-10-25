import { NextRequest, NextResponse } from 'next/server'
import { toolSearchJudgments } from '@/lib/tools'

export const dynamic = 'force-dynamic'

// GET /api/v1/judgments?q=&court=&case_type=&year_from=&year_to=&page=&limit=&include_samples=
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const num = (k: string) => (p.get(k) ? Number(p.get(k)) || undefined : undefined)
  try {
    const data = await toolSearchJudgments({
      query: p.get('q') ?? undefined,
      court: p.get('court') ?? undefined,
      case_type: p.get('case_type') ?? undefined,
      year_from: num('year_from'),
      year_to: num('year_to'),
      page: num('page'),
      limit: num('limit'),
      include_samples: p.get('include_samples') === 'true',
    })
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' } })
  } catch {
    return NextResponse.json({ error: 'Search is temporarily unavailable' }, { status: 503 })
  }
}
