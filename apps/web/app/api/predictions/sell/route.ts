import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function getAuthUser(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { response.cookies.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { response.cookies.set({ name, value: '', ...options }) },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// POST /api/predictions/sell — Sell a position before market resolution
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser?.email) {
      return NextResponse.json({ error: 'You must be signed in' }, { status: 401 })
    }

    const { bet_id } = await request.json()

    if (!bet_id) {
      return NextResponse.json({ error: 'bet_id required' }, { status: 400 })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const email = authUser.email

    // 1. Get the bet
    const { data: bet, error: betError } = await supabase
      .from('prediction_bets')
      .select('*')
      .eq('id', bet_id)
      .eq('user_email', email)
      .eq('status', 'active')
      .single()

    if (betError || !bet) {
      return NextResponse.json({ error: 'Active position not found' }, { status: 404 })
    }

    // 2. Get the market
    const { data: market, error: marketError } = await supabase
      .from('prediction_markets')
      .select('*')
      .eq('id', bet.market_id)
      .single()

    if (marketError || !market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    if (market.status !== 'open') {
      return NextResponse.json({ error: 'Cannot sell — market is no longer open' }, { status: 400 })
    }

    // 3. Calculate current value of the position
    const opts = market.outcome_options || { yes_shares: 20000, no_shares: 20000 }
    const totalShares = (opts.yes_shares || 20000) + (opts.no_shares || 20000)

    // Current price of the position's side
    const currentPrice = bet.selected_outcome === 'yes'
      ? (opts.no_shares || 20000) / totalShares
      : (opts.yes_shares || 20000) / totalShares

    // Value = original amount * current price / original price at time of bet
    // Simplified: sell at current market value minus 2% spread (1% fee each side)
    const currentValue = Math.floor(bet.amount * currentPrice * 2) // CPMM payout calc
    const sellFee = Math.round(currentValue * 0.01) // 1% sell fee
    const netPayout = currentValue - sellFee

    if (netPayout <= 0) {
      return NextResponse.json({ error: 'Position value too low to sell' }, { status: 400 })
    }

    // 4. Update the bet to sold
    const { error: updateBetError } = await supabase
      .from('prediction_bets')
      .update({
        status: 'sold',
        sold_at: new Date().toISOString(),
        sold_amount: netPayout,
      })
      .eq('id', bet_id)

    if (updateBetError) {
      return NextResponse.json({ error: 'Failed to update position' }, { status: 500 })
    }

    // 5. Credit wallet
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('naira_balance')
      .eq('user_email', email)
      .single()

    const newBalance = (wallet?.naira_balance || 0) + netPayout

    const { error: walletError } = await supabase
      .from('user_wallets')
      .update({
        naira_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_email', email)

    if (walletError) {
      // Rollback bet status
      await supabase
        .from('prediction_bets')
        .update({ status: 'active', sold_at: null, sold_amount: null })
        .eq('id', bet_id)
      return NextResponse.json({ error: 'Failed to credit wallet' }, { status: 500 })
    }

    // 6. Reduce market pool
    const newPool = Math.max(0, (market.total_pool || 0) - bet.amount)
    const updatedOptions = { ...opts }
    if (bet.selected_outcome === 'yes') {
      updatedOptions.yes_shares = Math.max(1000, (opts.yes_shares || 20000) - bet.amount)
    } else {
      updatedOptions.no_shares = Math.max(1000, (opts.no_shares || 20000) - bet.amount)
    }

    await supabase
      .from('prediction_markets')
      .update({
        total_pool: newPool,
        outcome_options: updatedOptions,
      })
      .eq('id', bet.market_id)

    // 7. Record transactions
    await supabase.from('wallet_transactions').insert({
      user_email: email,
      amount: netPayout,
      transaction_type: 'sell',
      related_id: bet.market_id,
      balance_after: newBalance,
      notes: `Sold ${bet.selected_outcome.toUpperCase()} position for \u20A6${netPayout.toLocaleString()} (original: \u20A6${bet.amount.toLocaleString()})`,
    })

    if (sellFee > 0) {
      await supabase.from('platform_fees').insert({
        user_email: email,
        amount: sellFee,
        fee_type: 'sell',
        related_id: bet.market_id,
        notes: `1% sell fee on \u20A6${currentValue.toLocaleString()} position sale`,
      })
    }

    const pnl = netPayout - bet.amount
    const pnlPercent = ((pnl / bet.amount) * 100).toFixed(1)

    return NextResponse.json({
      success: true,
      message: `Position sold for \u20A6${netPayout.toLocaleString()} (${pnl >= 0 ? '+' : ''}\u20A6${pnl.toLocaleString()}, ${pnl >= 0 ? '+' : ''}${pnlPercent}%)`,
      sold_amount: netPayout,
      original_amount: bet.amount,
      pnl,
      pnl_percent: parseFloat(pnlPercent),
      sell_fee: sellFee,
      new_balance: newBalance,
    })
  } catch (error) {
    console.error('Sell error:', error)
    return NextResponse.json({ error: 'Failed to sell position' }, { status: 500 })
  }
}
