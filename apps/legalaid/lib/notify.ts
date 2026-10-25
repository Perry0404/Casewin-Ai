import { createAdminClient } from '@/lib/supabase/server'
import { KINDS } from '@/lib/constants'
import { intlPhone } from '@/lib/cases'

// SMS through Termii, email through Resend. Both switch on when their keys are set:
//   TERMII_API_KEY, TERMII_SENDER_ID (approved sender), TERMII_BASE_URL (from your Termii dashboard)
//   RESEND_API_KEY, NOTIFY_FROM_EMAIL (on a domain verified in Resend)
// Every attempt is logged in la_notifications — sent, failed, or skipped when no key is set.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://legalaid.casewinai.com'

type Log = { case_id: string | null; channel: 'sms' | 'email'; recipient: string; template: string; status: 'sent' | 'failed' | 'skipped'; detail?: string }
async function log(l: Log) {
  await createAdminClient().from('la_notifications').insert({ ...l, detail: l.detail?.slice(0, 500) ?? null })
}

export async function sendSms(to: string | null | undefined, text: string, meta: { case_id: string | null; template: string }) {
  const phone = intlPhone(to)
  if (!phone) return
  const key = process.env.TERMII_API_KEY
  if (!key) return log({ ...meta, channel: 'sms', recipient: phone, status: 'skipped', detail: 'TERMII_API_KEY not set' })
  try {
    const res = await fetch(`${process.env.TERMII_BASE_URL || 'https://v3.api.termii.com'}/api/sms/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to: phone, from: process.env.TERMII_SENDER_ID || 'CaseWin', sms: text.slice(0, 450), type: 'plain', channel: 'generic', api_key: key }),
    })
    await log({ ...meta, channel: 'sms', recipient: phone, status: res.ok ? 'sent' : 'failed', detail: res.ok ? undefined : `${res.status} ${await res.text()}` })
  } catch (e) {
    await log({ ...meta, channel: 'sms', recipient: phone, status: 'failed', detail: String(e) })
  }
}

export async function sendEmail(to: string | null | undefined, subject: string, text: string, meta: { case_id: string | null; template: string }) {
  if (!to) return
  const key = process.env.RESEND_API_KEY
  if (!key || !process.env.NOTIFY_FROM_EMAIL) return log({ ...meta, channel: 'email', recipient: to, status: 'skipped', detail: 'RESEND_API_KEY / NOTIFY_FROM_EMAIL not set' })
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM_EMAIL, to, subject, text }),
    })
    await log({ ...meta, channel: 'email', recipient: to, status: res.ok ? 'sent' : 'failed', detail: res.ok ? undefined : `${res.status} ${await res.text()}` })
  } catch (e) {
    await log({ ...meta, channel: 'email', recipient: to, status: 'failed', detail: String(e) })
  }
}

type AlertCase = { id: string; ref: string; kind: string; state: string; facility: string | null; reporter_phone: string | null; reporter_email?: string | null; safe_contact?: string | null }

/** Messages to the family respect the safety answer: nothing is sent to a number marked unsafe. */
function familyMayReceive(c: AlertCase) {
  return c.safe_contact !== 'no_calls' && c.safe_contact !== 'other_way'
}

/**
 * A new request: tell approved volunteers who cover the state. Never includes the person's
 * name or the family's number — only the reference, the state and a link to the board.
 */
export async function alertNewCase(c: AlertCase) {
  const db = createAdminClient()
  const { data: vols } = await db.from('la_members').select('user_id, email, phone, states_covered, state').eq('status', 'approved').limit(500)
  const covering = (vols ?? []).filter((v) => (v.states_covered?.length ? v.states_covered : [v.state]).includes(c.state)).slice(0, 25)
  const what = KINDS[c.kind]?.short ?? 'Request'
  const sms = `CaseWin Legal Aid: new ${what.toLowerCase()} request in ${c.state} (${c.ref}). Can you take it? ${SITE}/desk/board`
  await Promise.all(
    covering.flatMap((v) => [
      sendSms(v.phone, sms, { case_id: c.id, template: 'new_case_volunteer' }),
      sendEmail(v.email, `New ${what.toLowerCase()} request in ${c.state} — ${c.ref}`, `${sms}\n\nOpen the case board to see the details and take it. Taking it starts the 48-hour clock.`, { case_id: c.id, template: 'new_case_volunteer' }),
    ]),
  )
}

export async function alertFamily(c: AlertCase, message: string, template: string) {
  if (!familyMayReceive(c)) return log({ case_id: c.id, channel: 'sms', recipient: c.reporter_phone ?? '-', template, status: 'skipped', detail: `safety: ${c.safe_contact}` })
  const text = `CaseWin Legal Aid ${c.ref}: ${message} Track: ${SITE}/track (use your PIN). We never ask for money.`
  await sendSms(c.reporter_phone, text, { case_id: c.id, template })
  if (c.reporter_email) await sendEmail(c.reporter_email, `Update on your request ${c.ref}`, text, { case_id: c.id, template })
}

export async function alertVolunteer(userId: string, caseId: string, subject: string, text: string, template: string) {
  const { data: v } = await createAdminClient().from('la_members').select('email, phone').eq('user_id', userId).maybeSingle()
  if (!v) return
  await Promise.all([sendSms(v.phone, `CaseWin Legal Aid: ${text}`, { case_id: caseId, template }), sendEmail(v.email, subject, text, { case_id: caseId, template })])
}
