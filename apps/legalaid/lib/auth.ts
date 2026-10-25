import { redirect } from 'next/navigation'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'

export interface Member {
  user_id: string
  org_id: string | null
  role: 'lawyer' | 'paralegal' | 'law_student' | 'coordinator'
  full_name: string
  email: string
  phone: string
  state: string
  states_covered: string[]
  languages: string[]
  practice_areas: string[]
  enrolment_number: string | null
  capacity: number
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  reviewer_note: string | null
  org?: { id: string; name: string; status: string } | null
}

export async function getUser() {
  const {
    data: { user },
  } = await createSessionClient().auth.getUser()
  if (user?.email?.endsWith('@demo.casewinai.com') && process.env.NEXT_PUBLIC_DEMO !== '1') return null
  return user
}

/** The signed-in user's volunteer record, whatever its status. */
export async function getMember(): Promise<Member | null> {
  const user = await getUser()
  if (!user) return null
  const { data } = await createAdminClient().from('la_members').select('*, org:la_organisations(id, name, status)').eq('user_id', user.id).maybeSingle()
  return (data as Member) ?? null
}

export async function isPlatformAdmin(userId: string) {
  const { data } = await createAdminClient().from('platform_admins').select('user_id').eq('user_id', userId).maybeSingle()
  return Boolean(data)
}

/** An approved volunteer, or a redirect. Platform admins pass as coordinators. */
export async function requireMember(): Promise<Member & { isAdmin: boolean }> {
  const user = await getUser()
  if (!user) redirect('/login?next=/desk')
  const [member, admin] = await Promise.all([getMember(), isPlatformAdmin(user.id)])
  if (member?.status === 'approved') return { ...member, isAdmin: admin }
  if (admin)
    return {
      user_id: user.id, org_id: null, role: 'coordinator', full_name: member?.full_name ?? user.email ?? 'Admin', email: user.email ?? '', phone: member?.phone ?? '',
      state: member?.state ?? 'FCT', states_covered: [], languages: [], practice_areas: [], enrolment_number: null, capacity: 50, status: 'approved', reviewer_note: null, isAdmin: true,
    }
  redirect('/volunteer')
}

export async function requireAdmin() {
  const user = await getUser()
  if (!user || !(await isPlatformAdmin(user.id))) redirect('/login?next=/admin')
  return user
}

/** Who may see a file's private details: the assignee, their supervising lawyer, the assignee's coordinator, or an admin. */
export function canWork(m: Member & { isAdmin: boolean }, c: { assigned_to: string | null; assigned_org: string | null; supervisor_id?: string | null; referred_org?: string | null }) {
  return (
    m.isAdmin ||
    c.assigned_to === m.user_id ||
    (c.supervisor_id != null && c.supervisor_id === m.user_id) ||
    (m.role === 'coordinator' && m.org_id != null && (c.assigned_org === m.org_id || c.referred_org === m.org_id))
  )
}

/** Students and paralegals act on a file only once a lawyer supervises it. */
export function needsSupervisor(m: Pick<Member, 'role'>, c: { supervisor_id?: string | null }) {
  return (m.role === 'law_student' || m.role === 'paralegal') && !c.supervisor_id
}

export async function logEvent(e: { case_id: string; actor?: string | null; actor_label?: string; kind: string; body?: string | null; public?: boolean }) {
  await createAdminClient().from('la_case_events').insert({ ...e, public: e.public ?? false })
}
