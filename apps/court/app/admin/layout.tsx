import Link from 'next/link'
import { getStaff, requirePlatformAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import AppBar from '@/components/AppBar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePlatformAdmin()
  const staff = await getStaff()
  const db = createAdminClient()
  const n = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0)
  const [submissions, registrations, volunteers, orgs, statutes] = await Promise.all([
    n(db.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    n(db.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    n(db.from('la_members').select('user_id', { count: 'exact', head: true }).eq('status', 'pending').neq('role', 'coordinator')),
    n(db.from('la_organisations').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    n(db.from('laws').select('id', { count: 'exact', head: true }).eq('needs_review', true)),
  ])
  const tabs: [string, string, number][] = [
    ['/admin', 'Inbox', 0],
    ['/admin/courts', 'Courts', 0],
    ['/admin/registrations', 'Registrations', registrations],
    ['/admin/legal-aid', 'Legal Aid', volunteers + orgs],
    ['/admin/submissions', 'Judgments', submissions],
    ['/admin/laws', 'Statutes', statutes],
  ]
  return (
    <div className="min-h-screen bg-white">
      <AppBar
        area="Justice admin"
        tabs={tabs}
        user={user.email ?? ''}
        extra={
          staff ? (
            <Link href="/registry" className="rounded-md px-2.5 py-1.5 text-ink-600 hover:bg-ink-100 hover:text-ink-950">
              My registry
            </Link>
          ) : null
        }
      />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}
