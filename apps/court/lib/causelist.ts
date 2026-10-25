import { createAdminClient } from './supabase/server'
import { lagosDayRange } from './format'

export interface ListedHearing {
  id: string
  scheduled_for: string
  purpose: string
  courtroom: string | null
  outcome: string | null
  case: { id: string; suit_number: string; title: string; case_type: string; is_sample: boolean }
  judge: { id: string; name: string; courtroom: string | null } | null
}

// Case types whose party names never appear on the public list.
const PRIVATE_TYPES = ['family']

export async function causeList(courtId: string, day: string, opts: { publicView?: boolean; judgeId?: string } = {}) {
  const { start, end } = lagosDayRange(day)
  let q = createAdminClient()
    .from('hearings')
    .select('id, scheduled_for, purpose, courtroom, outcome, case:cases(id, suit_number, title, case_type, is_sample), judge:judges(id, name, courtroom)')
    .eq('court_id', courtId)
    .gte('scheduled_for', start)
    .lt('scheduled_for', end)
    .order('scheduled_for')
  if (opts.judgeId) q = q.eq('judge_id', opts.judgeId)
  const { data } = await q
  const rows = ((data ?? []) as unknown as ListedHearing[]).map((h) =>
    opts.publicView && PRIVATE_TYPES.includes(h.case.case_type) ? { ...h, case: { ...h.case, title: 'In chambers — parties withheld' } } : h,
  )

  // Group by judge, keeping the day's order within each courtroom.
  const groups = new Map<string, { judge: ListedHearing['judge']; items: ListedHearing[] }>()
  for (const h of rows) {
    const key = h.judge?.id ?? 'unassigned'
    if (!groups.has(key)) groups.set(key, { judge: h.judge, items: [] })
    groups.get(key)!.items.push(h)
  }
  return Array.from(groups.values())
}
