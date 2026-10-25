import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getUser, isPlatformAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Post-login router:
//   platform admin → /admin · court officer → /registry · approved filer → /portal
//   anyone else → /register (apply, or see the status of their application)
export default async function Go({ searchParams }: { searchParams: { next?: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const next = searchParams.next?.startsWith('/') && !searchParams.next.startsWith('//') ? searchParams.next : null
  const db = createAdminClient()
  const [{ data: staff }, { data: filer }] = await Promise.all([
    db.from('court_staff').select('id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle(),
    db.from('filer_accounts').select('user_id').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
  ])
  if (staff) await db.from('court_staff').update({ last_login_at: new Date().toISOString() }).eq('id', staff.id)

  // Honour where they were headed when they have access to it.
  if (next?.startsWith('/registry') && staff) redirect(next)
  if ((next?.startsWith('/portal') || next?.startsWith('/file')) && filer) redirect(next)
  if (await isPlatformAdmin(user.id)) redirect(next?.startsWith('/admin') ? next : '/admin')
  if (staff) redirect('/registry')
  if (filer) redirect('/portal')
  redirect('/register')
}
