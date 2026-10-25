import Link from 'next/link'
import type { Metadata } from 'next'
import { PublicShell } from '@/components/site'
import { Badge, btn } from '@/components/ui'
import { FILING_STATUS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'How e-filing works',
  description: 'A step-by-step guide to filing a case online with CaseWin Court: registration, documents, fees, suit numbers and hearings.',
}

const STEPS = [
  {
    t: 'Register once',
    who: 'You',
    d: 'Create an account and tell us who you are: counsel (with your Supreme Court enrolment number), a party in person, or a government agency. Every account is verified before it is switched on — usually within one working day.',
  },
  {
    t: 'Prepare your papers',
    who: 'You',
    d: 'Sign and stamp your originating process as you would for paper filing, then scan or export it as PDF. Add your supporting documents: witness statements, list of documents, exhibits, pre-action protocol form where required.',
  },
  {
    t: 'File online',
    who: 'You',
    d: 'Choose the court and judicial division, the originating process, the parties and the reliefs claimed, and attach your documents. Each file is fingerprinted (SHA-256) in your browser and again by the registry, so no one can later alter it unnoticed. You get a tracking code at once.',
  },
  {
    t: 'Registry review',
    who: 'Registry clerk',
    d: 'A clerk opens your filing, checks the papers and confirms the case type the system suggested. If something is missing they raise a query — you see it in your portal and answer there.',
  },
  {
    t: 'Fee assessment',
    who: 'Registry clerk',
    d: 'Fees are assessed line by line from the court’s approved fee schedule — filing fee, service per defendant, exhibits and so on. The breakdown appears in your portal.',
  },
  {
    t: 'Pay',
    who: 'You',
    d: 'Pay at the court’s designated bank or through Remita, then enter your receipt or RRR number in the portal. You can also pay at the registry counter and the clerk records it for you.',
  },
  {
    t: 'Suit number & judge',
    who: 'Registrar',
    d: 'Once payment is confirmed, the registrar opens the case: a suit number is issued in the division’s sequence (for example HOW/142/2026) and the case is allocated to a judge. The system suggests a judge with room on their docket; the registrar decides.',
  },
  {
    t: 'Hearings',
    who: 'Court',
    d: 'Your dates appear in the portal and on the public cause list. After each sitting the court records what happened — heard, adjourned (with the reason), struck out, settled or judgment delivered.',
  },
  {
    t: 'Judgment',
    who: 'Court',
    d: 'When judgment is delivered it is uploaded to the case file. After a registrar removes protected details (names of children, victims of sexual offences, sealed material) it can be published free on OpenLegal Nigeria.',
  },
]

const FAQ = [
  ['Do I still need to come to the registry?', 'Not to file. You may still need to attend for service arrangements, certified true copies or anything the court’s practice direction requires in person.'],
  ['Which documents can I upload?', 'PDF, Word or images — up to 10 files and 20 MB in total per filing. PDF is preferred.'],
  ['What if I make a mistake?', 'Before the registry accepts the filing, it can raise a query and you can respond. After acceptance, file the appropriate application as you would on paper.'],
  ['Is my filing public?', 'No. Filings and documents are visible only to you and the court’s registry. The public cause list shows the suit number, case title and the purpose of each sitting; family matters never show party names.'],
  ['How do I prove a document was never changed?', 'Anyone can drop a copy into the Verify page. If it matches the fingerprint taken at filing, it is unaltered.'],
  ['Can a law firm file for many clients?', 'Yes. Each lawyer registers with their own enrolment number; every case they file appears in their portal.'],
]

export default function EFilingGuide() {
  return (
    <PublicShell>
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-[13px] text-ink-500">Guide</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-6xl">How e-filing works</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-500">
            Everything you can do at the registry counter — from your phone or laptop, with a record of every step. Here is the whole journey, who
            does what, and what you will see at each point.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={btn.primary}>
              Register to e-file
            </Link>
            <Link href="/file" className={btn.secondary}>
              File a case
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-ink-900">Step by step</h2>
        <ol className="mt-10 space-y-0">
          {STEPS.map((s, i) => (
            <li key={s.t} className="relative grid grid-cols-[3rem_1fr] gap-x-5 pb-10 last:pb-0">
              {i < STEPS.length - 1 && <span className="absolute left-6 top-12 h-[calc(100%-3rem)] w-px bg-brass-300" aria-hidden />}
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-200 bg-white font-display text-lg font-semibold text-ink-900 shadow-card">{i + 1}</span>
              <div className="pt-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-xl font-semibold text-ink-900">{s.t}</h3>
                  <span className="rounded-full bg-parchment px-2.5 py-0.5 text-xs font-medium text-ink-500 ring-1 ring-ink-100">{s.who}</span>
                </div>
                <p className="mt-2 max-w-2xl leading-relaxed text-ink-600">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-ink-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-ink-900">What each status means</h2>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {Object.entries(FILING_STATUS).map(([k, s]) => (
              <div key={k} className="rounded-2xl border border-ink-100 p-5">
                <dt>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-600">{s.help}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-ink-900">Who sees what</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ['Filers', 'Your portal: every case you filed and its status, fees to pay, queries to answer, your suit numbers and next dates in court.'],
            ['Registry staff', 'The filing queue, fee assessment, suit numbers, judge allocation, hearings, the cause list, judgments and the court’s analytics. Each officer has their own login and every action is logged.'],
            ['The public', 'Cause lists, the document verification page, and published judgments on OpenLegal Nigeria. Never filings or documents.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
              <h3 className="font-display text-xl font-semibold text-ink-900">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-ink-900">Questions</h2>
          <div className="mt-8 divide-y divide-ink-100 rounded-2xl border border-ink-100">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group p-5">
                <summary className="cursor-pointer list-none font-medium text-ink-900">
                  <span className="mr-2 text-brass-500 transition group-open:rotate-90">›</span>
                  {q}
                </summary>
                <p className="mt-2 pl-4 text-ink-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
