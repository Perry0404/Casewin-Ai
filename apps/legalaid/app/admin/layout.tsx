import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { Logo } from '@/components/ui'
import { COURT_URL } from '@/lib/constants'
import SignOutButton from '@/components/SignOutButton'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-ink-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
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
              Cases
            </Link>
            <Link href="/admin/cases" className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5 hover:text-white">
              All cases
            </Link>
            <a href={`${COURT_URL}/admin`} className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5 hover:text-white">
              Justice admin ↗
            </a>
            <Link href="/desk" className="rounded-lg px-3 py-2 text-brass-200 hover:bg-white/5 hover:text-white">
              Desk →
            </Link>
            <span className="ml-2 hidden text-xs text-ink-400 md:inline">{user.email}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}
