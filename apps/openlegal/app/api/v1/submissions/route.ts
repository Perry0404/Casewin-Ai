import { NextRequest, NextResponse } from 'next/server'
import { contributorByKey, keyFromRequest, myContributions, submitJudgment } from '@/lib/contrib'

export const dynamic = 'force-dynamic'

// POST /api/v1/submissions   (Authorization: Bearer olk_…)  — contribute a judgment
// GET  /api/v1/submissions   — your points and submission statuses
export async function POST(req: NextRequest) {
  const c = await contributorByKey(keyFromRequest(req))
  if (!c) return NextResponse.json({ error: 'A valid OpenLegal contributor key is required' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  try {
    return NextResponse.json(await submitJudgment(c, body, 'api'))
  } catch {
    return NextResponse.json({ error: 'Could not save the submission' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const c = await contributorByKey(keyFromRequest(req))
  if (!c) return NextResponse.json({ error: 'A valid OpenLegal contributor key is required' }, { status: 401 })
  return NextResponse.json(await myContributions(c))
}
