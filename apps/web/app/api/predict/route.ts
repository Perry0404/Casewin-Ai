import { NextRequest, NextResponse } from 'next/server'

const GROK_API_KEY = process.env.GROK_API_KEY || ''
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const GROK_MODEL = process.env.GROK_MODEL || 'grok-3'

export async function POST(req: NextRequest) {
  try {
    const { caseFacts, legalIssues, jurisdiction } = await req.json()

    if (!caseFacts) {
      return NextResponse.json({ success: false, error: 'caseFacts is required' }, { status: 400 })
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
            content: 'You are an expert Nigerian legal AI specializing in case outcome prediction. You have deep knowledge of Nigerian case law, Supreme Court judgments, Court of Appeal decisions, and all Nigerian statutes. Provide detailed predictions with supporting precedents and citations.'
          },
          {
            role: 'user',
            content: `Predict the outcome of this case:\n\nCase Facts: ${caseFacts}\nLegal Issues: ${legalIssues || 'To be identified'}\nJurisdiction: ${jurisdiction || 'Nigeria'}\n\nProvide:\n1. Likelihood of success (percentage)\n2. Relevant Nigerian case precedents with citations\n3. Key factors influencing the outcome\n4. Recommended legal strategy\n5. Potential risks and counterarguments`
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
    const prediction = grokData.choices?.[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      prediction,
      metadata: {
        jurisdiction: jurisdiction || 'Nigeria',
        analyzedAt: new Date().toISOString(),
        model: GROK_MODEL,
      }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Case prediction error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
