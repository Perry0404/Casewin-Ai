import Link from 'next/link'
import type { Metadata } from 'next'
import { requireStaff } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { causeList } from '@/lib/causelist'
import { DISPOSED_STATUSES, FILING_STATUS } from '@/lib/constants'
import { date, lagosToday, relative } from '@/lib/format'
import CauseListView from '@/components/CauseListView'
import { Badge, Card, CardTitle, Empty, Mono, Notice, PageHeader, Stat, TextLink, btn } from '@/components/ui'

export const metadata: Metadata = { title: 'Registry' }

const ACTION_LABELS: Record<string, string> = {
  'filing.submitted': 'New e-filing',
  'filing.queried': 'Filing queried',
  'filing.responded': 'Filer answered a query',
  'filing.assessed': 'Fees assessed',
  'filing.paid': 'Payment submitted',
  'filing.accepted': 'Case opened',
  'filing.rejected': 'Filing rejected',
  'case.assigned': 'Judge assigned',
  'case.reassigned': 'Judge reassigned',
  'hearing.listed': 'Hearing listed',
  'hearing.held': 'Hearing held',
  'hearing.adjourned': 'Hearing adjourned',
  'hearing.not_sitting': 'Court did not sit',
  'hearing.judgment_delivered': 'Judgment delivered',
  'judgment.uploaded': 'Judgment uploaded',
  'judgment.published': 'Judgment published to OpenLegal',
  'staff.created': 'Staff account created',
}

export default async function RegistryHome({ searchParams }: { searchParams: { welcome?: string; error?: string } }) {
  const staff = await requireStaff()
  const db = createAdminClient()
  const today = lagosToday()
  const judgeView = staff.role === 'judge' && staff.judge_id ? staff.judge_id : undefined

  const [queue, pending, unassigned, groups, events] = await Promise.all([
    db.from('filings').select('id, reference, title, status, urgent, created_at').eq('court_id', staff.court_id).in('status', ['submitted', 'under_review', 'paid']).order('urgent', { ascending: false }).order('created_at').limit(6),
    db.from('cases').select('id', { count: 'exact', head: true }).eq('court_id', staff.court_id).not('status', 'in', `(${DISPOSED_STATUSES.join(',')})`),
    db.from('cases').select('id', { count: 'exact', head: true }).eq('court_id', staff.court_id).eq('status', 'pending_assignment'),
    causeList(staff.court_id, today, { judgeId: judgeView }),
    db.from('case_events').select('id, action, actor_label, created_at, case_id, filing_id').eq('court_id', staff.court_id).order('created_at', { ascending: false }).limit(8),
  ])
  const listedToday = groups.reduce((n, g) => n + g.items.length, 0)
  const awaitingOutcome = groups.reduce((n, g) => n + g.items.filter((h) => !h.outcome).length, 0)
  const { count: queueCount } = await db.from('filings').select('id', { count: 'exact', head: true }).eq('court_id', staff.court_id).in('status', ['submitted', 'under_review', 'paid'])

  const hour = Number(new Date().toLocaleString('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', hour12: false }))
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <PageHeader
        eyebrow={date(today + 'T12:00:00+01:00', { weekday: 'long', day: 'numeric', month: 'long' })}
        title={`${greeting}, ${staff.full_name.split(' ')[0]}.`}
        sub={staff.court.name}
        actions={
          <>
            <Link href="/registry/cause-list" className={btn.secondary}>
              Today’s cause list
            </Link>
            <Link href="/registry/filings" className={btn.primary}>
              Open filing queue
            </Link>
          </>
        }
      />
      {searchParams.welcome && (
        <div className="mb-6">
          <Notice tone="good">Your password is set. Welcome to the registry.</Notice>
        </div>
      )}
      {searchParams.error === 'forbidden' && (
        <div className="mb-6">
          <Notice tone="warn">Your role doesn’t allow that action. Ask your court administrator if you need it.</Notice>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Filings awaiting the registry" value={queueCount ?? 0} hint={queueCount ? 'Review, assess or accept' : 'Queue is clear'} tone={queueCount ? 'warn' : 'good'} />
        <Stat label={judgeView ? 'Your matters today' : 'Matters listed today'} value={listedToday} hint={awaitingOutcome ? `${awaitingOutcome} still to record` : listedToday ? 'All outcomes recorded' : undefined} />
        <Stat label="Pending cases" value={(pending.count ?? 0).toLocaleString()} hint="On the court’s docket" />
        <Stat label="Awaiting a judge" value={unassigned.count ?? 0} hint={unassigned.count ? 'Assign from Cases' : 'All assigned'} tone={unassigned.count ? 'warn' : undefined} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold text-ink-900">{judgeView ? 'Your list today' : 'Today in court'}</h2>
            <TextLink href="/registry/cause-list">Full cause list</TextLink>
          </div>
          <CauseListView groups={groups} linkCases />
        </div>
        <div className="space-y-6">
          <Card>
            <CardTitle action={<TextLink href="/registry/filings">All</TextLink>}>Next in the queue</CardTitle>
            {queue.data?.length ? (
              <ul className="-mx-2 divide-y divide-ink-100">
                {queue.data.map((f) => (
                  <li key={f.id}>
                    <Link href={`/registry/filings/${f.id}`} className="flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-parchment">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink-900">{f.title}</span>
                        <span className="block text-xs text-ink-400">
                          <Mono className="text-[11px]">{f.reference}</Mono> · {relative(f.created_at)}
                        </span>
                      </span>
                      {f.urgent && <Badge tone="bad">Urgent</Badge>}
                      <Badge tone={FILING_STATUS[f.status].tone}>{FILING_STATUS[f.status].label}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="Nothing waiting" icon="✓" />
            )}
          </Card>
          <Card>
            <CardTitle>Recent activity</CardTitle>
            <ol className="space-y-3.5">
              {(events.data ?? []).map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass-400" />
                  <span className="min-w-0 flex-1">
                    <Link href={e.case_id ? `/registry/cases/${e.case_id}` : e.filing_id ? `/registry/filings/${e.filing_id}` : '#'} className="font-medium text-ink-800 hover:underline">
                      {ACTION_LABELS[e.action] ?? e.action}
                    </Link>
                    <span className="block text-xs text-ink-400">
                      {e.actor_label} · {relative(e.created_at)}
                    </span>
                  </span>
                </li>
              ))}
              {!events.data?.length && <p className="text-sm text-ink-400">No activity yet.</p>}
            </ol>
          </Card>
        </div>
      </div>
    </>
  )
}
