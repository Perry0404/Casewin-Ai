import Link from 'next/link'
import { Logo, btn } from './ui'
import { CASEWIN_URL, OPENLEGAL_URL } from '@/lib/constants'

export function SiteNav({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const dark = tone === 'dark'
  const link = dark ? 'text-ink-200 hover:text-white' : 'text-ink-600 hover:text-ink-900'
  return (
    <header className={dark ? 'relative z-20' : 'relative z-20 border-b border-ink-100 bg-white/80 backdrop-blur'}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-5 sm:px-6">
        <Link href="/" aria-label="CaseWin Court home">
          <Logo dark={dark} />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium lg:flex">
          <Link href="/#how" className={link}>How it works</Link>
          <Link href="/#analytics" className={link}>Judicial analytics</Link>
          <Link href="/cause-list" className={link}>Cause lists</Link>
          <Link href="/track" className={link}>Track a filing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className={`hidden rounded-xl px-3.5 py-2 text-sm font-semibold sm:inline-flex ${dark ? 'text-white hover:bg-white/10' : 'text-ink-800 hover:bg-ink-50'}`}>
            Staff sign in
          </Link>
          <Link href="/file" className={dark ? btn.brass + ' !py-2.5' : btn.primary}>
            File a case
          </Link>
        </div>
      </div>
      <nav className="-mt-2 flex gap-5 overflow-x-auto whitespace-nowrap px-4 pb-3 text-sm font-medium sm:px-6 lg:hidden">
        <Link href="/cause-list" className={link}>Cause lists</Link>
        <Link href="/track" className={link}>Track a filing</Link>
        <Link href="/verify" className={link}>Verify a document</Link>
        <Link href="/login" className={link + ' sm:hidden'}>Staff sign in</Link>
      </nav>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="bg-ink-950 text-ink-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
            The digital registry for Nigerian courts. Part of the CaseWin justice stack.
          </p>
        </div>
        <FooterCol
          title="For the public"
          links={[
            ['File a case', '/file'],
            ['Track a filing', '/track'],
            ['Cause lists', '/cause-list'],
            ['Verify a document', '/verify'],
          ]}
        />
        <FooterCol
          title="For courts"
          links={[
            ['Bring your court online', '/onboard'],
            ['Staff sign in', '/login'],
            ['Security & integrity', '/#integrity'],
          ]}
        />
        <FooterCol
          title="Justice stack"
          links={[
            ['CaseWin AI', CASEWIN_URL],
            ['OpenLegal Nigeria', OPENLEGAL_URL],
          ]}
        />
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-6 text-xs text-ink-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} CaseWin. Court records remain the property of the issuing court.</span>
          <span>Made in Nigeria 🇳🇬</span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-300">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="transition hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Light page shell for public utility pages (file, track, cause list). */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav tone="light" />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
