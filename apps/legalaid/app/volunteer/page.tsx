import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicPage } from '@/components/site'
import AccountPanel from '@/components/AccountPanel'
import { Notice, btn } from '@/components/ui'
import { getMember, getUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import VolunteerForm from './VolunteerForm'

export const metadata: Metadata = { title: 'Volunteer' }
export const dynamic = 'force-dynamic'

const WHAT = [
  ['Pick cases near you', 'A board of real requests in the states you cover, most urgent first: children, people held with no court order, expired remand.'],
  ['Act within 48 hours', 'Taking a case is a promise. Call the family or visit within 48 hours — or release it so the next volunteer can.'],
  ['Drafts from the file', 'Bail and fundamental-rights applications are pre-filled from the record, ready for your review and signature.'],
  ['A verified pro bono record', 'Every action and outcome is logged. Export it for NBA pro bono hours, scholarships or your CV.'],
]

export default async function VolunteerPage({ searchParams }: { searchParams: { sent?: string } }) {
  const user = await getUser()
  const member = user ? await getMember() : null
  const { data: orgs } = await createAdminClient().from('la_organisations').select('id, name').eq('status', 'approved').order('name')

  return (
    <PublicPage wide>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-[13px] text-ink-500">Volunteer</p>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-950 sm:text-[40px]">One case can get someone home.</h1>
          <p className="mt-4 text-lg text-ink-500">Lawyers, paralegals and law students. We verify every volunteer before they see a single file.</p>
          <ul className="mt-10 space-y-6">
            {WHAT.map(([t, d]) => (
              <li key={t} className="flex gap-4">
                <span className="mt-3 h-px w-3 shrink-0 bg-ink-950" />
                <div>
                  <p className="font-semibold text-ink-900">{t}</p>
                  <p className="mt-0.5 text-sm text-ink-500">{d}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-2xl border border-ink-100 bg-white p-5 text-sm text-ink-500">
            <p className="font-semibold text-ink-900">How we verify</p>
            <p className="mt-1">
              Lawyers: we check your name and enrolment number against the Roll of Legal Practitioners and may call your NBA branch. Students and paralegals:
              we confirm with your faculty, clinic or supervising chambers. Usually within 2 working days.
            </p>
          </div>
        </div>
        <div>
          {!user ? (
            <AccountPanel />
          ) : member && member.status === 'approved' ? (
            <Status title="You’re verified" body="Your desk has the case board and your files.">
              <Link href="/desk" className={btn.primary}>
                Open my desk
              </Link>
            </Status>
          ) : member && member.status === 'pending' ? (
            <Status title={searchParams.sent ? 'Sent — thank you' : 'Waiting for verification'} body="We are checking your details. You will be able to take cases as soon as you’re approved — sign in again then." />
          ) : member && member.status === 'suspended' ? (
            <Status title="Account suspended" body={member.reviewer_note ?? 'Contact the CaseWin Legal Aid team.'} />
          ) : (
            <>
              {member?.status === 'rejected' && (
                <div className="mb-4">
                  <Notice tone="bad">Not approved: {member.reviewer_note}. Correct the details and send again.</Notice>
                </div>
              )}
              <VolunteerForm email={user.email ?? ''} orgs={orgs ?? []} />
            </>
          )}
        </div>
      </div>
    </PublicPage>
  )
}

function Status({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-lift">
      <h2 className="font-display text-3xl font-semibold text-ink-900">{title}</h2>
      <p className="mt-2 text-ink-500">{body}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
