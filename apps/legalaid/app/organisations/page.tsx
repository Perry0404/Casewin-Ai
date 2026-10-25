import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicPage } from '@/components/site'
import AccountPanel from '@/components/AccountPanel'
import { btn } from '@/components/ui'
import { getMember, getUser } from '@/lib/auth'
import OrgForm from './OrgForm'

export const metadata: Metadata = { title: 'Organisations' }
export const dynamic = 'force-dynamic'

const FOR = [
  ['Take cases as a team', 'Your coordinator sees every case your members hold, reassigns when someone is stuck, and nothing waits on one person.'],
  ['Prison & station visits', 'Record a whole visit — every awaiting-trial inmate you meet becomes a verified file with a custody clock, on the spot.'],
  ['Reports from real records', 'People seen, released, days in custody saved. Numbers donors and the Legal Aid Council can check, not estimates.'],
]

export default async function Organisations({ searchParams }: { searchParams: { sent?: string } }) {
  const user = await getUser()
  const member = user ? await getMember() : null
  return (
    <PublicPage wide>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-[13px] text-ink-500">Organisations</p>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-950 sm:text-[40px]">Run your legal aid caseload here.</h1>
          <p className="mt-4 text-lg text-ink-500">For Legal Aid Council offices, public defenders, NGOs, university law clinics, NBA pro bono committees and chambers.</p>
          <ul className="mt-10 space-y-6">
            {FOR.map(([t, d]) => (
              <li key={t} className="flex gap-4">
                <span className="mt-3 h-px w-3 shrink-0 bg-ink-950" />
                <div>
                  <p className="font-semibold text-ink-900">{t}</p>
                  <p className="mt-0.5 text-sm text-ink-500">{d}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-ink-500">
            After approval your members register at <Link href="/volunteer" className="underline">/volunteer</Link> and choose your organisation; you confirm them.
          </p>
        </div>
        <div>
          {!user ? (
            <AccountPanel />
          ) : member?.role === 'coordinator' ? (
            <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-lift">
              <h2 className="font-display text-3xl font-semibold text-ink-900">
                {member.status === 'approved' ? 'Your organisation is verified' : searchParams.sent ? 'Sent — thank you' : 'Waiting for verification'}
              </h2>
              <p className="mt-2 text-ink-500">
                {member.status === 'approved'
                  ? 'Open your desk to see your team’s cases.'
                  : 'We confirm the organisation by phone and with its registration before approving. Usually within 2 working days.'}
              </p>
              {member.status === 'approved' && (
                <Link href="/desk" className={btn.primary + ' mt-6'}>
                  Open the desk
                </Link>
              )}
            </div>
          ) : (
            <OrgForm email={user.email ?? ''} />
          )}
        </div>
      </div>
    </PublicPage>
  )
}
