import Link from 'next/link'
import { Logo, btn, cx } from './ui'
import { CASEWIN_URL, LEGALAID_URL, OPENLEGAL_URL } from '@/lib/constants'

/** The thin strip that ties the CaseWin justice services together. */
export function JusticeBar({ current }: { current: 'court' | 'openlegal' | 'legalaid' }) {
  const items: [string, string, string][] = [
    ['court', 'Court', 'https://court.casewinai.com'],
    ['openlegal', 'OpenLegal', OPENLEGAL_URL],
    ['legalaid', 'Legal Aid', LEGALAID_URL],
  ]
  return (
    <div className="bg-ink-950 text-[12.5px] text-ink-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <a href={CASEWIN_URL} className="hidden hover:text-white sm:inline">
          A CaseWin justice service
        </a>
        <nav className="flex gap-5" aria-label="CaseWin justice services">
          {items.map(([k, label, href]) => (
            <a key={k} href={href} aria-current={k === current ? 'page' : undefined} className={cx('hover:text-white', k === current && 'font-medium text-white')}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}

const NAV: [string, string][] = [
  ['/e-filing', 'E-filing guide'],
  ['/cause-list', 'Cause lists'],
  ['/track', 'Track a filing'],
  ['/verify', 'Verify a document'],
]

export function SiteNav(_: { tone?: 'dark' | 'light' } = {}) {
  return (
    <>
      <JusticeBar current="court" />
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="CaseWin Court home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-[14px] lg:flex">
            {NAV.map(([h, l]) => (
              <Link key={h} href={h} className="text-ink-700 hover:text-ink-950 hover:underline hover:underline-offset-4">
                {l}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/login" className="hidden px-3 py-2 text-[14px] text-ink-700 hover:text-ink-950 sm:inline-flex">
              Sign in
            </Link>
            <Link href="/file" className={btn.primary + ' !py-2'}>
              File a case
            </Link>
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto whitespace-nowrap px-4 pb-3 text-[14px] text-ink-700 sm:px-6 lg:hidden">
          {NAV.map(([h, l]) => (
            <Link key={h} href={h}>
              {l}
            </Link>
          ))}
          <Link href="/login" className="sm:hidden">
            Sign in
          </Link>
        </nav>
      </header>
    </>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-200 bg-parchment">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-ink-600">
            Registry software for Nigerian courts: e-filing, suit numbers, cause lists, hearings, judgments and judicial analytics.
          </p>
        </div>
        <FooterCol
          title="Public services"
          links={[
            ['File a case', '/file'],
            ['E-filing guide', '/e-filing'],
            ['Track a filing', '/track'],
            ['Cause lists', '/cause-list'],
            ['Verify a document', '/verify'],
          ]}
        />
        <FooterCol
          title="Courts and staff"
          links={[
            ['Bring a court online', '/onboard'],
            ['Register as filer or staff', '/register'],
            ['Sign in', '/login'],
          ]}
        />
        <FooterCol
          title="CaseWin"
          links={[
            ['OpenLegal Nigeria', OPENLEGAL_URL],
            ['Legal Aid', LEGALAID_URL],
            ['CaseWin', CASEWIN_URL],
          ]}
        />
      </div>
      <div className="border-t border-ink-200">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-5 text-[12px] text-ink-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} CaseWin. Court records remain the property of the issuing court.</span>
          <span>Built in Nigeria</span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-ink-950">{title}</h3>
      <ul className="mt-3 space-y-2 text-[13px]">
        {links.map(([label, href]) => (
          <li key={href}>
            <a href={href} className="text-ink-600 hover:text-ink-950 hover:underline hover:underline-offset-4">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Page shell for public utility pages (file, track, cause list). */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
