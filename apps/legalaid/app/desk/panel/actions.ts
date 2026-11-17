'use server'

import { randomBytes } from 'crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireMember } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { caseAlertMessage, newAccessToken, panelEmail, parseRoster, waLink, welcomeMessage } from '@/lib/panel'

/** The organisation whose panel this person may manage: their own as coordinator, or any as a platform admin. */
async function manager(orgId: string) {
  const m = await requireMember()
  if (!orgId || !(m.isAdmin || (m.role === 'coordinator' && m.org_id === orgId))) redirect('/desk')
  const { data: org } = await createAdminClient().from('la_organisations').select('id, name, state').eq('id', orgId).maybeSingle()
  if (!org) redirect('/desk')
  return { m, org }
}

const back = (orgId: string, q = '') => `/desk/panel?org=${orgId}${q}`

/** Open WhatsApp with the case alert written, to send to the panel's broadcast list. Logged. */
export async function sendCaseToPanel(f: FormData) {
  const { m, org } = await manager(String(f.get('org_id')))
  const db = createAdminClient()
  const { data: c } = await db.from('la_cases').select('id, ref, kind, state, lga, facility, created_at, status').eq('id', String(f.get('case_id'))).maybeSingle()
  if (!c || c.status !== 'new') redirect(back(org.id, '&error=taken'))
  await db.from('la_panel_alerts').insert({ case_id: c.id, org_id: org.id, sent_by: m.user_id })
  redirect(waLink(null, caseAlertMessage(c, org.name)))
}

/** Make a new personal sign-in link (the old one stops working) and open WhatsApp to that lawyer with it. */
export async function sendSignInLink(f: FormData) {
  const { org } = await manager(String(f.get('org_id')))
  const db = createAdminClient()
  const { data: p } = await db.from('la_members').select('user_id, full_name, whatsapp, phone, org_id').eq('user_id', String(f.get('user_id'))).maybeSingle()
  if (!p || p.org_id !== org.id) redirect(back(org.id))
  const { token, hash } = newAccessToken()
  await db.from('la_members').update({ access_token_hash: hash, access_sent_at: new Date().toISOString() }).eq('user_id', p.user_id)
  redirect(waLink(p.whatsapp ?? p.phone, welcomeMessage({ name: p.full_name, orgName: org.name, token })))
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
    const { data: u, error } = await db.auth.admin.createUser({
      email: panelEmail(wa),
      email_confirm: true,
      password: randomBytes(24).toString('base64url'),
      user_metadata: { full_name: r.name, panel: org.id },
    })
    if (error || !u.user) {
      dupes++
      continue
    }
    const { error: insErr } = await db.from('la_members').insert({
      user_id: u.user.id,
      org_id: org.id,
      role: 'lawyer',
      full_name: r.name,
      email: panelEmail(wa),
      phone: r.phones.join(' / '),
      whatsapp: wa,
      state: org.state,
      states_covered: [org.state],
      status: 'approved',
      approved_at: new Date().toISOString(),
      reviewer_note: `Vouched for by ${org.name}`,
      on_panel: true,
      added_by: m.user_id,
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

/** Take a lawyer off the panel. Their sign-in link stops working; their case history stays. */
export async function removeFromPanel(f: FormData) {
  const { org } = await manager(String(f.get('org_id')))
  const db = createAdminClient()
  await db.from('la_members').update({ status: 'suspended', on_panel: false, access_token_hash: null }).eq('user_id', String(f.get('user_id'))).eq('org_id', org.id)
  revalidatePath('/desk/panel')
  redirect(back(org.id))
}
