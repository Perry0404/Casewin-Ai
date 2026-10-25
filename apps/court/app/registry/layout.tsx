import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireStaff, can, ROLE_LABELS } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import RegistryNav from '@/components/RegistryNav'

export const dynamic = 'force-dynamic'

export default async function RegistryLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff()
  const path = headers().get('x-pathname') ?? ''
  if (staff.must_change_password && path !== '/registry/account') redirect('/registry/account?first=1')

  const { count } = await createAdminClient()
    .from('filings')
    .select('id', { count: 'exact', head: true })
    .eq('court_id', staff.court_id)
    .in('status', ['submitted', 'under_review', 'paid'])

  return (
    <div className="min-h-screen bg-parchment lg:grid lg:grid-cols-[264px_1fr]">
      <RegistryNav
        court={staff.court.short_name ?? staff.court.name}
        name={staff.full_name}
        role={ROLE_LABELS[staff.role]}
        queue={count ?? 0}
        admin={can(staff, 'staff.manage')}
      />
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  )
}
