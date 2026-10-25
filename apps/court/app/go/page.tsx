import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getUser, isPlatformAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Post-login router: platform admins land on /admin, court staff on /registry.
export default async function Go({ searchParams }: { searchParams: { next?: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const next = searchParams.next?.startsWith('/') && !searchParams.next.startsWith('//') ? searchParams.next : null
  const db = createAdminClient()
  const { data: staff } = await db.from('court_staff').select('id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle()

  if (staff) {
    await db.from('court_staff').update({ last_login_at: new Date().toISOString() }).eq('id', staff.id)
    redirect(next?.startsWith('/registry') ? next : '/registry')
  }
  if (await isPlatformAdmin(user.id)) redirect(next?.startsWith('/admin') ? next : '/admin')
  redirect('/login?error=no-access')
}
