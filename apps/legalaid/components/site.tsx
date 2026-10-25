import Link from 'next/link'
import type { ReactNode } from 'react'
import { CASEWIN_URL, COURT_URL, OPENLEGAL_URL } from '@/lib/constants'
import { Logo, btn } from './ui'

export function SiteHeader({ dark = false }: { dark?: boolean }) {
  const link = dark ? 'text-ink-200 hover:text-white' : 'text-ink-500 hover:text-ink-900'
  return (
    <header className={dark ? 'relative z-10' : 'border-b border-ink-100 bg-white/80 backdrop-blur'}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/">
          <Logo dark={dark} />
        </Link>
        <nav className="flex items-center gap-1 whitespace-nowrap text-sm">
          <Link href="/track" className={`hidden rounded-lg px-3 py-2 sm:inline ${link}`}>
            Track a request
          </Link>
          <Link href="/rights" className={`hidden rounded-lg px-3 py-2 md:inline ${link}`}>
            Your rights
          </Link>
          <Link href="/volunteer" className={`hidden rounded-lg px-3 py-2 md:inline ${link}`}>
            Volunteer
          </Link>
          <Link href="/login" className={`rounded-lg px-3 py-2 ${link}`}>
            Sign in
          </Link>
          <Link href="/help" className={dark ? btn.brass + ' !px-4 !py-2' : btn.primary + ' !py-2'}>
            Get help
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-ink-500">
            Free legal help for people who cannot afford a lawyer — matched to verified volunteers, with every step recorded. Part of the CaseWin justice
            infrastructure.
          </p>
          <p className="mt-4 max-w-sm text-xs text-ink-400">
            We are not a law firm and this site is not legal advice. In an emergency, also contact the Legal Aid Council of Nigeria or the nearest NBA branch.
          </p>
        </div>
        <FooterCol title="Get help" links={[['Report a case', '/help'], ['Track a request', '/track'], ['Your rights in custody', '/rights'], ['How we work', '/how-it-works']]} />
        <FooterCol
          title="Justice stack"
          links={[['CaseWin', CASEWIN_URL], ['CaseWin Court', COURT_URL], ['OpenLegal Nigeria', OPENLEGAL_URL], ['Volunteer', '/volunteer'], ['Organisations', '/organisations'], ['Impact', '/impact']]}
        />
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">{title}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map(([l, h]) => (
          <li key={h}>
            <a href={h} className="text-ink-600 hover:text-ink-900">
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
    <div className="min-h-screen bg-parchment">
      <SiteHeader />
      <main className={`mx-auto px-4 py-12 sm:px-6 sm:py-16 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>{children}</main>
      <SiteFooter />
    </div>
  )
}
