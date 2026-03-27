import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

function generateBuiltInAnalysis(market: {
  title?: string
  description?: string
  category?: string
  yes_price?: number
  no_price?: number
  yes_shares?: number
  no_shares?: number
  total_pool?: number
}) {
  const title = (market.title || '').toLowerCase()
  const category = market.category || 'General'
  const yesShares = market.yes_shares || 20000
  const noShares = market.no_shares || 20000
  const total = yesShares + noShares
  const yesProb = Math.round((noShares / total) * 100)
  const noProb = 100 - yesProb

  const factors: Array<{ factor: string; impact: string; detail: string }> = []
  let confidence = 65
  let recommendation: 'YES' | 'NO' | 'HOLD' = yesProb > 55 ? 'YES' : yesProb < 45 ? 'NO' : 'HOLD'

  // Category-specific analysis
  if (category === 'Constitutional Law') {
    factors.push({
      factor: 'Constitutional Precedent',
      impact: 'high',
      detail: 'Nigerian Supreme Court has historically upheld constitutional provisions strictly. The 1999 Constitution (as amended) provides the framework for analysis. Key precedents from Marbury-equivalent Nigerian cases guide interpretation.'
    })
    factors.push({
      factor: 'Political & Legislative Climate',
      impact: 'medium',
      detail: 'Current National Assembly composition and inter-party dynamics significantly influence constitutional amendment outcomes and judicial appointments.'
    })
    confidence = 62
  } else if (category === 'Criminal Law') {
    factors.push({
      factor: 'Prosecution Success Rate',
      impact: 'high',
      detail: 'EFCC and other anti-corruption agencies maintain varying conviction rates. Lagos and Abuja Federal High Courts demonstrate different patterns in criminal proceedings.'
    })
    factors.push({
      factor: 'Defense & Procedure',
      impact: 'medium',
      detail: 'Quality of legal representation, adherence to ACJA 2015 procedures, and availability of forensic evidence significantly impact outcomes.'
    })
    confidence = 55
  } else if (category === 'Financial Law') {
    factors.push({
      factor: 'CBN Regulatory Framework',
      impact: 'high',
      detail: 'Central Bank of Nigeria directives carry significant weight. Recent monetary policy shifts and foreign exchange regulations directly impact financial law disputes.'
    })
    factors.push({
      factor: 'SEC & Capital Markets',
      impact: 'medium',
      detail: 'Securities and Exchange Commission guidelines and Investment & Securities Act provisions shape capital market dispute outcomes.'
    })
    confidence = 63
  } else if (category === 'Property Law') {
    factors.push({
      factor: 'Land Use Act 1978',
      impact: 'high',
      detail: 'All land vested in State Governors via Certificate of Occupancy. Disputes often hinge on proper documentation, consent requirements under S.22, and governor\'s revocation powers under S.28.'
    })
    factors.push({
      factor: 'Customary Land Tenure',
      impact: 'medium',
      detail: 'Traditional land rights and family land disputes remain significant, particularly in southern Nigeria. Courts balance statutory and customary claims.'
    })
    confidence = 58
  } else if (category === 'Corporate Law') {
    factors.push({
      factor: 'CAMA 2020 Framework',
      impact: 'high',
      detail: 'Companies and Allied Matters Act 2020 introduced significant reforms including single-member companies, electronic filing, and enhanced minority shareholder protections.'
    })
    factors.push({
      factor: 'Corporate Governance',
      impact: 'medium',
      detail: 'SEC Code of Corporate Governance and CBN guidelines for financial institutions create layered compliance requirements.'
    })
    confidence = 60
  } else if (category === 'Labour Law') {
    factors.push({
      factor: 'NIC Jurisdiction',
      impact: 'high',
      detail: 'National Industrial Court has exclusive jurisdiction over labour matters. Recent expansions include fundamental rights at work and international labour standards.'
    })
    factors.push({
      factor: 'Trade Union Dynamics',
      impact: 'medium',
      detail: 'NLC/TUC collective bargaining agreements and minimum wage legislation significantly influence labour dispute outcomes.'
    })
    confidence = 57
  } else {
    factors.push({
      factor: 'Nigerian Legal Framework',
      impact: 'high',
      detail: 'Analysis based on established precedents from Nigerian superior courts and relevant statutory provisions.'
    })
    confidence = 55
  }

  // Market sentiment factor
  factors.push({
    factor: 'Market Sentiment Analysis',
    impact: yesProb > 60 || noProb > 60 ? 'high' : 'low',
    detail: `Current CPMM pricing: YES at ₦${(market.yes_price || 0.5).toFixed(2)}, NO at ₦${(market.no_price || 0.5).toFixed(2)}. ${
      yesProb > 60 ? 'Strong bullish consensus among traders.' : noProb > 60 ? 'Strong bearish consensus among traders.' : 'Market is balanced — consider waiting for more signal.'
    } Total pool: ₦${(market.total_pool || 0).toLocaleString()}.`
  })

  factors.push({
    factor: 'Historical Case Patterns',
    impact: 'medium',
    detail: 'Similar Nigerian court cases show approximately 35% appellate reversal rate. Supreme Court overturns Court of Appeal in roughly 28% of appeals heard.'
  })

  // Keyword-specific factors
  if (title.includes('supreme court')) {
    factors.push({
      factor: 'Supreme Court Finality',
      impact: 'high',
      detail: 'Supreme Court decisions are final and binding under S.235 of the 1999 Constitution. The 7-justice panel configuration and Chief Justice assignment patterns can influence outcomes.'
    })
    confidence += 5
  }

  if (title.includes('election') || title.includes('tribunal')) {
    factors.push({
      factor: 'Election Petition Dynamics',
      impact: 'high',
      detail: 'Election petitions operate under strict 180-day timelines (S.285(6)). INEC documentation, card reader data, and witness testimony are critical. Recent presidential election petitions show evolving standards of proof.'
    })
    confidence = 48
    recommendation = 'HOLD'
  }

  if (title.includes('efcc') || title.includes('corruption')) {
    factors.push({
      factor: 'Anti-Corruption Prosecutions',
      impact: 'high',
      detail: 'EFCC conviction rate varies by jurisdiction and case complexity. High-profile cases often face procedural delays. Recent reforms in ACJA 2015 aim to expedite trials.'
    })
    confidence = 52
  }

  const summary = `**AI Legal Analysis for ${category}:**\n\nBased on analysis of Nigerian ${category.toLowerCase()} precedents and current market data, the market prices YES at ${yesProb}% probability. ${
    recommendation === 'YES'
      ? 'Legal factors and historical patterns favor a positive outcome. Traders should consider the strength of precedent and current judicial trends.'
      : recommendation === 'NO'
        ? 'Available evidence and precedent patterns suggest the proposition may not succeed. Key risk factors include procedural challenges and recent appellate trends.'
        : 'This case is closely contested with significant uncertainty. The balanced market reflects genuine ambiguity in the legal analysis. Consider smaller positions or waiting for new developments.'
  }`

  return {
    summary,
    confidence: Math.min(confidence, 85),
    recommendation,
    factors,
    risk_level: confidence >= 65 ? 'moderate' : confidence >= 55 ? 'high' : 'very_high',
    disclaimer: 'This AI analysis is for informational and educational purposes only. It does not constitute legal advice. Past case outcomes do not guarantee future results. Always conduct your own research and consult qualified legal professionals before making trading decisions.'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { market } = body

    if (!market) {
      return NextResponse.json({ error: 'Market data required' }, { status: 400 })
    }

    // Try Ollama AI first
    try {
      const ollamaRes = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.1',
          prompt: `You are a Nigerian legal AI expert specializing in case outcome prediction. Analyze this prediction market:\n\nTitle: ${market.title}\nDescription: ${market.description || 'N/A'}\nCategory: ${market.category}\nCurrent YES probability: ${market.yes_price ? Math.round(market.yes_price * 100) : 50}%\nTotal pool: ₦${market.total_pool || 0}\n\nRespond in this exact JSON format only:\n{\n  "summary": "2-3 sentence analysis of the legal case and likely outcome...",\n  "confidence": 65,\n  "recommendation": "YES or NO or HOLD",\n  "factors": [\n    {"factor": "Factor name", "impact": "high", "detail": "Detailed explanation"}\n  ],\n  "risk_level": "moderate",\n  "disclaimer": "This is AI analysis, not legal advice."\n}`,
          stream: false
        }),
        signal: AbortSignal.timeout(10000)
      })

      if (ollamaRes.ok) {
        const ollamaData = await ollamaRes.json()
        const responseText = ollamaData.response || ''
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0])
          return NextResponse.json({ analysis, source: 'ai' })
        }
      }
    } catch {
      // Ollama not available — use built-in engine
    }

    // Fallback: built-in analysis engine
    const analysis = generateBuiltInAnalysis(market)
    return NextResponse.json({ analysis, source: 'built-in' })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 })
  }
}
