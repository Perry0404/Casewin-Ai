import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { JudgmentCard, Shell, Tag } from '@/components/site'
import CopyButton from '@/components/CopyButton'
import { SITE_URL, caseTypeLabel, citeAs, longDate } from '@/lib/constants'
import { isConfigured } from '@/lib/db'
import { getJudgment, relatedJudgments } from '@/lib/queries'

export const revalidate = 600

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const j = isConfigured() ? await getJudgment(params.slug) : null
  if (!j) return { title: 'Judgment not found' }
  return {
    title: `${j.title} — ${j.suit_number ?? j.court_name}`,
    description: j.holding ?? j.summary ?? undefined,
    robots: j.is_sample ? { index: false } : undefined,
  }
}

export default async function JudgmentPage({ params }: { params: { slug: string } }) {
  if (!isConfigured()) notFound()
  const j = await getJudgment(params.slug)
  if (!j) notFound()
  const related = await relatedJudgments(j).catch(() => [])
  const citation = citeAs(j)
  const paragraphs = j.full_text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    genre: 'Court judgment',
    name: j.title,
    identifier: j.suit_number,
    dateCreated: j.delivered_on,
    author: { '@type': 'GovernmentOrganization', name: j.court_name },
    url: `${SITE_URL}/judgments/${j.slug}`,
    isAccessibleForFree: true,
  }

  return (
    <Shell query="">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {j.is_sample && (
        <div className="border-b border-dashed border-ink-4 bg-paper-2">
          <p className="mx-auto max-w-7xl px-4 py-3 text-center text-sm text-ink-2 sm:px-6">
            <b>Demonstration judgment.</b> This is sample data showing how a published judgment appears. It is not a real decision and must not be cited.
          </p>
        </div>
      )}

      <article className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14">
        <header className="max-w-4xl">
          <nav className="text-sm text-ink-3">
            <Link href="/search" className="hover:text-naija-700">
              Judgments
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/search?court=${encodeURIComponent(j.court_name)}`} className="hover:text-naija-700">
              {j.court_name}
            </Link>
          </nav>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-tight tracking-tight text-ink sm:text-[52px]">{j.title}</h1>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {[
              ['Suit no.', j.suit_number],
              ['Court', [j.court_name, j.division?.replace(/ Judicial Division$/, ' Division')].filter(Boolean).join(', ')],
              ['Delivered', longDate(j.delivered_on)],
              ['Coram', j.judges.join(', ')],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-[0.12em] text-ink-4">{k}</dt>
                  <dd className={k === 'Suit no.' ? 'mt-0.5 font-mono text-ink' : 'mt-0.5 text-ink'}>{v}</dd>
                </div>
              ))}
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <Tag tone={j.source === 'community' ? 'neutral' : 'green'}>{j.source === 'community' ? 'Community-contributed · verified' : 'Court-published'}</Tag>
            {j.case_type && <Tag tone="green">{caseTypeLabel(j.case_type)}</Tag>}
            {j.keywords.map((k) => (
              <Link key={k} href={`/search?q=${encodeURIComponent(k)}`}>
                <Tag>{k}</Tag>
              </Link>
            ))}
          </div>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {j.holding && (
              <section className="rounded-2xl border-l-4 border-naija-500 bg-white p-6 shadow-card sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-naija-700">Held</p>
                <p className="mt-2 font-serif text-2xl leading-snug text-ink">{j.holding}</p>
              </section>
            )}
            {j.summary && (
              <section className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Summary</h2>
                <p className="mt-2 text-lg leading-relaxed text-ink-2">{j.summary}</p>
              </section>
            )}
            {j.issues.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Issues for determination</h2>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-ink-2 marker:text-naija-600">
                  {j.issues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ol>
              </section>
            )}

            <section className="mt-12 border-t border-ink-line pt-10">
              <h2 className="mb-6 font-serif text-2xl font-semibold text-ink">Full judgment</h2>
              <div className="prose-judgment max-w-[70ch]">
                {paragraphs.map((p, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-ink-line bg-white p-5 shadow-card">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Cite as</h3>
              <p className="mt-2 font-serif text-[15px] leading-snug text-ink">{citation}</p>
              <div className="mt-3 flex gap-2">
                <CopyButton text={citation} label="Copy citation" />
                <CopyButton text={`${SITE_URL}/judgments/${j.slug}`} label="Copy link" />
              </div>
            </div>
            {j.statutes_cited.length > 0 && (
              <div className="rounded-2xl border border-ink-line bg-white p-5 shadow-card">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Statutes considered</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {j.statutes_cited.map((s) => (
                    <li key={s}>
                      <Link href={`/search?q=${encodeURIComponent(s)}`} className="text-ink-2 hover:text-naija-700">
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {j.cases_cited.length > 0 && (
              <div className="rounded-2xl border border-ink-line bg-white p-5 shadow-card">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Cases cited</h3>
                <ul className="mt-3 space-y-2 text-sm italic text-ink-2">
                  {j.cases_cited.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-2xl bg-paper-2 p-5 text-sm text-ink-3">
              {j.source === 'community'
                ? `Contributed by a member of the OpenLegal community and verified by our reviewers${j.published_at ? ` on ${longDate(j.published_at)}` : ''}. It was not published by the court itself.`
                : `Published by the ${j.court_name} registry${j.published_at ? ` on ${longDate(j.published_at)}` : ''}.`}{' '}
              Confirm against the certified true copy before relying on it.
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20 border-t border-ink-line pt-12">
            <h2 className="font-serif text-3xl font-medium text-ink">Related judgments</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {related.map((r) => (
                <JudgmentCard key={r.id} j={r} />
              ))}
            </div>
          </section>
        )}
      </article>
    </Shell>
  )
}
