import { NextRequest, NextResponse } from 'next/server'

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY || ''
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const GROK_MODEL = process.env.GROK_MODEL || 'grok-3'

export async function POST(req: NextRequest) {
  try {
    const { contractText } = await req.json()

    if (!contractText) {
      return NextResponse.json({ success: false, error: 'Contract text is required' }, { status: 400 })
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
            content: 'You are a contract analysis expert specializing in Nigerian law. Analyze contracts for risks, unfair terms, missing clauses, and compliance with Nigerian law (CAMA 2020, Evidence Act, etc.). Include a risk score from 0 to 100.'
          },
          {
            role: 'user',
            content: `Analyze the following contract:\n\n${contractText}\n\nProvide:\n1. Legal risks and liabilities\n2. Unfair or one-sided terms\n3. Missing clauses (force majeure, dispute resolution, etc.)\n4. Compliance with Nigerian contract law\n5. Recommendations for improvement\n6. Risk score (0-100)`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    })

    if (!grokRes.ok) {
      const errText = await grokRes.text()
      throw new Error(`Grok API returned ${grokRes.status}: ${errText}`)
    }

    const grokData = await grokRes.json()
    const responseText = grokData.choices?.[0]?.message?.content || ''

    const riskScoreMatch = responseText.match(/risk score[:\s]+(\d+)/i)
    const riskScore = riskScoreMatch ? parseInt(riskScoreMatch[1]) : 50

    return NextResponse.json({
      success: true,
      analysis: responseText,
      riskScore,
      riskLevel: riskScore < 30 ? 'Low' : riskScore < 70 ? 'Medium' : 'High',
      analyzedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Contract analysis error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
