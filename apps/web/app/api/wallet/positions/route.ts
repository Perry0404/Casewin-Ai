import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - Get user positions
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ 
        positions: [],
        isDemo: true,
        message: 'Login to track positions'
      });
    }

    // Get user positions with market info
    const { data: positions, error } = await supabase
      .from('positions')
      .select(`
        *,
        prediction_markets (
          id,
          title,
          category,
          status,
          closes_at,
          outcome_options,
          actual_outcome
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching positions:', error);
      return NextResponse.json({ positions: [], error: error.message });
    }

    // Transform positions with current prices
    const transformedPositions = (positions || []).map(pos => {
      const market = pos.prediction_markets;
      const yesShares = market?.outcome_options?.yes_shares || 10000;
      const noShares = market?.outcome_options?.no_shares || 10000;
      const total = yesShares + noShares;

      const currentPrice = pos.outcome === 'yes' 
        ? noShares / total 
        : yesShares / total;

      const currentValue = pos.shares * currentPrice;
      const invested = pos.shares * pos.avg_price;
      const profitLoss = currentValue - invested;

      return {
        id: pos.id,
        marketId: pos.market_id,
        marketTitle: market?.title || 'Unknown Market',
        category: market?.category || 'other',
        outcome: pos.outcome,
        shares: pos.shares,
        avgPrice: pos.avg_price,
        currentPrice,
        currentValue,
        invested,
        profitLoss,
        profitLossPercent: invested > 0 ? (profitLoss / invested) * 100 : 0,
        status: market?.status || 'open',
        closesAt: market?.closes_at,
        createdAt: pos.created_at
      };
    });

    return NextResponse.json({ 
      positions: transformedPositions,
      isDemo: false
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ positions: [], error: 'Failed to fetch positions' });
  }
}
