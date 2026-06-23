import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST /api/court/scheduling
// Layer 4 — Court infrastructure. Airline-style scheduling: find the earliest
// hearing dates that satisfy judge, lawyer and court-capacity constraints, so
// no slot is wasted on an adjournment.
//
// Body: {
//   earliestDate?: ISO date (default: 7 days from now),
//   complexity?: 'simple'|'moderate'|'complex',   // sets the hearing length
//   judgeBusyDates?: string[],   // ISO dates the judge is unavailable
//   lawyerBusyDates?: string[],  // ISO dates the lead counsel is unavailable
//   bookedPerDay?: Record<string, number>, // ISO date -> hearings already listed
//   courtCapacityPerDay?: number, // default 8
//   count?: number               // how many candidate dates to return (default 3)
// }
const HEARING_HOURS: Record<string, number> = { simple: 1, moderate: 2, complex: 4 }

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      earliestDate,
      complexity = 'moderate',
      judgeBusyDates = [],
      lawyerBusyDates = [],
      bookedPerDay = {},
      courtCapacityPerDay = 8,
      count = 3,
    } = body

    const start = earliestDate ? new Date(earliestDate) : new Date(Date.now() + 7 * 86400000)
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: 'Invalid earliestDate' }, { status: 400 })
    }

    const judgeBusy = new Set<string>(judgeBusyDates)
    const lawyerBusy = new Set<string>(lawyerBusyDates)
    const need = HEARING_HOURS[complexity] ?? 2

    const candidates: { date: string; score: number; load: number; reasons: string[] }[] = []
    const cursor = new Date(start)
    let scanned = 0

    // Scan up to ~120 days ahead for valid slots.
    while (candidates.length < Math.max(1, Math.min(count, 10)) && scanned < 120) {
      const iso = isoDate(cursor)
      const dow = cursor.getUTCDay() // 0 Sun .. 6 Sat
      const isWeekend = dow === 0 || dow === 6
      const load = Number(bookedPerDay[iso] || 0)
      const reasons: string[] = []
      let ok = true

      if (isWeekend) { ok = false }
      if (judgeBusy.has(iso)) { ok = false; reasons.push('judge unavailable') }
      if (lawyerBusy.has(iso)) { ok = false; reasons.push('lead counsel unavailable') }
      if (load + need > courtCapacityPerDay) { ok = false; reasons.push('court at capacity') }

      if (ok) {
        // Lower load and earlier dates score higher.
        const capacityScore = Math.round(((courtCapacityPerDay - load) / courtCapacityPerDay) * 60)
        const earlinessScore = Math.max(0, 40 - scanned) // sooner is better
        candidates.push({
          date: iso,
          score: capacityScore + earlinessScore,
          load,
          reasons: [`${courtCapacityPerDay - load}/${courtCapacityPerDay} capacity free`, `${need}h hearing fits`],
        })
      }

      cursor.setUTCDate(cursor.getUTCDate() + 1)
      scanned++
    }

    candidates.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      success: true,
      hearingHours: need,
      recommended: candidates[0] || null,
      alternatives: candidates.slice(1),
    })
  } catch (err) {
    console.error('Scheduling error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
