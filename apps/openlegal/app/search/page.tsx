import Link from 'next/link'
import type { Metadata } from 'next'
import { JudgmentCard, SearchBar, Shell, cx } from '@/components/site'
import { CASE_TYPES, safeSnippet } from '@/lib/constants'
import { isConfigured } from '@/lib/db'
import { courtsWithCounts, searchJudgments, searchLawSections } from '@/lib/queries'

export const dynamic = 'force-dynamic'

type Search = { q?: string; court?: string; type?: string; from?: string; to?: string; page?: string }

export function generateMetadata({ searchParams }: { searchParams: Search }): Metadata {
  return { title: searchParams.q ? `“${searchParams.q}” — search` : 'Search judgments' }
}

export default async function SearchPage({ searchParams }: { searchParams: Search }) {
  const q = (searchParams.q ?? '').slice(0, 200)
  const page = Math.max(1, Number(searchParams.page) || 1)
  const ok = isConfigured()
  const [res, sections, courts] = ok
    ? await Promise.all([
        searchJudgments({ q, court: searchParams.court, type: searchParams.type, from: Number(searchParams.from) || undefined, to: Number(searchParams.to) || undefined, page }).catch(() => ({ results: [], total: 0, page, perPage: 10 })),
        page === 1 ? searchLawSections(q, undefined, 3).catch(() => []) : Promise.resolve([]),
        courtsWithCounts().catch(() => []),
      ])
    : [{ results: [], total: 0, page, perPage: 10 }, [], []]

  const href = (patch: Partial<Search>) => {
    const merged = { ...searchParams, ...patch } as Record<string, string | undefined>
    return `/search?${new URLSearchParams(Object.entries(merged).filter((e): e is [string, string] => Boolean(e[1])))}`
  }
  const pages = Math.ceil(res.total / res.perPage)
  const filtered = Boolean(searchParams.court || searchParams.type || searchParams.from || searchParams.to)

  return (
    <Shell>
      <div className="border-b border-ink-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="max-w-3xl">
            <SearchBar defaultValue={q} />
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <Facet title="Area of law">
            <FacetLink href={href({ type: undefined, page: undefined })} active={!searchParams.type}>
              All areas
            </FacetLink>
            {CASE_TYPES.map((t) => (
              <FacetLink key={t.value} href={href({ type: t.value, page: undefined })} active={searchParams.type === t.value}>
                {t.label}
              </FacetLink>
            ))}
          </Facet>
          {courts.length > 0 && (
            <Facet title="Court">
              <FacetLink href={href({ court: undefined, page: undefined })} active={!searchParams.court}>
                All courts
              </FacetLink>
              {courts.map((c) => (
                <FacetLink key={c.name} href={href({ court: c.name, page: undefined })} active={searchParams.court === c.name}>
                  {c.name}
                  <span className="ml-auto pl-2 text-xs text-ink-4">{c.count}</span>
                </FacetLink>
              ))}
            </Facet>
          )}
          <Facet title="Year delivered">
            <form className="flex items-center gap-2">
              {q && <input type="hidden" name="q" value={q} />}
              {searchParams.type && <input type="hidden" name="type" value={searchParams.type} />}
              {searchParams.court && <input type="hidden" name="court" value={searchParams.court} />}
              <input name="from" defaultValue={searchParams.from} placeholder="From" inputMode="numeric" className="w-full rounded-lg border border-ink-line bg-white px-2.5 py-1.5 text-sm" />
              <span className="text-ink-4">–</span>
              <input name="to" defaultValue={searchParams.to} placeholder="To" inputMode="numeric" className="w-full rounded-lg border border-ink-line bg-white px-2.5 py-1.5 text-sm" />
              <button className="rounded-lg bg-ink px-2.5 py-1.5 text-sm text-white">Go</button>
            </form>
          </Facet>
          {filtered && (
            <Link href={`/search${q ? `?q=${encodeURIComponent(q)}` : ''}`} className="block text-sm font-medium text-naija-700">
              Clear filters
            </Link>
          )}
        </aside>

        <div>
          <p className="text-sm text-ink-3">
            {q ? (
              <>
                <b className="text-ink">{res.total.toLocaleString()}</b> judgment{res.total === 1 ? '' : 's'} matching <b className="text-ink">“{q}”</b>
              </>
            ) : (
              <>
                <b className="text-ink">{res.total.toLocaleString()}</b> judgments, most recent first
              </>
            )}
          </p>

          {sections.length > 0 && (
            <div className="mt-6 rounded-2xl border border-naija-100 bg-naija-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-naija-700">Statutory provisions</p>
              <ul className="mt-3 space-y-3">
                {sections.map((s) => (
                  <li key={s.id}>
                    <Link href={`/laws/${s.law_slug}#s-${s.number}`} className="group block">
                      <span className="font-serif text-lg font-semibold text-ink group-hover:text-naija-700">
                        Section {s.number}
                        {s.heading && ` — ${s.heading}`}
                      </span>
                      <span className="block text-xs text-ink-3">{s.law_title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: safeSnippet(s.snippet) }} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {res.results.map((j) => (
              <JudgmentCard key={j.id} j={j} snippet={q ? safeSnippet(j.snippet) : undefined} />
            ))}
            {res.results.length === 0 && (
              <div className="rounded-2xl border border-dashed border-ink-line p-12 text-center">
                <p className="font-serif text-2xl text-ink">No judgments found</p>
                <p className="mt-2 text-ink-3">Try fewer words, or search for a statute section like “section 36”.</p>
              </div>
            )}
          </div>

          {pages > 1 && (
            <nav className="mt-8 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link href={href({ page: String(page - 1) })} className="rounded-lg border border-ink-line bg-white px-4 py-2 hover:border-ink-3">
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-ink-3">
                Page {page} of {pages}
              </span>
              {page < pages ? (
                <Link href={href({ page: String(page + 1) })} className="rounded-lg border border-ink-line bg-white px-4 py-2 hover:border-ink-3">
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </div>
    </Shell>
  )
}

function Facet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function FacetLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cx('flex items-center rounded-lg px-2.5 py-1.5 text-sm transition', active ? 'bg-naija-50 font-semibold text-naija-700' : 'text-ink-2 hover:bg-paper-2')}>
      {children}
    </Link>
  )
}
