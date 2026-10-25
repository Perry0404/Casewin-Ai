import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { canWork, logEvent, needsSupervisor, requireMember } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { date } from '@/lib/format'
import { assess } from '@/lib/triage'
import PrintButton from '@/components/PrintButton'
import { Notice, btn } from '@/components/ui'

export const metadata: Metadata = { title: 'Draft', robots: { index: false } }

// Square-bracketed text is for counsel to complete or confirm. Nothing here is filed automatically.
const B = ({ children }: { children: React.ReactNode }) => <mark className="rounded bg-brass-100 px-1 text-ink-900 print:bg-transparent">[{children}]</mark>

export default async function Draft({ params }: { params: { id: string; type: string } }) {
  const m = await requireMember()
  const { data: c } = await createAdminClient().from('la_cases').select('*').eq('id', params.id).maybeSingle()
  if (!c || !canWork(m, c) || !['bail', 'frep', 'letter'].includes(params.type)) notFound()
  const { data: holder } = c.assigned_to ? await createAdminClient().from('la_members').select('role').eq('user_id', c.assigned_to).maybeSingle() : { data: null }
  if (needsSupervisor(holder ?? { role: 'lawyer' }, c)) redirect(`/desk/cases/${c.id}?error=supervise`)
  // Drafts are signed by counsel: the volunteer if a lawyer, otherwise the supervising lawyer.
  const { data: sup } = m.role !== 'lawyer' && c.supervisor_id ? await createAdminClient().from('la_members').select('full_name, enrolment_number, phone').eq('user_id', c.supervisor_id).maybeSingle() : { data: null }
  const counsel = sup ?? { full_name: m.full_name, enrolment_number: m.enrolment_number, phone: m.phone }
  const a = assess(c)
  const he = c.person_sex === 'female' ? 'she' : c.person_sex === 'male' ? 'he' : 'they'
  const his = c.person_sex === 'female' ? 'her' : c.person_sex === 'male' ? 'his' : 'their'
  const arrested = c.arrested_on ? date(c.arrested_on, { day: 'numeric', month: 'long', year: 'numeric' }) : null
  const court = c.court_name ? c.court_name.toUpperCase() : null
  await logEvent({ case_id: c.id, actor: m.user_id, actor_label: m.full_name, kind: 'draft', body: `Generated draft: ${params.type}` })

  const facts = (
    <>
      <p>
        That {c.person_name}
        {c.person_age != null && <>, aged {c.person_age},</>} was arrested on or about {arrested ?? <B>date of arrest</B>} and has since been held at {c.facility ?? <B>place of detention</B>}, {c.state} State
        {c.allegation ? <> in connection with an allegation of {c.allegation}</> : <> on an allegation of <B>offence alleged</B></>}.
      </p>
      {a.daysHeld != null && <p>That as at the date of this application {he} has been in custody for {a.daysHeld} days.</p>}
      {c.remanded_on ? (
        <p>
          That {he} was remanded on {date(c.remanded_on, { day: 'numeric', month: 'long', year: 'numeric' })}
          {c.court_name && <> by the {c.court_name}</>}, a period of {a.remandDays} days, which exceeds the periods permitted for a remand order without good cause shown.
        </p>
      ) : (
        a.daysHeld != null && a.daysHeld >= 2 && <p>That to the best of the deponent’s knowledge {he} has not been brought before any court since {his} arrest.</p>
      )}
      {c.person_age != null && c.person_age < 18 && <p>That {he} is a child within the meaning of the Child Rights Act 2003.</p>}
      <p>
        That {he} is presumed innocent, has a fixed address at <B>address</B>, and is willing to abide by any conditions this Honourable Court may impose. <B>Further facts: family, health, employment, sureties</B>.
      </p>
    </>
  )

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/desk/cases/${c.id}`} className={btn.ghost}>
          ← Back to the file
        </Link>
        <PrintButton />
      </div>
      <div className="no-print mb-6">
        <Notice tone="warn">
          A starting draft from the file — not legal advice and not ready to file. Complete everything in [brackets], check every fact and authority, and adapt it to the court’s
          rules before you sign.
        </Notice>
      </div>
      <article className="space-y-4 rounded-2xl bg-white p-8 font-display text-[15.5px] leading-relaxed text-ink-900 shadow-card sm:p-12 print:p-0 print:shadow-none">
        {params.type === 'letter' ? (
          <>
            <p className="text-right">{date(new Date(), { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>
              The Divisional Police Officer / Officer in Charge
              <br />
              {c.facility ?? <B>police division</B>}
              <br />
              {c.state} State
            </p>
            <p className="font-semibold uppercase">
              Re: Detention of {c.person_name} — request for release on bail or arraignment
            </p>
            <p>We act for {c.person_name} on a pro bono basis through CaseWin Legal Aid (reference {c.ref}).</p>
            <p>
              Our client was arrested on or about {arrested ?? <B>date</B>} and remains in your custody{a.daysHeld != null && <>, {a.daysHeld} days later</>}. Section 35(4) and (5)
              of the Constitution of the Federal Republic of Nigeria 1999 (as amended) require that a person arrested be brought before a court within 24 hours where there is a
              court within 40 kilometres, and otherwise within 48 hours.
            </p>
            <p>
              We therefore request that our client be released on bail forthwith — police bail being free of charge — or be charged before a court of competent jurisdiction
              without further delay. We also request access to our client and copies of any statement recorded from {his.replace('their', 'them')}.
            </p>
            <p>Failing this within <B>24 / 48</B> hours, we are instructed to apply to the High Court for the enforcement of our client’s fundamental rights without further notice.</p>
            <p className="pt-6">
              Yours faithfully,
              <br />
              <br />
              {counsel.full_name}
              {counsel.enrolment_number && <>, {counsel.enrolment_number}</>}
              <br />
              {counsel.phone}
            </p>
          </>
        ) : (
          <>
            <p className="text-center font-semibold uppercase">
              In the {params.type === 'frep' ? <B>High Court of {c.state} State / Federal High Court</B> : court ?? <B>court</B>}
              <br />
              In the {params.type === 'frep' ? <B>judicial division</B> : <B>division / district</B>}
            </p>
            <p className="text-center">
              {params.type === 'frep' ? 'Suit No.' : 'Charge No.'} {c.charge_number ?? <B>number</B>}
            </p>
            {params.type === 'frep' ? (
              <p className="text-center">
                IN THE MATTER OF AN APPLICATION BY {c.person_name.toUpperCase()} FOR THE ENFORCEMENT OF {his.toUpperCase()} FUNDAMENTAL RIGHTS
                <br />
                <br />
                {c.person_name.toUpperCase()} — Applicant
                <br />
                AND
                <br />
                <B>Inspector-General of Police; Commissioner of Police, {c.state} State; Officer in Charge, {c.facility ?? 'facility'}</B> — Respondents
              </p>
            ) : (
              <p className="text-center">
                <B>Commissioner of Police / The State</B> — Complainant
                <br />
                AND
                <br />
                {c.person_name.toUpperCase()} — Defendant
              </p>
            )}
            <p className="text-center font-semibold uppercase">{params.type === 'frep' ? 'Motion on notice' : 'Motion on notice for bail'}</p>
            {params.type === 'frep' ? (
              <p>
                Brought pursuant to section 46(1) of the Constitution of the Federal Republic of Nigeria 1999 (as amended), Order II of the Fundamental Rights (Enforcement
                Procedure) Rules 2009, and the inherent jurisdiction of this Honourable Court.
              </p>
            ) : (
              <p>
                Brought pursuant to sections 35 and 36(5) of the Constitution of the Federal Republic of Nigeria 1999 (as amended), <B>the bail provisions of the Administration of Criminal Justice Act 2015 / State ACJL</B>, and the inherent jurisdiction of this Honourable Court.
              </p>
            )}
            <p>TAKE NOTICE that this Honourable Court will be moved on the ___ day of __________ 20__ at 9 o’clock in the forenoon or so soon thereafter as counsel may be heard, for:</p>
            <ol className="list-decimal space-y-2 pl-6">
              {params.type === 'frep' ? (
                <>
                  <li>A DECLARATION that the arrest and continued detention of the Applicant since {arrested ?? <B>date</B>} without being brought before a court of competent jurisdiction violates {his} rights under sections 35 and 36 of the Constitution.</li>
                  <li>AN ORDER directing the Respondents to release the Applicant forthwith, or to produce {his.replace('their', 'them')} before a court of competent jurisdiction.</li>
                  <li><B>Damages / apology, if instructed</B>.</li>
                  <li>Such further or other orders as this Honourable Court may deem fit to make in the circumstances.</li>
                </>
              ) : (
                <>
                  <li>AN ORDER admitting the Defendant/Applicant to bail pending the hearing and determination of the charge against {his.replace('their', 'them')}, on such terms as this Honourable Court may deem fit.</li>
                  <li>Such further or other orders as this Honourable Court may deem fit to make in the circumstances.</li>
                </>
              )}
            </ol>
            <p className="pt-4 font-semibold uppercase">Affidavit in support — facts</p>
            <div className="space-y-3">{facts}</div>
            <p className="pt-8">
              Dated this ___ day of __________ 20__
              <br />
              <br />
              {counsel.full_name}
              {counsel.enrolment_number && <> ({counsel.enrolment_number})</>}
              <br />
              Counsel to the {params.type === 'frep' ? 'Applicant' : 'Defendant/Applicant'}, acting pro bono
              <br />
              {counsel.phone}
            </p>
          </>
        )}
      </article>
    </div>
  )
}
