import { NextRequest, NextResponse } from 'next/server'
import { toolGetJudgment } from '@/lib/tools'

export const dynamic = 'force-dynamic'

// GET /api/v1/judgments/:id
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const j = await toolGetJudgment({ id: params.slug, max_chars: 200000 })
  if (!j) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(j, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } })
}
