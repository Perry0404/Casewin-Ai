import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { PREDICTIONS_ENABLED } from '@/lib/features';

export const dynamic = 'force-dynamic';

const TRADE_FEE_PERCENT = 2; // 2% platform fee on each trade

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// AMM Functions (Constant Product Market Maker)
function calculatePrice(yesShares: number, noShares: number) {
  const total = yesShares + noShares;
  return {
    yes: noShares / total,
    no: yesShares / total
  };
}

function calculateBuyCost(
  yesShares: number,
  noShares: number,
  outcome: 'yes' | 'no',
  sharesToBuy: number
) {
  const k = yesShares * noShares;
  
  let newYesShares: number;
  let newNoShares: number;

  if (outcome === 'yes') {
    newYesShares = yesShares - sharesToBuy;
    if (newYesShares <= 0) {
      return { error: 'Not enough liquidity' };
    }
    newNoShares = k / newYesShares;
  } else {
    newNoShares = noShares - sharesToBuy;
    if (newNoShares <= 0) {
      return { error: 'Not enough liquidity' };
    }
    newYesShares = k / newNoShares;
  }

  const cost = outcome === 'yes'
    ? newNoShares - noShares
    : newYesShares - yesShares;

  const newPrices = calculatePrice(newYesShares, newNoShares);

  return {
    cost: Math.abs(cost),
    newYesShares,
    newNoShares,
    newPrices
  };
}

function calculateSellReturn(
  yesShares: number,
  noShares: number,
  outcome: 'yes' | 'no',
  sharesToSell: number
) {
  const k = yesShares * noShares;

  let newYesShares: number;
  let newNoShares: number;

  if (outcome === 'yes') {
    newYesShares = yesShares + sharesToSell;
    newNoShares = k / newYesShares;
  } else {
    newNoShares = noShares + sharesToSell;
    newYesShares = k / newNoShares;
  }

  const returns = outcome === 'yes'
    ? noShares - newNoShares
    : yesShares - newYesShares;

  const newPrices = calculatePrice(newYesShares, newNoShares);

  return {
    returns: Math.abs(returns),
    newYesShares,
    newNoShares,
    newPrices
  };
}

export async function POST(request: NextRequest) {
  if (!PREDICTIONS_ENABLED) {
    return NextResponse.json({ error: 'Prediction market is currently disabled' }, { status: 503 });
  }
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Login required to trade' }, { status: 401 });
    }

    const admin = getAdmin();
    const body = await request.json();
    const { marketId, action, outcome, shares } = body;

    // Validate inputs
    if (!marketId || !action || !outcome || !shares) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['buy', 'sell'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const normalizedOutcome = outcome.toLowerCase() as 'yes' | 'no';
    if (!['yes', 'no'].includes(normalizedOutcome)) {
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

    if (market.status !== 'open') {
      return NextResponse.json({ error: 'Market is not open for trading' }, { status: 400 });
    }

    // Check if trading window is still open
    if (market.closes_at && new Date() > new Date(market.closes_at)) {
      return NextResponse.json({ error: 'Trading has ended for this market' }, { status: 400 });
    }

    // Get current AMM state
    const yesShares = market.outcome_options?.yes_shares || 10000;
    const noShares = market.outcome_options?.no_shares || 10000;

    let result: any;
    let totalAmount: number;

    if (action === 'buy') {
      result = calculateBuyCost(yesShares, noShares, normalizedOutcome, shares);
      
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      totalAmount = result.cost;

      // Calculate platform fee
      const fee = Math.ceil(totalAmount * TRADE_FEE_PERCENT / 100);
      const totalWithFee = totalAmount + fee;

      // Check user balance (service role for reliable access)
      const { data: userBalance } = await admin
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      const balance = userBalance?.balance || 0;
      if (totalWithFee > balance) {
        return NextResponse.json({ 
          error: 'Insufficient balance. Deposit crypto to fund your account.',
          required: totalWithFee,
          available: balance,
          breakdown: { cost: totalAmount, fee }
        }, { status: 400 });
      }

    } else {
      // Selling - check user has shares
      const { data: position } = await admin
        .from('positions')
        .select('shares')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .eq('outcome', normalizedOutcome)
        .single();

      if (!position || position.shares < shares) {
        return NextResponse.json({ 
          error: 'Insufficient shares',
          available: position?.shares || 0
        }, { status: 400 });
      }

      result = calculateSellReturn(yesShares, noShares, normalizedOutcome, shares);
      totalAmount = result.returns;
    }

    // Update market AMM state (service role for reliable write)
    const { error: updateError } = await admin
      .from('prediction_markets')
      .update({
        outcome_options: {
          yes_shares: result.newYesShares,
          no_shares: result.newNoShares
        },
        total_pool: (market.total_pool || 0) + (action === 'buy' ? totalAmount : 0)
      })
      .eq('id', marketId);

    if (updateError) {
      console.error('Failed to update market:', updateError);
      return NextResponse.json({ error: 'Failed to execute trade' }, { status: 500 });
    }

    // Calculate fee for this trade
    const tradeFee = Math.ceil(totalAmount * TRADE_FEE_PERCENT / 100);

    // Update user balance + positions
    if (action === 'buy') {
      // Deduct balance (cost + fee)
      const { data: currentBalance } = await admin
        .from('user_balances')
        .select('balance, total_trades')
        .eq('user_id', user.id)
        .single();

      const balanceBefore = currentBalance?.balance || 0;
      const balanceAfter = balanceBefore - totalAmount - tradeFee;

      await admin
        .from('user_balances')
        .update({
          balance: balanceAfter,
          total_trades: (currentBalance?.total_trades || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      // Add/update position
      const { data: existingPosition } = await admin
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .eq('outcome', normalizedOutcome)
        .single();

      if (existingPosition) {
        const totalShares = existingPosition.shares + shares;
        const totalCost = (existingPosition.shares * existingPosition.avg_price) + (shares * (totalAmount / shares));
        const newAvgPrice = totalCost / totalShares;

        await admin
          .from('positions')
          .update({ shares: totalShares, avg_price: newAvgPrice })
          .eq('id', existingPosition.id);
      } else {
        await admin
          .from('positions')
          .insert({
            user_id: user.id,
            market_id: marketId,
            outcome: normalizedOutcome,
            shares: shares,
            avg_price: totalAmount / shares
          });
      }

    } else {
      // Selling - add balance back (minus fee)
      const { data: currentBalance } = await admin
        .from('user_balances')
        .select('balance, total_trades')
        .eq('user_id', user.id)
        .single();

      const balanceBefore = currentBalance?.balance || 0;
      const balanceAfter = balanceBefore + totalAmount - tradeFee;

      await admin
        .from('user_balances')
        .update({
          balance: balanceAfter,
          total_trades: (currentBalance?.total_trades || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      // Reduce position
      const { data: position } = await admin
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .eq('outcome', normalizedOutcome)
        .single();

      if (position) {
        const newShares = position.shares - shares;
        if (newShares <= 0) {
          await admin.from('positions').delete().eq('id', position.id);
        } else {
          await admin.from('positions').update({ shares: newShares }).eq('id', position.id);
        }
      }
    }

    // Record trade
    const { data: tradeRecord } = await admin
      .from('trades')
      .insert({
        user_id: user.id,
        market_id: marketId,
        action,
        outcome: normalizedOutcome,
        shares,
        price: totalAmount / shares,
        total: totalAmount
      })
      .select('id')
      .single();

    // Record platform revenue (fee)
    if (tradeFee > 0) {
      await admin.from('platform_revenue').insert({
        type: 'trade_fee',
        amount: tradeFee,
        user_id: user.id,
        market_id: marketId,
        trade_id: tradeRecord?.id,
        description: `${TRADE_FEE_PERCENT}% fee on ${action} ${shares} ${normalizedOutcome} shares`,
        metadata: { action, outcome: normalizedOutcome, shares, tradeTotal: totalAmount, feePercent: TRADE_FEE_PERCENT }
      });
    }

    // Log transaction for monitoring
    await admin.from('transaction_log').insert({
      user_id: user.id,
      type: action === 'buy' ? 'trade_buy' : 'trade_sell',
      amount: totalAmount,
      fee: tradeFee,
      net_amount: action === 'buy' ? totalAmount + tradeFee : totalAmount - tradeFee,
      status: 'completed',
      reference: tradeRecord?.id,
      description: `${action.toUpperCase()} ${shares} ${normalizedOutcome} shares @ ₦${(totalAmount / shares).toFixed(2)}`,
      metadata: { marketId, marketTitle: market.title, outcome: normalizedOutcome, shares, price: totalAmount / shares }
    });

    return NextResponse.json({
      success: true,
      trade: {
        action,
        outcome: normalizedOutcome,
        shares,
        price: totalAmount / shares,
        total: totalAmount,
        fee: tradeFee,
        totalCharged: action === 'buy' ? totalAmount + tradeFee : totalAmount - tradeFee
      },
      newPrices: {
        yes: result.newPrices.yes,
        no: result.newPrices.no
      }
    });

  } catch (error) {
    console.error('Trading error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get trade quote
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get('marketId');
  const action = searchParams.get('action') || 'buy';
  const outcome = searchParams.get('outcome') || 'yes';
  const shares = parseFloat(searchParams.get('shares') || '100');

  if (!marketId) {
    return NextResponse.json({ error: 'Market ID required' }, { status: 400 });
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

    const yesShares = market.outcome_options?.yes_shares || 10000;
    const noShares = market.outcome_options?.no_shares || 10000;
    const normalizedOutcome = outcome.toLowerCase() as 'yes' | 'no';

    let result;
    let amount: number;

    if (action === 'buy') {
      result = calculateBuyCost(yesShares, noShares, normalizedOutcome, shares);
      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      amount = result.cost;
    } else {
      result = calculateSellReturn(yesShares, noShares, normalizedOutcome, shares);
      amount = result.returns;
    }

    return NextResponse.json({
      quote: {
        action,
        outcome: normalizedOutcome,
        shares,
        price: amount / shares,
        total: amount,
        newPrices: result.newPrices
      },
      currentPrices: calculatePrice(yesShares, noShares)
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
