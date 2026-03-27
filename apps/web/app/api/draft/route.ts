import { NextRequest, NextResponse } from 'next/server'

const GROK_API_KEY = process.env.GROK_API_KEY || ''
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const GROK_MODEL = process.env.GROK_MODEL || 'grok-3'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { documentType, parties, terms, jurisdiction } = body

    if (!documentType || !parties) {
      return NextResponse.json({ success: false, error: 'documentType and parties are required' }, { status: 400 })
    }

    if (!GROK_API_KEY) {
      return NextResponse.json({ success: false, error: 'AI service not configured. Set GROK_API_KEY.' }, { status: 500 })
    }

    const grokRes = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert Nigerian legal document drafter. Draft professional legal documents compliant with Nigerian law including CAMA 2020, Evidence Act, Land Use Act, and other applicable legislation. Include all standard legal clauses.'
          },
          {
            role: 'user',
            content: `Draft a ${documentType} for the following parties: ${parties}\n\n${terms ? `Key terms: ${terms}` : ''}\n${jurisdiction ? `Jurisdiction: ${jurisdiction}` : 'Jurisdiction: Nigeria'}\n\nInclude all necessary legal provisions, boilerplate clauses, and ensure compliance with Nigerian law.`
          }
        ],
        temperature: 0.4,
        max_tokens: 6000,
      }),
    })

    if (!grokRes.ok) {
      const errText = await grokRes.text()
      throw new Error(`Grok API returned ${grokRes.status}: ${errText}`)
    }

    const grokData = await grokRes.json()
    const document = grokData.choices?.[0]?.message?.content || ''

    return NextResponse.json({ success: true, document })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Draft error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
