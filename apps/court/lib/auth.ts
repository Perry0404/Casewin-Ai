import { redirect } from 'next/navigation'
import { createAdminClient, createSessionClient } from './supabase/server'

export type StaffRole = 'court_admin' | 'registrar' | 'clerk' | 'judge'

export interface Court {
  id: string
  slug: string
  name: string
  short_name: string | null
  state: string
  status: string
  fee_schedule: { code: string; label: string; amount: number }[]
}

export interface Staff {
  id: string
  user_id: string
  court_id: string
  role: StaffRole
  full_name: string
  email: string
  judge_id: string | null
  must_change_password: boolean
  court: Court
}

// What each role may do. Kept in one place so pages and actions agree.
const PERMISSIONS = {
  'filings.review': ['court_admin', 'registrar', 'clerk'],
  'filings.decide': ['court_admin', 'registrar'],
  'cases.schedule': ['court_admin', 'registrar', 'clerk'],
  'hearings.record': ['court_admin', 'registrar', 'clerk', 'judge'],
  'judgments.upload': ['court_admin', 'registrar', 'clerk', 'judge'],
  'judgments.publish': ['court_admin', 'registrar'],
  'staff.manage': ['court_admin'],
  'settings.manage': ['court_admin'],
} as const satisfies Record<string, readonly StaffRole[]>

export type Permission = keyof typeof PERMISSIONS

export function can(staff: Pick<Staff, 'role'>, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly StaffRole[]).includes(staff.role)
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  court_admin: 'Court administrator',
  registrar: 'Registrar',
  clerk: 'Registry clerk',
  judge: 'Judge',
}

export async function getUser() {
  const supabase = createSessionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.email?.endsWith('@demo.casewinai.com') && process.env.NEXT_PUBLIC_DEMO !== '1') return null
  return user
}

/** The signed-in user's active staff record, or null. */
export async function getStaff(): Promise<Staff | null> {
  const user = await getUser()
  if (!user) return null
  const db = createAdminClient()
  const { data } = await db
    .from('court_staff')
    .select('id, user_id, court_id, role, full_name, email, judge_id, must_change_password, court:courts(id, slug, name, short_name, state, status, fee_schedule)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at')
    .limit(1)
    .maybeSingle()
  return (data as unknown as Staff) ?? null
}

/** For server components and actions: the staff member, or a redirect. */
export async function requireStaff(permission?: Permission): Promise<Staff> {
  const staff = await getStaff()
  if (!staff) redirect('/login?error=no-access')
  if (permission && !can(staff, permission)) redirect('/registry?error=forbidden')
  return staff
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const db = createAdminClient()
  const { data } = await db.from('platform_admins').select('user_id').eq('user_id', userId).maybeSingle()
  return Boolean(data)
}

export async function requirePlatformAdmin() {
  const user = await getUser()
  if (!user || !(await isPlatformAdmin(user.id))) redirect('/login?error=no-access')
  return user
}

export interface FilerAccount {
  user_id: string
  full_name: string
  email: string
  phone: string | null
  filer_type: 'lawyer' | 'litigant' | 'agency'
  bar_number: string | null
  law_firm: string | null
  address: string | null
}

/** The signed-in user's approved e-filing account, or null. */
export async function getFiler(): Promise<FilerAccount | null> {
  const user = await getUser()
  if (!user) return null
  const { data } = await createAdminClient().from('filer_accounts').select('*').eq('user_id', user.id).eq('is_active', true).maybeSingle()
  return (data as FilerAccount) ?? null
}

export async function requireFiler(): Promise<FilerAccount> {
  const filer = await getFiler()
  if (!filer) redirect('/register')
  return filer
}

/** Latest registration the user has made, if any. */
export async function getRegistration(userId: string) {
  const { data } = await createAdminClient().from('registrations').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
  return data as null | { id: string; kind: 'filer' | 'court_staff'; status: 'pending' | 'approved' | 'rejected'; reviewer_note: string | null; created_at: string; full_name: string }
}

/** Writes one row to the audit trail. Never throws: auditing must not block the work. */
export async function logEvent(event: {
  court_id: string
  action: string
  filing_id?: string | null
  case_id?: string | null
  actor?: Pick<Staff, 'id' | 'full_name'> | null
  actor_label?: string
  detail?: Record<string, unknown>
}) {
  try {
    await createAdminClient()
      .from('case_events')
      .insert({
        court_id: event.court_id,
        action: event.action,
        filing_id: event.filing_id ?? null,
        case_id: event.case_id ?? null,
        actor_staff_id: event.actor?.id ?? null,
        actor_label: event.actor?.full_name ?? event.actor_label ?? 'System',
        detail: event.detail ?? {},
      })
  } catch (e) {
    console.error('audit log failed', e)
  }
}
