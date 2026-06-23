import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Layer 4 — Justice Analytics.
// Aggregates the real justice activity flowing through CaseWin today. True
// court-system analytics (backlogs, durations, regional judge gaps) come online
// as courts digitise; until then this reflects on-platform activity.

async function safeCount(table: string, filter?: (q: any) => any): Promise<number | null> {
  try {
    const supabase = getSupabaseAdmin()
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    if (filter) q = filter(q)
    const { count, error } = await q
    if (error) return null
    return count ?? 0
  } catch {
    return null
  }
}

export async function GET() {
  const supabase = getSupabaseAdmin()

  const [lawyers, verifiedLawyers, invoices, paidInvoices, evidence, activeSubs, bookings] =
    await Promise.all([
      safeCount('lawyer_profiles'),
      safeCount('lawyer_profiles', (q) => q.eq('is_verified', true)),
      safeCount('invoices'),
      safeCount('invoices', (q) => q.eq('status', 'paid')),
      safeCount('evidence_records'),
      safeCount('subscriptions', (q) => q.eq('status', 'active')),
      safeCount('bookings'),
    ])

  // Total value settled through the transactions layer (sum of paid invoices).
  let settledValueNGN: number | null = null
  try {
    const { data } = await supabase.from('invoices').select('total').eq('status', 'paid').limit(5000)
    if (data) settledValueNGN = data.reduce((s, r: { total?: number }) => s + Number(r.total || 0), 0)
  } catch {
    settledValueNGN = null
  }

  return NextResponse.json({
    success: true,
    generatedAt: new Date().toISOString(),
    metrics: {
      lawyers,
      verifiedLawyers,
      invoices,
      paidInvoices,
      settledValueNGN,
      evidenceProofs: evidence,
      activeSubscriptions: activeSubs,
      bookings,
    },
    note: 'Reflects on-platform justice activity. Court-system analytics (backlogs, case durations, regional judge gaps) activate as court data is digitised.',
  })
}
