import Link from 'next/link'
import type { ReactNode } from 'react'
import { CASEWIN_URL, COURT_URL, caseTypeLabel, longDate } from '@/lib/constants'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className={size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'} aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-naija-500" />
        <path d="M9 8.5h5.2c1 0 1.8.8 1.8 1.8v13.2c0-1-.8-1.8-1.8-1.8H9V8.5Zm14 0h-5.2c-1 0-1.8.8-1.8 1.8v13.2c0-1 .8-1.8 1.8-1.8H23V8.5Z" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
      <span className="leading-none">
        <span className="block font-serif text-[19px] font-semibold tracking-tight text-ink">
          OpenLegal<span className="text-naija-500"> Nigeria</span>
        </span>
      </span>
    </span>
  )
}

export function Nav({ query }: { query?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3.5 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="OpenLegal Nigeria home">
          <Logo />
        </Link>
        {query !== undefined && (
          <div className="hidden flex-1 md:block">
            <SearchBar defaultValue={query} compact />
          </div>
        )}
        <nav className="ml-auto flex items-center gap-1 text-sm font-medium text-ink-2">
          <Link href="/search" className="hidden rounded-lg px-3 py-2 hover:bg-paper-2 hover:text-ink sm:block">
            Judgments
          </Link>
          <Link href="/laws" className="rounded-lg px-3 py-2 hover:bg-paper-2 hover:text-ink">
            Laws
          </Link>
          <Link href="/courts" className="hidden rounded-lg px-3 py-2 hover:bg-paper-2 hover:text-ink sm:block">
            Courts
          </Link>
          <Link href="/contribute" className="hidden rounded-lg px-3 py-2 text-naija-700 hover:bg-naija-50 md:block">
            Contribute
          </Link>
          <Link href="/developers" className="rounded-lg bg-ink px-3.5 py-2 text-white transition hover:bg-ink-2">
            API &amp; MCP
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function SearchBar({ defaultValue = '', compact = false, autoFocus = false }: { defaultValue?: string; compact?: boolean; autoFocus?: boolean }) {
  return (
    <form action="/search" role="search" className="relative">
      <svg viewBox="0 0 20 20" className={cx('pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-4', compact ? 'left-3.5 h-4 w-4' : 'left-5 h-5 w-5')} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="9" cy="9" r="5.5" />
        <path d="m13.5 13.5 3 3" strokeLinecap="round" />
      </svg>
      <input
        name="q"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        aria-label="Search judgments and laws"
        placeholder={compact ? 'Search judgments, suit numbers, laws…' : 'Try “declaration of title customary land” or “section 36 fair hearing”'}
        className={cx(
          'w-full border border-ink-line bg-white text-ink shadow-card transition placeholder:text-ink-4 focus:border-naija-500 focus:outline-none focus:ring-4 focus:ring-naija-100',
          compact ? 'rounded-xl py-2.5 pl-10 pr-4 text-sm' : 'rounded-2xl py-5 pl-14 pr-36 text-lg',
        )}
      />
      {!compact && (
        <button className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl bg-naija-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-naija-600">
          Search
        </button>
      )}
    </form>
  )
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-line bg-paper-2">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-3">
            Free access to Nigerian law. Judgments are published by the courts that delivered them, through CaseWin Court.
          </p>
        </div>
        <FooterCol title="Read & contribute" links={[['Judgments', '/search'], ['Laws', '/laws'], ['Courts', '/courts'], ['Contribute a judgment', '/contribute'], ['Leaderboard', '/leaderboard']]} />
        <FooterCol title="Build" links={[['REST API', '/developers#api'], ['MCP server', '/developers#mcp'], ['About the data', '/about']]} />
        <FooterCol title="Justice stack" links={[['CaseWin Court', COURT_URL], ['CaseWin AI', CASEWIN_URL]]} />
      </div>
      <div className="border-t border-ink-line">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-ink-3 sm:px-6">
          OpenLegal Nigeria is an information service, not legal advice. Always confirm against the certified true copy from the court.
        </p>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map(([l, h]) => (
          <li key={h}>
            <Link href={h} className="text-ink-2 hover:text-naija-600">
              {l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Shell({ children, query }: { children: ReactNode; query?: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav query={query} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'sample' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tone === 'green' && 'bg-naija-50 text-naija-700',
        tone === 'neutral' && 'bg-paper-2 text-ink-2 ring-1 ring-inset ring-ink-line',
        tone === 'sample' && 'border border-dashed border-ink-4 text-ink-3',
      )}
    >
      {children}
    </span>
  )
}

export function JudgmentCard({
  j,
  snippet,
}: {
  j: { slug: string; title: string; suit_number: string | null; court_name: string; division?: string | null; case_type: string | null; delivered_on: string | null; holding?: string | null; judges?: string[]; is_sample?: boolean; source?: string }
  snippet?: string
}) {
  return (
    <article className="group relative rounded-2xl border border-ink-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-naija-100 hover:shadow-lift">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
        <span className="font-medium text-ink-2">{j.court_name}</span>
        {j.division && <span>· {j.division.replace(/ Judicial Division$/, '')}</span>}
        <span>· {longDate(j.delivered_on)}</span>
      </div>
      <h3 className="mt-2 font-serif text-[22px] font-semibold leading-snug tracking-tight text-ink">
        <Link href={`/judgments/${j.slug}`} className="after:absolute after:inset-0 group-hover:text-naija-700">
          {j.title}
        </Link>
      </h3>
      {j.suit_number && <p className="mt-0.5 font-mono text-xs text-ink-3">{j.suit_number}</p>}
      {snippet ? (
        <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: snippet }} />
      ) : (
        j.holding && <p className="mt-3 line-clamp-3 font-serif text-[16px] leading-relaxed text-ink-2">{j.holding}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {j.case_type && <Tag tone="green">{caseTypeLabel(j.case_type)}</Tag>}
        {j.judges?.[0] && <Tag>{j.judges[0]}</Tag>}
        {j.source === 'community' && <Tag>Community-contributed · verified</Tag>}
        {j.is_sample && <Tag tone="sample">Sample — not a real decision</Tag>}
      </div>
    </article>
  )
}
