import Link from 'next/link'
import { SiteFooter, SiteNav } from '@/components/site'
import { btn } from '@/components/ui'
import { OPENLEGAL_URL } from '@/lib/constants'

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <Hero />
      <Modules />
      <Journey />
      <Analytics />
      <Integrity />
      <OpenLegalBridge />
      <Cta />
      <SiteFooter />
    </div>
  )
}

function Hero() {
  return (
    <section className="relative isolate bg-ink-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_85%_-10%,rgba(209,166,70,0.16),transparent_60%),radial-gradient(50rem_30rem_at_-10%_110%,rgba(59,91,154,0.35),transparent_60%)]" />
      <div className="grain absolute inset-0 -z-10" />
      <Columns />
      <SiteNav />
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-32 lg:pt-16">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-brass-300/30 bg-brass-300/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brass-200">
            <span className="h-1.5 w-1.5 rounded-full bg-brass-300" />
            Pilot programme open to State High Courts
          </p>
          <h1 className="mt-7 font-display text-[44px] font-medium leading-[1.02] tracking-[-0.02em] sm:text-6xl lg:text-[72px]">
            The registry,
            <br />
            <em className="font-normal italic text-brass-300">rebuilt</em> for the
            <br />
            courts of today.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-200">
            Lawyers file from anywhere. Clerks assess fees and issue suit numbers in hours, not weeks. Cause lists publish themselves —
            and the Chief Judge sees where every case stands, live.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/onboard" className={btn.brass}>
              Bring your court online
              <Arrow />
            </Link>
            <Link href="/file" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
              File a case
            </Link>
          </div>
          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
            {[
              ['24/7', 'e-filing from any phone'],
              ['1 click', 'cause list, published'],
              ['SHA-256', 'proof on every document'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="whitespace-nowrap font-display text-xl font-semibold text-white sm:text-2xl">{k}</dt>
                <dd className="mt-1 text-xs leading-snug text-ink-300">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <RegistryMock />
      </div>
    </section>
  )
}

/** Faint courthouse columns behind the hero. */
function Columns() {
  return (
    <svg className="pointer-events-none absolute bottom-0 right-0 -z-10 h-[70%] w-[55%] opacity-[0.05]" viewBox="0 0 400 300" preserveAspectRatio="xMaxYMax meet" aria-hidden>
      <path d="M20 70 200 10l180 60v14H20z" fill="#fff" />
      {[50, 110, 170, 230, 290, 350].map((x) => (
        <rect key={x} x={x - 12} y={96} width={24} height={176} rx={3} fill="#fff" />
      ))}
      <rect x={10} y={280} width={380} height={14} fill="#fff" />
    </svg>
  )
}

function RegistryMock() {
  const steps = [
    ['Filed online', '09:12', true],
    ['Fees assessed · ₦13,500', '10:40', true],
    ['Payment confirmed', '11:05', true],
    ['Suit number issued', '11:07', true],
    ['First mention listed', 'Thu', false],
  ] as const
  return (
    <div className="relative animate-rise [animation-delay:120ms]" aria-label="Illustration of a filing in the registry">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brass-300/10 blur-2xl" />
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-2 shadow-2xl backdrop-blur">
        <div className="rounded-[20px] bg-parchment p-5 text-ink-900 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-600">Registry · Owerri Division</span>
            <span className="rounded-full bg-verdict-50 px-2.5 py-0.5 text-[11px] font-semibold text-verdict-700 ring-1 ring-verdict-500/20">● Accepted</span>
          </div>
          <p className="mt-4 font-mono text-sm text-ink-500">HOW/142/2026</p>
          <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight">Chukwu v. Okeke &amp; Anor.</h3>
          <p className="mt-1 text-sm text-ink-500">Land · Declaration of title &amp; injunction</p>

          <ol className="mt-6 space-y-0">
            {steps.map(([label, when, done], i) => (
              <li key={label} className="relative flex items-start gap-3 pb-4 last:pb-0">
                {i < steps.length - 1 && <span className={`absolute left-[9px] top-5 h-full w-px ${done ? 'bg-verdict-500/40' : 'bg-ink-200'}`} />}
                <span className={`relative mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full ${done ? 'bg-verdict-600 text-white' : 'border-2 border-dashed border-ink-300 bg-white'}`}>
                  {done && (
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
                      <path d="m2.5 6.2 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 text-sm font-medium">{label}</span>
                <span className="font-mono text-xs text-ink-400">{when}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-ink-100 pt-5">
            <div className="rounded-xl bg-white p-3 shadow-card">
              <p className="text-[11px] font-medium text-ink-400">Assigned to</p>
              <p className="mt-0.5 text-sm font-semibold">Court 3</p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-card">
              <p className="text-[11px] font-medium text-ink-400">Document proof</p>
              <p className="mt-0.5 truncate font-mono text-xs font-medium text-ink-700">9f2c…e41a ✓</p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-ink-400">Illustration — sample matter</p>
    </div>
  )
}

const MODULES = [
  {
    k: '01',
    title: 'E-filing',
    body: 'Lawyers and litigants file originating processes online, attach documents, and get a tracking code. Every page is hashed the moment it lands.',
  },
  {
    k: '02',
    title: 'Registry desk',
    body: 'One queue for every new filing. Automatic case-type routing, fee assessment from your own schedule, queries back to counsel, and suit numbers issued in sequence.',
  },
  {
    k: '03',
    title: 'Cause lists & hearings',
    body: 'Judge allocation that balances dockets, hearing dates with room on the list, and a public cause list that updates itself. Every adjournment is recorded with its reason.',
  },
  {
    k: '04',
    title: 'Judicial analytics',
    body: 'Backlog by age, clearance rate, time to disposal, adjournment causes and caseload per judge — the numbers a Chief Judge needs, without a single spreadsheet.',
  },
]

function Modules() {
  return (
    <section className="bg-parchment py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">What changes on day one</p>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink-900 sm:text-5xl">
            Four desks. One record.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-500">
            Courts are information systems. CaseWin Court gives the registry, the bench and the public the same, single source of truth — from the
            first filing to the published judgment.
          </p>
        </div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-ink-100 bg-ink-100 md:grid-cols-2">
          {MODULES.map((m) => (
            <div key={m.k} className="group relative bg-white p-8 transition hover:bg-parchment/40 sm:p-10">
              <span className="font-mono text-xs text-brass-600">{m.k}</span>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink-900">{m.title}</h3>
              <p className="mt-3 max-w-md leading-relaxed text-ink-500">{m.body}</p>
              <span className="absolute bottom-0 left-8 right-8 h-px origin-left scale-x-0 bg-brass-400 transition-transform duration-500 group-hover:scale-x-100 sm:left-10 sm:right-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const JOURNEY = [
  ['File', 'Counsel files online and receives a tracking code.'],
  ['Assess', 'A clerk checks the papers and assesses fees from the court’s schedule.'],
  ['Pay', 'Counsel pays and enters the receipt. The registry confirms.'],
  ['Number', 'The suit number is issued and a judge is allocated.'],
  ['Hear', 'Hearings are listed, held or adjourned — each with a reason.'],
  ['Decide', 'The judgment is uploaded, redacted, and published.'],
]

function Journey() {
  return (
    <section id="how" className="border-y border-ink-100 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">How it works</p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink-900 sm:text-5xl">From filing to judgment, without a queue.</h2>
          </div>
          <p className="max-w-sm text-ink-500">Every step is logged with who did it and when — an audit trail no paper file can give you.</p>
        </div>
        <ol className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
          {JOURNEY.map(([t, d], i) => (
            <li key={t} className="relative">
              <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 bg-parchment font-display text-lg font-semibold text-ink-900">
                  {i + 1}
                </span>
                {i < JOURNEY.length - 1 && <span className="rule-brass hidden h-px flex-1 lg:absolute lg:left-14 lg:right-0 lg:top-[22px] lg:block" />}
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Analytics() {
  const bars = [62, 58, 71, 66, 74, 80, 77, 85, 90, 88, 96, 104]
  const disposed = [40, 45, 52, 50, 61, 66, 70, 73, 82, 86, 91, 101]
  const max = 110
  const pts = (arr: number[]) => arr.map((v, i) => `${(i / (arr.length - 1)) * 100},${100 - (v / max) * 100}`).join(' ')
  return (
    <section id="analytics" className="relative isolate overflow-hidden bg-ink-950 py-24 text-white sm:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_30rem_at_100%_0%,rgba(209,166,70,0.12),transparent_60%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-300">Judicial analytics</p>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">Once a court goes digital, justice becomes measurable.</h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-200">
            The dashboard updates with every filing and every adjournment. See which cases are ageing, which courtrooms are overloaded, and why
            matters stall — then act on it.
          </p>
          <ul className="mt-8 space-y-3 text-ink-200">
            {['Clearance rate and backlog by age', 'Median time from filing to judgment', 'Top causes of adjournment', 'Caseload per judge, against the court average'].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brass-300" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl sm:p-8" aria-label="Illustrative analytics preview">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Clearance rate', '97%'],
              ['Median to judgment', '14 mo'],
              ['Cases > 3 years', '38'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] text-ink-300">{k}</p>
                <p className="mt-1 font-display text-2xl font-semibold">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between text-xs text-ink-300">
              <span>Filed vs disposed, by month</span>
              <span className="flex gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-[3px] w-3.5 rounded bg-[#7D9BD6]" />
                  Filed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-[3px] w-3.5 rounded bg-brass-300" />
                  Disposed
                </span>
              </span>
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-4 h-44 w-full" aria-hidden>
              {[25, 50, 75].map((y) => (
                <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
              ))}
              <polyline points={pts(bars)} fill="none" stroke="#7D9BD6" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              <polyline points={pts(disposed)} fill="none" stroke="#DDBC69" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-3 text-right text-[11px] text-ink-400">Illustrative figures</p>
        </div>
      </div>
    </section>
  )
}

function Integrity() {
  const items = [
    ['Tamper-evident documents', 'Every filed document is fingerprinted with SHA-256 on upload. Anyone can later prove a page was never altered.'],
    ['A full audit trail', 'Every action — query, assessment, payment, allocation, adjournment — is stamped with the officer and the time.'],
    ['Role-based access', 'Court administrators, registrars, clerks and judges each see only what their role needs. Every officer has their own login.'],
    ['Redaction before publication', 'Nothing reaches the public until a registrar confirms that names of minors, victims and sealed details are removed.'],
  ]
  return (
    <section id="integrity" className="bg-parchment py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">Security &amp; integrity</p>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink-900 sm:text-5xl">Built to the standard of the record.</h2>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {items.map(([t, d]) => (
            <div key={t} className="rounded-3xl border border-ink-100 bg-white p-8 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-brass-300">
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M10 2.5 4 5v4.5c0 3.8 2.6 6.9 6 8 3.4-1.1 6-4.2 6-8V5l-6-2.5Z" strokeLinejoin="round" />
                  <path d="m7.3 10 1.9 1.9 3.6-3.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">{t}</h3>
              <p className="mt-2 leading-relaxed text-ink-500">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function OpenLegalBridge() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-ink-100 bg-[linear-gradient(135deg,#F7F4ED_0%,#FFFFFF_60%)] p-8 sm:p-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-verdict-600">Connected to OpenLegal Nigeria</p>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">
                When a judgment is delivered, the whole country can read it.
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-ink-500">
                Registrars publish redacted judgments in one click. They become free, searchable law on OpenLegal Nigeria — for lawyers,
                students, journalists and the AI tools they use.
              </p>
              <a href={OPENLEGAL_URL} className="mt-7 inline-flex items-center gap-2 font-semibold text-ink-900 underline decoration-verdict-500/50 decoration-2 underline-offset-4 hover:decoration-verdict-500">
                Explore OpenLegal Nigeria <Arrow />
              </a>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-lift">
              <div className="flex items-center gap-2 rounded-xl border border-ink-100 bg-parchment px-4 py-3 text-sm text-ink-400">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <circle cx="9" cy="9" r="5.5" />
                  <path d="m13.5 13.5 3 3" strokeLinecap="round" />
                </svg>
                declaration of title customary land
              </div>
              <div className="mt-4 space-y-3">
                {['Chukwu v. Okeke & Anor.', 'Nwosu v. Registered Trustees…'].map((t, i) => (
                  <div key={t} className="rounded-xl border border-ink-100 p-4">
                    <p className="font-display font-semibold text-ink-900">{t}</p>
                    <p className="mt-1 text-xs text-ink-400">High Court of Imo State · {i ? 'HOR/17/2025' : 'HOW/142/2026'}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-right text-[11px] text-ink-400">Illustration</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="relative isolate overflow-hidden bg-ink-900 py-24 text-center text-white">
      <div className="grain absolute inset-0 -z-10" />
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">Bring your court online.</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-200">
          We set up your divisions, judges, fee schedule and staff logins, train your registry, and run alongside the paper process until
          you are ready to switch.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/onboard" className={btn.brass}>
            Request a pilot <Arrow />
          </Link>
          <Link href="/login" className="inline-flex items-center rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold transition hover:bg-white/5">
            Staff sign in
          </Link>
        </div>
      </div>
    </section>
  )
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 8h10m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
