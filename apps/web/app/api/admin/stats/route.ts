import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Admin emails — add your admin email(s) here
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

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

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser?.email || !isAdmin(authUser.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all stats in parallel
    const [
      walletsRes,
      transactionsRes,
      marketsRes,
      betsRes,
      paymentsRes,
      feesRes,
      recentUsersRes,
      recentTxRes
    ] = await Promise.all([
      supabase.from('user_wallets').select('user_email, naira_balance, total_deposits, total_withdrawals'),
      supabase.from('wallet_transactions').select('amount, transaction_type, created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('prediction_markets').select('id, title, total_pool, status, created_at'),
      supabase.from('prediction_bets').select('amount, status, created_at').order('created_at', { ascending: false }),
      supabase.from('payments').select('amount, status, provider, created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('platform_fees').select('amount, fee_type, created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('user_wallets').select('user_email, naira_balance, total_deposits, created_at').order('created_at', { ascending: false }).limit(20),
      supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(30)
    ])

    const wallets = walletsRes.data || []
    const transactions = transactionsRes.data || []
    const markets = marketsRes.data || []
    const bets = betsRes.data || []
    const payments = paymentsRes.data || []
    const fees = feesRes.data || []

    // Calculate stats
    const totalUsers = wallets.length
    const totalDeposits = wallets.reduce((s, w) => s + (w.total_deposits || 0), 0)
    const totalWithdrawals = wallets.reduce((s, w) => s + (w.total_withdrawals || 0), 0)
    const totalWalletBalance = wallets.reduce((s, w) => s + (w.naira_balance || 0), 0)
    const totalBetVolume = bets.reduce((s, b) => s + (b.amount || 0), 0)
    const totalMarketPool = markets.reduce((s, m) => s + (m.total_pool || 0), 0)
    const activeMarkets = markets.filter(m => m.status === 'open').length
    const totalPlatformFees = fees.reduce((s, f) => s + (f.amount || 0), 0)
    const marketFees = fees.filter(f => f.fee_type === 'market').reduce((s, f) => s + (f.amount || 0), 0)
    const depositFees = fees.filter(f => f.fee_type === 'deposit').reduce((s, f) => s + (f.amount || 0), 0)
    const successPayments = payments.filter(p => p.status === 'success').length
    const pendingPayments = payments.filter(p => p.status === 'pending').length

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDeposits,
        totalWithdrawals,
        totalWalletBalance,
        totalBetVolume,
        totalMarketPool,
        activeMarkets,
        totalMarkets: markets.length,
        totalBets: bets.length,
        totalPlatformFees,
        marketFees,
        depositFees,
        successPayments,
        pendingPayments,
        netRevenue: totalPlatformFees
      },
      recentUsers: (recentUsersRes.data || []).slice(0, 10),
      recentTransactions: (recentTxRes.data || []).slice(0, 20),
      markets: markets.slice(0, 20)
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
  }
}

// POST /api/admin/stats - Admin actions (resolve markets, etc.)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser?.email || !isAdmin(authUser.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { action, market_id, outcome } = body

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Resolve a market
    if (action === 'resolve_market') {
      if (!market_id || !outcome) {
        return NextResponse.json({ error: 'market_id and outcome (yes/no) required' }, { status: 400 })
      }

      const { data: market } = await supabase
        .from('prediction_markets')
        .select('*')
        .eq('id', market_id)
        .single()

      if (!market) {
        return NextResponse.json({ error: 'Market not found' }, { status: 404 })
      }

      // Update market status
      await supabase
        .from('prediction_markets')
        .update({
          status: 'resolved',
          resolved_outcome: outcome,
          resolved_at: new Date().toISOString(),
          resolved_by: authUser.email
        })
        .eq('id', market_id)

      // Pay out winners
      const { data: winningBets } = await supabase
        .from('prediction_bets')
        .select('*')
        .eq('market_id', market_id)
        .eq('selected_outcome', outcome)
        .eq('status', 'active')

      let totalPaidOut = 0
      for (const bet of (winningBets || [])) {
        const payout = bet.potential_payout || bet.amount * 2

        // Credit winner's wallet
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('naira_balance')
          .eq('user_email', bet.user_email)
          .single()

        if (wallet) {
          const newBalance = (wallet.naira_balance || 0) + payout
          await supabase
            .from('user_wallets')
            .update({ naira_balance: newBalance, updated_at: new Date().toISOString() })
            .eq('user_email', bet.user_email)

          await supabase.from('wallet_transactions').insert({
            user_email: bet.user_email,
            amount: payout,
            transaction_type: 'payout',
            related_id: market_id,
            balance_after: newBalance,
            notes: `Won ₦${payout.toLocaleString()} on "${(market.title || '').substring(0, 40)}"`
          })

          await supabase.from('notifications').insert({
            user_email: bet.user_email,
            type: 'payout',
            title: 'You Won! 🎉',
            message: `You won ₦${payout.toLocaleString()} on "${(market.title || '').substring(0, 50)}"`,
            read: false
          })

          totalPaidOut += payout
        }

        // Update bet status
        await supabase
          .from('prediction_bets')
          .update({ status: 'won', payout_amount: payout })
          .eq('id', bet.id)
      }

      // Mark losing bets
      await supabase
        .from('prediction_bets')
        .update({ status: 'lost', payout_amount: 0 })
        .eq('market_id', market_id)
        .neq('selected_outcome', outcome)
        .eq('status', 'active')

      return NextResponse.json({
        success: true,
        message: `Market resolved as ${outcome.toUpperCase()}. ₦${totalPaidOut.toLocaleString()} paid to ${(winningBets || []).length} winners.`
      })
    }

    // Create a new market
    if (action === 'create_market') {
      const { title, description, category, deadline } = body
      if (!title || !category || !deadline) {
        return NextResponse.json({ error: 'title, category, and deadline are required' }, { status: 400 })
      }

      const { data: newMarket, error } = await supabase
        .from('prediction_markets')
        .insert({
          title,
          description: description || '',
          category,
          closes_at: deadline,
          status: 'open',
          total_pool: 0,
          outcome_options: { yes_shares: 20000, no_shares: 20000 },
          created_by: authUser.email
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, market: newMarket })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Admin action error:', error)
    return NextResponse.json({ error: 'Failed to perform admin action' }, { status: 500 })
  }
}
