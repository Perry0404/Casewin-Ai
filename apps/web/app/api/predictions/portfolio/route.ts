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

// GET /api/predictions/portfolio — Get user's positions with P&L
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser?.email) {
      return NextResponse.json({ error: 'You must be signed in' }, { status: 401 })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const email = authUser.email

    // Get all bets for user
    const { data: bets, error: betsError } = await supabase
      .from('prediction_bets')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })

    if (betsError) {
      return NextResponse.json({ positions: [], summary: {} })
    }

    if (!bets?.length) {
      return NextResponse.json({
        positions: [],
        summary: { totalInvested: 0, currentValue: 0, totalPnl: 0, activeCount: 0 },
      })
    }

    // Get all relevant markets
    const marketIds = [...new Set(bets.map(b => b.market_id))]
    const { data: markets } = await supabase
      .from('prediction_markets')
      .select('id, title, status, outcome_options, resolved_outcome')
      .in('id', marketIds)

    const marketMap = new Map((markets || []).map(m => [m.id, m]))

    // Calculate P&L for each position
    const positions = bets.map(bet => {
      const market = marketMap.get(bet.market_id)
      if (!market) return null

      const opts = market.outcome_options || { yes_shares: 20000, no_shares: 20000 }
      const totalShares = (opts.yes_shares || 20000) + (opts.no_shares || 20000)

      const currentPrice = bet.selected_outcome === 'yes'
        ? (opts.no_shares || 20000) / totalShares
        : (opts.yes_shares || 20000) / totalShares

      const currentValue = bet.status === 'active'
        ? Math.floor(bet.amount * currentPrice * 2)
        : bet.status === 'sold'
        ? bet.sold_amount || 0
        : bet.status === 'won'
        ? bet.potential_payout || bet.amount * 2
        : 0

      const pnl = currentValue - bet.amount
      const pnlPercent = bet.amount > 0 ? (pnl / bet.amount) * 100 : 0

      return {
        id: bet.id,
        marketId: bet.market_id,
        marketTitle: market.title || 'Unknown Market',
        marketStatus: market.status,
        selectedOutcome: bet.selected_outcome,
        amount: bet.amount,
        currentValue,
        pnl,
        pnlPercent: Math.round(pnlPercent * 10) / 10,
        currentPrice: Math.round(currentPrice * 100),
        potentialPayout: bet.potential_payout || 0,
        status: bet.status,
        createdAt: bet.created_at,
        soldAt: bet.sold_at,
        resolvedOutcome: market.resolved_outcome,
      }
    }).filter(Boolean)

    // Calculate summary
    const activePositions = positions.filter(p => p && p.status === 'active')
    const totalInvested = activePositions.reduce((sum, p) => sum + (p?.amount || 0), 0)
    const currentValue = activePositions.reduce((sum, p) => sum + (p?.currentValue || 0), 0)
    const totalPnl = currentValue - totalInvested
    const resolvedPnl = positions
      .filter(p => p && (p.status === 'won' || p.status === 'sold'))
      .reduce((sum, p) => sum + (p?.pnl || 0), 0)

    return NextResponse.json({
      positions,
      summary: {
        totalInvested,
        currentValue,
        totalPnl,
        resolvedPnl,
        activeCount: activePositions.length,
        totalPositions: positions.length,
      },
    })
  } catch (error) {
    console.error('Portfolio error:', error)
    return NextResponse.json({ error: 'Failed to load portfolio' }, { status: 500 })
  }
}
