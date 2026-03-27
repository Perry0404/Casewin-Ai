import { NextRequest, NextResponse } from 'next/server'

const GROK_API_KEY = process.env.GROK_API_KEY || ''
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const GROK_MODEL = process.env.GROK_MODEL || 'grok-3'

interface MarketData {
  title?: string
  description?: string
  category?: string
  yes_price?: number
  no_price?: number
  yes_shares?: number
  no_shares?: number
  total_pool?: number
}

interface Factor {
  factor: string
  impact: string
  detail: string
}

interface Analysis {
  summary: string
  confidence: number
  recommendation: 'YES' | 'NO' | 'HOLD'
  factors: Factor[]
  risk_level: string
  disclaimer: string
}

function generateBuiltInAnalysis(market: MarketData): Analysis {
  const title = (market.title || '').toLowerCase()
  const category = market.category || 'General'
  const yesShares = market.yes_shares || 20000
  const noShares = market.no_shares || 20000
  const total = yesShares + noShares
  const yesProb = Math.round((noShares / total) * 100)

  const factors: Factor[] = []
  let confidence = 65
  let recommendation: 'YES' | 'NO' | 'HOLD' = yesProb > 55 ? 'YES' : yesProb < 45 ? 'NO' : 'HOLD'

  if (category === 'Constitutional Law') {
    factors.push({ factor: 'Constitutional Precedent', impact: 'high', detail: 'Nigerian Supreme Court has historically upheld constitutional provisions strictly. The 1999 Constitution (as amended) provides the framework.' })
    factors.push({ factor: 'Political Climate', impact: 'medium', detail: 'Current National Assembly composition and inter-party dynamics influence constitutional outcomes.' })
    confidence = 62
  } else if (category === 'Criminal Law') {
    factors.push({ factor: 'Prosecution Success Rate', impact: 'high', detail: 'EFCC and anti-corruption agencies maintain varying conviction rates across jurisdictions.' })
    factors.push({ factor: 'Defense & Procedure', impact: 'medium', detail: 'Adherence to ACJA 2015 procedures and forensic evidence availability impact outcomes.' })
    confidence = 55
  } else if (category === 'Financial Law') {
    factors.push({ factor: 'CBN Regulatory Framework', impact: 'high', detail: 'CBN directives and monetary policy shifts directly impact financial law disputes.' })
    factors.push({ factor: 'SEC & Capital Markets', impact: 'medium', detail: 'SEC guidelines and Investment & Securities Act shape capital market dispute outcomes.' })
    confidence = 63
  } else if (category === 'Property Law') {
    factors.push({ factor: 'Land Use Act 1978', impact: 'high', detail: 'All land vested in State Governors via C of O. Disputes hinge on documentation and consent requirements.' })
    factors.push({ factor: 'Customary Tenure', impact: 'medium', detail: 'Traditional land rights remain significant. Courts balance statutory and customary claims.' })
    confidence = 58
  } else if (category === 'Corporate Law') {
    factors.push({ factor: 'CAMA 2020', impact: 'high', detail: 'CAMA 2020 introduced reforms including single-member companies and enhanced minority protections.' })
    factors.push({ factor: 'Corporate Governance', impact: 'medium', detail: 'SEC Corporate Governance Code and CBN guidelines create layered compliance.' })
    confidence = 60
  } else if (category === 'Labour Law') {
    factors.push({ factor: 'NIC Jurisdiction', impact: 'high', detail: 'National Industrial Court has exclusive jurisdiction over labour matters.' })
    factors.push({ factor: 'Trade Union Dynamics', impact: 'medium', detail: 'NLC/TUC collective bargaining and minimum wage legislation influence outcomes.' })
    confidence = 57
  } else {
    factors.push({ factor: 'Nigerian Legal Framework', impact: 'high', detail: 'Analysis based on established precedents from Nigerian superior courts.' })
    confidence = 55
  }

  factors.push({
    factor: 'Market Sentiment',
    impact: yesProb > 60 || (100 - yesProb) > 60 ? 'high' : 'low',
    detail: `YES at N${(market.yes_price || 0.5).toFixed(2)}, NO at N${(market.no_price || 0.5).toFixed(2)}. Pool: N${(market.total_pool || 0).toLocaleString()}.`
  })

  if (title.includes('election') || title.includes('tribunal')) {
    factors.push({ factor: 'Election Petition', impact: 'high', detail: 'Election petitions operate under strict 180-day timelines (S.285(6)).' })
    confidence = 48
    recommendation = 'HOLD'
  }

  const summary = `AI Legal Analysis for ${category}: Market prices YES at ${yesProb}% probability. ${
    recommendation === 'YES' ? 'Legal factors favor a positive outcome.'
    : recommendation === 'NO' ? 'Evidence suggests the proposition may not succeed.'
    : 'Closely contested with significant uncertainty.'
  }`

  return {
    summary,
    confidence: Math.min(confidence, 85),
    recommendation,
    factors,
    risk_level: confidence >= 65 ? 'moderate' : confidence >= 55 ? 'high' : 'very_high',
    disclaimer: 'This AI analysis is for informational purposes only. It does not constitute legal advice. Always consult qualified legal professionals.'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { market } = body

    if (!market) {
      return NextResponse.json({ error: 'Market data required' }, { status: 400 })
    }

    // Try Grok API first
    if (GROK_API_KEY) {
      try {
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
                content: 'You are a Nigerian legal AI expert specializing in case outcome prediction and prediction market analysis. Respond ONLY with valid JSON.'
              },
              {
                role: 'user',
                content: `Analyze this Nigerian legal prediction market:\n\nTitle: ${market.title}\nDescription: ${market.description || 'N/A'}\nCategory: ${market.category}\nCurrent YES probability: ${market.yes_price ? Math.round(market.yes_price * 100) : 50}%\nTotal pool: N${market.total_pool || 0}\n\nRespond in this exact JSON format:\n{"summary": "2-3 sentence analysis", "confidence": 65, "recommendation": "YES or NO or HOLD", "factors": [{"factor": "Name", "impact": "high/medium/low", "detail": "Explanation"}], "risk_level": "moderate/high/very_high", "disclaimer": "This is AI analysis, not legal advice."}`
              }
            ],
            temperature: 0.3,
            max_tokens: 2000,
          }),
          signal: AbortSignal.timeout(15000)
        })

        if (grokRes.ok) {
          const grokData = await grokRes.json()
          const responseText = grokData.choices?.[0]?.message?.content || ''
          const jsonMatch = responseText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0])
            return NextResponse.json({ analysis, source: 'grok-ai' })
          }
        }
      } catch {
        // Grok unavailable - fall through to built-in
      }
    }

    // Fallback: built-in analysis engine
    const analysis = generateBuiltInAnalysis(market)
    return NextResponse.json({ analysis, source: 'built-in' })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 })
  }
}
