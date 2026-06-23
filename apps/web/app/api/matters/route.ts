import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { callLLM } from '@/lib/agents/base-agent'

export const dynamic = 'force-dynamic'

function authedClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  )
}

function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET /api/matters — list the current user's matters (owned or joined as lawyer)
export async function GET(request: NextRequest) {
  const { data: { user } } = await authedClient(request).auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await serviceClient()
    .from('matters')
    .select('*')
    .or(`owner_id.eq.${user.id},lawyer_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ matters: data || [] })
}

// POST /api/matters — open a new dispute. AI turns the raw description into
// "one story" (narrative + structured facts), then the matter enters the pipeline.
// Body: { title, counterparty?, claimAmount?, description }
export async function POST(request: NextRequest) {
  const { data: { user } } = await authedClient(request).auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, counterparty, claimAmount, description } = body
  if (!title || !description) {
    return NextResponse.json({ error: 'Required: title and description' }, { status: 400 })
  }

  // Layer 2 — turn the chaos into one case narrative + structured facts.
  let narrative = description
  let facts: Record<string, unknown> = {}
  let stage: 'intake' | 'analysis' = 'intake'
  try {
    const raw = await callLLM(
      [
        {
          role: 'system',
          content: `You are a Nigerian legal intake analyst. From a plain-language dispute description, produce ONE coherent case narrative and structured facts. Return ONLY valid JSON, no markdown:
{
  "narrative": "<3-5 sentence neutral case narrative>",
  "facts": { "who": "<claimant>", "againstWhom": "<respondent>", "what": "<core issue>", "when": "<timeframe if any>", "claims": ["<claim>"], "claimAmountNGN": <number or null> }
}`,
        },
        {
          role: 'user',
          content: `Title: ${title}\nAgainst: ${counterparty || 'unspecified'}\nClaim amount (NGN): ${claimAmount || 'unspecified'}\n\nDescription:\n${description}`,
        },
      ],
      0.3
    )
    const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim()
    const parsed = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1))
    if (parsed.narrative) narrative = parsed.narrative
    if (parsed.facts) facts = parsed.facts
    stage = 'analysis'
  } catch (e) {
    // Graceful fallback: keep the raw description as the narrative.
    console.warn('Matter intake AI unavailable, using raw description:', e)
  }

  const { data, error } = await serviceClient()
    .from('matters')
    .insert({
      owner_id: user.id,
      owner_email: user.email,
      title,
      counterparty: counterparty || null,
      claim_amount: claimAmount ? Number(claimAmount) : null,
      stage,
      narrative,
      facts,
    })
    .select()
    .single()

  if (error) {
    console.error('Matter create error:', error)
    return NextResponse.json({ error: 'Failed to create matter: ' + error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, matter: data })
}
