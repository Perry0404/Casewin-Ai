import Link from 'next/link'
import { requireMember } from '@/lib/auth'
import { Logo } from '@/components/ui'
import SignOutButton from '@/components/SignOutButton'

export const dynamic = 'force-dynamic'

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const m = await requireMember()
  const links: [string, string][] = [
    ['/desk', 'My cases'],
    ['/desk/board', 'Case board'],
    ['/desk/visit', 'Record a visit'],
    ['/desk/record', 'My record'],
  ]
  if (m.role === 'coordinator' && m.org_id) links.splice(2, 0, ['/desk/team', 'Team'])
  if (m.isAdmin) links.push(['/admin', 'Admin →'])
  return (
    <div className="min-h-screen bg-parchment">
      <header className="no-print bg-ink-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/desk">
            <Logo dark />
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {links.map(([h, l]) => (
              <Link key={h} href={h} className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5 hover:text-white">
                {l}
              </Link>
            ))}
            <span className="ml-2 hidden text-xs text-ink-400 lg:inline">{m.full_name}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}
