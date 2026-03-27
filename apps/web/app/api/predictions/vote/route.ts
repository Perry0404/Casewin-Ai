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

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser?.email) {
      return NextResponse.json({ error: 'You must be signed in to place a bet' }, { status: 401 })
    }

    const { market_id, vote, amount } = await request.json()

    if (!market_id || !vote || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['yes', 'no'].includes(vote)) {
      return NextResponse.json({ error: 'Vote must be "yes" or "no"' }, { status: 400 })
    }

    if (amount < 100) {
      return NextResponse.json({ error: 'Minimum bet is ₦100' }, { status: 400 })
    }

    if (amount > 500000) {
      return NextResponse.json({ error: 'Maximum bet is ₦500,000 per trade' }, { status: 400 })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const email = authUser.email

    // 1. Check wallet balance (stored in Naira)
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_email', email)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({
        error: 'No wallet found. Please deposit funds first.',
        need_deposit: true
      }, { status: 400 })
    }

    const currentBalance = wallet.naira_balance || 0
    if (currentBalance < amount) {
      return NextResponse.json({
        error: `Insufficient balance. You have ₦${currentBalance.toLocaleString()} but need ₦${amount.toLocaleString()}. Please deposit more funds.`,
        balance: currentBalance,
        need_deposit: true
      }, { status: 400 })
    }

    // 2. Get & validate market
    const { data: market, error: marketError } = await supabase
      .from('prediction_markets')
      .select('*')
      .eq('id', market_id)
      .single()

    if (marketError || !market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    if (market.status !== 'open') {
      return NextResponse.json({ error: 'This market is closed for trading' }, { status: 400 })
    }

    // Check deadline
    if (market.closes_at && new Date(market.closes_at) < new Date()) {
      return NextResponse.json({ error: 'This market has expired' }, { status: 400 })
    }

    // 3. Deduct from wallet
    const newBalance = currentBalance - amount
    const { error: deductError } = await supabase
      .from('user_wallets')
      .update({
        naira_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_email', email)

    if (deductError) {
      console.error('Wallet deduct error:', deductError)
      return NextResponse.json({ error: 'Failed to process payment from wallet' }, { status: 500 })
    }

    // 4. Update market pool & shares (CPMM model)
    const opts = market.outcome_options || { yes_shares: 20000, no_shares: 20000 }
    const updatedOptions = {
      ...opts,
      yes_shares: vote === 'yes' ? (opts.yes_shares || 20000) + amount : (opts.yes_shares || 20000),
      no_shares: vote === 'no' ? (opts.no_shares || 20000) + amount : (opts.no_shares || 20000),
    }

    const { error: updateError } = await supabase
      .from('prediction_markets')
      .update({
        outcome_options: updatedOptions,
        total_pool: (market.total_pool || 0) + amount
      })
      .eq('id', market_id)

    if (updateError) {
      // CRITICAL: Refund the user on market update failure
      console.error('Market update error, refunding:', updateError)
      await supabase.from('user_wallets')
        .update({ naira_balance: currentBalance, updated_at: new Date().toISOString() })
        .eq('user_email', email)
      return NextResponse.json({ error: 'Failed to place bet. Your funds have been refunded.' }, { status: 500 })
    }

    // 5. Record bet in prediction_bets table
    const totalSharesAfter = (updatedOptions.yes_shares || 20000) + (updatedOptions.no_shares || 20000)
    const winPrice = vote === 'yes'
      ? (updatedOptions.no_shares || 20000) / totalSharesAfter
      : (updatedOptions.yes_shares || 20000) / totalSharesAfter
    const potentialPayout = Math.floor(amount / winPrice)

    const { error: betErr } = await supabase.from('prediction_bets').insert([{
      user_id: authUser.id,
      user_email: email,
      market_id,
      selected_outcome: vote,
      amount,
      potential_payout: potentialPayout,
      status: 'active'
    }])
    if (betErr) console.warn('Failed to record bet (non-critical):', betErr.message)

    // 6. Record wallet transaction
    const { error: txErr } = await supabase.from('wallet_transactions').insert({
      user_email: email,
      amount: -amount,
      transaction_type: 'bet',
      related_id: market_id,
      balance_after: newBalance,
      notes: `Bet ₦${amount.toLocaleString()} on ${vote.toUpperCase()} — ${(market.title || '').substring(0, 60)}`
    })
    if (txErr) console.warn('Failed to record wallet transaction (non-critical):', txErr.message)

    return NextResponse.json({
      message: `₦${amount.toLocaleString()} placed on ${vote.toUpperCase()}! Potential payout: ₦${potentialPayout.toLocaleString()}`,
      success: true,
      new_balance: newBalance,
      potential_payout: potentialPayout
    })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json({ error: 'Failed to place bet. Please try again.' }, { status: 500 })
  }
}
