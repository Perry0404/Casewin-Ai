import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/components/brand'
import { COURT_URL, JUSTICE_STACK, OPENLEGAL_URL } from '@/lib/justice-stack'

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-night-950 text-white">
      <SiteHeader current="/" />
      <Hero />
      <Products />
      <Pipeline />
      <Stack />
      <Tools />
      <Mission />
      <SiteFooter />
    </main>
  )
}

/* ─────────────────────────── Hero ─────────────────────────── */

function Hero() {
  return (
    <section className="relative isolate">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[72rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(30,192,126,0.22),transparent)]" />
        <div className="absolute right-[-12rem] top-[18rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,rgba(224,180,81,0.10),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 pb-24 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.05fr_1fr] lg:pb-32">
        <div>
          <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/70">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint-400" />
            </span>
            AI justice infrastructure · built in Nigeria
          </p>
          <h1 className="animate-rise mt-7 font-display text-[48px] font-semibold leading-[0.98] tracking-[-0.035em] [animation-delay:60ms] sm:text-7xl lg:text-[84px]">
            From dispute
            <br />
            to <span className="font-serif text-[1.08em] font-normal italic tracking-normal text-mint-300">just</span> outcome.
          </h1>
          <p className="animate-rise mt-7 max-w-xl text-lg leading-relaxed text-white/65 [animation-delay:120ms]">
            One stack for the whole journey: AI that helps people and lawyers understand a problem, resolve it fairly, and — only when needed —
            carry it into a court that runs on modern rails, with every judgment open to all.
          </p>
          <div className="animate-rise mt-9 flex flex-wrap gap-3 [animation-delay:180ms]">
            <Link href="/matter" className="group inline-flex items-center gap-2 rounded-xl bg-mint-400 px-5 py-3.5 text-sm font-semibold text-night-950 shadow-[0_0_40px_-8px_rgba(79,217,155,0.6)] transition hover:bg-mint-300">
              Resolve a dispute
              <Arrow />
            </Link>
            <Link href="/tools" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
              Explore AI tools
            </Link>
          </div>
          <p className="animate-rise mt-6 text-sm text-white/40 [animation-delay:240ms]">Free to start · Built for Nigerian law · Works on any phone</p>
        </div>

        <StackVisual />
      </div>
    </section>
  )
}

/** The four layers as floating glass plates, with the journey running through them. */
function StackVisual() {
  const plates = [
    { n: 4, title: 'Court', meta: 'Suit HOW/142/2026 · listed Thursday', tone: 'from-gold-400/25 to-gold-400/5', ring: 'ring-gold-300/30', dot: 'bg-gold-300' },
    { n: 3, title: 'Dispute resolution', meta: 'Settlement range ₦2.1m – ₦2.8m', tone: 'from-mint-400/20 to-mint-400/5', ring: 'ring-mint-300/25', dot: 'bg-mint-300' },
    { n: 2, title: 'AI for lawyers', meta: 'Statement of claim · draft ready', tone: 'from-white/10 to-white/[0.02]', ring: 'ring-white/15', dot: 'bg-white/70' },
    { n: 1, title: 'Knowledge', meta: '“declaration of title” · 12 authorities', tone: 'from-white/[0.07] to-white/[0.02]', ring: 'ring-white/10', dot: 'bg-white/50' },
  ]
  return (
    <div className="relative mx-auto w-full max-w-lg [perspective:1600px]" aria-label="Illustration of the four layers of the CaseWin justice stack">
      <div className="space-y-4 [transform:rotateX(14deg)_rotateZ(-4deg)] [transform-style:preserve-3d]">
        {plates.map((p, i) => (
          <div
            key={p.n}
            className={`animate-float rounded-2xl bg-gradient-to-br ${p.tone} p-5 ring-1 ${p.ring} backdrop-blur-xl`}
            style={{ animationDelay: `${i * 0.4}s`, marginLeft: `${i * 18}px`, marginRight: `${(3 - i) * 18}px` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-night-950/60 font-display text-sm font-semibold text-white/90 ring-1 ring-white/10">{p.n}</span>
                <span className="font-display text-lg font-semibold tracking-tight">{p.title}</span>
              </div>
              <span className={`h-2 w-2 rounded-full ${p.dot}`} />
            </div>
            <p className="mt-3 rounded-lg bg-night-950/50 px-3 py-2 font-mono text-[12px] text-white/70">{p.meta}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-[11px] text-white/30">Illustration</p>
    </div>
  )
}

/* ─────────────────────────── Product family ─────────────────────────── */

function Products() {
  return (
    <section id="products" className="relative border-t border-white/[0.06] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow="Three products, one record" title="Built for everyone a dispute touches." sub="People and lawyers, the courts that decide, and the public that lives under the law." />
        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          <ProductCard
            href="/tools"
            name="CaseWin AI"
            who="For people & lawyers"
            body="Understand a problem, draft the documents, find the authorities, and settle fairly — with a verified lawyer when you need one."
            cta="Open CaseWin AI"
            accent="mint"
          >
            <div className="space-y-2">
              {['Draft a statement of claim', 'Predict likely outcome', 'Find a verified lawyer'].map((t, i) => (
                <div key={t} className="flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2 text-[13px] text-white/75 ring-1 ring-white/[0.06]">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint-400" style={{ opacity: 1 - i * 0.25 }} />
                  {t}
                </div>
              ))}
            </div>
          </ProductCard>

          <ProductCard
            href={COURT_URL}
            name="CaseWin Court"
            who="For courts"
            body="The digital registry: e-filing, fee assessment, suit numbers, judge allocation, live cause lists and judicial analytics."
            cta="Visit court.casewinai.com"
            accent="gold"
          >
            <div className="rounded-lg bg-[#F7F4ED] p-3 text-[#0F1729]">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-[#956B24]">
                <span>Registry</span>
                <span className="rounded-full bg-[#EAF6EF] px-2 py-0.5 normal-case tracking-normal text-[#0F5A3A]">● Accepted</span>
              </div>
              <p className="mt-2 font-mono text-[11px] text-[#4B5D7E]">HOW/142/2026</p>
              <p className="font-serif text-[17px] leading-tight">Chukwu v. Okeke &amp; Anor.</p>
            </div>
          </ProductCard>

          <ProductCard
            href={OPENLEGAL_URL}
            name="OpenLegal Nigeria"
            who="For everyone"
            body="Judgments published by the courts that delivered them, and the statutes they apply — free to read, and open to AI through MCP."
            cta="Visit openlegal.casewinai.com"
            accent="paper"
          >
            <div className="rounded-lg bg-[#FBFAF6] p-3 text-[#15171A]">
              <div className="flex items-center gap-2 rounded-md border border-[#E3E1D9] bg-white px-2.5 py-1.5 text-[12px] text-[#6B7079]">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="9" cy="9" r="5.5" />
                  <path d="m13.5 13.5 3 3" strokeLinecap="round" />
                </svg>
                section 36 fair hearing
              </div>
              <p className="mt-2 font-serif text-[15px] leading-snug">
                <mark className="rounded bg-[#FFEFA8] px-0.5">fair hearing</mark> within a reasonable time…
              </p>
            </div>
          </ProductCard>
        </div>
      </div>
    </section>
  )
}

function ProductCard({ href, name, who, body, cta, accent, children }: { href: string; name: string; who: string; body: string; cta: string; accent: 'mint' | 'gold' | 'paper'; children: React.ReactNode }) {
  const color = accent === 'mint' ? 'text-mint-300' : accent === 'gold' ? 'text-gold-300' : 'text-white'
  const glow = accent === 'mint' ? 'group-hover:shadow-[0_0_60px_-20px_rgba(79,217,155,0.5)]' : accent === 'gold' ? 'group-hover:shadow-[0_0_60px_-20px_rgba(224,180,81,0.5)]' : 'group-hover:shadow-[0_0_60px_-20px_rgba(255,255,255,0.35)]'
  return (
    <a href={href} className={`group relative flex flex-col rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-7 transition duration-300 hover:-translate-y-1 hover:border-white/15 ${glow}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${color}`}>{who}</p>
      <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight">{name}</h3>
      <p className="mt-3 leading-relaxed text-white/60">{body}</p>
      <div className="mt-7 flex-1">{children}</div>
      <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white/85 group-hover:text-white">
        {cta} <Arrow />
      </span>
    </a>
  )
}

/* ─────────────────────────── The journey ─────────────────────────── */

function Pipeline() {
  const steps = [
    ['Intake', 'Describe the problem in plain words, or upload WhatsApp chats, receipts and contracts.'],
    ['Analysis', 'AI builds one clear story: who, what, when, and which laws apply.'],
    ['Settlement', 'A fair settlement range, grounded in how Nigerian courts have decided similar cases.'],
    ['Agreement', 'Terms, invoice and payment — closed without a courtroom.'],
    ['Court', 'If settlement fails, the case file carries straight into e-filing. Nothing is re-done.'],
  ]
  return (
    <section className="relative border-t border-white/[0.06] bg-night-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow="One matter, start to finish" title="Most disputes should never reach court." sub="Every step reads and writes the same matter, so nothing is ever typed twice." />
        <ol className="relative mt-16 grid gap-6 md:grid-cols-5 md:gap-4">
          <span className="absolute left-0 right-0 top-[22px] hidden h-px bg-gradient-to-r from-mint-400/0 via-mint-400/40 to-gold-300/50 md:block" aria-hidden />
          {steps.map(([t, d], i) => (
            <li key={t} className="relative">
              <span
                className={`relative flex h-11 w-11 items-center justify-center rounded-full font-display text-sm font-semibold ring-1 ${
                  i === steps.length - 1 ? 'bg-gold-300/10 text-gold-200 ring-gold-300/40' : 'bg-mint-400/10 text-mint-300 ring-mint-400/30'
                }`}
              >
                {i + 1}
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14">
          <Link href="/matter" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold transition hover:bg-white/[0.06]">
            Open a matter <Arrow />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── The stack ─────────────────────────── */

function Stack() {
  const accents = ['text-white/80', 'text-white/80', 'text-mint-300', 'text-gold-300']
  return (
    <section className="border-t border-white/[0.06] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow="The justice stack" title="Four layers. One mission." sub="Each layer reduces the distance between a dispute and a just outcome." />
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.06] md:grid-cols-2">
          {JUSTICE_STACK.map((layer, i) => (
            <div key={layer.id} className="bg-night-950 p-8 sm:p-10">
              <div className="flex items-baseline gap-4">
                <span className={`font-display text-5xl font-semibold tracking-tighter ${accents[i]}`}>0{layer.number}</span>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight">{layer.title}</h3>
                  <p className="text-sm text-white/45">{layer.tagline}</p>
                </div>
              </div>
              <p className="mt-5 leading-relaxed text-white/60">{layer.description}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {layer.tools.map((t) => (
                  <li key={t.name}>
                    <a href={t.href} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[13px] text-white/75 transition hover:border-white/25 hover:text-white">
                      {t.name}
                      {t.external && <span className="text-white/35">↗</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── AI tools ─────────────────────────── */

const TOOLS: { name: string; href: string; body: string; icon: string }[] = [
  { name: 'Document drafting', href: '/tools/draft', body: 'Contracts, letters, affidavits and pleadings in Nigerian form.', icon: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h4' },
  { name: 'Legal research', href: '/tools/research', body: 'Authorities on point, with the reasoning that matters.', icon: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4' },
  { name: 'Outcome prediction', href: '/tools/predict', body: 'Likely outcome and risk, grounded in similar decided cases.', icon: 'M4 19 9 13l4 3 7-9M15 7h5v5' },
  { name: 'Contract analysis', href: '/tools/analyze', body: 'Risky clauses, unfair terms and compliance gaps, flagged.', icon: 'M5 4h14v16H5zM9 9l2 2 4-4M9 15h6' },
  { name: 'Judgment summaries', href: '/tools/summarize', body: 'Facts, issues and ratio from a long judgment in seconds.', icon: 'M5 5h14M5 10h14M5 15h9M5 20h6' },
  { name: 'Arguments', href: '/tools/arguments', body: 'Persuasive submissions with authorities attached.', icon: 'M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0Zm10 0-3 7a3 3 0 0 0 6 0Z' },
  { name: 'Compliance check', href: '/tools/compliance', body: 'CAMA, NDPA, CBN and tax rules against your documents.', icon: 'M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6Zm-3 9 2 2 4-4' },
  { name: 'Translation', href: '/tools/translate', body: 'Yoruba, Igbo, Hausa and Pidgin — law people can read.', icon: 'M4 5h8M8 3v2m-3 9c3-2 5-5 6-9M7 9c1 2 3 4 5 5m2 6 4-9 4 9m-7-3h6' },
]

function Tools() {
  return (
    <section className="border-t border-white/[0.06] bg-night-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHead eyebrow="AI for lawyers" title="Turn chaos into one case narrative." sub="Built for the lawyer, not instead of them." />
          <Link href="/tools" className="shrink-0 text-sm font-semibold text-mint-300 hover:text-mint-200">
            All tools →
          </Link>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t) => (
            <Link key={t.name} href={t.href} className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition hover:border-mint-400/30 hover:bg-white/[0.04]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-400/10 text-mint-300 ring-1 ring-mint-400/20 transition group-hover:bg-mint-400/20">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={t.icon} />
                </svg>
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{t.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">{t.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Mission ─────────────────────────── */

function Mission() {
  return (
    <section className="relative isolate overflow-hidden border-t border-white/[0.06] py-28 sm:py-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(50rem_30rem_at_50%_120%,rgba(30,192,126,0.18),transparent)]" />
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="font-serif text-4xl italic leading-tight text-white/90 sm:text-6xl">
          “Justice delayed is justice denied.”
        </p>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/60">
          CaseWin is building the rails that make justice faster, fairer and open — for the person with a dispute, the lawyer who takes it on,
          the court that decides it, and every citizen who should be able to read the law.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/auth/signup" className="inline-flex items-center gap-2 rounded-xl bg-mint-400 px-6 py-3.5 text-sm font-semibold text-night-950 transition hover:bg-mint-300">
            Start free <Arrow />
          </Link>
          <Link href="/marketplace" className="inline-flex items-center rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold transition hover:bg-white/[0.06]">
            Find a verified lawyer
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── bits ─────────────────────────── */

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-400">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg leading-relaxed text-white/55">{sub}</p>}
    </div>
  )
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 8h10m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
