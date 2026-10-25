import { createAdminClient } from '@/lib/supabase/server'
import { canWork, type Member } from '@/lib/auth'
import { CASE_SELECT, type CaseRow } from '@/lib/cases'
import { STATES } from '@/lib/constants'
import { assess, type Assessment } from '@/lib/triage'

export type Visible = CaseRow & { supervisor_id: string | null; referred_org: string | null; a: Assessment; works: boolean; holder: string | null }

/**
 * Open cases a member may see in cross-case views: admins everywhere, everyone else in the
 * states they cover. Details are shown only where the member could open the file (`works`);
 * otherwise the row is masked, exactly as on the case board.
 */
export async function visibleOpenCases(m: Member & { isAdmin: boolean }, opts: { state?: string; kind?: string } = {}) {
  const db = createAdminClient()
  const covered = m.isAdmin ? [...STATES] : m.states_covered.length ? m.states_covered : [m.state]
  const states = opts.state && covered.includes(opts.state as (typeof STATES)[number]) ? [opts.state] : covered
  let q = db.from('la_cases').select(`${CASE_SELECT}, supervisor_id, referred_org`).in('status', ['new', 'assigned', 'in_progress']).in('state', states).limit(3000)
  if (opts.kind) q = q.eq('kind', opts.kind)
  const { data } = await q
  const ids = [...new Set((data ?? []).map((c) => c.assigned_to).filter(Boolean))] as string[]
  const { data: people } = ids.length ? await db.from('la_members').select('user_id, full_name').in('user_id', ids) : { data: [] }
  const names = new Map((people ?? []).map((p) => [p.user_id, p.full_name]))
  return (data ?? [])
    .map((c) => ({ ...(c as unknown as Visible), a: assess(c as unknown as CaseRow), works: canWork(m, c as never), holder: c.assigned_to ? names.get(c.assigned_to) ?? 'A volunteer' : null }))
    .sort((x, y) => y.a.score - x.a.score)
}
