'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { canWork, logEvent, needsSupervisor, requireMember } from '@/lib/auth'
import { ACTIONS, FACILITY_TYPES, LAWYER_ONLY_ACTIONS, OUTCOMES, STATES } from '@/lib/constants'
import { alertFamily, alertVolunteer } from '@/lib/notify'
import { hashPin, newPin, newRef } from '@/lib/cases'

const str = (f: FormData, k: string, n = 300) => String(f.get(k) ?? '').trim().slice(0, n)
const day = (f: FormData, k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(str(f, k, 10)) ? str(f, k, 10) : null)
const FIRST_ACTION_HOURS = 48
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://legalaid.casewinai.com'
const firstName = (n: string) => n.split(/\s+/).slice(0, 2).join(' ')

async function loadCase(id: string) {
  const { data } = await createAdminClient().from('la_cases').select('*').eq('id', id).maybeSingle()
  return data
}

export async function claimCase(f: FormData) {
  const m = await requireMember()
  const db = createAdminClient()
  const id = str(f, 'id')
  if (f.get('no_conflict') !== 'on') redirect(`/desk/cases/${id}?error=conflict`)
  const { count } = await db.from('la_cases').select('id', { count: 'exact', head: true }).eq('assigned_to', m.user_id).in('status', ['assigned', 'in_progress'])
  if (!m.isAdmin && (count ?? 0) >= m.capacity) redirect(`/desk/cases/${id}?error=capacity`)
  const now = new Date()
  // Only an unassigned, open case can be claimed — the filter makes two volunteers claiming at once safe.
  const { data } = await db
    .from('la_cases')
    .update({ assigned_to: m.user_id, assigned_org: m.org_id, assigned_at: now.toISOString(), first_action_due: new Date(now.getTime() + FIRST_ACTION_HOURS * 3600000).toISOString(), first_action_at: null, status: 'assigned', conflict_cleared_by: m.user_id, conflict_cleared_at: now.toISOString(), updated_at: now.toISOString() })
    .eq('id', id)
    .is('assigned_to', null)
    .eq('status', 'new')
    .select('id')
    .maybeSingle()
  if (!data) redirect(`/desk/cases/${id}?error=taken`)
  await logEvent({ case_id: id, actor: m.user_id, actor_label: m.full_name, kind: 'conflict_check', body: 'Confirmed no conflict of interest.' })
  await logEvent({ case_id: id, actor: m.user_id, actor_label: m.full_name, kind: 'assigned', body: `Volunteer ${firstName(m.full_name)} has taken the case and will contact you within 48 hours.`, public: true })
  const c = await loadCase(id)
  if (c) await alertFamily(c, `Volunteer ${firstName(m.full_name)} has taken your case and will contact you within 48 hours.`, 'assigned').catch(() => {})
  redirect(`/desk/cases/${id}?claimed=1`)
}

/** Assignee gives a case back, or a coordinator/admin pulls it back to the board. */
export async function releaseCase(f: FormData) {
  const m = await requireMember()
  const c = await loadCase(str(f, 'id'))
  if (!c || !canWork(m, c)) redirect('/desk')
  const reason = str(f, 'reason', 500) || 'Released'
  await createAdminClient()
    .from('la_cases')
    .update({ assigned_to: null, assigned_org: null, assigned_at: null, first_action_due: null, first_action_at: null, status: 'new', updated_at: new Date().toISOString() })
    .eq('id', c.id)
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'released', body: reason })
  await logEvent({ case_id: c.id, kind: 'public_update', actor_label: 'CaseWin Legal Aid', body: 'We are finding another volunteer for this case.', public: true })
  redirect(c.assigned_to === m.user_id ? '/desk?released=1' : `/desk/cases/${c.id}`)
}

export async function assignTo(f: FormData) {
  const m = await requireMember()
  const c = await loadCase(str(f, 'id'))
  if (!c) redirect('/desk')
  const db = createAdminClient()
  const { data: to } = await db.from('la_members').select('user_id, full_name, org_id, status').eq('user_id', str(f, 'member')).maybeSingle()
  // Admins can assign anyone; a coordinator only to members of their own organisation.
  if (!to || to.status !== 'approved' || !(m.isAdmin || (m.role === 'coordinator' && m.org_id && to.org_id === m.org_id))) redirect(`/desk/cases/${c.id}?error=assign`)
  const now = new Date()
  await db
    .from('la_cases')
    .update({ assigned_to: to.user_id, assigned_org: to.org_id, assigned_at: now.toISOString(), first_action_due: new Date(now.getTime() + FIRST_ACTION_HOURS * 3600000).toISOString(), first_action_at: null, status: 'assigned', updated_at: now.toISOString() })
    .eq('id', c.id)
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'assigned', body: `Assigned to ${to.full_name} by ${m.full_name}` })
  await logEvent({ case_id: c.id, kind: 'public_update', actor_label: 'CaseWin Legal Aid', body: `Volunteer ${firstName(to.full_name)} has been assigned and will contact you within 48 hours.`, public: true })
  await alertFamily(c, `Volunteer ${firstName(to.full_name)} has been assigned and will contact you within 48 hours.`, 'assigned').catch(() => {})
  await alertVolunteer(to.user_id, c.id, `Case ${c.ref} assigned to you`, `${m.full_name} assigned you case ${c.ref} (${c.state}). Please act within 48 hours: ${SITE}/desk/cases/${c.id}`, 'assigned_volunteer').catch(() => {})
  redirect(`/desk/cases/${c.id}`)
}

export async function logAction(f: FormData) {
  const m = await requireMember()
  const c = await loadCase(str(f, 'id'))
  if (!c || !canWork(m, c)) redirect('/desk')
  const kind = str(f, 'kind', 40)
  if (!ACTIONS[kind]) redirect(`/desk/cases/${c.id}?error=action`)
  const note = str(f, 'note', 4000)
  const publicText = str(f, 'public_text', 500)
  if (kind === 'note' && !note) redirect(`/desk/cases/${c.id}?error=note`)
  if (LAWYER_ONLY_ACTIONS.includes(kind) && needsSupervisor(m, c)) redirect(`/desk/cases/${c.id}?error=supervise`)
  const now = new Date().toISOString()
  const patch: Record<string, unknown> = { updated_at: now }
  if (ACTIONS[kind]!.first && !c.first_action_at) patch.first_action_at = now
  if (c.status === 'assigned' && ACTIONS[kind]!.first) patch.status = 'in_progress'
  // Verification: the volunteer confirms the person and the core facts are real.
  const verify = str(f, 'verify_method', 60)
  if (verify && !c.verified_at) Object.assign(patch, { verified_at: now, verified_by: m.user_id, verification_method: verify })
  await createAdminClient().from('la_cases').update(patch).eq('id', c.id)
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind, body: [ACTIONS[kind]!.label, note].filter(Boolean).join(' — ') })
  if (verify && !c.verified_at) await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'verified', body: `Facts confirmed: ${verify}` })
  if (publicText) {
    await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'public_update', body: publicText, public: true })
    await alertFamily(c, publicText, 'update').catch(() => {})
  }
  revalidatePath(`/desk/cases/${c.id}`)
  redirect(`/desk/cases/${c.id}?saved=1`)
}

export async function updateFacts(f: FormData) {
  const m = await requireMember()
  const c = await loadCase(str(f, 'id'))
  if (!c || !canWork(m, c)) redirect('/desk')
  const fields = {
    facility: str(f, 'facility', 200) || null,
    arrested_on: day(f, 'arrested_on'),
    remanded_on: day(f, 'remanded_on'),
    last_hearing_on: day(f, 'last_hearing_on'),
    next_hearing_on: day(f, 'next_hearing_on'),
    court_name: str(f, 'court_name', 200) || null,
    charge_number: str(f, 'charge_number', 80) || null,
    allegation: str(f, 'allegation', 300) || null,
  }
  const changed = Object.entries(fields).filter(([k, v]) => (c as Record<string, unknown>)[k] !== v)
  if (!changed.length) redirect(`/desk/cases/${c.id}`)
  await createAdminClient().from('la_cases').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', c.id)
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'facts', body: 'Updated: ' + changed.map(([k, v]) => `${k.replace(/_/g, ' ')} → ${v ?? '—'}`).join('; ') })
  if (fields.next_hearing_on && fields.next_hearing_on !== c.next_hearing_on) {
    const text = `Next court date: ${new Date(fields.next_hearing_on).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}${fields.court_name ? `, ${fields.court_name}` : ''}.`
    await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'public_update', body: text, public: true })
    await alertFamily(c, text, 'hearing').catch(() => {})
  }
  redirect(`/desk/cases/${c.id}?saved=1`)
}

export async function recordOutcome(f: FormData) {
  const m = await requireMember()
  const c = await loadCase(str(f, 'id'))
  if (!c || !canWork(m, c)) redirect('/desk')
  const outcome = str(f, 'outcome', 40)
  if (!OUTCOMES[outcome]) redirect(`/desk/cases/${c.id}?error=outcome`)
  if (needsSupervisor(m, c)) redirect(`/desk/cases/${c.id}?error=supervise`)
  // An outcome only counts once the facts were confirmed by someone who met the person or saw the record.
  const verify = str(f, 'verify_method', 60)
  if (!c.verified_at && !verify) redirect(`/desk/cases/${c.id}?error=verify-first`)
  const now = new Date().toISOString()
  await createAdminClient()
    .from('la_cases')
    .update({
      outcome,
      outcome_on: day(f, 'outcome_on') ?? now.slice(0, 10),
      outcome_note: str(f, 'note', 2000) || null,
      status: 'resolved',
      updated_at: now,
      first_action_at: c.first_action_at ?? now,
      ...(verify && !c.verified_at ? { verified_at: now, verified_by: m.user_id, verification_method: verify } : {}),
    })
    .eq('id', c.id)
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'outcome', body: `${OUTCOMES[outcome]!.label}${str(f, 'note', 2000) ? ' — ' + str(f, 'note', 2000) : ''}` })
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'public_update', body: `Outcome: ${OUTCOMES[outcome]!.label}.`, public: true })
  await alertFamily(c, `Outcome: ${OUTCOMES[outcome]!.label}.`, 'outcome').catch(() => {})
  redirect(`/desk/cases/${c.id}?saved=1`)
}

export async function markSpam(f: FormData) {
  const m = await requireMember()
  const c = await loadCase(str(f, 'id'))
  if (!c || !(m.isAdmin || canWork(m, c))) redirect('/desk')
  const reason = str(f, 'reason', 500)
  if (!reason) redirect(`/desk/cases/${c.id}?error=reason`)
  await createAdminClient().from('la_cases').update({ status: 'spam', assigned_to: null, updated_at: new Date().toISOString() }).eq('id', c.id)
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'spam', body: reason })
  redirect('/desk?spam=1')
}

export type VisitResult = { error?: string; created?: { ref: string; pin: string; name: string }[] } | undefined

/**
 * A facility visit: a verified volunteer meets people in custody and records each one.
 * These are verified at source — the volunteer saw the person.
 */
export async function recordVisit(_: VisitResult, f: FormData): Promise<VisitResult> {
  const m = await requireMember()
  const state = str(f, 'state', 40)
  const facility = str(f, 'facility', 200)
  const facilityType = str(f, 'facility_type', 30)
  if (!(STATES as readonly string[]).includes(state) || facility.length < 3) return { error: 'Give the state and the facility you visited.' }
  if (!FACILITY_TYPES[facilityType]) return { error: 'Choose the type of facility.' }
  const names = f.getAll('person_name').map((v) => String(v).trim())
  const db = createAdminClient()
  const created: { ref: string; pin: string; name: string }[] = []
  const now = new Date().toISOString()
  for (let i = 0; i < names.length; i++) {
    const name = names[i]!.slice(0, 160)
    if (name.length < 3) continue
    const at = (k: string) => String(f.getAll(k)[i] ?? '').trim()
    const d = (k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(at(k)) ? at(k) : null)
    const age = Number(at('person_age'))
    const ref = newRef()
    const pin = newPin()
    const claim = f.get('take_all') === 'on'
    const { data, error } = await db
      .from('la_cases')
      .insert({
        ref,
        kind: 'detention',
        channel: 'visit',
        state,
        facility,
        facility_type: facilityType,
        person_name: name,
        person_age: Number.isInteger(age) && age > 0 ? age : null,
        person_sex: ['female', 'male'].includes(at('person_sex')) ? at('person_sex') : 'unspecified',
        arrested_on: d('arrested_on'),
        remanded_on: d('remanded_on'),
        last_hearing_on: d('last_hearing_on'),
        court_name: at('court_name').slice(0, 200) || null,
        allegation: at('allegation').slice(0, 300) || null,
        reporter_name: at('contact_name').slice(0, 160) || null,
        reporter_phone: at('contact_phone').slice(0, 30) || null,
        reporter_relationship: at('contact_phone') ? 'family' : null,
        story: at('notes').slice(0, 4000) || `Met during a visit to ${facility} by ${m.full_name}.`,
        consent_at: now,
        pin_hash: hashPin(ref, pin),
        verified_at: now,
        verified_by: m.user_id,
        verification_method: `Met in person at ${facility}`,
        created_by: m.user_id,
        ...(claim
          ? { assigned_to: m.user_id, assigned_org: m.org_id, assigned_at: now, first_action_at: now, status: 'in_progress' }
          : {}),
      })
      .select('id')
      .single()
    if (error || !data) return { error: `Saved ${created.length}; failed on ${name}. Try that one again.`, created }
    await logEvent({ case_id: data.id, actor: m.user_id, actor_label: m.full_name, kind: 'reported', body: `Recorded during a visit to ${facility}. Consent given in person.`, public: true })
    created.push({ ref, pin, name })
  }
  if (!created.length) return { error: 'Add at least one person.' }
  return { created }
}
