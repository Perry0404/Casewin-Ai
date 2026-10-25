import Link from 'next/link'
import type { ReactNode } from 'react'
import { CASEWIN_URL, COURT_URL, LEGALAID_URL, caseTypeLabel, longDate } from '@/lib/constants'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

/** CaseWin family mark: a solid block with the product's accent tab. */
export function Logo(_: { size?: 'md' | 'lg' } = {}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden>
        <rect width="24" height="24" className="fill-ink" />
        <rect x="5" y="5" width="3" height="14" fill="#fff" />
        <rect x="11" y="13" width="8" height="6" className="fill-naija-400" />
      </svg>
      <span className="text-[16px] font-semibold leading-none tracking-[-0.01em] text-ink">
        OpenLegal <span className="font-normal text-ink-3">Nigeria</span>
      </span>
    </span>
  )
}

/** The thin strip that ties the CaseWin justice services together. */
export function JusticeBar() {
  const items: [string, string, boolean][] = [
    ['Court', COURT_URL, false],
    ['OpenLegal', '/', true],
    ['Legal Aid', LEGALAID_URL, false],
  ]
  return (
    <div className="bg-ink text-[12.5px] text-[#BDBDB8]">
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
  ['/search', 'Judgments'],
  ['/laws', 'Laws'],
  ['/courts', 'Courts'],
  ['/contribute', 'Contribute'],
  ['/developers', 'API & MCP'],
]

export function Nav({ query }: { query?: string }) {
  return (
    <>
      <JusticeBar />
      <header className="border-b border-ink-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-6">
          <Link href="/" className="shrink-0" aria-label="OpenLegal Nigeria home">
            <Logo />
          </Link>
          {query !== undefined && (
            <div className="hidden max-w-md flex-1 md:block">
              <SearchBar defaultValue={query} compact />
            </div>
          )}
          <nav className="ml-auto flex items-center gap-5 overflow-x-auto whitespace-nowrap text-[14px] text-ink-2">
            {NAV.map(([h, l], i) => (
              <Link key={h} href={h} className={cx('hover:text-ink hover:underline hover:underline-offset-4', i > 1 && 'hidden sm:inline')}>
                {l}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  )
}

export function SearchBar({ defaultValue = '', compact = false, autoFocus = false }: { defaultValue?: string; compact?: boolean; autoFocus?: boolean }) {
  return (
    <form action="/search" role="search" className="flex">
      <input
        name="q"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        aria-label="Search judgments and laws"
        placeholder={compact ? 'Search judgments, suit numbers, laws' : 'Words, a suit number, a party, or a section of law'}
        className={cx(
          'min-w-0 flex-1 rounded-l-md border border-r-0 border-ink-3 bg-white text-ink placeholder:text-ink-4 focus:border-ink focus:outline-none focus:ring-2 focus:ring-naija-100',
          compact ? 'px-3 py-2 text-[14px]' : 'px-4 py-3.5 text-[17px]',
        )}
      />
      <button className={cx('rounded-r-md bg-ink font-medium text-white transition-colors hover:bg-ink-2', compact ? 'px-3.5 text-[14px]' : 'px-6 text-[15px]')}>Search</button>
    </form>
  )
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-line bg-paper-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-ink-2">
            Free access to Nigerian law: judgments published by the courts that delivered them, and the statutes they apply.
          </p>
        </div>
        <FooterCol title="Read and contribute" links={[['Judgments', '/search'], ['Laws', '/laws'], ['Courts', '/courts'], ['Contribute a judgment', '/contribute'], ['Leaderboard', '/leaderboard']]} />
        <FooterCol title="Build" links={[['REST API', '/developers#api'], ['MCP server', '/developers#mcp'], ['About the data', '/about']]} />
        <FooterCol title="CaseWin" links={[['CaseWin Court', COURT_URL], ['Legal Aid', LEGALAID_URL], ['CaseWin', CASEWIN_URL]]} />
      </div>
      <div className="border-t border-ink-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-[12px] text-ink-3 sm:px-6">
          OpenLegal Nigeria is an information service, not legal advice. Always confirm against the certified true copy from the court.
        </p>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
      <ul className="mt-3 space-y-2 text-[13px]">
        {links.map(([l, h]) => (
          <li key={h}>
            <a href={h} className="text-ink-2 hover:text-ink hover:underline hover:underline-offset-4">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Shell({ children, query }: { children: ReactNode; query?: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
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
        'inline-flex items-center rounded-sm px-1.5 py-0.5 text-[12px] font-medium leading-tight',
        tone === 'green' && 'bg-naija-50 text-naija-700',
        tone === 'neutral' && 'bg-paper-2 text-ink-2',
        tone === 'sample' && 'border border-dashed border-ink-4 text-ink-3',
      )}
    >
      {children}
    </span>
  )
}

/** One judgment in a list: ruled row, title as the link. */
export function JudgmentCard({
  j,
  snippet,
}: {
  j: { slug: string; title: string; suit_number: string | null; court_name: string; division?: string | null; case_type: string | null; delivered_on: string | null; holding?: string | null; judges?: string[]; is_sample?: boolean; source?: string }
  snippet?: string
}) {
  return (
    <article className="border-b border-ink-line py-5">
      <h3 className="font-serif text-[20px] font-semibold leading-snug text-ink">
        <Link href={`/judgments/${j.slug}`} className="hover:text-naija-600 hover:underline hover:decoration-1 hover:underline-offset-4">
          {j.title}
        </Link>
      </h3>
      <p className="mt-1 text-[13px] text-ink-3">
        {j.suit_number && <span className="font-mono text-ink-2">{j.suit_number}</span>}
        {j.suit_number && ' · '}
        {j.court_name}
        {j.division && `, ${j.division.replace(/ Judicial Division$/, '')}`} · {longDate(j.delivered_on)}
      </p>
      {snippet ? (
        <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: snippet }} />
      ) : (
        j.holding && <p className="mt-2 line-clamp-3 font-serif text-[16px] leading-relaxed text-ink-2">{j.holding}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {j.case_type && <Tag tone="green">{caseTypeLabel(j.case_type)}</Tag>}
        {j.judges?.[0] && <Tag>{j.judges[0]}</Tag>}
        {j.source === 'community' && <Tag>Community-contributed, verified</Tag>}
        {j.is_sample && <Tag tone="sample">Sample — not a real decision</Tag>}
      </div>
    </article>
  )
}
