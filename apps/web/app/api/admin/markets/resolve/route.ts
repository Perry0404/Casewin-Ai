import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { market_id, outcome } = body

    if (!market_id || !outcome) {
      return NextResponse.json({ error: 'Missing required fields: market_id, outcome' }, { status: 400 })
    }

    if (!['yes', 'no'].includes(outcome)) {
      return NextResponse.json({ error: 'Outcome must be "yes" or "no"' }, { status: 400 })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Get the market
    const { data: market, error: marketErr } = await supabase
      .from('prediction_markets')
      .select('*')
      .eq('id', market_id)
      .single()

    if (marketErr || !market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    if (market.status === 'resolved') {
      return NextResponse.json({ error: 'Market is already resolved' }, { status: 400 })
    }

    // 2. Update market status to resolved
    const { error: resolveErr } = await supabase
      .from('prediction_markets')
      .update({
        status: 'resolved',
        actual_outcome: outcome,
        resolution_date: new Date().toISOString()
      })
      .eq('id', market_id)

    if (resolveErr) {
      return NextResponse.json({ error: resolveErr.message }, { status: 500 })
    }

    // 3. Get all active bets for this market
    const { data: allBets, error: betsErr } = await supabase
      .from('prediction_bets')
      .select('*')
      .eq('market_id', market_id)
      .eq('status', 'active')

    if (betsErr) {
      console.error('Failed to fetch bets:', betsErr)
      return NextResponse.json({ error: 'Failed to fetch bets for settlement' }, { status: 500 })
    }

    if (!allBets || allBets.length === 0) {
      return NextResponse.json({ success: true, message: `Market resolved as ${outcome.toUpperCase()}. No active bets to settle.` })
    }

    // 4. Separate winners and losers
    const winners = allBets.filter(b => b.selected_outcome === outcome)
    const losers = allBets.filter(b => b.selected_outcome !== outcome)

    // 5. Calculate total pool and payouts
    // The pool is ALL bet amounts (winners + losers). Winners split the entire pool.
    const totalPool = allBets.reduce((sum, b) => sum + (b.amount || 0), 0)
    const winnerTotalStake = winners.reduce((sum, b) => sum + (b.amount || 0), 0)

    // Mark losing bets
    if (losers.length > 0) {
      await supabase
        .from('prediction_bets')
        .update({ status: 'lost' })
        .eq('market_id', market_id)
        .neq('selected_outcome', outcome)
    }

    // 6. Pay out winners proportionally from the pool
    let totalPaidOut = 0
    const payoutResults: Array<{ email: string; payout: number }> = []

    for (const bet of winners) {
      // Each winner gets: (their_stake / total_winner_stakes) * total_pool
      const payout = winnerTotalStake > 0
        ? Math.floor((bet.amount / winnerTotalStake) * totalPool)
        : bet.amount

      // Update bet status + actual payout
      await supabase
        .from('prediction_bets')
        .update({ status: 'won', potential_payout: payout })
        .eq('id', bet.id)

      // Credit the winner's wallet
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('naira_balance')
        .eq('user_email', bet.user_email)
        .single()

      if (wallet) {
        const newBalance = (wallet.naira_balance || 0) + payout
        await supabase
          .from('user_wallets')
          .update({
            naira_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_email', bet.user_email)

        // Record payout transaction
        await supabase.from('wallet_transactions').insert({
          user_email: bet.user_email,
          amount: payout,
          transaction_type: 'payout',
          related_id: market_id,
          balance_after: newBalance,
          notes: `Won bet on "${(market.title || '').substring(0, 50)}" \u2014 ${outcome.toUpperCase()}`
        })

        totalPaidOut += payout
        payoutResults.push({ email: bet.user_email, payout })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Market resolved as ${outcome.toUpperCase()}. ${winners.length} winner(s) paid \u20A6${totalPaidOut.toLocaleString()}.`,
      settlement: {
        total_pool: totalPool,
        winners: winners.length,
        losers: losers.length,
        total_paid_out: totalPaidOut,
        payouts: payoutResults
      }
    })
  } catch (error) {
    console.error('Resolve error:', error)
    return NextResponse.json({ error: 'Failed to resolve market' }, { status: 500 })
  }
}


