import Link from 'next/link'
import { requireFiler } from '@/lib/auth'
import { Logo } from '@/components/ui'
import SignOutButton from '@/components/SignOutButton'

export const dynamic = 'force-dynamic'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const filer = await requireFiler()
  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-ink-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/portal">
            <Logo dark />
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/portal" className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5 hover:text-white">
              My filings
            </Link>
            <Link href="/file" className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5 hover:text-white">
              New filing
            </Link>
            <Link href="/e-filing" className="hidden rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5 hover:text-white sm:block">
              Guide
            </Link>
            <span className="ml-2 hidden text-xs text-ink-400 md:inline">{filer.full_name}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}
