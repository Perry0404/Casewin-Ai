import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Automated Market Maker (AMM) - Similar to Polymarket/Uniswap
// Uses Constant Product Market Maker (CPMM) formula

interface MarketState {
  yesShares: number;
  noShares: number;
  liquidity: number;
}

// Calculate price using CPMM: x * y = k
function calculatePrice(yesShares: number, noShares: number): { yes: number; no: number } {
  const total = yesShares + noShares;
  return {
    yes: (noShares / total) * 100, // Yes price as percentage
    no: (yesShares / total) * 100,  // No price as percentage
  };
}

// Calculate cost to buy shares
function calculateBuyCost(
  currentYesShares: number,
  currentNoShares: number,
  outcome: 'yes' | 'no',
  sharesToBuy: number
): { cost: number; newPrice: number; priceImpact: number } {
  const k = currentYesShares * currentNoShares; // Constant product
  
  let newYesShares: number;
  let newNoShares: number;
  
  if (outcome === 'yes') {
    // Buying YES means removing YES shares from pool
    newYesShares = currentYesShares - sharesToBuy;
    newNoShares = k / newYesShares;
  } else {
    newNoShares = currentNoShares - sharesToBuy;
    newYesShares = k / newNoShares;
  }
  
  // Cost is the change in the other side
  const cost = outcome === 'yes' 
    ? newNoShares - currentNoShares 
    : newYesShares - currentYesShares;
  
  const oldPrice = calculatePrice(currentYesShares, currentNoShares);
  const newPrice = calculatePrice(newYesShares, newNoShares);
  
  const priceImpact = outcome === 'yes'
    ? ((newPrice.yes - oldPrice.yes) / oldPrice.yes) * 100
    : ((newPrice.no - oldPrice.no) / oldPrice.no) * 100;
  
  return {
    cost: Math.abs(cost),
    newPrice: outcome === 'yes' ? newPrice.yes : newPrice.no,
    priceImpact,
  };
}

// Calculate shares received for selling
function calculateSellReturn(
  currentYesShares: number,
  currentNoShares: number,
  outcome: 'yes' | 'no',
  sharesToSell: number
): { returns: number; newPrice: number; priceImpact: number } {
  const k = currentYesShares * currentNoShares;
  
  let newYesShares: number;
  let newNoShares: number;
  
  if (outcome === 'yes') {
    // Selling YES means adding YES shares to pool
    newYesShares = currentYesShares + sharesToSell;
    newNoShares = k / newYesShares;
  } else {
    newNoShares = currentNoShares + sharesToSell;
    newYesShares = k / newNoShares;
  }
  
  const returns = outcome === 'yes'
    ? currentNoShares - newNoShares
    : currentYesShares - newYesShares;
  
  const oldPrice = calculatePrice(currentYesShares, currentNoShares);
  const newPrice = calculatePrice(newYesShares, newNoShares);
  
  const priceImpact = outcome === 'yes'
    ? ((newPrice.yes - oldPrice.yes) / oldPrice.yes) * 100
    : ((newPrice.no - oldPrice.no) / oldPrice.no) * 100;
  
  return {
    returns: Math.abs(returns),
    newPrice: outcome === 'yes' ? newPrice.yes : newPrice.no,
    priceImpact,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { marketId, action, outcome, amount, shares } = body;
    
    // Validate inputs
    if (!marketId || !action || !outcome) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (!['buy', 'sell'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    if (!['yes', 'no'].includes(outcome.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid outcome' }, { status: 400 });
    }
    
    // Get market data
    const { data: market, error: marketError } = await supabase
      .from('prediction_markets')
      .select('*')
      .eq('id', marketId)
      .single();
    
    if (marketError || !market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    
    // Check market status
    if (market.status !== 'active') {
      return NextResponse.json({ error: 'Market is not active' }, { status: 400 });
    }
    
    // Check trading window
    const now = new Date();
    if (now > new Date(market.trading_ends_at)) {
      return NextResponse.json({ error: 'Trading has ended' }, { status: 400 });
    }
    
    // Get user wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (walletError || !wallet) {
      // Create wallet if doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert({ user_id: user.id, ngn_balance: 0 })
        .select()
        .single();
      
      if (createError) {
        return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
      }
    }
    
    // Get current market state (simplified - using liquidity as proxy)
    const liquidity = parseFloat(market.initial_liquidity) || 100000;
    const currentPrices = market.current_prices || { Yes: 50, No: 50 };
    
    // Calculate shares from prices
    const yesPrice = currentPrices.Yes / 100;
    const noPrice = currentPrices.No / 100;
    
    // Initialize pool shares based on price and liquidity
    let yesShares = liquidity * noPrice;
    let noShares = liquidity * yesPrice;
    
    const normalizedOutcome = outcome.toLowerCase() as 'yes' | 'no';
    const tradingFee = parseFloat(market.trading_fee_percent) || 0.02;
    
    let result;
    let totalCost;
    let sharesToTrade;
    
    if (action === 'buy') {
      // Calculate how many shares user gets for their amount
      const amountAfterFee = amount * (1 - tradingFee);
      
      // Iterative calculation for shares
      sharesToTrade = shares || (amountAfterFee / (normalizedOutcome === 'yes' ? yesPrice : noPrice));
      
      result = calculateBuyCost(yesShares, noShares, normalizedOutcome, sharesToTrade);
      totalCost = result.cost * (1 + tradingFee);
      
      // Check balance
      const availableBalance = parseFloat(wallet?.ngn_balance || '0');
      if (totalCost > availableBalance) {
        return NextResponse.json({ 
          error: 'Insufficient balance',
          required: totalCost,
          available: availableBalance
        }, { status: 400 });
      }
      
    } else {
      // Selling
      // Check user has shares
      const { data: position } = await supabase
        .from('user_positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .eq('outcome', normalizedOutcome === 'yes' ? 'Yes' : 'No')
        .single();
      
      if (!position || parseFloat(position.shares) < shares) {
        return NextResponse.json({ 
          error: 'Insufficient shares',
          available: position?.shares || 0
        }, { status: 400 });
      }
      
      sharesToTrade = shares;
      result = calculateSellReturn(yesShares, noShares, normalizedOutcome, sharesToTrade);
      totalCost = -result.returns * (1 - tradingFee); // Negative because user receives
    }
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('market_orders')
      .insert({
        user_id: user.id,
        market_id: marketId,
        order_type: 'market',
        side: action,
        outcome: normalizedOutcome === 'yes' ? 'Yes' : 'No',
        shares: sharesToTrade,
        total_cost: Math.abs(totalCost),
        fee_amount: Math.abs(totalCost) * tradingFee,
        status: 'filled',
        filled_shares: sharesToTrade,
        avg_fill_price: result.newPrice / 100,
        filled_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (orderError) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
    
    // Update user position
    const outcomeKey = normalizedOutcome === 'yes' ? 'Yes' : 'No';
    
    if (action === 'buy') {
      // Upsert position
      const { error: positionError } = await supabase
        .from('user_positions')
        .upsert({
          user_id: user.id,
          market_id: marketId,
          outcome: outcomeKey,
          shares: sharesToTrade,
          avg_price: result.newPrice / 100,
          total_invested: totalCost,
        }, {
          onConflict: 'user_id,market_id,outcome',
        });
      
      // Deduct from wallet
      await supabase
        .from('user_wallets')
        .update({ 
          ngn_balance: parseFloat(wallet.ngn_balance) - totalCost,
          total_wagered: parseFloat(wallet.total_wagered || '0') + totalCost,
        })
        .eq('user_id', user.id);
        
    } else {
      // Update position (reduce shares)
      const { data: currentPosition } = await supabase
        .from('user_positions')
        .select('shares')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .eq('outcome', outcomeKey)
        .single();
      
      const newShares = parseFloat(currentPosition?.shares || '0') - sharesToTrade;
      
      if (newShares <= 0) {
        await supabase
          .from('user_positions')
          .delete()
          .eq('user_id', user.id)
          .eq('market_id', marketId)
          .eq('outcome', outcomeKey);
      } else {
        await supabase
          .from('user_positions')
          .update({ shares: newShares })
          .eq('user_id', user.id)
          .eq('market_id', marketId)
          .eq('outcome', outcomeKey);
      }
      
      // Add to wallet
      await supabase
        .from('user_wallets')
        .update({ 
          ngn_balance: parseFloat(wallet.ngn_balance) + Math.abs(totalCost),
        })
        .eq('user_id', user.id);
    }
    
    // Update market prices
    const newPrices = {
      Yes: normalizedOutcome === 'yes' 
        ? result.newPrice 
        : 100 - result.newPrice,
      No: normalizedOutcome === 'no' 
        ? result.newPrice 
        : 100 - result.newPrice,
    };
    
    await supabase
      .from('prediction_markets')
      .update({
        current_prices: newPrices,
        total_volume: parseFloat(market.total_volume || '0') + Math.abs(totalCost),
      })
      .eq('id', marketId);
    
    // Record trade
    await supabase
      .from('market_trades')
      .insert({
        market_id: marketId,
        order_id: order.id,
        buyer_id: action === 'buy' ? user.id : null,
        seller_id: action === 'sell' ? user.id : null,
        outcome: outcomeKey,
        shares: sharesToTrade,
        price: result.newPrice / 100,
        total_amount: Math.abs(totalCost),
      });
    
    // Record price history
    await supabase
      .from('price_history')
      .insert({
        market_id: marketId,
        outcome: outcomeKey,
        price: result.newPrice / 100,
        volume: Math.abs(totalCost),
      });
    
    // Record transaction
    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: action === 'buy' ? 'trade_buy' : 'trade_sell',
        currency: 'NGN',
        amount: action === 'buy' ? -totalCost : Math.abs(totalCost),
        reference_type: 'order',
        reference_id: order.id,
        description: `${action === 'buy' ? 'Bought' : 'Sold'} ${sharesToTrade.toFixed(2)} ${outcomeKey} shares`,
      });
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        action,
        outcome: outcomeKey,
        shares: sharesToTrade,
        price: result.newPrice,
        totalCost: Math.abs(totalCost),
        priceImpact: result.priceImpact,
      },
      newPrices,
    });
    
  } catch (error) {
    console.error('Trading error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get quote without executing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get('marketId');
  const action = searchParams.get('action');
  const outcome = searchParams.get('outcome');
  const amount = parseFloat(searchParams.get('amount') || '0');
  
  if (!marketId || !action || !outcome || !amount) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  
  try {
    const supabase = await createClient();
    
    const { data: market } = await supabase
      .from('prediction_markets')
      .select('*')
      .eq('id', marketId)
      .single();
    
    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    
    const liquidity = parseFloat(market.initial_liquidity) || 100000;
    const currentPrices = market.current_prices || { Yes: 50, No: 50 };
    
    const yesPrice = currentPrices.Yes / 100;
    const noPrice = currentPrices.No / 100;
    
    let yesShares = liquidity * noPrice;
    let noShares = liquidity * yesPrice;
    
    const normalizedOutcome = outcome.toLowerCase() as 'yes' | 'no';
    const tradingFee = parseFloat(market.trading_fee_percent) || 0.02;
    
    const estimatedShares = amount / (normalizedOutcome === 'yes' ? yesPrice : noPrice);
    
    const result = action === 'buy'
      ? calculateBuyCost(yesShares, noShares, normalizedOutcome, estimatedShares)
      : calculateSellReturn(yesShares, noShares, normalizedOutcome, estimatedShares);
    
    // Type-safe access to result properties
    const totalCost = action === 'buy' && 'cost' in result ? result.cost * (1 + tradingFee) : undefined;
    const totalReturn = action === 'sell' && 'returns' in result ? result.returns * (1 - tradingFee) : undefined;
    
    return NextResponse.json({
      quote: {
        action,
        outcome,
        amount,
        estimatedShares,
        estimatedPrice: result.newPrice,
        priceImpact: result.priceImpact,
        fee: amount * tradingFee,
        totalCost,
        totalReturn,
      },
      currentPrices,
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
