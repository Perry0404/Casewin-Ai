import Link from 'next/link'
import MobileNav from './MobileNav'
import { COURT_URL, LEGAL_AID_URL, OPENLEGAL_URL } from '@/lib/justice-stack'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
        <defs>
          <linearGradient id="cw-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4FD99B" />
            <stop offset="1" stopColor="#119C64" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#cw-g)" />
        {/* Four stacked bars — the four layers of the justice stack — rising to a just outcome. */}
        <path d="M8 22.5h16M9.5 18.5h13M11 14.5h10M12.5 10.5h7" stroke="#04140C" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      {!compact && <span className="font-display text-[19px] font-semibold tracking-tight text-white">CaseWin</span>}
    </span>
  )
}

const LINKS = [
  ['/tools', 'AI tools'],
  ['/matter', 'Resolve a dispute'],
  ['/marketplace', 'Lawyers'],
  ['/pricing', 'Pricing'],
] as const

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-night-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3.5 sm:px-6">
        <Link href="/" aria-label="CaseWin home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
          {LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 transition ${current === href ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              {label}
            </Link>
          ))}
          <span className="mx-2 h-4 w-px bg-white/10" />
          <a href={COURT_URL} className="rounded-lg px-3 py-2 text-white/60 transition hover:text-gold-300">
            Court
          </a>
          <a href={OPENLEGAL_URL} className="rounded-lg px-3 py-2 text-white/60 transition hover:text-mint-300">
            OpenLegal
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:text-white sm:block">
            Sign in
          </Link>
          <Link href="/auth/signup" className="hidden rounded-xl bg-mint-400 px-4 py-2 text-sm font-semibold text-night-950 transition hover:bg-mint-300 sm:block">
            Get started
          </Link>
          <div className="lg:hidden">
            <MobileNav currentPath={current} />
          </div>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  const cols: [string, [string, string][]][] = [
    ['Product', [['AI tools', '/tools'], ['Resolve a dispute', '/matter'], ['Hire a lawyer', '/marketplace'], ['Pricing', '/pricing']]],
    ['Justice stack', [['CaseWin Court', COURT_URL], ['OpenLegal Nigeria', OPENLEGAL_URL], ['OpenLegal API & MCP', `${OPENLEGAL_URL}/developers`], ['Legal Aid', LEGAL_AID_URL]]],
    ['Company', [['For lawyers', '/for-lawyers'], ['Terms', '/terms'], ['Privacy', '/privacy']]],
  ]
  return (
    <footer className="border-t border-white/[0.06] bg-night-950">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
            AI justice infrastructure, built in Nigeria — reducing the distance between a dispute and a just outcome.
          </p>
        </div>
        {cols.map(([title, links]) => (
          <div key={title}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">{title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {links.map(([l, h]) => (
                <li key={h}>
                  <a href={h} className="text-white/70 transition hover:text-white">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-6 text-xs text-white/40 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} CaseWin. Not a law firm; AI output is not legal advice.</span>
          <span>Made in Nigeria 🇳🇬</span>
        </div>
      </div>
    </footer>
  )
}
