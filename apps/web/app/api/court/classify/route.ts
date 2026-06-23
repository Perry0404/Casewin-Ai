import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/agents/base-agent'

export const dynamic = 'force-dynamic'

// POST /api/court/classify
// Layer 4 — Court infrastructure. Automatically routes a filed case into the
// correct division so registries stop hand-sorting.
// Body: { text } (the case description / statement of claim)
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    if (!text || String(text).trim().length < 20) {
      return NextResponse.json({ error: 'Provide the case description (at least a sentence).' }, { status: 400 })
    }

    const system = `You are a Nigerian court registry classification engine. Given a case description, route it to the correct division and suggest the appropriate court.

Categories: "Commercial", "Family", "Criminal", "Civil", "Labour", "Land/Property", "Constitutional".
Suggested courts include: Federal High Court, State High Court, Magistrate Court, National Industrial Court, Customary Court, Court of Appeal.

Return ONLY valid JSON, no markdown:
{
  "category": "<one of the categories>",
  "subCategory": "<short specific area, e.g. 'breach of contract'>",
  "confidence": <integer 0-100>,
  "suggestedCourt": "<court name>",
  "urgency": "<low|medium|high>",
  "reasoning": "<1-2 sentences>",
  "estimatedComplexity": "<simple|moderate|complex>"
}`

    let result: Record<string, unknown> | null = null
    try {
      const raw = await callLLM(
        [
          { role: 'system', content: system },
          { role: 'user', content: `Classify this case:\n\n${text}` },
        ],
        0.2
      )
      const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim()
      result = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1))
    } catch (e) {
      console.error('Classify LLM/parse error:', e)
      return NextResponse.json({ error: 'Could not classify the case right now.' }, { status: 502 })
    }

    return NextResponse.json({ success: true, classification: result })
  } catch (err) {
    console.error('Classify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
