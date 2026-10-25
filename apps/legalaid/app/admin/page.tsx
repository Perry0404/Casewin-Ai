import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { publicStats } from '@/lib/stats'
import { COURT_URL } from '@/lib/constants'
import { Card, CardTitle, Notice, PageHeader, Stat, btn } from '@/components/ui'
import { releaseOverdue } from './actions'

export const metadata: Metadata = { title: 'Admin' }

export default async function Admin({ searchParams }: { searchParams: { released?: string } }) {
  const db = createAdminClient()
  const [s, { count: overdue }, { count: unverified }, { count: pendingVolunteers }, { count: pendingOrgs }] = await Promise.all([
    publicStats(),
    db.from('la_cases').select('id', { count: 'exact', head: true }).eq('status', 'assigned').is('first_action_at', null).lt('first_action_due', new Date().toISOString()),
    db.from('la_cases').select('id', { count: 'exact', head: true }).is('verified_at', null).not('status', 'in', '(spam,closed)'),
    db.from('la_members').select('user_id', { count: 'exact', head: true }).eq('status', 'pending').neq('role', 'coordinator'),
    db.from('la_organisations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  const pending = (pendingVolunteers ?? 0) + (pendingOrgs ?? 0)

  return (
    <>
      <PageHeader
        eyebrow="CaseWin Legal Aid"
        title="Cases"
        sub="The live caseload. Volunteer and organisation verification happens in the Justice admin, alongside Court and OpenLegal."
        actions={
          <Link href="/admin/cases" className={btn.primary}>
            All cases
          </Link>
        }
      />
      {searchParams.released && <div className="mb-6"><Notice tone="info">{searchParams.released} overdue case(s) returned to the board.</Notice></div>}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Requests" value={s.requests} />
        <Stat label="Waiting for volunteer" value={s.requests - s.assigned} tone={s.requests - s.assigned ? 'warn' : undefined} hint={<Link href="/desk/board" className="underline">open the board</Link>} />
        <Stat label="Not yet verified" value={unverified ?? 0} />
        <Stat label="Released / resolved" value={`${s.released} / ${s.resolved}`} tone="good" />
        <Stat label="Approved volunteers" value={s.volunteers} hint={`${s.organisations} organisations`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle sub="Lawyers are checked against the roll; organisations by phone and registration.">Verification</CardTitle>
          <p className="text-ink-700">
            {pending ? (
              <>
                <b>{pending}</b> {pending === 1 ? 'application is' : 'applications are'} waiting.
              </>
            ) : (
              'Nobody is waiting.'
            )}
          </p>
          <a href={`${COURT_URL}/admin/legal-aid`} className={btn.primary + ' mt-5'}>
            Open in Justice admin ↗
          </a>
        </Card>
        <Card className={(overdue ?? 0) > 0 ? 'ring-2 ring-seal-500/30' : ''}>
          <CardTitle sub="Claims return to the board automatically when the board loads; this does it now.">48-hour promise</CardTitle>
          <p className="text-ink-700">
            <b>{overdue ?? 0}</b> claimed case(s) with no action for 48 hours.
          </p>
          {(overdue ?? 0) > 0 && (
            <form action={releaseOverdue} className="mt-5">
              <button className={btn.danger}>Return them to the board</button>
            </form>
          )}
        </Card>
      </div>
    </>
  )
}
