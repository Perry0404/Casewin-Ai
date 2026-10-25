import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicPage } from '@/components/site'

export const metadata: Metadata = { title: 'Privacy', description: 'How CaseWin Legal Aid collects, uses, protects and deletes personal data, under the Nigeria Data Protection Act 2023.' }

const SECTIONS: [string, React.ReactNode][] = [
  ['Who we are', 'CaseWin Legal Aid is run by CaseWin. We decide how the information in a request is used, so we are responsible for it under the Nigeria Data Protection Act 2023.'],
  [
    'What we collect',
    'What you put in a request: the name, age and sex of the person who needs help, where they are held or live, what happened, dates, the court, and your own name, phone number and (if you give it) email. Volunteers add what they learn while helping: notes, court dates, documents such as a charge sheet, and the outcome. We also keep a one-way scrambled form of your connection address to stop abuse — it cannot be turned back into the address.',
  ],
  [
    'Why, and on what basis',
    'Only to find a lawyer and give legal help, and to count — without names — how many people were helped. You give consent when you send a request. Where someone is in custody and cannot consent themselves, we act to protect their vital interests until they or their family can decide.',
  ],
  [
    'Who can see it',
    'Nobody sees a request until they have been checked: volunteers see only initials until they take a case; the full file is open only to the volunteer handling it, their supervising lawyer, their organisation’s coordinator and CaseWin administrators. Requests are never published, sold or shared for marketing. We share information with a court, the police or another legal aid provider only when that is part of helping you, or when the law requires it.',
  ],
  [
    'How we keep it safe',
    'Requests are stored in a database that only our server can read, over encrypted connections. Documents are in a private store and open only through links that expire within minutes. Every action on a file is recorded against the person who took it. Your tracking PIN is stored only in scrambled form.',
  ],
  [
    'Messages we send',
    'We text or email you only about your request. If you tell us it is not safe to contact your number, we send nothing to it.',
  ],
  [
    'How long we keep it',
    'While the case is open, and for up to two years after it closes so that the record of what was done stays available to you. After that we delete it or remove everything that identifies anyone.',
  ],
  [
    'Your rights',
    <>
      You can ask to see what we hold, to correct it, or to delete it, and you can withdraw your consent. Use{' '}
      <Link href="/track" className="prose-link">
        Track a request
      </Link>{' '}
      with your reference and PIN, then “Is something wrong?”. If a volunteer is in the middle of court proceedings for you, we will talk to you before deleting so your case is not harmed. If you are unhappy with how we handle your data you can complain to the Nigeria Data Protection Commission.
    </>,
  ],
]

export default function Privacy() {
  return (
    <PublicPage>
      <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-950 sm:text-[40px]">Privacy</h1>
      <p className="mt-3 max-w-xl text-[17px] text-ink-600">Families trust us with someone they love. This is what we do with the information.</p>
      <dl className="mt-10 border-t border-ink-950">
        {SECTIONS.map(([t, d]) => (
          <div key={t} className="grid gap-1 border-b border-ink-200 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
            <dt className="text-[15px] font-semibold text-ink-950">{t}</dt>
            <dd className="text-[15px] leading-relaxed text-ink-700">{d}</dd>
          </div>
        ))}
      </dl>
    </PublicPage>
  )
}
