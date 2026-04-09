import { NextRequest, NextResponse } from 'next/server'

const GROK_API_KEY = process.env.GROK_API_KEY || ''
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const GROK_MODEL = process.env.GROK_MODEL || 'grok-3'

interface BriefSection {
  title: string
  type: 'legislation' | 'court_decision' | 'regulatory' | 'market' | 'compliance' | 'opportunity'
  summary: string
  impact: 'high' | 'medium' | 'low'
  practiceAreas: string[]
  actionItems: string[]
  source?: string
  date?: string
}

interface DailyBrief {
  date: string
  headline: string
  sections: BriefSection[]
  marketInsights: string[]
  upcomingDeadlines: string[]
  generatedAt: string
}

export async function POST(req: NextRequest) {
  try {
    const { practiceAreas, jurisdiction, firmName } = await req.json()

    if (!GROK_API_KEY) {
      return NextResponse.json({ success: false, error: 'AI service not configured' }, { status: 500 })
    }

    const areas = Array.isArray(practiceAreas) && practiceAreas.length > 0
      ? practiceAreas.join(', ')
      : 'general Nigerian law'

    const today = new Date().toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

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
            content: `You are CaseWin AI's Daily Intelligence Brief engine for Nigerian legal professionals. You provide actionable, real intelligence — not generic summaries. Today is ${today}.

You MUST return ONLY valid JSON (no markdown, no explanation) matching this exact schema:
{
  "headline": "One-line top story of the day",
  "sections": [
    {
      "title": "Section title",
      "type": "legislation|court_decision|regulatory|market|compliance|opportunity",
      "summary": "2-3 sentence detailed summary with specific facts, names, dates",
      "impact": "high|medium|low",
      "practiceAreas": ["relevant areas"],
      "actionItems": ["Specific action lawyer should take"],
      "source": "Source name or publication",
      "date": "YYYY-MM-DD"
    }
  ],
  "marketInsights": ["Insight about legal market trends"],
  "upcomingDeadlines": ["Important upcoming regulatory or filing deadlines"]
}

RULES:
- Include 6-10 sections covering: new legislation/bills, recent court decisions, regulatory changes, compliance alerts, business opportunities for lawyers
- Focus on REAL, CURRENT Nigerian legal developments — reference actual agencies (SEC, CBN, CAC, FIRS, NLC, NBA, EFCC, ICPC, NCC)
- Each section must have at least 1 concrete action item
- Prioritize items relevant to: ${areas}
- Impact should reflect how much it affects daily legal practice
- Include at least 2 upcoming regulatory or filing deadlines
- Be specific: use real names of laws, agencies, and cases where applicable
${firmName ? `- Tailor insights for a firm called "${firmName}"` : ''}
${jurisdiction ? `- Focus on ${jurisdiction} jurisdiction` : '- Cover federal and Lagos/Abuja state developments'}`
          },
          {
            role: 'user',
            content: `Generate today's Daily Intelligence Brief for a Nigerian legal professional specializing in: ${areas}. Include the latest developments in legislation, court decisions, regulatory changes, and business opportunities. Be specific and actionable.`
          }
        ],
        temperature: 0.3,
        max_tokens: 6000,
      }),
    })

    if (!grokRes.ok) {
      const errText = await grokRes.text()
      throw new Error(`AI API returned ${grokRes.status}: ${errText}`)
    }

    const grokData = await grokRes.json()
    const content = grokData.choices?.[0]?.message?.content || ''

    // Parse JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse intelligence brief from AI')
    }

    const briefData = JSON.parse(jsonMatch[0])

    const brief: DailyBrief = {
      date: today,
      headline: briefData.headline || 'Daily Intelligence Brief',
      sections: (briefData.sections || []).map((s: Record<string, unknown>) => ({
        title: s.title || '',
        type: s.type || 'regulatory',
        summary: s.summary || '',
        impact: s.impact || 'medium',
        practiceAreas: Array.isArray(s.practiceAreas) ? s.practiceAreas : [],
        actionItems: Array.isArray(s.actionItems) ? s.actionItems : [],
        source: s.source || '',
        date: s.date || '',
      })),
      marketInsights: briefData.marketInsights || [],
      upcomingDeadlines: briefData.upcomingDeadlines || [],
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, brief })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Intelligence brief error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
