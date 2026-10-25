import Link from 'next/link'
import { Footer, JudgmentCard, Nav, SearchBar } from '@/components/site'
import { isConfigured } from '@/lib/db'
import { recentJudgments, stats, type RecentJudgment } from '@/lib/queries'
import { COURT_URL, SITE_URL } from '@/lib/constants'

export const revalidate = 300

const SUGGESTIONS = ['declaration of title', 'unlawful detention', 'breach of contract', 'fair hearing', 'letters of administration', 'wrongful termination']

// Statutes people look up most. Superseded texts (e.g. the 2004 Evidence Act) are deliberately not featured.
const STATUTES: [string, string][] = [
  ['constitution-1999', 'Constitution of the Federal Republic of Nigeria, 1999 (as amended)'],
  ['electoral-act-2026', 'Electoral Act, 2026'],
  ['economic-and-financial-crimes-commission-establishmentetc-act-lfn-2004', 'Economic and Financial Crimes Commission (Establishment, etc.) Act'],
  ['labour-act-lfn-2004', 'Labour Act'],
  ['legal-practitioners-act-lfn-2004', 'Legal Practitioners Act'],
  ['legal-aid-act-lfn-2004', 'Legal Aid Act'],
  ['marriage-act-lfn-2004', 'Marriage Act'],
]

async function load() {
  const empty = { s: { judgments: 0, laws: 0, sections: 0, courts: 0 }, recent: [] as RecentJudgment[] }
  if (!isConfigured()) return empty
  try {
    const [s, recent] = await Promise.all([stats(), recentJudgments(6)])
    return { s, recent }
  } catch {
    return empty
  }
}

export default async function Home() {
  const { s, recent } = await load()

  return (
    <div className="bg-white">
      <Nav />
      <main>
        <section className="border-b border-ink-line">
          <div className="mx-auto max-w-6xl px-4 pb-12 pt-14 sm:px-6 sm:pt-20">
            <h1 className="max-w-3xl text-[40px] font-semibold leading-[1.08] tracking-[-0.025em] text-ink sm:text-[56px]">Nigerian law, free to read.</h1>
            <p className="mt-4 max-w-2xl text-[18px] leading-relaxed text-ink-2">
              Judgments published by the courts that delivered them, and the statutes they apply — to read, search, cite and build on.
            </p>
            <div className="mt-8 max-w-3xl">
              <SearchBar autoFocus />
              <p className="mt-3 text-[14px] text-ink-3">
                Try{' '}
                {SUGGESTIONS.map((q, i) => (
                  <span key={q}>
                    <Link href={`/search?q=${encodeURIComponent(q)}`} className="text-naija-600 underline decoration-naija-100 underline-offset-[3px] hover:decoration-naija-500">
                      {q}
                    </Link>
                    {i < SUGGESTIONS.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            </div>
            <dl className="mt-12 grid max-w-3xl grid-cols-2 border-t border-ink sm:grid-cols-4">
              {(
                [
                  [s.judgments, 'Judgments'],
                  [s.courts, s.courts === 1 ? 'Court publishing' : 'Courts publishing'],
                  [s.laws, 'Statutes'],
                  [s.sections, 'Sections of law'],
                ] as const
              ).map(([n, l]) => (
                <div key={l} className="py-4 pr-4">
                  <dt className="text-[13px] text-ink-3">{l}</dt>
                  <dd className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink tabular-nums">{Number(n).toLocaleString()}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
              <h2 className="text-[20px] font-semibold text-ink">Recently published judgments</h2>
              <Link href="/search" className="prose-link text-[14px]">
                All judgments
              </Link>
            </div>
            {recent.length ? (
              recent.map((j) => <JudgmentCard key={j.id} j={j} />)
            ) : (
              <p className="py-6 text-[15px] text-ink-2">The first judgments will appear here as courts publish them.</p>
            )}
          </div>
          <aside>
            <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
              <h2 className="text-[20px] font-semibold text-ink">Statutes</h2>
              <Link href="/laws" className="prose-link text-[14px]">
                A–Z
              </Link>
            </div>
            <ul>
              {STATUTES.map(([slug, title]) => (
                <li key={slug} className="border-b border-ink-line">
                  <Link href={`/laws/${slug}`} className="block py-3 font-serif text-[16px] leading-snug text-ink hover:text-naija-600 hover:underline hover:underline-offset-4">
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
              Older Acts are from the Laws of the Federation 2004 and may since have been amended — each page says so, with its source.
            </p>
          </aside>
        </section>

        <section className="border-y border-ink-line bg-paper-2">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">Where the judgments come from</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
                No scraping and no middlemen.{' '}
                <a href={COURT_URL} className="prose-link">
                  How courts publish
                </a>
              </p>
            </div>
            <dl className="border-t border-ink">
              {(
                [
                  ['Courts', 'Courts on CaseWin Court publish their own judgments. A registrar confirms that names of minors, victims and sealed material are removed first.'],
                  ['Contributors', 'Students and lawyers submit judgments they hold, through the site or their AI assistant. Each is checked against its source by a reviewer before it appears, and marked as contributed.'],
                  ['Never generated', 'No judgment text on OpenLegal is written by AI. AI tools may find and summarise; the text always comes from the court’s own record.'],
                ] as const
              ).map(([t, d]) => (
                <div key={t} className="grid gap-1 border-b border-ink-line py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="text-[15px] font-semibold text-ink">{t}</dt>
                  <dd className="text-[14px] leading-relaxed text-ink-2">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <div className="border-t border-ink pt-5">
            <h2 className="text-[20px] font-semibold text-ink">Contribute judgments</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              Connect your AI assistant with a personal key and ask it to upload judgments you hold. It checks for duplicates first; reviewers verify new cases;
              verified contributions earn points on the leaderboard.
            </p>
            <p className="mt-4 flex gap-5 text-[15px]">
              <Link href="/contribute" className="prose-link">
                Start contributing
              </Link>
              <Link href="/leaderboard" className="prose-link">
                Leaderboard
              </Link>
            </p>
          </div>
          <div className="border-t border-ink pt-5">
            <h2 className="text-[20px] font-semibold text-ink">Build on it</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">A free REST API and an MCP server, so research tools and AI assistants can search and quote Nigerian law with citations.</p>
            <pre className="mt-4 overflow-x-auto rounded-md border border-ink-line bg-paper-2 p-4 font-mono text-[12.5px] leading-relaxed text-ink">
              <span className="text-ink-3"># Search judgments</span>
              {'\n'}curl &quot;{SITE_URL}/api/v1/judgments?q=fair+hearing&quot;
              {'\n\n'}
              <span className="text-ink-3"># MCP server</span>
              {'\n'}
              {SITE_URL}/api/mcp
            </pre>
            <p className="mt-4 text-[15px]">
              <Link href="/developers" className="prose-link">
                API and MCP documentation
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
