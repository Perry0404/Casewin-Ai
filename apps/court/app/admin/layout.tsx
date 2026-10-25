import Link from 'next/link'
import { getStaff, requirePlatformAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { Logo } from '@/components/ui'
import SignOutButton from '@/components/SignOutButton'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePlatformAdmin()
  const staff = await getStaff()
  const [{ count: pending }, { count: registrations }] = await Promise.all([
    createAdminClient().from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    createAdminClient().from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-ink-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Logo dark />
            </Link>
            <span className="hidden rounded-full border border-brass-300/40 bg-brass-300/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brass-200 sm:inline">
              Platform admin
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/admin" className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5 hover:text-white">
              Overview
            </Link>
            <Link href="/admin/courts/new" className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5 hover:text-white">
              Onboard a court
            </Link>
            <Link href="/admin/registrations" className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5 hover:text-white">
              Registrations
              {registrations ? <span className="ml-1.5 rounded-full bg-brass-400 px-1.5 py-0.5 text-[11px] font-bold text-ink-950">{registrations}</span> : null}
            </Link>
            <Link href="/admin/laws" className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5 hover:text-white">
              Statutes
            </Link>
            <Link href="/admin/submissions" className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5 hover:text-white">
              Submissions
              {pending ? <span className="ml-1.5 rounded-full bg-brass-400 px-1.5 py-0.5 text-[11px] font-bold text-ink-950">{pending}</span> : null}
            </Link>
            {staff && (
              <Link href="/registry" className="rounded-lg px-3 py-2 text-brass-200 hover:bg-white/5 hover:text-white">
                My registry →
              </Link>
            )}
            <span className="ml-3 hidden text-xs text-ink-400 md:inline">{user.email}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}
