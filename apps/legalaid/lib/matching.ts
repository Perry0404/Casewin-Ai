import { createAdminClient } from '@/lib/supabase/server'
import { ORG_KINDS } from '@/lib/constants'

// Suggests who should take a case, with the reasons, so a coordinator can confirm in one click.

const AREAS_FOR: Record<string, string[]> = {
  detention: ['Criminal defence', 'Bail & remand', 'Fundamental rights'],
  police_abuse: ['Fundamental rights', 'Criminal defence'],
  family: ['Family & domestic violence', 'Child justice', 'Inheritance'],
  land_housing: ['Land & tenancy'],
  employment: ['Employment'],
  other_civil: [],
}

export interface Suggestion {
  user_id: string
  name: string
  role: string
  org: string | null
  score: number
  load: string
  reasons: string[]
}

export interface OrgSuggestion {
  id: string
  name: string
  kind: string
  members: number
  active: number
  reasons: string[]
}

export async function suggest(c: { id: string; kind: string; state: string; language: string | null; person_age: number | null }) {
  const db = createAdminClient()
  const [{ data: members }, { data: open }, { data: recent }, { data: orgs }] = await Promise.all([
    db.from('la_members').select('user_id, full_name, role, state, states_covered, languages, practice_areas, capacity, org_id, org:la_organisations(name)').eq('status', 'approved').neq('role', 'coordinator'),
    db.from('la_cases').select('assigned_to, assigned_org').in('status', ['assigned', 'in_progress']),
    db.from('la_cases').select('assigned_to, assigned_at, first_action_at').not('first_action_at', 'is', null).gte('assigned_at', new Date(Date.now() - 180 * 86400000).toISOString()),
    db.from('la_organisations').select('id, name, kind, state').eq('status', 'approved').eq('state', c.state),
  ])
  const active = new Map<string, number>()
  const orgActive = new Map<string, number>()
  for (const r of open ?? []) {
    if (r.assigned_to) active.set(r.assigned_to, (active.get(r.assigned_to) ?? 0) + 1)
    if (r.assigned_org) orgActive.set(r.assigned_org, (orgActive.get(r.assigned_org) ?? 0) + 1)
  }
  const hours = new Map<string, number[]>()
  for (const r of recent ?? []) {
    if (!r.assigned_to || !r.assigned_at) continue
    hours.set(r.assigned_to, [...(hours.get(r.assigned_to) ?? []), (new Date(r.first_action_at!).getTime() - new Date(r.assigned_at).getTime()) / 3600000])
  }
  const wanted = [...(AREAS_FOR[c.kind] ?? []), ...(c.person_age != null && c.person_age < 18 ? ['Child justice'] : [])]
  const lang = (c.language ?? '').toLowerCase()

  const people: Suggestion[] = []
  for (const m of members ?? []) {
    const states = m.states_covered?.length ? m.states_covered : [m.state]
    if (!states.includes(c.state)) continue
    const busy = active.get(m.user_id) ?? 0
    if (busy >= m.capacity) continue
    const reasons: string[] = [m.state === c.state ? `Based in ${c.state}` : `Covers ${c.state}`]
    let score = 40 + (m.state === c.state ? 5 : 0)
    const areas = (m.practice_areas ?? []).filter((a: string) => wanted.includes(a))
    if (areas.length) {
      score += 20
      reasons.push(areas.join(', '))
    }
    if (lang && lang !== 'english' && (m.languages ?? []).some((l: string) => l.toLowerCase() === lang)) {
      score += 15
      reasons.push(`Speaks ${c.language}`)
    }
    score += Math.round(15 * (1 - busy / m.capacity))
    const h = (hours.get(m.user_id) ?? []).sort((a, b) => a - b)
    const med = h.length ? h[Math.floor(h.length / 2)]! : null
    if (med != null && med <= 24) {
      score += 10
      reasons.push(`Usually acts within ${Math.max(1, Math.round(med))} h`)
    }
    if ((c.kind === 'detention' || c.kind === 'police_abuse') && m.role === 'lawyer') {
      score += 10
      reasons.push('Lawyer — can go to court')
    }
    people.push({
      user_id: m.user_id,
      name: m.full_name,
      role: m.role,
      org: (m.org as unknown as { name: string } | null)?.name ?? null,
      score,
      load: `${busy} of ${m.capacity} cases`,
      reasons,
    })
  }
  people.sort((a, b) => b.score - a.score)

  const orgList: OrgSuggestion[] = (orgs ?? []).map((o) => {
    const n = (members ?? []).filter((m) => m.org_id === o.id).length
    return { id: o.id, name: o.name, kind: ORG_KINDS[o.kind] ?? o.kind, members: n, active: orgActive.get(o.id) ?? 0, reasons: [`In ${o.state}`, `${n} verified member${n === 1 ? '' : 's'}`] }
  })
  return { people: people.slice(0, 6), orgs: orgList.filter((o) => o.members > 0) }
}
