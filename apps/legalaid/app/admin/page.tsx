import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { publicStats } from '@/lib/stats'
import { ORG_KINDS, ROLES } from '@/lib/constants'
import { dateTime } from '@/lib/format'
import { Badge, Card, CardTitle, Empty, Notice, PageHeader, Stat, btn, input } from '@/components/ui'
import { releaseOverdue, reviewMember, reviewOrg } from './actions'

export const metadata: Metadata = { title: 'Admin' }

export default async function Admin({ searchParams }: { searchParams: { error?: string; released?: string } }) {
  const db = createAdminClient()
  const [s, { data: members }, { data: orgs }, { count: overdue }, { count: unverified }] = await Promise.all([
    publicStats(),
    db.from('la_members').select('*, org:la_organisations(name)').eq('status', 'pending').order('created_at'),
    db.from('la_organisations').select('*').eq('status', 'pending').order('created_at'),
    db.from('la_cases').select('id', { count: 'exact', head: true }).eq('status', 'assigned').is('first_action_at', null).lt('first_action_due', new Date().toISOString()),
    db.from('la_cases').select('id', { count: 'exact', head: true }).is('verified_at', null).not('status', 'in', '(spam,closed)'),
  ])

  return (
    <>
      <PageHeader eyebrow="CaseWin Legal Aid" title="Admin" sub="Verify every volunteer and organisation before they see a file. Keep the 48-hour promise." />
      {searchParams.error === 'note' && <div className="mb-6"><Notice tone="bad">Give a reason when you reject or suspend — the applicant sees it.</Notice></div>}
      {searchParams.released && <div className="mb-6"><Notice tone="info">{searchParams.released} overdue case(s) returned to the board.</Notice></div>}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Requests" value={s.requests} />
        <Stat label="Waiting for volunteer" value={s.requests - s.assigned} tone={s.requests - s.assigned ? 'warn' : undefined} hint={<Link href="/desk/board" className="underline">open the board</Link>} />
        <Stat label="Not yet verified" value={unverified ?? 0} />
        <Stat label="Released / resolved" value={`${s.released} / ${s.resolved}`} tone="good" />
        <Stat label="Approved volunteers" value={s.volunteers} hint={`${s.organisations} organisations`} />
      </div>
      {(overdue ?? 0) > 0 && (
        <Card className="mb-6 ring-2 ring-seal-500/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-ink-800">
              <b>{overdue}</b> claimed case(s) have had no action for 48 hours.
            </p>
            <form action={releaseOverdue}>
              <button className={btn.danger}>Return them to the board</button>
            </form>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card pad={false}>
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle sub="Lawyers: check the name and SCN against the Supreme Court roll / NBA directory, and call the phone number. Students & paralegals: confirm with their faculty, clinic or supervisor.">
              Volunteers waiting ({(members ?? []).length})
            </CardTitle>
          </div>
          {(members ?? []).length ? (
            <ul className="divide-y divide-ink-100 border-t border-ink-100">
              {(members ?? []).map((p) => (
                <li key={p.user_id} className="space-y-3 px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-ink-900">{p.full_name}</p>
                    <Badge tone="info">{ROLES[p.role]?.split(' (')[0]}</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-ink-600">
                    {p.enrolment_number && <dd className="font-mono">{p.enrolment_number}</dd>}
                    {p.year_called && <dd>Called {p.year_called}</dd>}
                    {p.nba_branch && <dd>NBA {p.nba_branch}</dd>}
                    {p.institution && <dd>{p.institution}</dd>}
                    <dd>{p.email}</dd>
                    <dd className="font-mono">{p.phone}</dd>
                    <dd>
                      {p.state}
                      {p.states_covered?.length > 1 && ` +${p.states_covered.length - 1}`}
                    </dd>
                    {p.org && <dd>{(p.org as { name: string }).name}</dd>}
                    <dd className="text-ink-400">{dateTime(p.created_at)}</dd>
                  </dl>
                  <form action={reviewMember} className="flex flex-wrap gap-2">
                    <input type="hidden" name="user_id" value={p.user_id} />
                    <input name="note" placeholder="Reason (required to reject)" className={input + ' !w-auto flex-1 !py-2 !text-sm'} />
                    <button name="decision" value="approved" className={btn.primary + ' !py-2'}>
                      Verified — approve
                    </button>
                    <button name="decision" value="rejected" className={btn.ghost}>
                      Reject
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6">
              <Empty title="Nobody waiting" icon="✓" />
            </div>
          )}
        </Card>

        <Card pad={false}>
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle sub="Call the office number, check the CAC number or the Legal Aid Council office, and confirm the coordinator works there.">
              Organisations waiting ({(orgs ?? []).length})
            </CardTitle>
          </div>
          {(orgs ?? []).length ? (
            <ul className="divide-y divide-ink-100 border-t border-ink-100">
              {(orgs ?? []).map((o) => (
                <li key={o.id} className="space-y-3 px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-ink-900">{o.name}</p>
                    <Badge tone="info">{ORG_KINDS[o.kind]}</Badge>
                  </div>
                  <p className="text-[13px] text-ink-600">
                    {o.state} · {o.phone} · {o.email}
                    {o.cac_number && <> · CAC {o.cac_number}</>}
                    {o.website && <> · {o.website}</>}
                  </p>
                  {o.description && <p className="text-sm text-ink-500">{o.description}</p>}
                  <form action={reviewOrg} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <input name="note" placeholder="Reason (required to reject)" className={input + ' !w-auto flex-1 !py-2 !text-sm'} />
                    <button name="decision" value="approved" className={btn.primary + ' !py-2'}>
                      Verified — approve
                    </button>
                    <button name="decision" value="rejected" className={btn.ghost}>
                      Reject
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6">
              <Empty title="Nobody waiting" icon="✓" />
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
