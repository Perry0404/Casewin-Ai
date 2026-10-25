import { createAdminClient } from '@/lib/supabase/server'
import { OUTCOMES, ORG_KINDS, ROLES } from '@/lib/constants'

// The clearing house: every provider of legal aid on the platform — organisations
// (Legal Aid Council offices, NGOs, law clinics, NBA committees, chambers) and
// independent volunteers — with the cases they took and what came of them, by
// state and town. Computed from the case record; nothing is entered by hand.

export interface Provider {
  key: string
  kind: 'org' | 'volunteer' | 'others'
  id: string | null
  name: string
  subtitle: string
  state: string | null
  members: number
  taken: number
  active: number
  resolved: number
  released: number
  verified: number
  referredWaiting: number
  medianHours: number | null
  byState: [string, number][]
  byTown: [string, number][]
}

type Row = {
  id: string
  status: string
  state: string
  lga: string | null
  facility: string | null
  assigned_to: string | null
  assigned_org: string | null
  referred_org: string | null
  assigned_at: string | null
  first_action_at: string | null
  verified_at: string | null
  outcome: string | null
  created_at: string
}

const median = (xs: number[]) => (xs.length ? xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)]! : null)
const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])

/** Where a case happened, at town level: the town given, else the facility, else the state. */
export const townOf = (c: Pick<Row, 'lga' | 'facility' | 'state'>) => (c.lga?.trim() || c.facility?.trim() || c.state).replace(/\s+/g, ' ')

export async function clearingHouse({ publicView }: { publicView: boolean }) {
  const db = createAdminClient()
  const [{ data: cases }, { data: orgs }, { data: members }] = await Promise.all([
    db
      .from('la_cases')
      .select('id, status, state, lga, facility, assigned_to, assigned_org, referred_org, assigned_at, first_action_at, verified_at, outcome, created_at')
      .neq('status', 'spam')
      .limit(50000),
    db.from('la_organisations').select('id, name, kind, state, town').eq('status', 'approved'),
    db.from('la_members').select('user_id, full_name, role, state, org_id, show_publicly, institution, enrolment_number').eq('status', 'approved'),
  ])
  const memberById = new Map((members ?? []).map((m) => [m.user_id, m]))

  const blank = (p: Omit<Provider, 'taken' | 'active' | 'resolved' | 'released' | 'verified' | 'referredWaiting' | 'medianHours' | 'byState' | 'byTown'>) => ({
    ...p,
    taken: 0,
    active: 0,
    resolved: 0,
    released: 0,
    verified: 0,
    referredWaiting: 0,
    medianHours: null as number | null,
    byState: [] as [string, number][],
    byTown: [] as [string, number][],
    _hours: [] as number[],
    _states: new Map<string, number>(),
    _towns: new Map<string, number>(),
  })
  const providers = new Map<string, ReturnType<typeof blank>>()
  for (const o of orgs ?? [])
    providers.set(`org:${o.id}`, blank({ key: `org:${o.id}`, kind: 'org', id: o.id, name: o.name, subtitle: ORG_KINDS[o.kind] ?? o.kind, state: o.state, members: (members ?? []).filter((m) => m.org_id === o.id).length }))
  const others = blank({ key: 'others', kind: 'others', id: null, name: 'Other independent volunteers', subtitle: 'Volunteers who have not chosen to be listed by name', state: null, members: 0 })

  const providerFor = (c: Row) => {
    const m = c.assigned_to ? memberById.get(c.assigned_to) : null
    const orgId = c.assigned_org ?? m?.org_id ?? null
    if (orgId && providers.has(`org:${orgId}`)) return providers.get(`org:${orgId}`)!
    if (!m) return null
    if (publicView && !m.show_publicly) return others
    const key = `vol:${m.user_id}`
    if (!providers.has(key))
      providers.set(
        key,
        blank({
          key,
          kind: 'volunteer',
          id: m.user_id,
          name: m.full_name,
          subtitle: [ROLES[m.role]?.split(' (')[0], m.institution].filter(Boolean).join(' · '),
          state: m.state,
          members: 1,
        }),
      )
    return providers.get(key)!
  }

  for (const c of (cases ?? []) as Row[]) {
    if (!c.assigned_at) {
      if (c.referred_org && providers.has(`org:${c.referred_org}`) && c.status === 'new') providers.get(`org:${c.referred_org}`)!.referredWaiting++
      continue
    }
    const p = providerFor(c)
    if (!p) continue
    p.taken++
    if (['assigned', 'in_progress'].includes(c.status)) p.active++
    if (c.outcome) p.resolved++
    if (c.outcome && OUTCOMES[c.outcome]?.release) p.released++
    if (c.verified_at) p.verified++
    if (c.first_action_at) p._hours.push((new Date(c.first_action_at).getTime() - new Date(c.assigned_at).getTime()) / 3600000)
    p._states.set(c.state, (p._states.get(c.state) ?? 0) + 1)
    const town = townOf(c)
    p._towns.set(town, (p._towns.get(town) ?? 0) + 1)
  }
  if (publicView) for (const m of members ?? []) if (!m.org_id && !m.show_publicly) others.members++

  const finish = (p: ReturnType<typeof blank>): Provider => {
    const { _hours, _states, _towns, ...rest } = p
    return { ...rest, medianHours: median(_hours), byState: top(_states), byTown: top(_towns) }
  }
  // Independent volunteers with no cases yet still appear in the private view, so coordinators see who is available.
  if (!publicView)
    for (const m of members ?? [])
      if (!m.org_id && !providers.has(`vol:${m.user_id}`))
        providers.set(`vol:${m.user_id}`, blank({ key: `vol:${m.user_id}`, kind: 'volunteer', id: m.user_id, name: m.full_name, subtitle: ROLES[m.role]?.split(' (')[0] ?? m.role, state: m.state, members: 1 }))

  const list = [...providers.values()].map(finish).sort((a, b) => b.taken - a.taken || a.name.localeCompare(b.name))
  if (publicView && (others.taken || others.members)) list.push(finish(others))

  // Where help is needed: open requests nobody has taken, by state.
  const waiting = new Map<string, number>()
  for (const c of (cases ?? []) as Row[]) if (c.status === 'new') waiting.set(c.state, (waiting.get(c.state) ?? 0) + 1)
  const totals = list.reduce((t, p) => ({ taken: t.taken + p.taken, resolved: t.resolved + p.resolved, released: t.released + p.released, active: t.active + p.active }), { taken: 0, resolved: 0, released: 0, active: 0 })
  return { providers: list, waiting: top(waiting), totals }
}
