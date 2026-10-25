import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicPage } from '@/components/site'
import { btn } from '@/components/ui'
import { OPENLEGAL_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Your rights if you are arrested in Nigeria',
  description: 'Plain-language rights on arrest, detention, bail and remand in Nigeria, with the law behind each one.',
}

const RIGHTS: [string, string, string, string][] = [
  ['You must be told why', 'You must be told, in writing and in a language you understand, why you are being arrested — within 24 hours.', 'Constitution s.35(3)', 'informed in writing within twenty-four hours'],
  ['You may stay silent', 'You do not have to answer questions until you have spoken with a lawyer of your choice.', 'Constitution s.35(2)', 'right to remain silent'],
  ['Court within 24–48 hours', 'You must be taken before a court within one day if there is a court within 40 km, otherwise within two days.', 'Constitution s.35(4)–(5)', 'reasonable time 35'],
  ['Bail is free', 'Police bail costs nothing. Anyone demanding money to release you is breaking the law — note their name and number.', 'ACJA 2015; Police Act 2020', 'bail'],
  ['No torture', 'Nobody may torture you or treat you in an inhuman or degrading way to make you confess.', 'Constitution s.34; Anti-Torture Act 2017', 'torture inhuman degrading'],
  ['Nobody arrested in your place', 'The police may not arrest your relative or anyone else instead of you.', 'ACJA 2015 s.7', 'arrested in place of a suspect'],
  ['No arrest over a debt', 'A civil dispute or unpaid debt is not a crime. The police may not arrest you to recover money for someone.', 'ACJA 2015 s.8(2)', 'civil wrong or breach of contract'],
  ['Remand has limits', 'A remand order lasts at most 14 days, renewable once for 14 days on good cause. After that the court must act.', 'ACJA 2015 s.296', 'remand order 296'],
  ['Children are different', 'A child under 18 must be handled through the child justice system. Detention is the last resort.', 'Child Rights Act 2003', 'child justice'],
  ['Free legal aid', 'If you cannot afford a lawyer, the Legal Aid Council and volunteers can represent you free.', 'Constitution s.36(6)(c); Legal Aid Act 2011', 'legal aid council'],
]

export default function Rights() {
  return (
    <PublicPage>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-600">Know your rights</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">If you or someone you love is arrested</h1>
      <p className="mt-4 text-lg text-ink-500">Stay calm. Don’t sign anything you don’t understand. Ask for a lawyer — and ask us for one if you can’t pay.</p>
      <ol className="mt-12 space-y-4">
        {RIGHTS.map(([t, d, ref, q], i) => (
          <li key={t} className="flex gap-5 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
            <span className="font-mono text-sm text-brass-600">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">{t}</h2>
              <p className="mt-1.5 text-ink-600">{d}</p>
              <a href={`${OPENLEGAL_URL}/search?q=${encodeURIComponent(q)}`} target="_blank" rel="noreferrer" className="mt-3 inline-block font-mono text-xs text-ink-400 underline decoration-ink-200 underline-offset-4 hover:text-ink-700">
                {ref} — read the law on OpenLegal
              </a>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-12 rounded-3xl bg-ink-950 p-8 text-white">
        <h2 className="font-display text-2xl font-semibold">Someone is held right now?</h2>
        <p className="mt-2 text-ink-200">Tell us where and since when. A verified volunteer lawyer takes it within 48 hours.</p>
        <Link href="/help" className={btn.brass + ' mt-6'}>
          Get a free lawyer
        </Link>
      </div>
      <p className="mt-8 text-xs text-ink-400">General information, not legal advice for your situation. Section numbers refer to the Constitution of the Federal Republic of Nigeria 1999 (as amended) and the Administration of Criminal Justice Act 2015; states have their own ACJ Laws with similar provisions.</p>
    </PublicPage>
  )
}
