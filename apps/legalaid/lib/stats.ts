import { createAdminClient } from '@/lib/supabase/server'
import { OUTCOMES } from '@/lib/constants'

/** Public numbers, computed from real records only. Spam is excluded; nothing is estimated. */
export async function publicStats() {
  const db = createAdminClient()
  const [{ data: cases }, { count: volunteers }, { count: orgs }] = await Promise.all([
    db.from('la_cases').select('status, state, kind, verified_at, assigned_at, first_action_at, outcome, created_at').neq('status', 'spam').limit(20000),
    db.from('la_members').select('user_id', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('la_organisations').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ])
  const rows = cases ?? []
  const hours = rows
    .filter((c) => c.first_action_at)
    .map((c) => (new Date(c.first_action_at!).getTime() - new Date(c.created_at).getTime()) / 3600000)
    .sort((a, b) => a - b)
  const byState = new Map<string, number>()
  for (const c of rows) byState.set(c.state, (byState.get(c.state) ?? 0) + 1)
  return {
    requests: rows.length,
    verified: rows.filter((c) => c.verified_at).length,
    assigned: rows.filter((c) => c.assigned_at).length,
    released: rows.filter((c) => c.outcome && OUTCOMES[c.outcome]?.release).length,
    resolved: rows.filter((c) => c.outcome).length,
    medianHoursToAction: hours.length ? hours[Math.floor(hours.length / 2)] : null,
    volunteers: volunteers ?? 0,
    organisations: orgs ?? 0,
    states: [...byState.entries()].sort((a, b) => b[1] - a[1]),
  }
}
