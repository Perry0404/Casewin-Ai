import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export const dynamic = 'force-dynamic'

// POST /api/dispute/settlement
// Layer 3 — AI dispute resolution. Estimates settlement probability, a
// settlement range, expected timeline and litigation risk so parties can
// resolve before a matter ever reaches court.
//
// Body: {
//   matter, claimAmount (NGN), facts, evidenceStrength ('weak'|'moderate'|'strong'),
//   party ('claimant'|'defendant'), priorOffers?, jurisdiction?
// }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      matter,
      claimAmount,
      facts,
      evidenceStrength = 'moderate',
      party = 'claimant',
      priorOffers,
      jurisdiction = 'Nigeria',
    } = body

    if (!matter || !facts) {
      return NextResponse.json(
        { error: 'Required: matter and facts' },
        { status: 400 }
      )
    }

    const system = `You are a Nigerian dispute-resolution analyst. You estimate the PROBABILITY of outcomes and a realistic settlement zone — you are NOT predicting "justice", you are modelling risk so parties can settle sensibly and avoid years of litigation.

Base your reasoning on typical Nigerian civil practice: court backlogs, adjournment culture, cost of litigation, time value of money, and the strength of the evidence described. Be concrete and realistic about timelines (Nigerian suits commonly run 3–5 years to judgment).

Return ONLY a valid JSON object, no markdown, with this exact shape:
{
  "settlementProbability": <integer 0-100>,
  "recommendedSettlement": { "low": <NGN integer>, "mid": <NGN integer>, "high": <NGN integer> },
  "expectedTimeline": { "settle": "<e.g. 2-6 weeks>", "litigate": "<e.g. 3-5 years>" },
  "litigationRisk": "<low|medium|high>",
  "winProbabilityIfLitigated": <integer 0-100>,
  "estimatedLitigationCostNGN": <NGN integer>,
  "rationale": "<2-4 sentence explanation>",
  "recommendation": "<one clear recommended next step for the ${party}>",
  "keyFactors": ["<factor>", "<factor>", "<factor>"]
}`

    const user = `Matter: ${matter}
Jurisdiction: ${jurisdiction}
Party seeking advice: ${party}
Claim amount (NGN): ${claimAmount || 'not specified'}
Evidence strength: ${evidenceStrength}
${priorOffers ? `Prior settlement offers: ${priorOffers}` : ''}

Facts:
${facts}

Produce the settlement analysis as specified.`

    let analysis: Record<string, unknown> | null = null
    try {
      const raw = await callLLM(
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        0.3
      )
      // Strip code fences if the model added them, then parse.
      const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim()
      const start = cleaned.indexOf('{')
      const end = cleaned.lastIndexOf('}')
      analysis = JSON.parse(cleaned.slice(start, end + 1))
    } catch (e) {
      console.error('Settlement engine LLM/parse error:', e)
      return NextResponse.json(
        { error: 'Could not generate a settlement analysis right now. Please try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, analysis })
  } catch (err) {
    console.error('Settlement engine error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
