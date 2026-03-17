import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST - Get AI analysis for a specific market
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const { marketId } = await request.json();
    if (!marketId) {
      return NextResponse.json({ error: 'Market ID required' }, { status: 400 });
    }

    const admin = getAdmin();

    // Check if we already have a recent analysis (< 1 hour old)
    const { data: cached } = await admin
      .from('ai_market_analyses')
      .select('*')
      .eq('market_id', marketId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      return NextResponse.json({
        analysis: cached,
        cached: true
      });
    }

    // Get market data
    const { data: market } = await admin
      .from('prediction_markets')
      .select('*')
      .eq('id', marketId)
      .single();

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    // Get trading history for this market
    const { data: recentTrades } = await admin
      .from('trades')
      .select('action, outcome, shares, price, total, created_at')
      .eq('market_id', marketId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get AMM state
    const yesShares = market.outcome_options?.yes_shares || 10000;
    const noShares = market.outcome_options?.no_shares || 10000;
    const yesPrice = noShares / (yesShares + noShares);
    const noPrice = yesShares / (yesShares + noShares);
    const totalPool = market.total_pool || 0;

    // Calculate volume and momentum
    const trades = recentTrades || [];
    const totalVolume = trades.reduce((s: number, t: any) => s + (t.total || 0), 0);
    const yesBuys = trades.filter((t: any) => t.action === 'buy' && t.outcome === 'yes').length;
    const noBuys = trades.filter((t: any) => t.action === 'buy' && t.outcome === 'no').length;
    const momentum = yesBuys > 0 || noBuys > 0
      ? ((yesBuys - noBuys) / (yesBuys + noBuys) * 100).toFixed(1)
      : '0';

    // Get API key
    const { data: config } = await admin
      .from('app_config')
      .select('value')
      .eq('key', 'XAI_API_KEY')
      .single();

    const apiKey = config?.value || process.env.XAI_API_KEY || '';

    if (!apiKey) {
      // Return basic analysis without AI
      const basicAnalysis = {
        market_id: marketId,
        ai_probability: yesPrice,
        confidence: 'low',
        risk_level: totalPool < 5000 ? 'high' : totalPool < 50000 ? 'medium' : 'low',
        insight: `Market odds: YES ${(yesPrice * 100).toFixed(1)}% / NO ${(noPrice * 100).toFixed(1)}%. ${trades.length} recent trades.`,
        factors: ['Market price reflects current trader sentiment', 'Limited AI analysis available'],
        recommendation: yesPrice > 0.7 ? 'Strong YES consensus' : yesPrice < 0.3 ? 'Strong NO consensus' : 'Market is undecided — proceed with caution',
        edge_score: 0,
        created_at: new Date().toISOString()
      };

      return NextResponse.json({ analysis: basicAnalysis, cached: false, aiPowered: false });
    }

    // Build AI prompt
    const prompt = `You are a world-class prediction market analyst. Analyze this market and provide a JSON response.

MARKET: "${market.title}"
DESCRIPTION: "${market.description || 'No description'}"
CATEGORY: "${market.category || 'General'}"
CLOSING DATE: "${market.closes_at || 'Not set'}"

CURRENT MARKET DATA:
- YES price: ${(yesPrice * 100).toFixed(1)}% (₦${yesPrice.toFixed(4)} per share)
- NO price: ${(noPrice * 100).toFixed(1)}%
- Total pool: ₦${totalPool.toLocaleString()}
- Trading volume: ₦${totalVolume.toLocaleString()} (last 20 trades)
- Momentum: ${momentum}% (positive = YES momentum)
- Liquidity depth: ${Math.min(yesShares, noShares).toFixed(0)} shares

RECENT TRADE ACTIVITY:
${trades.slice(0, 10).map((t: any) => `  ${t.action.toUpperCase()} ${t.outcome.toUpperCase()} - ${t.shares} shares @ ₦${t.price?.toFixed(2)}`).join('\n') || '  No recent trades'}

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "ai_probability": <your estimated probability 0-1 for YES outcome>,
  "confidence": "<low|medium|high>",
  "risk_level": "<low|medium|high|extreme>",
  "insight": "<2-3 sentence analysis with specific reasoning>",
  "factors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "recommendation": "<1 sentence actionable recommendation>",
  "edge_score": <-100 to 100, positive means YES is underpriced, negative means NO is underpriced>,
  "smart_money_signal": "<bullish|bearish|neutral>",
  "volatility_forecast": "<low|medium|high>"
}`;

    const aiRes = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          { role: 'system', content: 'You are a prediction market analyst. Respond with only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!aiRes.ok) {
      console.error('AI API error:', await aiRes.text());
      return NextResponse.json({ error: 'AI analysis temporarily unavailable' }, { status: 503 });
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';

    // Parse AI response
    let aiAnalysis;
    try {
      // Strip markdown code blocks if present
      const cleaned = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      aiAnalysis = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', rawContent);
      aiAnalysis = {
        ai_probability: yesPrice,
        confidence: 'medium',
        risk_level: 'medium',
        insight: rawContent.slice(0, 300),
        factors: ['AI analysis completed'],
        recommendation: 'Review the market carefully before trading',
        edge_score: 0,
        smart_money_signal: 'neutral',
        volatility_forecast: 'medium'
      };
    }

    // Store analysis in DB
    const analysis = {
      market_id: marketId,
      ai_probability: aiAnalysis.ai_probability,
      confidence: aiAnalysis.confidence,
      risk_level: aiAnalysis.risk_level,
      insight: aiAnalysis.insight,
      factors: aiAnalysis.factors,
      recommendation: aiAnalysis.recommendation,
      edge_score: aiAnalysis.edge_score || 0,
      smart_money_signal: aiAnalysis.smart_money_signal || 'neutral',
      volatility_forecast: aiAnalysis.volatility_forecast || 'medium',
      market_price_at_analysis: yesPrice,
      total_pool_at_analysis: totalPool,
      created_at: new Date().toISOString()
    };

    await admin.from('ai_market_analyses').insert(analysis);

    return NextResponse.json({
      analysis,
      cached: false,
      aiPowered: true
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
  }
}
