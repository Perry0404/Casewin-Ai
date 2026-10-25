import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicPage } from '@/components/site'
import { btn } from '@/components/ui'

export const metadata: Metadata = { title: 'How we work', description: 'How CaseWin Legal Aid verifies volunteers, checks every report, protects personal data and counts outcomes.' }

const SECTIONS: [string, string[]][] = [
  [
    'Every volunteer is checked before they see a file',
    [
      'Lawyers give their Supreme Court enrolment number. We check the name and number against the roll and call the phone number before approving.',
      'Paralegals and law students are confirmed by their faculty, clinic or the organisation they work under, and work under a lawyer’s supervision.',
      'Organisations are confirmed by phone and registration before their coordinator can see any case.',
      'Volunteers sign a pledge: no money from clients, confidentiality, truthful records, action within 48 hours.',
    ],
  ],
  [
    'Every report is checked before it counts',
    [
      'A report starts as unverified. It is counted as verified only when a volunteer confirms the facts — by speaking with the person, visiting the facility, seeing the charge sheet or remand warrant, or confirming with the police or court registry. The method is recorded.',
      'Reports from prison and police-station visits start verified, because a volunteer met the person.',
      'An outcome (release, bail, striking out) cannot be recorded until the facts are verified.',
      'False reports are marked as not genuine, with a reason, and excluded from every figure. Repeated reports from one connection are limited.',
    ],
  ],
  [
    'Nobody sits on a case',
    [
      'A volunteer who takes a case has 48 hours to act — call the family, visit, or file something. If not, the case goes back to the board automatically.',
      'Every action is recorded with who did it and when. Families see plain-language updates with their reference and PIN.',
    ],
  ],
  [
    'Personal data is protected',
    [
      'Reports are never published. Volunteers see only initials until they take a case; contact details unlock only for the volunteer handling it, their coordinator and our administrators.',
      'Tracking PINs and connection addresses are stored only as one-way hashes. The data is processed under the Nigeria Data Protection Act 2023 for the purpose of giving legal help, with consent given at the time of the report.',
    ],
  ],
  [
    'Public figures are real',
    [
      'Every number on this site is counted from real records on the platform. There is no sample or estimated data. Released means a volunteer recorded the release after verifying the facts.',
    ],
  ],
]

export default function HowItWorks() {
  return (
    <PublicPage>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-600">How we work</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">Trust is the whole product.</h1>
      <p className="mt-4 text-lg text-ink-500">Families trust us with someone they love. Here is how we keep that trust — and keep our numbers honest.</p>
      <div className="mt-12 space-y-10">
        {SECTIONS.map(([t, items]) => (
          <section key={t}>
            <h2 className="font-display text-2xl font-semibold text-ink-900">{t}</h2>
            <ul className="mt-4 space-y-3">
              {items.map((x) => (
                <li key={x} className="flex gap-3 text-ink-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brass-400" />
                  {x}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-14 flex flex-wrap gap-3">
        <Link href="/help" className={btn.primary}>
          Report a case
        </Link>
        <Link href="/impact" className={btn.secondary}>
          See the record
        </Link>
      </div>
    </PublicPage>
  )
}
