import { NextRequest, NextResponse } from 'next/server';
import { getAIModel, MarketData } from '@/lib/ai/prediction-model';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { market } = body;
    
    if (!market || !market.title) {
      return NextResponse.json(
        { error: 'Market data with title is required' },
        { status: 400 }
      );
    }
    
    const marketData: MarketData = {
      title: market.title,
      description: market.description || '',
      category: market.category || 'court_cases',
      market_type: market.market_type || 'binary',
      resolution_date: market.resolution_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      current_yes_price: market.yes_price || 0.5,
      current_no_price: market.no_price || 0.5,
      total_volume: market.total_volume || 0,
      total_traders: market.total_traders || 0,
      historical_prices: market.historical_prices || []
    };
    
    const model = getAIModel();
    const prediction = await model.predict(marketData);
    
    return NextResponse.json({
      success: true,
      prediction: {
        probability: prediction.prediction,
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
        factors: prediction.factors,
        model_version: prediction.model_version
      }
    });
    
  } catch (error) {
    console.error('AI Prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}

// Batch prediction endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { markets } = body;
    
    if (!markets || !Array.isArray(markets)) {
      return NextResponse.json(
        { error: 'Markets array is required' },
        { status: 400 }
      );
    }
    
    const model = getAIModel();
    const predictions: Record<string, unknown>[] = [];
    
    for (const market of markets) {
      const marketData: MarketData = {
        title: market.title,
        description: market.description || '',
        category: market.category || 'court_cases',
        market_type: market.market_type || 'binary',
        resolution_date: market.resolution_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        current_yes_price: market.yes_price || 0.5,
        current_no_price: market.no_price || 0.5,
        total_volume: market.total_volume || 0,
        total_traders: market.total_traders || 0
      };
      
      const prediction = await model.predict(marketData);
      
      predictions.push({
        market_id: market.id,
        title: market.title,
        probability: prediction.prediction,
        confidence: prediction.confidence,
        reasoning: prediction.reasoning
      });
    }
    
    return NextResponse.json({
      success: true,
      predictions,
      count: predictions.length
    });
    
  } catch (error) {
    console.error('Batch AI Prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate batch predictions' },
      { status: 500 }
    );
  }
}

// Get model info
export async function GET() {
  const model = getAIModel();
  
  return NextResponse.json({
    model_name: 'CaseWin AI Prediction Model',
    model_version: '1.0.0-local',
    model_type: 'rule-based-hybrid',
    description: 'Custom prediction model for Nigerian legal and event forecasting',
    capabilities: [
      'Binary market predictions',
      'Legal case outcome analysis',
      'Legislative and regulatory forecasting',
      'Sentiment analysis',
      'Market consensus integration',
      'Multi-factor probability estimation'
    ],
    supported_categories: [
      'court_cases',
      'legal_reform', 
      'supreme_court',
      'elections',
      'corporate',
      'criminal',
      'international',
      'regulatory',
      'sports',
      'entertainment'
    ],
    status: 'active'
  });
}
