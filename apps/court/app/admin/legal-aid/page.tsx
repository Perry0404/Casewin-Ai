import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { LEGALAID_URL } from '@/lib/constants'
import { dateTime } from '@/lib/format'
import { Badge, Card, CardTitle, Empty, Notice, PageHeader, btn, input } from '@/components/ui'
import { reviewLegalAidOrg, reviewVolunteer } from '../actions'

export const metadata: Metadata = { title: 'Legal Aid — verification' }

const ROLE: Record<string, string> = { lawyer: 'Lawyer', paralegal: 'Paralegal', law_student: 'Law student', coordinator: 'Coordinator' }
const ORG_KIND: Record<string, string> = {
  legal_aid_council: 'Legal Aid Council office',
  pdss: 'Public Defender',
  ngo: 'NGO',
  law_clinic: 'Law clinic',
  nba_branch: 'NBA branch',
  chambers: 'Chambers (pro bono)',
  faith_community: 'Faith / community',
  other: 'Other',
}

export default async function LegalAidAdmin({ searchParams }: { searchParams: { error?: string } }) {
  const db = createAdminClient()
  const [{ data: members }, { data: orgs }, { data: active }] = await Promise.all([
    db.from('la_members').select('*, org:la_organisations(name)').eq('status', 'pending').neq('role', 'coordinator').order('created_at'),
    db.from('la_organisations').select('*').eq('status', 'pending').order('created_at'),
    db.from('la_members').select('user_id, full_name, role, state, status, enrolment_number, approved_at').in('status', ['approved', 'suspended']).order('approved_at', { ascending: false }).limit(200),
  ])

  return (
    <>
      <PageHeader
        eyebrow="CaseWin Legal Aid"
        title="Verify volunteers & organisations"
        sub="Nobody sees a case file until they are approved here. Day-to-day case handling is on the Legal Aid desk."
        actions={
          <a href={`${LEGALAID_URL}/admin`} className={btn.secondary}>
            Legal Aid cases ↗
          </a>
        }
      />
      {searchParams.error === 'note' && (
        <div className="mb-6">
          <Notice tone="bad">Give a reason when you reject or suspend — the applicant sees it.</Notice>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card pad={false}>
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle sub="Lawyers: check the name and SCN against the Supreme Court roll / NBA directory and call the number. Students & paralegals: confirm with their faculty, clinic or supervisor.">
              Volunteers waiting ({(members ?? []).length})
            </CardTitle>
          </div>
          {(members ?? []).length ? (
            <ul className="divide-y divide-ink-100 border-t border-ink-100">
              {(members ?? []).map((p) => (
                <li key={p.user_id} className="space-y-3 px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-ink-900">{p.full_name}</p>
                    <Badge tone="info">{ROLE[p.role]}</Badge>
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
                      {p.states_covered?.length > 1 && ` +${p.states_covered.length - 1} states`}
                    </dd>
                    {p.org && <dd>{(p.org as { name: string }).name}</dd>}
                    <dd className="text-ink-400">applied {dateTime(p.created_at)}</dd>
                  </dl>
                  <form action={reviewVolunteer} className="flex flex-wrap gap-2">
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
              <Empty title="No volunteers waiting" icon="✓" />
            </div>
          )}
        </Card>

        <Card pad={false}>
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle sub="Call the office, check the CAC number or Legal Aid Council office, and confirm the coordinator works there. Approving also approves the coordinator.">
              Organisations waiting ({(orgs ?? []).length})
            </CardTitle>
          </div>
          {(orgs ?? []).length ? (
            <ul className="divide-y divide-ink-100 border-t border-ink-100">
              {(orgs ?? []).map((o) => (
                <li key={o.id} className="space-y-3 px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-ink-900">{o.name}</p>
                    <Badge tone="info">{ORG_KIND[o.kind] ?? o.kind}</Badge>
                  </div>
                  <p className="text-[13px] text-ink-600">
                    {o.state} · {o.phone} · {o.email}
                    {o.cac_number && <> · CAC {o.cac_number}</>}
                    {o.website && <> · {o.website}</>}
                  </p>
                  {o.description && <p className="text-sm text-ink-500">{o.description}</p>}
                  <form action={reviewLegalAidOrg} className="flex flex-wrap gap-2">
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
              <Empty title="No organisations waiting" icon="✓" />
            </div>
          )}
        </Card>
      </div>

      <Card pad={false} className="mt-6">
        <div className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardTitle sub="Suspend anyone who breaks the pledge — they lose access to every file at once.">Verified volunteers ({(active ?? []).length})</CardTitle>
        </div>
        {(active ?? []).length ? (
          <ul className="divide-y divide-ink-100 border-t border-ink-100">
            {(active ?? []).map((p) => (
              <li key={p.user_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6">
                <span className="text-sm">
                  <span className="font-medium text-ink-900">{p.full_name}</span>
                  <span className="text-ink-400">
                    {' '}
                    · {ROLE[p.role]} · {p.state}
                    {p.enrolment_number && ` · ${p.enrolment_number}`}
                  </span>
                </span>
                {p.status === 'suspended' ? (
                  <form action={reviewVolunteer} className="flex gap-2">
                    <input type="hidden" name="user_id" value={p.user_id} />
                    <Badge tone="bad">suspended</Badge>
                    <button name="decision" value="approved" className={btn.ghost}>
                      Reinstate
                    </button>
                  </form>
                ) : (
                  <form action={reviewVolunteer} className="flex gap-2">
                    <input type="hidden" name="user_id" value={p.user_id} />
                    <input name="note" placeholder="Reason" className={input + ' !w-48 !py-1.5 !text-sm'} />
                    <button name="decision" value="suspended" className={btn.ghost}>
                      Suspend
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6">
            <Empty title="No verified volunteers yet" />
          </div>
        )}
      </Card>
    </>
  )
}
