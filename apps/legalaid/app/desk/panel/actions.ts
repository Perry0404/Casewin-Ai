'use server'

import { randomBytes } from 'crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logEvent, requireMember } from '@/lib/auth'
import { alertFamily } from '@/lib/notify'
import { createAdminClient } from '@/lib/supabase/server'
import { caseAlertMessage, caseDetailsMessage, panelEmail, parseRoster, waLink } from '@/lib/panel'

// The coordinator runs the panel on WhatsApp. Lawyers never sign in: the coordinator posts
// the case to the group, records who took it, and records what they report back.

const FIRST_ACTION_HOURS = 48
const firstName = (n: string) => n.split(/\s+/).slice(0, 2).join(' ')

/** The organisation whose panel this person may manage: their own as coordinator, or any as a platform admin. */
async function manager(orgId: string) {
  const m = await requireMember()
  if (!orgId || !(m.isAdmin || (m.role === 'coordinator' && m.org_id === orgId))) redirect('/desk')
  const { data: org } = await createAdminClient().from('la_organisations').select('id, name, state').eq('id', orgId).maybeSingle()
  if (!org) redirect('/desk')
  return { m, org }
}

const back = (orgId: string, q = '') => `/desk/panel?org=${orgId}${q}`

/** Open WhatsApp with the case written out (no names), to post in the panel's group. */
export async function postToGroup(f: FormData) {
  const { m, org } = await manager(String(f.get('org_id')))
  const db = createAdminClient()
  const { data: c } = await db.from('la_cases').select('id, ref, kind, state, lga, facility, allegation, status').eq('id', String(f.get('case_id'))).maybeSingle()
  if (!c || c.status !== 'new') redirect(back(org.id, '&error=taken'))
  await db.from('la_panel_alerts').insert({ case_id: c.id, org_id: org.id, sent_by: m.user_id })
  redirect(waLink(null, caseAlertMessage(c, org.name)))
}

/** A lawyer said "I'll take it": record the case to them. The 48-hour clock starts. */
export async function recordTaken(f: FormData) {
  const { m, org } = await manager(String(f.get('org_id')))
  const db = createAdminClient()
  const caseId = String(f.get('case_id'))
  const { data: to } = await db.from('la_members').select('user_id, full_name, org_id, status').eq('user_id', String(f.get('lawyer'))).maybeSingle()
  if (!to || to.org_id !== org.id || to.status !== 'approved') redirect(back(org.id, '&error=lawyer'))
  const now = new Date()
  const { data: c } = await db
    .from('la_cases')
    .update({ assigned_to: to.user_id, assigned_org: org.id, assigned_at: now.toISOString(), first_action_due: new Date(now.getTime() + FIRST_ACTION_HOURS * 3600000).toISOString(), first_action_at: null, status: 'assigned', updated_at: now.toISOString() })
    .eq('id', caseId)
    .eq('status', 'new')
    .select('*')
    .maybeSingle()
  if (!c) redirect(back(org.id, '&error=taken'))
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'assigned', body: `Taken by ${to.full_name} (${org.name} panel), recorded by ${m.full_name}` })
  await logEvent({ case_id: c.id, kind: 'public_update', actor_label: 'CaseWin Legal Aid', body: `Lawyer ${firstName(to.full_name)} has taken the case and will contact you within 48 hours.`, public: true })
  await alertFamily(c, `Lawyer ${firstName(to.full_name)} has taken your case and will contact you within 48 hours.`, 'assigned').catch(() => {})
  redirect(back(org.id, `&taken=${c.id}`))
}

/** Open WhatsApp to the lawyer who took the case, with the full details. */
export async function sendDetails(f: FormData) {
  const { org } = await manager(String(f.get('org_id')))
  const db = createAdminClient()
  const { data: c } = await db.from('la_cases').select('*').eq('id', String(f.get('case_id'))).maybeSingle()
  if (!c || c.assigned_org !== org.id || !c.assigned_to) redirect(back(org.id))
  const { data: l } = await db.from('la_members').select('full_name, whatsapp, phone').eq('user_id', c.assigned_to).maybeSingle()
  if (!l) redirect(back(org.id))
  redirect(waLink(l.whatsapp ?? l.phone, caseDetailsMessage(c, l.full_name)))
}

/** The lawyer reported back that they have contacted the family or visited: stop the 48-hour clock. */
export async function recordContacted(f: FormData) {
  const { m, org } = await manager(String(f.get('org_id')))
  const db = createAdminClient()
  const { data: c } = await db.from('la_cases').select('id, assigned_org, assigned_to, first_action_at').eq('id', String(f.get('case_id'))).maybeSingle()
  if (!c || c.assigned_org !== org.id) redirect(back(org.id))
  if (!c.first_action_at) {
    const now = new Date().toISOString()
    await db.from('la_cases').update({ first_action_at: now, status: 'in_progress', updated_at: now }).eq('id', c.id)
    const { data: l } = await db.from('la_members').select('full_name').eq('user_id', c.assigned_to).maybeSingle()
    await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'contacted_family', body: `${l?.full_name ?? 'The lawyer'} reported contacting the family (recorded by ${m.full_name}).` })
  }
  revalidatePath('/desk/panel')
  redirect(back(org.id))
}

/** Paste a list: one lawyer per line, name and phone number(s). The organisation vouches for them. */
export async function addPanelLawyers(f: FormData) {
  const { m, org } = await manager(String(f.get('org_id')))
  const { rows, skipped } = parseRoster(String(f.get('roster') ?? '').slice(0, 20000))
  const db = createAdminClient()
  const { data: existing } = await db.from('la_members').select('whatsapp, phone')
  const known = new Set((existing ?? []).flatMap((e) => [e.whatsapp, e.phone]).filter(Boolean))
  let added = 0
  let dupes = 0
  for (const r of rows) {
    const wa = r.phones[0]
    if (known.has(wa)) {
      dupes++
      continue
    }
    // Every member needs an account record; panel lawyers never use it (no password is ever shared).
    const { data: u, error } = await db.auth.admin.createUser({ email: panelEmail(wa), email_confirm: true, password: randomBytes(24).toString('base64url'), user_metadata: { full_name: r.name, panel: org.id } })
    if (error || !u.user) {
      dupes++
      continue
    }
    const { error: insErr } = await db.from('la_members').insert({
      user_id: u.user.id, org_id: org.id, role: 'lawyer', full_name: r.name, email: panelEmail(wa), phone: r.phones.join(' / '), whatsapp: wa,
      state: org.state, states_covered: [org.state], status: 'approved', approved_at: new Date().toISOString(), reviewer_note: `Vouched for by ${org.name}`, on_panel: true, added_by: m.user_id,
    })
    if (insErr) {
      await db.auth.admin.deleteUser(u.user.id)
      dupes++
      continue
    }
    known.add(wa)
    added++
  }
  revalidatePath('/desk/panel')
  redirect(back(org.id, `&added=${added}&dupes=${dupes}&skipped=${skipped.length}`))
}

/** Take a lawyer off the panel. Their case history stays. */
export async function removeFromPanel(f: FormData) {
  const { org } = await manager(String(f.get('org_id')))
  await createAdminClient().from('la_members').update({ status: 'suspended', on_panel: false, access_token_hash: null }).eq('user_id', String(f.get('user_id'))).eq('org_id', org.id)
  revalidatePath('/desk/panel')
  redirect(back(org.id))
}
