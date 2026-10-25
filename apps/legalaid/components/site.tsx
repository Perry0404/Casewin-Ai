import Link from 'next/link'
import type { ReactNode } from 'react'
import { CASEWIN_URL, COURT_URL, OPENLEGAL_URL } from '@/lib/constants'
import { Logo, btn, cx } from './ui'

/** The thin strip that ties the CaseWin justice services together. */
export function JusticeBar() {
  const items: [string, string, boolean][] = [
    ['Court', COURT_URL, false],
    ['OpenLegal', OPENLEGAL_URL, false],
    ['Legal Aid', '/', true],
  ]
  return (
    <div className="bg-ink-950 text-[12.5px] text-ink-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <a href={CASEWIN_URL} className="hidden hover:text-white sm:inline">
          A CaseWin justice service
        </a>
        <nav className="flex gap-5" aria-label="CaseWin justice services">
          {items.map(([label, href, current]) => (
            <a key={label} href={href} aria-current={current ? 'page' : undefined} className={cx('hover:text-white', current && 'font-medium text-white')}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}

const NAV: [string, string][] = [
  ['/track', 'Track a request'],
  ['/rights', 'Your rights'],
  ['/volunteer', 'Volunteer'],
  ['/organisations', 'Organisations'],
]

export function SiteHeader(_: { dark?: boolean } = {}) {
  return (
    <>
      <JusticeBar />
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="CaseWin Legal Aid home">
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
            <Link href="/help" className={btn.brass + ' !py-2'}>
              Get help
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
            Free legal help for people who cannot afford a lawyer, from verified volunteers, with every step recorded.
          </p>
          <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-ink-500">
            Not a law firm, and nothing here is legal advice. In an emergency also contact the Legal Aid Council of Nigeria or the nearest NBA branch.
          </p>
        </div>
        <FooterCol title="Get help" links={[['Report a case', '/help'], ['Track a request', '/track'], ['Your rights in custody', '/rights'], ['How we work', '/how-it-works']]} />
        <FooterCol title="Help others" links={[['Volunteer', '/volunteer'], ['Register an organisation', '/organisations'], ['The record', '/impact'], ['Sign in', '/login']]} />
        <FooterCol title="CaseWin" links={[['CaseWin Court', COURT_URL], ['OpenLegal Nigeria', OPENLEGAL_URL], ['CaseWin', CASEWIN_URL]]} />
      </div>
      <div className="border-t border-ink-200">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-5 text-[12px] text-ink-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} CaseWin. Reports are confidential and never published.</span>
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
        {links.map(([l, h]) => (
          <li key={h}>
            <a href={h} className="text-ink-600 hover:text-ink-950 hover:underline hover:underline-offset-4">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PublicPage({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className={`mx-auto px-4 py-12 sm:px-6 sm:py-14 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>{children}</main>
      <SiteFooter />
    </div>
  )
}
