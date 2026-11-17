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
  const [contributed, courtDrafts, registrations, volunteers, orgs, statutes, requests] = await Promise.all([
    n(db.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    n(db.from('judgments').select('id', { count: 'exact', head: true }).eq('status', 'draft')),
    n(db.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    n(db.from('la_members').select('user_id', { count: 'exact', head: true }).eq('status', 'pending').neq('role', 'coordinator')),
    n(db.from('la_organisations').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    n(db.from('laws').select('id', { count: 'exact', head: true }).eq('needs_review', true)),
    n(db.from('court_requests').select('id', { count: 'exact', head: true }).eq('status', 'new')),
  ])
  // Grouped by product, so each admin task has one obvious home.
  const tabs: [string, string, number, string?][] = [
    ['/admin', 'Inbox', 0],
    ['/admin/courts', 'Courts', requests, 'Court'],
    ['/admin/registrations', 'People & access', registrations, 'Court'],
    ['/admin/activity', 'Activity log', 0, 'Court'],
    ['/admin/submissions', 'Judgments', contributed + courtDrafts, 'OpenLegal'],
    ['/admin/laws', 'Statutes', statutes, 'OpenLegal'],
    ['/admin/legal-aid', 'Volunteers & orgs', volunteers + orgs, 'Legal Aid'],
    ['/admin/panels', 'Panels', 0, 'Legal Aid'],
    ['/admin/admins', 'Admins', 0, 'Team'],
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
