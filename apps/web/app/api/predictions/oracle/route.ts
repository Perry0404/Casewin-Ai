import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithXAI } from '@/lib/xai'

export const dynamic = 'force-dynamic'

interface OracleAnalysis {
  market_id: string
  title: string
  ai_probability: number
  ai_confidence: number
  reasoning: string
  key_factors: string[]
  risk_level: 'low' | 'medium' | 'high'
  recommendation: string
  data_sources: string[]
  last_updated: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const marketId = searchParams.get('marketId')
    const category = searchParams.get('category')

    const supabase = await createClient()

    // Fetch markets to analyze
    let query = supabase
      .from('prediction_markets')
      .select('*')
      .eq('status', 'open')
      .order('total_pool', { ascending: false })

    if (marketId) {
      query = query.eq('id', marketId)
    } else if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Limit to prevent excessive API calls
    query = query.limit(marketId ? 1 : 5)

    const { data: markets, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!markets || markets.length === 0) {
      return NextResponse.json({ analyses: [], message: 'No markets found' })
    }

    // Analyze each market with xAI Grok
    const analyses: OracleAnalysis[] = await Promise.all(
      markets.map(async (market) => {
        try {
          return await analyzeMarket(market)
        } catch (err) {
          console.error(`Oracle analysis failed for market ${market.id}:`, err)
          return getFallbackAnalysis(market)
        }
      })
    )

    return NextResponse.json({ 
      analyses,
      oracle_model: 'grok-4',
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Oracle API error:', error)
    return NextResponse.json({ error: 'Oracle analysis failed' }, { status: 500 })
  }
}

// Single market deep analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketId, question } = body

    if (!marketId) {
      return NextResponse.json({ error: 'Market ID required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: market, error } = await supabase
      .from('prediction_markets')
      .select('*')
      .eq('id', marketId)
      .single()

    if (error || !market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    // If user has a specific question about the market
    if (question) {
      const answer = await askOracleQuestion(market, question)
      return NextResponse.json({ answer, market_id: marketId })
    }

    // Full deep analysis
    const analysis = await analyzeMarket(market, true)

    // Update market with AI prediction
    const yesShares = market.outcome_options?.yes_shares || 20000
    const noShares = market.outcome_options?.no_shares || 20000

    await supabase
      .from('prediction_markets')
      .update({
        description: market.description + `\n\n[AI Oracle Update ${new Date().toLocaleDateString()}]: ${analysis.recommendation}`
      })
      .eq('id', marketId)

    return NextResponse.json({ 
      analysis,
      oracle_model: 'grok-4',
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Oracle POST error:', error)
    return NextResponse.json({ error: 'Oracle analysis failed' }, { status: 500 })
  }
}

async function analyzeMarket(market: any, deep: boolean = false): Promise<OracleAnalysis> {
  const yesShares = market.outcome_options?.yes_shares || 20000
  const noShares = market.outcome_options?.no_shares || 20000
  const total = yesShares + noShares
  const currentYesPrice = noShares / total
  const currentNoPrice = yesShares / total

  const systemPrompt = `You are the CaseWin AI Oracle, an advanced prediction market analyst powered by Grok. 
You analyze prediction markets and provide probability assessments based on available data, current events, and logical reasoning.
You specialize in legal, political, technology, cryptocurrency, and global events analysis.
Always provide calibrated probabilities - your confidence should reflect genuine uncertainty.
Consider the Nigerian and African context when relevant.
Current date: ${new Date().toISOString().split('T')[0]}.`

  const prompt = `Analyze this prediction market and provide your assessment:

MARKET: "${market.title}"
DESCRIPTION: ${market.description || 'No description provided'}
CATEGORY: ${market.category}
CURRENT ODDS: YES ${(currentYesPrice * 100).toFixed(1)}% / NO ${(currentNoPrice * 100).toFixed(1)}%
TOTAL POOL: ${market.total_pool || 0} NGN
DEADLINE: ${market.closes_at || 'Not set'}

${deep ? 'Provide a DEEP analysis with extensive reasoning.' : 'Provide a concise analysis.'}

Respond in EXACTLY this JSON format (no other text):
{
  "probability": <number between 0.05 and 0.95 - your assessed YES probability>,
  "confidence": <number between 0.3 and 0.95 - how confident you are in your assessment>,
  "reasoning": "<2-4 sentence explanation of your probability assessment>",
  "key_factors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "risk_level": "<low|medium|high>",
  "recommendation": "<1 sentence trading recommendation>",
  "data_sources": ["<source 1>", "<source 2>"]
}`

  const response = await generateWithXAI(prompt, systemPrompt)

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    
    const parsed = JSON.parse(jsonMatch[0])

    return {
      market_id: market.id,
      title: market.title,
      ai_probability: Math.max(0.05, Math.min(0.95, parsed.probability || 0.5)),
      ai_confidence: Math.max(0.3, Math.min(0.95, parsed.confidence || 0.6)),
      reasoning: parsed.reasoning || 'Analysis unavailable',
      key_factors: parsed.key_factors || [],
      risk_level: ['low', 'medium', 'high'].includes(parsed.risk_level) ? parsed.risk_level : 'medium',
      recommendation: parsed.recommendation || 'No recommendation available',
      data_sources: parsed.data_sources || [],
      last_updated: new Date().toISOString(),
    }
  } catch {
    // If JSON parsing fails, extract what we can
    return getFallbackAnalysis(market, response)
  }
}

async function askOracleQuestion(market: any, question: string): Promise<string> {
  const systemPrompt = `You are the CaseWin AI Oracle. Answer questions about prediction markets concisely and accurately.
Consider Nigerian and African context. Current date: ${new Date().toISOString().split('T')[0]}.`

  const prompt = `Market: "${market.title}"
Description: ${market.description || 'N/A'}
Category: ${market.category}

User Question: ${question}

Provide a clear, concise answer (2-4 sentences).`

  return await generateWithXAI(prompt, systemPrompt)
}

function getFallbackAnalysis(market: any, rawResponse?: string): OracleAnalysis {
  const yesShares = market.outcome_options?.yes_shares || 20000
  const noShares = market.outcome_options?.no_shares || 20000
  const total = yesShares + noShares
  const currentPrice = noShares / total

  return {
    market_id: market.id,
    title: market.title,
    ai_probability: Math.max(0.20, Math.min(0.80, currentPrice)),
    ai_confidence: 0.5,
    reasoning: rawResponse?.substring(0, 300) || 'AI analysis is temporarily unavailable. Using current market price as baseline.',
    key_factors: ['Market price data', 'Historical patterns'],
    risk_level: 'medium',
    recommendation: 'Consider current market odds before trading.',
    data_sources: ['Market data'],
    last_updated: new Date().toISOString(),
  }
}
