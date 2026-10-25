'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { requirePlatformAdmin } from '@/lib/auth'
import { slugify } from '@/lib/format'

const str = (f: FormData, k: string, n = 300) => String(f.get(k) ?? '').trim().slice(0, n)

const DEFAULT_FEES = [
  { code: 'writ', label: 'Writ of summons (filing)', amount: 5000 },
  { code: 'originating_summons', label: 'Originating summons (filing)', amount: 5000 },
  { code: 'petition', label: 'Petition (filing)', amount: 7500 },
  { code: 'motion', label: 'Motion on notice', amount: 2500 },
  { code: 'service', label: 'Service per defendant', amount: 1500 },
  { code: 'exhibit', label: 'Exhibits / documents (per document)', amount: 200 },
]

function tempPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from(crypto.getRandomValues(new Uint8Array(14)), (b) => alphabet[b % alphabet.length]).join('')
}

/** Shows a new temporary password once, via a 2-minute httpOnly cookie (never a URL). */
function handOver(path: string, email: string, password: string) {
  cookies().set('handover', JSON.stringify({ email, password }), { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 120, path })
}

async function createCourtAdmin(courtId: string, fullName: string, email: string) {
  const db = createAdminClient()
  const password = tempPassword()
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } })
  if (error || !data.user) return { error: error?.message ?? 'create failed' }
  await db.from('court_staff').insert({ user_id: data.user.id, court_id: courtId, role: 'court_admin', full_name: fullName, email })
  return { password }
}

export async function createCourt(form: FormData) {
  await requirePlatformAdmin()
  const db = createAdminClient()
  const name = str(form, 'name')
  const state = str(form, 'state', 60)
  if (!name || !state) redirect('/admin/courts/new?error=missing')

  const { data: court, error } = await db
    .from('courts')
    .insert({
      slug: slugify(str(form, 'slug') || name),
      name,
      short_name: str(form, 'short_name') || null,
      state,
      tier: str(form, 'tier') || 'state_high_court',
      address: str(form, 'address') || null,
      status: 'pilot',
      fee_schedule: DEFAULT_FEES,
    })
    .select('id')
    .single()
  if (error || !court) redirect(`/admin/courts/new?error=${error?.message.includes('duplicate') ? 'slug' : 'create'}`)

  // Divisions, one per line: "Owerri Judicial Division | HOW"
  const divisions = str(form, 'divisions', 4000)
    .split('\n')
    .map((l) => l.split('|').map((s) => s.trim()))
    .filter(([n, c]) => n && c)
    .map(([n, c]) => ({ court_id: court.id, name: n, code: c.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) }))
  if (divisions.length) await db.from('divisions').insert(divisions)

  const adminName = str(form, 'admin_name', 160)
  const adminEmail = str(form, 'admin_email', 200).toLowerCase()
  if (adminName && adminEmail) {
    const r = await createCourtAdmin(court.id, adminName, adminEmail)
    if (r.password) handOver(`/admin/courts/${court.id}`, adminEmail, r.password)
  }
  redirect(`/admin/courts/${court.id}?created=1`)
}

export async function addCourtAdmin(form: FormData) {
  await requirePlatformAdmin()
  const courtId = str(form, 'court_id')
  const r = await createCourtAdmin(courtId, str(form, 'full_name', 160), str(form, 'email', 200).toLowerCase())
  if (r.error) redirect(`/admin/courts/${courtId}?error=${encodeURIComponent(r.error.includes('already') ? 'exists' : 'create')}`)
  handOver(`/admin/courts/${courtId}`, str(form, 'email', 200).toLowerCase(), r.password!)
  redirect(`/admin/courts/${courtId}?created=1`)
}

export async function setCourtStatus(form: FormData) {
  await requirePlatformAdmin()
  const status = str(form, 'status')
  if (!['pilot', 'active', 'suspended'].includes(status)) return
  await createAdminClient().from('courts').update({ status }).eq('id', str(form, 'court_id'))
  revalidatePath(`/admin/courts/${str(form, 'court_id')}`)
}

// ── OpenLegal contributor submissions ───────────────────────────────────────

const VERIFIED_POINTS = 10
const CONFIRMATION_POINTS = 1

export async function approveSubmission(form: FormData) {
  await requirePlatformAdmin()
  const db = createAdminClient()
  const id = str(form, 'id')
  if (form.get('redaction_confirmed') !== 'on') redirect(`/admin/submissions/${id}?error=redaction`)
  const { data: s } = await db.from('submissions').select('*').eq('id', id).eq('status', 'pending').maybeSingle()
  if (!s) redirect('/admin/submissions')

  const list = (k: string) =>
    str(form, k, 4000)
      .split(/\n|;|,/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 30)
  const title = str(form, 'title') || s.title
  const suit = str(form, 'suit_number', 80) || null
  const fullText = String(form.get('full_text') ?? s.full_text).trim().slice(0, 400000)

  const { data: j, error } = await db
    .from('judgments')
    .insert({
      slug: `${slugify(suit ? suit.replace(/\//g, '-') : '')}-${slugify(title)}`.replace(/^-/, '').slice(0, 96) + '-' + crypto.randomUUID().slice(0, 4),
      source: 'community',
      title,
      suit_number: suit,
      court_name: str(form, 'court_name') || s.court_name,
      division: str(form, 'division', 120) || null,
      state: str(form, 'state', 60) || null,
      judges: list('judges'),
      case_type: str(form, 'case_type', 40) || null,
      delivered_on: /^\d{4}-\d{2}-\d{2}$/.test(str(form, 'delivered_on')) ? str(form, 'delivered_on') : null,
      holding: str(form, 'holding', 2000) || null,
      summary: str(form, 'summary', 6000) || null,
      keywords: list('keywords'),
      full_text: fullText,
      status: 'published',
      redaction_confirmed: true,
      published_at: new Date().toISOString(),
      contributed_by: s.contributor_id,
    })
    .select('id')
    .single()
  if (error || !j) redirect(`/admin/submissions/${id}?error=publish`)

  await db.from('submissions').update({ status: 'verified', judgment_id: j.id, reviewed_at: new Date().toISOString(), reviewer_note: str(form, 'note', 1000) || null }).eq('id', id)
  await db.rpc('award_points', { p_contributor: s.contributor_id, p_delta: VERIFIED_POINTS, p_reason: `Verified: ${title}`, p_submission: id })
  const { data: confirmers } = await db.from('submission_confirmations').select('contributor_id').eq('submission_id', id)
  for (const c of confirmers ?? []) {
    await db.rpc('award_points', { p_contributor: c.contributor_id, p_delta: CONFIRMATION_POINTS, p_reason: `Confirmed: ${title}`, p_submission: id })
  }
  redirect('/admin/submissions?done=verified')
}

export async function rejectSubmission(form: FormData) {
  await requirePlatformAdmin()
  const status = str(form, 'status') === 'duplicate' ? 'duplicate' : 'rejected'
  const note = str(form, 'note', 1000)
  if (!note) redirect(`/admin/submissions/${str(form, 'id')}?error=note`)
  await createAdminClient().from('submissions').update({ status, reviewer_note: note, reviewed_at: new Date().toISOString() }).eq('id', str(form, 'id')).eq('status', 'pending')
  redirect(`/admin/submissions?done=${status}`)
}

// ── OpenLegal statutes held for review ──────────────────────────────────────

export async function reviewLaw(form: FormData) {
  await requirePlatformAdmin()
  const publish = str(form, 'decision') === 'publish'
  await createAdminClient().from('laws').update({ is_published: publish, needs_review: false }).eq('id', str(form, 'id'))
  revalidatePath('/admin/laws')
}

// ── Registrations (filers and court staff) ──────────────────────────────────

export async function approveRegistration(form: FormData) {
  await requirePlatformAdmin()
  const db = createAdminClient()
  const { data: r } = await db.from('registrations').select('*').eq('id', str(form, 'id')).eq('status', 'pending').maybeSingle()
  if (!r) redirect('/admin/registrations')

  if (r.kind === 'filer') {
    const { error } = await db.from('filer_accounts').upsert({
      user_id: r.user_id,
      full_name: r.full_name,
      email: r.email,
      phone: r.phone,
      filer_type: r.filer_type ?? 'lawyer',
      bar_number: r.bar_number,
      law_firm: r.law_firm,
      address: r.address,
      is_active: true,
      approved_at: new Date().toISOString(),
    })
    if (error) redirect(`/admin/registrations?error=${encodeURIComponent(error.message)}`)
  } else {
    const role = ['court_admin', 'registrar', 'clerk', 'judge'].includes(str(form, 'role')) ? str(form, 'role') : r.requested_role
    const judgeId = role === 'judge' ? str(form, 'judge_id') || null : null
    const { error } = await db.from('court_staff').upsert(
      { user_id: r.user_id, court_id: r.court_id, role, full_name: r.full_name, email: r.email, judge_id: judgeId, is_active: true, must_change_password: false },
      { onConflict: 'user_id,court_id' },
    )
    if (error) redirect(`/admin/registrations?error=${encodeURIComponent(error.message)}`)
  }
  await db.from('registrations').update({ status: 'approved', reviewer_note: str(form, 'note', 500) || null, reviewed_at: new Date().toISOString() }).eq('id', r.id)
  redirect('/admin/registrations?done=approved')
}

export async function rejectRegistration(form: FormData) {
  await requirePlatformAdmin()
  const note = str(form, 'note', 500)
  if (!note) redirect('/admin/registrations?error=Give+a+reason+%E2%80%94+the+applicant+sees+it')
  await createAdminClient().from('registrations').update({ status: 'rejected', reviewer_note: note, reviewed_at: new Date().toISOString() }).eq('id', str(form, 'id')).eq('status', 'pending')
  redirect('/admin/registrations?done=rejected')
}

export async function setFilerActive(form: FormData) {
  await requirePlatformAdmin()
  await createAdminClient().from('filer_accounts').update({ is_active: str(form, 'active') === 'true' }).eq('user_id', str(form, 'user_id'))
  revalidatePath('/admin/registrations')
}

export async function setRequestStatus(form: FormData) {
  await requirePlatformAdmin()
  const status = str(form, 'status')
  if (!['new', 'contacted', 'onboarded', 'declined'].includes(status)) return
  await createAdminClient().from('court_requests').update({ status }).eq('id', str(form, 'id'))
  revalidatePath('/admin')
}
