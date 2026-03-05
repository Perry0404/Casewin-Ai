import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const supabase = await createClient();

    let query = supabase
      .from('prediction_markets')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: markets, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ markets: [], error: error.message });
    }

    // Transform data for frontend with AMM pricing
    const transformedMarkets = (markets || []).map(market => {
      // Get shares from outcome_options or use defaults
      // Higher default shares = tighter spread, less slippage for low-liquidity markets
      const yesShares = market.outcome_options?.yes_shares || 20000;
      const noShares = market.outcome_options?.no_shares || 20000;
      const total = yesShares + noShares;

      // Calculate prices using CPMM
      // For low-liquidity markets, cap extreme prices to protect traders
      let yesPrice = noShares / total;
      let noPrice = yesShares / total;

      // Clamp prices between 0.10 and 0.90 to prevent extreme odds
      yesPrice = Math.max(0.10, Math.min(0.90, yesPrice));
      noPrice = Math.max(0.10, Math.min(0.90, noPrice));

      return {
        id: market.id,
        title: market.title,
        description: market.description,
        category: market.category || 'other',
        deadline: market.closes_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        yes_shares: yesShares,
        no_shares: noShares,
        yes_price: yesPrice,
        no_price: noPrice,
        total_pool: market.total_pool || 0,
        liquidity_pool: market.liquidity_pool || 20000,
        resolved: market.status === 'resolved',
        outcome: market.actual_outcome,
        resolution_source: market.resolution_source,
        created_at: market.created_at
      };
    });

    return NextResponse.json({ markets: transformedMarkets });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ markets: [], error: 'Failed to fetch markets' });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { title, description, category, closes_at, initial_liquidity } = body;

    if (!title || title.length < 10) {
      return NextResponse.json({ error: 'Title must be at least 10 characters' }, { status: 400 });
    }

    const liquidity = initial_liquidity || 20000;

    const { data, error } = await supabase
      .from('prediction_markets')
      .insert([{
        title,
        description,
        category: category || 'other',
        closes_at,
        outcome_options: { 
          yes_shares: liquidity, 
          no_shares: liquidity 
        },
        total_pool: 0,
        liquidity_pool: liquidity,
        status: 'open',
        creator_id: user?.id || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Create market error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ market: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to create market' }, { status: 500 });
  }
}


