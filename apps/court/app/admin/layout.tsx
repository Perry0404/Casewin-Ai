import Link from 'next/link'
import { getStaff, requirePlatformAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { Logo } from '@/components/ui'
import SignOutButton from '@/components/SignOutButton'

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
    <div className="min-h-screen bg-parchment">
      <header className="bg-ink-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Logo dark />
            </Link>
            <span className="hidden rounded-full border border-brass-300/40 bg-brass-300/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brass-200 sm:inline">
              Justice admin
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {staff && (
              <Link href="/registry" className="rounded-lg px-3 py-2 text-brass-200 hover:bg-white/5 hover:text-white">
                My registry →
              </Link>
            )}
            <span className="ml-2 hidden text-xs text-ink-400 md:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 text-sm sm:px-6">
          {tabs.map(([href, label, count]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5 hover:text-white">
              {label}
              {count ? <span className="ml-1.5 rounded-full bg-brass-400 px-1.5 py-0.5 text-[11px] font-bold text-ink-950">{count}</span> : null}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}
