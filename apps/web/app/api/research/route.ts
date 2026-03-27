import { NextRequest, NextResponse } from 'next/server'

const GROK_API_KEY = process.env.GROK_API_KEY || ''
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const GROK_MODEL = process.env.GROK_MODEL || 'grok-3'

export async function POST(req: NextRequest) {
  try {
    const { query, jurisdiction, limit = 10 } = await req.json()

    if (!query) {
      return NextResponse.json({ success: false, error: 'Research query is required' }, { status: 400 })
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
            content: `You are a Nigerian legal research assistant with comprehensive knowledge of Nigerian case law, statutes, and legal principles. When searching for cases, provide real Nigerian case citations, court names, years, summaries, and key holdings. Return up to ${limit} relevant cases. Format each case as a structured entry.`
          },
          {
            role: 'user',
            content: `Research the following legal topic in ${jurisdiction || 'Nigerian'} law:\n\n"${query}"\n\nFind relevant cases, statutes, and legal principles. For each case provide:\n- Case name\n- Citation (e.g., (2020) LPELR-51234(SC))\n- Court (Supreme Court, Court of Appeal, Federal High Court, etc.)\n- Year\n- Summary of facts and decision\n- Key holdings\n\nAlso identify relevant statutes and constitutional provisions.`
          }
        ],
        temperature: 0.2,
        max_tokens: 5000,
      }),
    })

    if (!grokRes.ok) {
      const errText = await grokRes.text()
      throw new Error(`Grok API returned ${grokRes.status}: ${errText}`)
    }

    const grokData = await grokRes.json()
    const researchText = grokData.choices?.[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      query,
      research: researchText,
      totalResults: limit,
      searchedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Legal research error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
