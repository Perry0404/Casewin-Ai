import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/components/site'
import { KINDS, OPENLEGAL_URL } from '@/lib/constants'
import { publicStats } from '@/lib/stats'

export const revalidate = 300

const RIGHTS: [string, string, string][] = [
  ['They must take you to court within 24 hours', 'if a court is within 40 km; otherwise within 48 hours.', 'Constitution s.35(5)'],
  ['Police bail is free', 'Nobody may demand money to release you. Note their name and number.', 'ACJA 2015'],
  ['You may stay silent until you have a lawyer', 'Don’t sign a statement you don’t understand.', 'Constitution s.35(2)'],
  ['Nobody may be arrested in your place', 'The police may not hold a relative instead of you.', 'ACJA 2015 s.7'],
]

const STEPS: [string, string][] = [
  ['Now', 'Tell us who is held, where and since when. It takes about two minutes. You get a reference number and a PIN.'],
  ['Within 48 hours', 'A volunteer lawyer we have verified takes the case and calls or WhatsApps you. If they don’t act in 48 hours, it passes to the next lawyer.'],
  ['Every step', 'Calls, visits, bail applications and court dates are recorded. You see the updates with your reference and PIN.'],
  ['The outcome', 'Release, bail, charges struck out, or a settlement — recorded on the file, never published with your name.'],
]

export default async function Home() {
  const s = await publicStats().catch(() => null)
  return (
    <div className="bg-white">
      <SiteHeader />
      <main>
        <section className="border-b border-ink-200">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.35fr_1fr]">
            <div>
              <p className="text-[14px] text-ink-500">Free · confidential · anywhere in Nigeria</p>
              <h1 className="mt-3 text-[38px] font-semibold leading-[1.08] tracking-[-0.025em] text-ink-950 sm:text-[52px]">
                Get a free lawyer for someone held by the police.
              </h1>
              <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-ink-600">
                Also for police extortion, domestic violence, eviction and unpaid wages — for anyone who cannot afford a lawyer.
              </p>

              <h2 className="mt-10 text-[15px] font-semibold text-ink-950">What is happening?</h2>
              <ul className="mt-3 border-t border-ink-200">
                {Object.entries(KINDS).map(([k, v]) => (
                  <li key={k} className="border-b border-ink-200">
                    <Link href={`/help?kind=${k}`} className="group flex items-center justify-between gap-4 py-3.5">
                      <span>
                        <span className="text-[16px] font-semibold text-brass-500 group-hover:underline group-hover:underline-offset-4">{v.label}</span>
                        <span className="block text-[13px] text-ink-500">{v.help}</span>
                      </span>
                      <span className="text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-950" aria-hidden>
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[14px] text-ink-600">
                Already asked?{' '}
                <Link href="/track" className="prose-link">
                  Track your request
                </Link>
              </p>
            </div>

            <aside className="self-start border-t-4 border-ink-950 bg-parchment p-6">
              <h2 className="text-[17px] font-semibold text-ink-950">If someone is arrested right now</h2>
              <ol className="mt-4 space-y-4">
                {RIGHTS.map(([t, d, ref], i) => (
                  <li key={t} className="grid grid-cols-[1.5rem_1fr] gap-2">
                    <span className="font-mono text-[13px] text-ink-400">{i + 1}.</span>
                    <span>
                      <span className="block text-[15px] font-medium leading-snug text-ink-950">{t}</span>
                      <span className="block text-[14px] leading-snug text-ink-600">{d}</span>
                      <a href={`${OPENLEGAL_URL}/search?q=${encodeURIComponent(ref)}`} className="mt-1 inline-block font-mono text-[12px] text-ink-500 underline decoration-ink-300 underline-offset-2 hover:text-ink-950">
                        {ref}
                      </a>
                    </span>
                  </li>
                ))}
              </ol>
              <Link href="/rights" className="prose-link mt-5 inline-block text-[14px]">
                All your rights, with the law
              </Link>
            </aside>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink-950">What happens after you ask</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
              Nobody from CaseWin will ever ask you for money.{' '}
              <Link href="/how-it-works" className="prose-link">
                How we check volunteers and reports
              </Link>
            </p>
          </div>
          <ol className="border-t border-ink-950">
            {STEPS.map(([when, what]) => (
              <li key={when} className="grid gap-1 border-b border-ink-200 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <span className="text-[15px] font-semibold text-ink-950">{when}</span>
                <span className="text-[14px] leading-relaxed text-ink-600">{what}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-ink-200 bg-parchment">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink-950">The record so far</h2>
              <Link href="/impact" className="prose-link text-[14px]">
                Full record
              </Link>
            </div>
            <dl className="mt-6 grid grid-cols-2 border-t border-ink-950 sm:grid-cols-4">
              {(
                [
                  ['Requests received', s?.requests],
                  ['Taken by a volunteer', s?.assigned],
                  ['People released', s?.released],
                  ['Verified volunteers', s?.volunteers],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="border-b border-ink-200 py-4 pr-4 sm:border-b-0">
                  <dt className="text-[13px] text-ink-500">{k}</dt>
                  <dd className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.02em] text-ink-950 tabular-nums">{v == null ? '—' : v.toLocaleString()}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[13px] text-ink-500">Counted from real requests on this service only — no estimates, no sample data.</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div className="border-t border-ink-950 pt-5">
            <h2 className="text-[20px] font-semibold text-ink-950">Lawyers, paralegals and law students</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
              Take cases in your state from a board ranked by the custody rules. Bail and fundamental-rights drafts are prepared from the file, and your pro bono
              record builds itself. Every volunteer is verified before seeing a file.
            </p>
            <Link href="/volunteer" className="prose-link mt-4 inline-block">
              Volunteer
            </Link>
          </div>
          <div className="border-t border-ink-950 pt-5">
            <h2 className="text-[20px] font-semibold text-ink-950">Legal aid organisations</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
              Legal Aid Council offices, NGOs, law clinics and NBA pro bono committees: take cases as a team, record prison and police-station visits, and report
              outcomes from real records.
            </p>
            <Link href="/organisations" className="prose-link mt-4 inline-block">
              Register an organisation
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
