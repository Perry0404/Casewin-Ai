import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/components/site'
import { btn } from '@/components/ui'
import { publicStats } from '@/lib/stats'

export const revalidate = 300

const STEPS = [
  ['Tell us', 'Two minutes, on any phone. Who is detained or what happened, where, and since when. You get a reference number and a PIN.'],
  ['We check it', 'Our rules engine reads the dates against the Constitution and ACJA and puts the most urgent cases — children, people held without a court order — first.'],
  ['A lawyer takes it', 'A volunteer lawyer we have verified on the Nigerian Bar roll takes the case and must act within 48 hours, or it goes back to the next lawyer.'],
  ['You follow it', 'Every step — call, visit, bail application, court date, release — is recorded. You see the updates with your reference and PIN.'],
]

const RIGHTS = [
  ['24–48 hours', 'You must be taken to court within 24 hours if a court is within 40 km, otherwise 48 hours.', 'Constitution s.35(5)'],
  ['Bail is free', 'Police bail is free. Nobody may demand money to release you.', 'ACJA 2015; Police Act 2020'],
  ['Silence & a lawyer', 'You may stay silent until you have spoken with a lawyer of your choice.', 'Constitution s.35(2)'],
  ['14 + 14 days', 'A remand order lasts at most 14 days, extendable once by 14 days on good cause.', 'ACJA 2015 s.296'],
]

export default async function Home() {
  const s = await publicStats().catch(() => null)
  return (
    <div className="bg-parchment">
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(48rem_32rem_at_85%_-10%,rgba(209,166,70,0.22),transparent_60%)]" />
        <div className="grain absolute inset-0" />
        <SiteHeader dark />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:pb-28 lg:pt-20">
          <div className="animate-rise">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-300">Free · Confidential · Nigeria-wide</p>
            <h1 className="mt-5 font-display text-[44px] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[68px]">
              Someone held by the police?
              <span className="block text-brass-300">Get a free lawyer.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-200">
              Tell us what happened. A verified volunteer lawyer takes the case within 48 hours — and you can see every step they take.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/help" className={btn.brass + ' !px-7 !py-4 !text-base'}>
                Report a case — free
              </Link>
              <Link href="/track" className="inline-flex items-center rounded-xl border border-white/20 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/5">
                Track a request
              </Link>
            </div>
            <p className="mt-5 text-sm text-ink-300">Also for police extortion, domestic violence, eviction and unpaid wages.</p>
          </div>
          <div className="animate-rise self-end rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur [animation-delay:120ms] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-300">Live, from real cases</p>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-7">
              <Num label="Requests received" v={s?.requests} />
              <Num label="Taken by a lawyer" v={s?.assigned} />
              <Num label="People released" v={s?.released} />
              <Num label="Verified volunteers" v={s?.volunteers} />
            </dl>
            <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-ink-300">
              No estimates and no sample data: these count only real requests on this platform.{' '}
              <Link href="/impact" className="text-brass-200 underline underline-offset-4">
                See the full record
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-600">How it works</p>
        <h2 className="mt-2 max-w-2xl font-display text-4xl font-semibold tracking-tight text-ink-900">From a phone call for help to a lawyer at the station.</h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              <span className="font-mono text-sm text-brass-600">0{i + 1}</span>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink-900">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-ink-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-600">Know your rights</p>
              <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900">If you are arrested in Nigeria</h2>
            </div>
            <Link href="/rights" className={btn.secondary}>
              All your rights, with the law →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RIGHTS.map(([t, d, ref]) => (
              <div key={t} className="rounded-2xl bg-parchment p-6">
                <p className="font-display text-3xl font-semibold text-ink-900">{t}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{d}</p>
                <p className="mt-4 font-mono text-[11px] text-ink-400">{ref}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:px-6 md:grid-cols-2">
        <div className="rounded-3xl bg-ink-950 p-8 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-300">For lawyers, paralegals & law students</p>
          <h3 className="mt-3 font-display text-3xl font-semibold">Take one case a month.</h3>
          <p className="mt-3 text-ink-200">
            Pick cases in your state from a board sorted by urgency. Drafts of bail and fundamental-rights applications are generated from the file. Your
            pro bono record builds itself.
          </p>
          <Link href="/volunteer" className={btn.brass + ' mt-7'}>
            Volunteer
          </Link>
        </div>
        <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-card sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-600">For legal aid organisations</p>
          <h3 className="mt-3 font-display text-3xl font-semibold text-ink-900">Run your caseload here.</h3>
          <p className="mt-3 text-ink-500">
            Legal Aid Council offices, NGOs, law clinics and NBA pro bono committees: bring your team, take cases as an organisation, record prison and
            police-station visits, and report outcomes from real data.
          </p>
          <Link href="/organisations" className={btn.primary + ' mt-7'}>
            Register an organisation
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}

function Num({ label, v }: { label: string; v: number | undefined }) {
  return (
    <div>
      <dt className="text-[13px] text-ink-300">{label}</dt>
      <dd className="mt-1 font-display text-4xl font-semibold tabular-nums">{v == null ? '—' : v.toLocaleString()}</dd>
    </div>
  )
}
