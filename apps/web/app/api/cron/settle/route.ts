import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/cron/settle - Auto-settle expired markets
// Call this from Vercel Cron or external cron service every hour
export async function GET(request: NextRequest) {
  // Simple auth: check for cron secret or allow in dev
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'casewin-cron-2024'
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Find markets that are past their deadline but still open
    const now = new Date().toISOString()
    const { data: expiredMarkets, error: fetchErr } = await supabase
      .from('prediction_markets')
      .select('*')
      .eq('status', 'open')
      .lt('closes_at', now)

    if (fetchErr) {
      console.error('Failed to fetch expired markets:', fetchErr)
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    if (!expiredMarkets || expiredMarkets.length === 0) {
      return NextResponse.json({ message: 'No expired markets to settle', settled: 0 })
    }

    const results = []

    for (const market of expiredMarkets) {
      // Determine outcome based on market odds at close
      // The side with more shares (more money bet on it) = the majority prediction
      const yesShares = market.outcome_options?.yes_shares || 20000
      const noShares = market.outcome_options?.no_shares || 20000
      const totalPool = market.total_pool || 0

      // If no one bet, just close the market without settling
      if (totalPool === 0) {
        await supabase
          .from('prediction_markets')
          .update({ status: 'resolved', actual_outcome: 'cancelled', resolution_date: now })
          .eq('id', market.id)
        results.push({ market_id: market.id, title: market.title, outcome: 'cancelled', reason: 'No bets placed' })
        continue
      }

      // Auto-resolve: majority wins (the side with MORE bets wins)
      // This is the default for unresolved markets. Admin can also manually resolve before deadline.
      const outcome = yesShares > noShares ? 'yes' : 'no'

      // Resolve the market + settle payouts
      const settleRes = await fetch(`${request.nextUrl.origin}/api/admin/markets/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market_id: market.id, outcome })
      })

      const settleData = await settleRes.json()
      results.push({
        market_id: market.id,
        title: market.title,
        outcome,
        settled: settleRes.ok,
        ...settleData.settlement
      })
    }

    return NextResponse.json({
      message: `Settled ${results.length} expired market(s)`,
      settled: results.length,
      results
    })
  } catch (error) {
    console.error('Cron settle error:', error)
    return NextResponse.json({ error: 'Settlement failed' }, { status: 500 })
  }
}
