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

export async function setRequestStatus(form: FormData) {
  await requirePlatformAdmin()
  const status = str(form, 'status')
  if (!['new', 'contacted', 'onboarded', 'declined'].includes(status)) return
  await createAdminClient().from('court_requests').update({ status }).eq('id', str(form, 'id'))
  revalidatePath('/admin')
}
