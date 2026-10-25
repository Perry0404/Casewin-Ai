import Link from 'next/link'
import { Footer, JudgmentCard, Logo, SearchBar } from '@/components/site'
import { isConfigured } from '@/lib/db'
import { recentJudgments, stats, type RecentJudgment } from '@/lib/queries'
import { COURT_URL, SITE_URL } from '@/lib/constants'

export const revalidate = 300

const SUGGESTIONS = ['declaration of title', 'unlawful detention', 'breach of contract', 'fair hearing', 'letters of administration', 'wrongful termination']

async function load() {
  if (!isConfigured()) return { s: { judgments: 0, laws: 0, sections: 0, courts: 0 }, recent: [] as RecentJudgment[] }
  try {
    const [s, recent] = await Promise.all([stats(), recentJudgments(6)])
    return { s, recent }
  } catch {
    return { s: { judgments: 0, laws: 0, sections: 0, courts: 0 }, recent: [] as RecentJudgment[] }
  }
}

export default async function Home() {
  const { s, recent } = await load()

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative isolate border-b border-ink-line">
        <div className="paper-lines absolute inset-0 -z-10 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="absolute -right-40 -top-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-naija-100/50 blur-3xl" />
        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 text-sm font-medium text-ink-2">
            <Link href="/laws" className="rounded-lg px-3 py-2 hover:bg-paper-2">
              Laws
            </Link>
            <Link href="/courts" className="hidden rounded-lg px-3 py-2 hover:bg-paper-2 sm:block">
              Courts
            </Link>
            <Link href="/about" className="hidden rounded-lg px-3 py-2 hover:bg-paper-2 sm:block">
              About
            </Link>
            <Link href="/developers" className="rounded-lg bg-ink px-3.5 py-2 text-white transition hover:bg-ink-2">
              API &amp; MCP
            </Link>
          </nav>
        </header>

        <div className="mx-auto max-w-4xl px-4 pb-24 pt-16 text-center sm:px-6 sm:pt-24">
          <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-naija-100 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-naija-700 shadow-card">
            <span className="h-1.5 w-1.5 rounded-full bg-naija-500" />
            Free · Open · Machine-readable
          </p>
          <h1 className="animate-rise mt-8 font-serif text-[46px] font-medium leading-[1.04] tracking-[-0.02em] text-ink [animation-delay:60ms] sm:text-7xl">
            The law of Nigeria,
            <br />
            <em className="text-naija-600">open to everyone.</em>
          </h1>
          <p className="animate-rise mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2 [animation-delay:120ms]">
            Judgments published by the courts that delivered them, and the statutes they apply — free to read, search, cite and build on.
          </p>
          <div className="animate-rise mx-auto mt-10 max-w-3xl text-left [animation-delay:180ms]">
            <SearchBar autoFocus />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((q) => (
                <Link key={q} href={`/search?q=${encodeURIComponent(q)}`} className="rounded-full border border-ink-line bg-white px-3.5 py-1.5 text-sm text-ink-2 transition hover:border-naija-400 hover:text-naija-700">
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-ink-line bg-white/60">
          <dl className="mx-auto grid max-w-5xl grid-cols-2 divide-ink-line px-4 sm:grid-cols-4 sm:divide-x">
            {[
              [s.judgments, 'judgments'],
              [s.courts, s.courts === 1 ? 'court publishing' : 'courts publishing'],
              [s.laws, s.laws === 1 ? 'statute' : 'statutes'],
              [s.sections, 'sections of law'],
            ].map(([n, l]) => (
              <div key={String(l)} className="px-4 py-6 text-center">
                <dt className="font-serif text-4xl font-medium text-ink">{Number(n).toLocaleString()}</dt>
                <dd className="mt-1 text-sm text-ink-3">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Recently published */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-naija-600">Fresh from the courts</p>
            <h2 className="mt-2 font-serif text-4xl font-medium tracking-tight text-ink">Recently published</h2>
          </div>
          <Link href="/search" className="hidden text-sm font-semibold text-ink-2 hover:text-naija-700 sm:block">
            All judgments →
          </Link>
        </div>
        {recent.length ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {recent.map((j) => (
              <JudgmentCard key={j.id} j={j} />
            ))}
          </div>
        ) : (
          <p className="mt-10 rounded-2xl border border-dashed border-ink-line p-10 text-center text-ink-3">The first judgments will appear here as courts publish them.</p>
        )}
      </section>

      {/* How judgments arrive */}
      <section className="border-y border-ink-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-naija-600">Where the law comes from</p>
            <h2 className="mt-2 font-serif text-4xl font-medium tracking-tight text-ink">Straight from the registry. No middlemen.</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-2">
              Courts on CaseWin Court publish their own judgments. Each one is checked by a registrar for sensitive details before it goes
              public — then it is here, free, within minutes of release.
            </p>
            <a href={COURT_URL} className="mt-6 inline-block font-semibold text-naija-700 underline decoration-naija-100 decoration-2 underline-offset-4 hover:decoration-naija-500">
              How courts publish →
            </a>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {[
              ['Delivered', 'The judge delivers judgment in open court.'],
              ['Uploaded', 'The registry uploads the text to the case file.'],
              ['Redacted', 'A registrar confirms names of minors, victims and sealed material are removed.'],
              ['Published', 'It appears on OpenLegal — searchable, citable and in the API.'],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-2xl border border-ink-line bg-paper p-6">
                <span className="font-mono text-xs text-naija-600">0{i + 1}</span>
                <h3 className="mt-2 font-serif text-xl font-semibold text-ink">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* For builders */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] bg-naija-900 text-white">
          <div className="grid gap-10 p-8 sm:p-14 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-naija-100">For builders &amp; AI tools</p>
              <h2 className="mt-3 font-serif text-4xl font-medium tracking-tight">Plug Nigerian law into anything.</h2>
              <p className="mt-5 text-lg leading-relaxed text-naija-100/90">
                A free REST API and a Model Context Protocol server. Point Claude, ChatGPT or your own agent at OpenLegal and it can search
                judgments and quote statutes — with citations back to the source.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/developers#mcp" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-naija-900 transition hover:bg-naija-50">
                  Connect via MCP
                </Link>
                <Link href="/developers#api" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold transition hover:bg-white/5">
                  REST API docs
                </Link>
              </div>
            </div>
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-6 font-mono text-[13px] leading-relaxed text-naija-50">
              <span className="text-naija-100/60"># Search judgments</span>
              {'\n'}curl &quot;{SITE_URL}/api/v1/judgments?q=fair+hearing&quot;
              {'\n\n'}
              <span className="text-naija-100/60"># Add to an MCP client</span>
              {'\n'}
              {`{
  "mcpServers": {
    "openlegal-nigeria": {
      "type": "http",
      "url": "${SITE_URL}/api/mcp"
    }
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
