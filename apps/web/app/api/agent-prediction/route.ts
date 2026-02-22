import { NextRequest, NextResponse } from 'next/server'
import { createPredictionAgent } from '@/lib/agents/prediction-agent'
import { getMemoryManager } from '@/lib/agents/memory'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await req.json()
    const { action, market, markets, caseInfo, userId, court, category, judge } = body

    const agent = createPredictionAgent()
    await agent.initialize()

    let result: any

    switch (action) {
      case 'analyze_market':
        if (!market) return NextResponse.json({ success: false, error: 'Market data required' }, { status: 400 })
        result = await agent.analyzeMarket(market)
        break

      case 'analyze_multiple':
        if (!markets?.length) return NextResponse.json({ success: false, error: 'Markets array required' }, { status: 400 })
        result = await agent.analyzeMultipleMarkets(markets)
        break

      case 'predict_case':
        if (!caseInfo) return NextResponse.json({ success: false, error: 'Case info required' }, { status: 400 })
        result = await agent.predictCaseOutcome(caseInfo)
        break

      case 'find_opportunities':
        if (!markets?.length) return NextResponse.json({ success: false, error: 'Markets array required' }, { status: 400 })
        result = await agent.findContrarianOpportunities(markets)
        break

      case 'judicial_patterns':
        if (!court || !category) return NextResponse.json({ success: false, error: 'Court and category required' }, { status: 400 })
        result = await agent.analyzeJudicialPatterns({ court, category, judge })
        break

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    if (userId) {
      const memory = getMemoryManager()
      await memory.remember(`Prediction: ${action}`, 'solution', { userId, importance: 0.6 })
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        agentVersion: '2.0.0-predictions',
        disclaimer: 'AI predictions are informational only. Past patterns do not guarantee future outcomes.'
      }
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const marketId = req.nextUrl.searchParams.get('marketId')
  const title = req.nextUrl.searchParams.get('title')
  const category = req.nextUrl.searchParams.get('category') || 'General'
  const yes = parseInt(req.nextUrl.searchParams.get('yes') || '50')
  const no = parseInt(req.nextUrl.searchParams.get('no') || '50')

  if (!marketId || !title) return NextResponse.json({ success: false, error: 'marketId and title required' }, { status: 400 })

  try {
    const agent = createPredictionAgent()
    await agent.initialize()
    const analysis = await agent.analyzeMarket({
      id: marketId, title, description: title, category,
      deadline: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      yes_votes: yes, no_votes: no, total_pool: (yes + no) * 1000
    })

    return NextResponse.json({
      success: true,
      prediction: analysis.aiPrediction.outcome,
      confidence: analysis.aiPrediction.confidence,
      recommendation: analysis.recommendation.action,
      riskLevel: analysis.riskAssessment.level
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
