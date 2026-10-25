import { NextRequest, NextResponse } from 'next/server'
import { submitJudgment } from '@/lib/contrib'
import { currentContributor } from '@/lib/session'

export const dynamic = 'force-dynamic'

// POST /api/contribute/submit — the website upload form (signed-in contributors).
export async function POST(req: NextRequest) {
  const { contributor } = await currentContributor()
  if (!contributor || contributor.is_blocked) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  try {
    return NextResponse.json(await submitJudgment(contributor, body, 'web'))
  } catch (e) {
    console.error('submit failed', e)
    return NextResponse.json({ error: 'Could not save the submission. Try again.' }, { status: 500 })
  }
}
