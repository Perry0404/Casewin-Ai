import Link from 'next/link'
import { SiteFooter, SiteNav } from '@/components/site'
import { Badge, btn } from '@/components/ui'
import { createAdminClient, isConfigured } from '@/lib/supabase/server'
import { OPENLEGAL_URL } from '@/lib/constants'

export const revalidate = 300

const SERVICES: [string, string, string][] = [
  ['/file', 'File a new case', 'Originating processes and motions, from any phone or computer. Approved lawyers and litigants only.'],
  ['/cause-list', 'Check a cause list', 'Which matters are before which judge today, by court and division.'],
  ['/track', 'Track a filing', 'Fees assessed, payment, suit number and first hearing date — with your tracking code.'],
  ['/verify', 'Verify a court document', 'Check that a filed document is exactly the one the registry received.'],
  ['/register', 'Register to file or work in a registry', 'Lawyers, litigants, clerks, registrars and judges apply once; every account is checked.'],
  ['/onboard', 'Bring a court online', 'For Chief Judges and Chief Registrars. We set up divisions, judges, fees and staff.'],
]

const CAPABILITIES: [string, string][] = [
  ['E-filing', 'Counsel files originating processes with documents. Each document is fingerprinted (SHA-256) on arrival and the filer gets a tracking code.'],
  ['Registry queue', 'Every new filing in one queue. The case type is classified automatically; the clerk checks the papers or sends a query back to counsel.'],
  ['Fees and payment', 'Fees are assessed from the court’s own schedule. Counsel pays and enters the receipt; the registry confirms it.'],
  ['Suit numbers', 'Issued in sequence per division and year (e.g. HOW/142/2026) the moment payment is confirmed.'],
  ['Judge allocation', 'Suggested by current docket size, so no courtroom is overloaded; the registrar confirms.'],
  ['Hearings and cause lists', 'Hearing dates are proposed where the list has room. Every sitting is recorded — held, adjourned (with the reason) or concluded — and the public cause list updates itself.'],
  ['Judgments', 'Judges or the registry upload the judgment. A registrar confirms redaction of minors, victims and sealed matters, then publishes it to OpenLegal Nigeria.'],
  ['Judicial analytics', 'Clearance rate, backlog by age, median time to disposal, adjournment causes, caseload per judge and division — computed from the court’s own records.'],
  ['Staff and roles', 'Every officer has their own login and sees only what their role allows. Temporary passwords are handed over once and must be changed.'],
  ['Audit trail', 'Every action is stamped with the officer and the time: an account of the file that paper cannot give.'],
]

const ROLES: [string, string, string][] = [
  ['Lawyers and litigants', 'File, pay, follow every filing, see hearing dates', 'Filer portal'],
  ['Registry clerks', 'Check filings, assess fees, schedule hearings, record outcomes', 'Registry'],
  ['Registrars', 'Everything a clerk does, plus accept filings and publish judgments', 'Registry'],
  ['Judges', 'Their own list for the day, their docket, recording hearings, uploading judgments', 'Registry — judge view'],
  ['Court administrator', 'Staff accounts and roles, judges, divisions, fee schedule', 'Registry — settings'],
  ['Chief Judge and court management', 'Judicial analytics for the court', 'Registry — analytics'],
  ['The public', 'Cause lists, tracking, document verification, published judgments', 'This site and OpenLegal'],
]

async function courts() {
  if (!isConfigured()) return []
  const db = createAdminClient()
  const { data } = await db.from('courts').select('id, name, state, status, divisions(count)').in('status', ['pilot', 'active']).order('name')
  return (data ?? []).map((c) => ({ ...c, divisions: (c.divisions as unknown as { count: number }[])[0]?.count ?? 0 }))
}

export default async function Home() {
  const list = await courts().catch(() => [])
  return (
    <div className="bg-white">
      <SiteNav />
      <main>
        <section className="border-b border-ink-200">
          <div className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 sm:pt-20">
            <p className="text-[14px] text-ink-500">For Nigerian courts, lawyers and the public</p>
            <h1 className="mt-3 max-w-3xl text-[40px] font-semibold leading-[1.08] tracking-[-0.025em] text-ink-950 sm:text-[56px]">
              The court registry, online.
            </h1>
            <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-ink-600">
              File a case, pay fees, get a suit number and follow every hearing — while the registry, the bench and court management work from
              one record.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/file" className={btn.primary + ' !px-5 !py-3'}>
                File a case
              </Link>
              <Link href="/e-filing" className={btn.secondary + ' !px-5 !py-3'}>
                How e-filing works
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-500">Services</h2>
          <ul className="mt-4 grid border-t border-ink-200 md:grid-cols-2 md:gap-x-12">
            {SERVICES.map(([href, title, desc]) => (
              <li key={href} className="border-b border-ink-200">
                <Link href={href} className="group flex items-start justify-between gap-6 py-5">
                  <span>
                    <span className="text-[17px] font-semibold text-brass-600 group-hover:underline group-hover:underline-offset-4">{title}</span>
                    <span className="mt-1 block text-[14px] leading-relaxed text-ink-600">{desc}</span>
                  </span>
                  <span className="mt-1 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-950" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-parchment">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink-950">Courts on CaseWin Court</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
                Courts run a pilot alongside their paper registry before switching over.{' '}
                <Link href="/onboard" className="prose-link">
                  Ask about a pilot
                </Link>
              </p>
            </div>
            {list.length ? (
              <table className="w-full self-start border-t border-ink-950 text-left text-[14px]">
                <thead>
                  <tr className="border-b border-ink-200 text-[12px] text-ink-500">
                    <th className="py-2 pr-4 font-medium">Court</th>
                    <th className="py-2 pr-4 font-medium">State</th>
                    <th className="py-2 pr-4 font-medium">Divisions</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="border-b border-ink-200">
                      <td className="py-3 pr-4 font-medium text-ink-950">{c.name}</td>
                      <td className="py-3 pr-4 text-ink-600">{c.state}</td>
                      <td className="py-3 pr-4 tabular-nums text-ink-600">{c.divisions}</td>
                      <td className="py-3">
                        <Badge tone={c.status === 'active' ? 'good' : 'info'}>{c.status === 'active' ? 'Live' : 'Pilot'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="self-start border-t border-ink-950 pt-4 text-[14px] text-ink-600">The first pilot courts are being set up.</p>
            )}
          </div>
        </section>

        <section id="capabilities" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink-950">What the system does</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-600">From the first filing to the published judgment, one record shared by the registry, the bench and the public.</p>
            </div>
            <dl className="border-t border-ink-950">
              {CAPABILITIES.map(([t, d]) => (
                <div key={t} className="grid gap-1 border-b border-ink-200 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
                  <dt className="text-[15px] font-semibold text-ink-950">{t}</dt>
                  <dd className="text-[14px] leading-relaxed text-ink-600">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="roles" className="border-t border-ink-200">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink-950">Who uses it</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
                Each person signs in with their own account and sees what their role needs. Every account is approved before it can act.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-t border-ink-950 text-left text-[14px]">
                <thead>
                  <tr className="border-b border-ink-200 text-[12px] text-ink-500">
                    <th className="py-2 pr-4 font-medium">Who</th>
                    <th className="py-2 pr-4 font-medium">What they do</th>
                    <th className="py-2 font-medium">Where</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map(([who, what, where]) => (
                    <tr key={who} className="border-b border-ink-200 align-top">
                      <td className="py-3 pr-4 font-medium text-ink-950">{who}</td>
                      <td className="py-3 pr-4 text-ink-600">{what}</td>
                      <td className="py-3 text-ink-600">{where}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-t border-ink-200 bg-parchment">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-[18px] font-semibold text-ink-950">Published judgments become public law</h2>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-600">
                When a registrar publishes a redacted judgment, it appears on OpenLegal Nigeria — free to read, search and cite.
              </p>
            </div>
            <a href={OPENLEGAL_URL} className={btn.secondary}>
              Open OpenLegal Nigeria
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
