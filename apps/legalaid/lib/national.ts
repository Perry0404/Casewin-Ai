import { createAdminClient } from '@/lib/supabase/server'
import { OUTCOMES } from '@/lib/constants'
import { assess } from '@/lib/triage'

// The national picture, from the case record only (spam excluded). Aggregates — no names.

export type StateRow = { state: string; open: number; pastLimit: number; noLawyer: number; resolved: number; released: number }

export const CUSTODY_BUCKETS = ['Under 2 days', '2–14 days', '15–28 days', '29–90 days', '3–12 months', 'Over a year'] as const
const bucket = (d: number) => (d < 2 ? 0 : d <= 14 ? 1 : d <= 28 ? 2 : d <= 90 ? 3 : d <= 365 ? 4 : 5)

export async function nationalPicture() {
  const db = createAdminClient()
  const [{ data: cases }, { data: incidents }] = await Promise.all([
    db
      .from('la_cases')
      .select('id, kind, status, state, facility_type, arrested_on, remanded_on, last_hearing_on, next_hearing_on, person_age, has_lawyer, assigned_to, outcome, outcome_on, created_at, first_action_at, verified_at, diversion_status')
      .neq('status', 'spam')
      .limit(50000),
    db.from('la_incidents').select('kind, state, verified').limit(50000),
  ])
  const rows = cases ?? []
  const byState = new Map<string, StateRow>()
  const get = (s: string) => byState.get(s) ?? byState.set(s, { state: s, open: 0, pastLimit: 0, noLawyer: 0, resolved: 0, released: 0 }).get(s)!
  const custody = CUSTODY_BUCKETS.map(() => 0)
  let pastLimit = 0
  let noLawyer = 0
  let children = 0
  let diverted = 0
  const hours: number[] = []
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setUTCDate(1)
    d.setUTCMonth(d.getUTCMonth() - (11 - i))
    return d.toISOString().slice(0, 7)
  })
  const received = months.map(() => 0)
  const resolvedM = months.map(() => 0)

  for (const c of rows) {
    const r = get(c.state)
    const open = !['resolved', 'closed'].includes(c.status)
    const a = assess(c)
    if (open) {
      r.open++
      if (!c.assigned_to && !c.has_lawyer) {
        r.noLawyer++
        noLawyer++
      }
      if (c.kind === 'detention' && a.flags.some((f) => ['R1', 'R2', 'R3'].includes(f.rule) && f.severity !== 'watch')) {
        r.pastLimit++
        pastLimit++
      }
      if (c.kind === 'detention' && a.daysHeld != null) custody[bucket(a.daysHeld)]!++
      if (c.kind === 'detention' && (c.person_age ?? 99) < 18) children++
    }
    if (c.outcome) r.resolved++
    if (c.outcome && OUTCOMES[c.outcome]?.release) r.released++
    if (c.diversion_status && ['referred', 'in_progress', 'completed'].includes(c.diversion_status)) diverted++
    if (c.first_action_at) hours.push((new Date(c.first_action_at).getTime() - new Date(c.created_at).getTime()) / 3600000)
    const mi = months.indexOf(c.created_at.slice(0, 7))
    if (mi >= 0) received[mi]!++
  }
  for (const c of rows)
    if (c.outcome && c.outcome_on) {
      const mi = months.indexOf(c.outcome_on.slice(0, 7))
      if (mi >= 0) resolvedM[mi]!++
    }
  hours.sort((a, b) => a - b)
  const incidentsByKind = new Map<string, number>()
  const incidentsByState = new Map<string, number>()
  for (const i of incidents ?? []) {
    if (!i.verified) continue
    incidentsByKind.set(i.kind, (incidentsByKind.get(i.kind) ?? 0) + 1)
    incidentsByState.set(i.state, (incidentsByState.get(i.state) ?? 0) + 1)
  }
  return {
    states: [...byState.values()],
    totals: { cases: rows.length, open: rows.filter((c) => !['resolved', 'closed'].includes(c.status)).length, pastLimit, noLawyer, children, diverted },
    custody: CUSTODY_BUCKETS.map((label, i) => ({ label, value: custody[i]! })),
    monthly: { months, received, resolved: resolvedM },
    medianHoursToAction: hours.length ? hours[Math.floor(hours.length / 2)]! : null,
    incidents: { byKind: [...incidentsByKind.entries()].sort((a, b) => b[1] - a[1]), byState: [...incidentsByState.entries()].sort((a, b) => b[1] - a[1]) },
  }
}
export type National = Awaited<ReturnType<typeof nationalPicture>>
