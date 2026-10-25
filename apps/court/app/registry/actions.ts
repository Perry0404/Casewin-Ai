'use server'

// Every registry mutation lives here. Each action re-checks the caller's role
// and scopes every query to the caller's own court — never trust form input
// for court_id.

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { logEvent, requireStaff, type StaffRole } from '@/lib/auth'
import { CASE_TYPES, DISPOSED_STATUSES } from '@/lib/constants'
import { slugify } from '@/lib/format'

const str = (f: FormData, k: string, n = 500) => String(f.get(k) ?? '').trim().slice(0, n)

async function loadFiling(id: string, courtId: string) {
  const { data } = await createAdminClient().from('filings').select('*').eq('id', id).eq('court_id', courtId).maybeSingle()
  if (!data) redirect('/registry/filings?error=not-found')
  return data
}

async function loadCase(id: string, courtId: string) {
  const { data } = await createAdminClient().from('cases').select('*').eq('id', id).eq('court_id', courtId).maybeSingle()
  if (!data) redirect('/registry/cases?error=not-found')
  return data
}

// ── Filings ──────────────────────────────────────────────────────────────────

export async function queryFiling(form: FormData) {
  const staff = await requireStaff('filings.review')
  const filing = await loadFiling(str(form, 'id'), staff.court_id)
  const note = str(form, 'note', 4000)
  if (!note) return
  await createAdminClient().from('filings').update({ status: 'queried', query_note: note, reviewed_by: staff.id, updated_at: new Date().toISOString() }).eq('id', filing.id)
  await logEvent({ court_id: staff.court_id, filing_id: filing.id, action: 'filing.queried', actor: staff, detail: { note } })
  revalidatePath(`/registry/filings/${filing.id}`)
}

export async function assessFees(form: FormData) {
  const staff = await requireStaff('filings.review')
  const filing = await loadFiling(str(form, 'id'), staff.court_id)
  if (!['submitted', 'under_review', 'assessed'].includes(filing.status)) return

  // Lines come from the court's schedule (code + quantity) plus free-form extras.
  const schedule = staff.court.fee_schedule
  const items: { label: string; amount: number }[] = []
  for (const fee of schedule) {
    const qty = Math.max(0, Math.min(500, Number(form.get(`qty_${fee.code}`) || 0)))
    if (qty > 0) items.push({ label: qty > 1 ? `${fee.label} × ${qty}` : fee.label, amount: fee.amount * qty })
  }
  const extraLabel = str(form, 'extra_label', 200)
  const extraAmount = Number(form.get('extra_amount') || 0)
  if (extraLabel && extraAmount > 0) items.push({ label: extraLabel, amount: extraAmount })
  if (!items.length) return

  const total = items.reduce((s, i) => s + i.amount, 0)
  await createAdminClient()
    .from('filings')
    .update({
      status: 'assessed',
      fee_assessment: { items, total, assessed_by: staff.full_name, assessed_at: new Date().toISOString() },
      reviewed_by: staff.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', filing.id)
  await logEvent({ court_id: staff.court_id, filing_id: filing.id, action: 'filing.assessed', actor: staff, detail: { total } })
  revalidatePath(`/registry/filings/${filing.id}`)
}

export async function recordPayment(form: FormData) {
  const staff = await requireStaff('filings.review')
  const filing = await loadFiling(str(form, 'id'), staff.court_id)
  const receipt = str(form, 'receipt', 80)
  if (filing.status !== 'assessed' || !receipt) return
  await createAdminClient().from('filings').update({ status: 'paid', payment_reference: receipt, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', filing.id)
  await logEvent({ court_id: staff.court_id, filing_id: filing.id, action: 'filing.paid', actor: staff, detail: { receipt, recorded_by_registry: true } })
  revalidatePath(`/registry/filings/${filing.id}`)
}

export async function rejectFiling(form: FormData) {
  const staff = await requireStaff('filings.decide')
  const filing = await loadFiling(str(form, 'id'), staff.court_id)
  const reason = str(form, 'reason', 4000)
  if (!reason || filing.status === 'accepted') return
  await createAdminClient().from('filings').update({ status: 'rejected', rejection_reason: reason, reviewed_by: staff.id, updated_at: new Date().toISOString() }).eq('id', filing.id)
  await logEvent({ court_id: staff.court_id, filing_id: filing.id, action: 'filing.rejected', actor: staff, detail: { reason } })
  revalidatePath(`/registry/filings/${filing.id}`)
}

/** Paid → open the case: issue the suit number, allocate a judge, list the first date. */
export async function acceptFiling(form: FormData) {
  const staff = await requireStaff('filings.decide')
  const filing = await loadFiling(str(form, 'id'), staff.court_id)
  if (filing.status !== 'paid' || filing.case_id) return

  const db = createAdminClient()
  const divisionId = str(form, 'division_id') || filing.division_id
  const { data: division } = await db.from('divisions').select('id').eq('id', divisionId).eq('court_id', staff.court_id).maybeSingle()
  if (!division) redirect(`/registry/filings/${filing.id}?error=division`)

  const caseType = CASE_TYPES.some((c) => c.value === str(form, 'case_type')) ? str(form, 'case_type') : filing.case_type
  const judgeId = str(form, 'judge_id') || null
  if (judgeId) {
    const { data: j } = await db.from('judges').select('id').eq('id', judgeId).eq('court_id', staff.court_id).maybeSingle()
    if (!j) redirect(`/registry/filings/${filing.id}?error=judge`)
  }

  const { data: suitNumber, error: seqErr } = await db.rpc('assign_suit_number', { p_division_id: division.id })
  if (seqErr || !suitNumber) redirect(`/registry/filings/${filing.id}?error=suit-number`)

  const firstDate = str(form, 'first_date')
  const { data: created, error } = await db
    .from('cases')
    .insert({
      court_id: staff.court_id,
      division_id: division.id,
      filing_id: filing.id,
      suit_number: suitNumber,
      title: filing.title,
      case_type: caseType,
      claimants: filing.claimants,
      defendants: filing.defendants,
      claimant_counsel: filing.filer_type === 'lawyer' ? [filing.filer_name, filing.law_firm].filter(Boolean).join(', ') : null,
      judge_id: judgeId,
      status: judgeId ? 'active' : 'pending_assignment',
      urgent: filing.urgent,
      filed_at: filing.created_at,
      assigned_at: judgeId ? new Date().toISOString() : null,
    })
    .select('id')
    .single()
  if (error || !created) redirect(`/registry/filings/${filing.id}?error=case`)

  await db.from('filings').update({ status: 'accepted', case_id: created.id, reviewed_by: staff.id, updated_at: new Date().toISOString() }).eq('id', filing.id)
  await logEvent({ court_id: staff.court_id, filing_id: filing.id, case_id: created.id, action: 'filing.accepted', actor: staff, detail: { suit_number: suitNumber } })
  if (judgeId) await logEvent({ court_id: staff.court_id, case_id: created.id, action: 'case.assigned', actor: staff, detail: { judge_id: judgeId } })

  if (firstDate && judgeId) await listHearing(staff, created.id, judgeId, firstDate, str(form, 'first_time') || '09:00', 'mention')

  redirect(`/registry/cases/${created.id}?opened=1`)
}

// ── Cases & hearings ─────────────────────────────────────────────────────────

async function listHearing(staff: { id: string; court_id: string; full_name: string }, caseId: string, judgeId: string, day: string, time: string, purpose: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time)) return
  const db = createAdminClient()
  const { data: judge } = await db.from('judges').select('courtroom').eq('id', judgeId).maybeSingle()
  const when = new Date(`${day}T${time}:00+01:00`).toISOString()
  await db.from('hearings').insert({ case_id: caseId, court_id: staff.court_id, judge_id: judgeId, scheduled_for: when, purpose, courtroom: judge?.courtroom ?? null, created_by: staff.id })
  await db.from('cases').update({ next_hearing_at: when, updated_at: new Date().toISOString() }).eq('id', caseId)
  await logEvent({ court_id: staff.court_id, case_id: caseId, action: 'hearing.listed', actor: staff, detail: { when, purpose } })
}

export async function assignJudge(form: FormData) {
  const staff = await requireStaff('cases.schedule')
  const c = await loadCase(str(form, 'case_id'), staff.court_id)
  const judgeId = str(form, 'judge_id')
  const db = createAdminClient()
  const { data: j } = await db.from('judges').select('id, name').eq('id', judgeId).eq('court_id', staff.court_id).maybeSingle()
  if (!j) return
  await db
    .from('cases')
    .update({ judge_id: j.id, status: c.status === 'pending_assignment' ? 'active' : c.status, assigned_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', c.id)
  await logEvent({ court_id: staff.court_id, case_id: c.id, action: c.judge_id ? 'case.reassigned' : 'case.assigned', actor: staff, detail: { judge: j.name } })
  revalidatePath(`/registry/cases/${c.id}`)
}

export async function scheduleHearing(form: FormData) {
  const staff = await requireStaff('cases.schedule')
  const c = await loadCase(str(form, 'case_id'), staff.court_id)
  if (!c.judge_id) return
  await listHearing(staff, c.id, c.judge_id, str(form, 'date'), str(form, 'time') || '09:00', str(form, 'purpose') || 'mention')
  revalidatePath(`/registry/cases/${c.id}`)
}

const OUTCOME_TO_STATUS: Record<string, string | null> = {
  held: 'active',
  adjourned: 'adjourned',
  not_sitting: 'adjourned',
  struck_out: 'struck_out',
  judgment_delivered: 'judgment_delivered',
  settled: 'settled',
}

export async function recordOutcome(form: FormData) {
  const staff = await requireStaff('hearings.record')
  const db = createAdminClient()
  const { data: h } = await db.from('hearings').select('id, case_id, purpose, judge_id').eq('id', str(form, 'hearing_id')).eq('court_id', staff.court_id).maybeSingle()
  if (!h) return
  if (staff.role === 'judge' && staff.judge_id && h.judge_id !== staff.judge_id) return

  const outcome = str(form, 'outcome')
  if (!(outcome in OUTCOME_TO_STATUS)) return
  const reason = outcome === 'adjourned' || outcome === 'not_sitting' ? str(form, 'reason', 200) || (outcome === 'not_sitting' ? 'Judge not sitting' : 'Other') : null
  await db.from('hearings').update({ outcome, adjournment_reason: reason, notes: str(form, 'notes', 4000) || null }).eq('id', h.id)

  const c = await loadCase(h.case_id, staff.court_id)
  let status = OUTCOME_TO_STATUS[outcome]!
  // A case whose addresses were adopted is reserved for judgment, not merely "active".
  if (outcome === 'held' && h.purpose === 'adoption') status = 'reserved'
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString(), next_hearing_at: null }
  if (outcome === 'adjourned' || outcome === 'not_sitting') update.adjournment_count = (c.adjournment_count ?? 0) + 1
  if (DISPOSED_STATUSES.includes(status)) update.disposed_at = new Date().toISOString()
  await db.from('cases').update(update).eq('id', c.id)
  await logEvent({ court_id: staff.court_id, case_id: c.id, action: `hearing.${outcome}`, actor: staff, detail: { reason } })

  // Adjourned to a new date in the same step.
  const nextDate = str(form, 'next_date')
  if (nextDate && c.judge_id && !DISPOSED_STATUSES.includes(status)) {
    await listHearing(staff, c.id, c.judge_id, nextDate, str(form, 'next_time') || '09:00', str(form, 'next_purpose') || h.purpose)
  }
  revalidatePath(`/registry/cases/${c.id}`)
  revalidatePath('/registry/cause-list')
}

// ── Judgments ────────────────────────────────────────────────────────────────

function splitList(s: string) {
  return s
    .split(/\n|;/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 50)
}

export async function saveJudgment(form: FormData) {
  const staff = await requireStaff('judgments.upload')
  const db = createAdminClient()
  const c = await loadCase(str(form, 'case_id'), staff.court_id)
  const fullText = str(form, 'full_text', 400000)
  if (fullText.length < 200) redirect(`/registry/judgments/new?case=${c.id}&error=short`)

  const { data: judge } = c.judge_id ? await db.from('judges').select('name').eq('id', c.judge_id).maybeSingle() : { data: null }
  const { data: division } = c.division_id ? await db.from('divisions').select('name').eq('id', c.division_id).maybeSingle() : { data: null }
  const deliveredOn = str(form, 'delivered_on') || new Date().toISOString().slice(0, 10)

  const row = {
    court_id: staff.court_id,
    case_id: c.id,
    source: 'court_upload',
    title: c.title,
    suit_number: c.suit_number,
    court_name: staff.court.name,
    division: division?.name ?? null,
    state: staff.court.state,
    judges: judge ? [judge.name] : [],
    case_type: c.case_type,
    delivered_on: deliveredOn,
    summary: str(form, 'summary', 6000) || null,
    holding: str(form, 'holding', 2000) || null,
    issues: splitList(str(form, 'issues', 8000)),
    keywords: splitList(str(form, 'keywords', 2000).replace(/,/g, ';')),
    statutes_cited: splitList(str(form, 'statutes_cited', 4000)),
    cases_cited: splitList(str(form, 'cases_cited', 8000)),
    full_text: fullText,
    status: 'draft',
    uploaded_by: staff.id,
    is_sample: c.is_sample,
    updated_at: new Date().toISOString(),
  }

  const existingId = str(form, 'judgment_id')
  let id = existingId
  if (existingId) {
    await db.from('judgments').update(row).eq('id', existingId).eq('court_id', staff.court_id).neq('status', 'published')
  } else {
    const slug = `${slugify(c.suit_number.replace(/\//g, '-'))}-${slugify(c.title)}`.slice(0, 96) + '-' + crypto.randomUUID().slice(0, 4)
    const { data } = await db.from('judgments').insert({ ...row, slug }).select('id').single()
    id = data?.id
    if (c.status !== 'judgment_delivered') {
      await db.from('cases').update({ status: 'judgment_delivered', disposed_at: c.disposed_at ?? new Date(`${deliveredOn}T12:00:00+01:00`).toISOString(), next_hearing_at: null }).eq('id', c.id)
    }
    await logEvent({ court_id: staff.court_id, case_id: c.id, action: 'judgment.uploaded', actor: staff })
  }
  redirect(`/registry/judgments/${id}`)
}

export async function publishJudgment(form: FormData) {
  const staff = await requireStaff('judgments.publish')
  const db = createAdminClient()
  const id = str(form, 'id')
  if (form.get('redaction_confirmed') !== 'on') redirect(`/registry/judgments/${id}?error=redaction`)
  const { data: j } = await db.from('judgments').select('id, case_id').eq('id', id).eq('court_id', staff.court_id).maybeSingle()
  if (!j) return
  await db
    .from('judgments')
    .update({ status: 'published', redaction_confirmed: true, published_by: staff.id, published_at: new Date().toISOString() })
    .eq('id', j.id)
  await logEvent({ court_id: staff.court_id, case_id: j.case_id, action: 'judgment.published', actor: staff })
  revalidatePath(`/registry/judgments/${j.id}`)
}

export async function withdrawJudgment(form: FormData) {
  const staff = await requireStaff('judgments.publish')
  const db = createAdminClient()
  const { data: j } = await db.from('judgments').select('id, case_id').eq('id', str(form, 'id')).eq('court_id', staff.court_id).maybeSingle()
  if (!j) return
  await db.from('judgments').update({ status: 'withdrawn' }).eq('id', j.id)
  await logEvent({ court_id: staff.court_id, case_id: j.case_id, action: 'judgment.withdrawn', actor: staff, detail: { reason: str(form, 'reason', 500) } })
  revalidatePath(`/registry/judgments/${j.id}`)
}

// ── Staff & settings (court administrator) ──────────────────────────────────

/**
 * Shows a new temporary password to the administrator exactly once. It travels
 * in a 2-minute httpOnly cookie, never in a URL, so it stays out of browser
 * history and request logs.
 */
function handOver(email: string, password: string) {
  cookies().set('handover', JSON.stringify({ email, password }), { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 120, path: '/registry/staff' })
}

function tempPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(14))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

export async function createStaff(form: FormData) {
  const admin = await requireStaff('staff.manage')
  const db = createAdminClient()
  const email = str(form, 'email', 200).toLowerCase()
  const fullName = str(form, 'full_name', 160)
  const role = str(form, 'role') as StaffRole
  if (!email || !fullName || !['court_admin', 'registrar', 'clerk', 'judge'].includes(role)) redirect('/registry/staff?error=missing')

  let judgeId: string | null = null
  if (role === 'judge') {
    judgeId = str(form, 'judge_id') || null
    if (judgeId) {
      const { data: j } = await db.from('judges').select('id').eq('id', judgeId).eq('court_id', admin.court_id).maybeSingle()
      if (!j) judgeId = null
    }
  }

  const password = tempPassword()
  const { data: created, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } })
  if (error || !created.user) redirect(`/registry/staff?error=${encodeURIComponent(error?.message.includes('already') ? 'exists' : 'create')}`)

  await db.from('court_staff').insert({ user_id: created.user.id, court_id: admin.court_id, role, full_name: fullName, email, judge_id: judgeId })
  await logEvent({ court_id: admin.court_id, action: 'staff.created', actor: admin, detail: { email, role } })
  handOver(email, password)
  redirect('/registry/staff?created=1')
}

export async function resetStaffPassword(form: FormData) {
  const admin = await requireStaff('staff.manage')
  const db = createAdminClient()
  const { data: s } = await db.from('court_staff').select('id, user_id, email').eq('id', str(form, 'id')).eq('court_id', admin.court_id).maybeSingle()
  if (!s) return
  const password = tempPassword()
  await db.auth.admin.updateUserById(s.user_id, { password })
  await db.from('court_staff').update({ must_change_password: true }).eq('id', s.id)
  await logEvent({ court_id: admin.court_id, action: 'staff.password_reset', actor: admin, detail: { email: s.email } })
  handOver(s.email, password)
  redirect('/registry/staff?created=1&reset=1')
}

export async function setStaffActive(form: FormData) {
  const admin = await requireStaff('staff.manage')
  const id = str(form, 'id')
  if (id === admin.id) return // can't lock yourself out
  const active = str(form, 'active') === 'true'
  const db = createAdminClient()
  const { data: s } = await db.from('court_staff').select('id, user_id, email').eq('id', id).eq('court_id', admin.court_id).maybeSingle()
  if (!s) return
  await db.from('court_staff').update({ is_active: active }).eq('id', s.id)
  // Also block sign-in at the auth layer while deactivated.
  await db.auth.admin.updateUserById(s.user_id, { ban_duration: active ? 'none' : '876000h' })
  await logEvent({ court_id: admin.court_id, action: active ? 'staff.reactivated' : 'staff.deactivated', actor: admin, detail: { email: s.email } })
  revalidatePath('/registry/staff')
}

export async function changeOwnPassword(form: FormData) {
  const staff = await requireStaff()
  const password = String(form.get('password') ?? '')
  if (password.length < 10 || password !== String(form.get('confirm') ?? '')) redirect('/registry/account?error=password')
  const { error } = await createSessionClient().auth.updateUser({ password })
  if (error) redirect('/registry/account?error=update')
  await createAdminClient().from('court_staff').update({ must_change_password: false }).eq('id', staff.id)
  await logEvent({ court_id: staff.court_id, action: 'staff.password_changed', actor: staff })
  redirect('/registry?welcome=1')
}

export async function saveJudge(form: FormData) {
  const admin = await requireStaff('settings.manage')
  const db = createAdminClient()
  const row = {
    court_id: admin.court_id,
    name: str(form, 'name', 160),
    courtroom: str(form, 'courtroom', 60) || null,
    division_id: str(form, 'division_id') || null,
    specialisations: form.getAll('specialisations').map(String).filter((s) => CASE_TYPES.some((c) => c.value === s)),
  }
  if (!row.name) return
  const id = str(form, 'id')
  if (id) await db.from('judges').update(row).eq('id', id).eq('court_id', admin.court_id)
  else await db.from('judges').insert(row)
  revalidatePath('/registry/settings')
}

export async function setJudgeActive(form: FormData) {
  const admin = await requireStaff('settings.manage')
  await createAdminClient().from('judges').update({ is_active: str(form, 'active') === 'true' }).eq('id', str(form, 'id')).eq('court_id', admin.court_id)
  revalidatePath('/registry/settings')
}

export async function saveDivision(form: FormData) {
  const admin = await requireStaff('settings.manage')
  const name = str(form, 'name', 120)
  const code = str(form, 'code', 8).toUpperCase().replace(/[^A-Z]/g, '')
  if (!name || !code) return
  await createAdminClient().from('divisions').insert({ court_id: admin.court_id, name, code })
  revalidatePath('/registry/settings')
}

export async function saveFees(form: FormData) {
  const admin = await requireStaff('settings.manage')
  const labels = form.getAll('fee_label').map(String)
  const amounts = form.getAll('fee_amount').map(Number)
  const codes = form.getAll('fee_code').map(String)
  const schedule = labels
    .map((l, i) => ({ code: codes[i] || slugify(l).replace(/-/g, '_') || `fee_${i}`, label: l.trim().slice(0, 120), amount: Math.max(0, Math.round(amounts[i] || 0)) }))
    .filter((f) => f.label && f.amount > 0)
  await createAdminClient().from('courts').update({ fee_schedule: schedule }).eq('id', admin.court_id)
  await logEvent({ court_id: admin.court_id, action: 'settings.fees_updated', actor: admin, detail: { items: schedule.length } })
  revalidatePath('/registry/settings')
}

export async function removeSampleData() {
  const admin = await requireStaff('settings.manage')
  const db = createAdminClient()
  await db.from('judgments').delete().eq('court_id', admin.court_id).eq('is_sample', true)
  await db.from('cases').delete().eq('court_id', admin.court_id).eq('is_sample', true)
  await db.from('judges').delete().eq('court_id', admin.court_id).eq('is_sample', true)
  await logEvent({ court_id: admin.court_id, action: 'settings.sample_removed', actor: admin })
  revalidatePath('/registry', 'layout')
  redirect('/registry/settings?sample=removed')
}
