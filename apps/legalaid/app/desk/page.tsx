import Link from 'next/link'
import { requireMember } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_SELECT, type CaseRow } from '@/lib/cases'
import CaseList from '@/components/CaseList'
import { Card, CardTitle, Empty, Notice, PageHeader, Stat, btn } from '@/components/ui'

export default async function Desk({ searchParams }: { searchParams: { released?: string; spam?: string } }) {
  const m = await requireMember()
  const db = createAdminClient()
  const states = m.states_covered.length ? m.states_covered : [m.state]
  let board = db.from('la_cases').select('id', { count: 'exact', head: true }).eq('status', 'new')
  if (!m.isAdmin) board = board.in('state', states)
  const [{ data: mine }, { count: open }, { count: done }] = await Promise.all([
    db.from('la_cases').select(CASE_SELECT).eq('assigned_to', m.user_id).in('status', ['assigned', 'in_progress']).limit(200),
    board,
    db.from('la_cases').select('id', { count: 'exact', head: true }).eq('assigned_to', m.user_id).eq('status', 'resolved'),
  ])
  const cases = (mine ?? []) as CaseRow[]
  const overdue = cases.filter((c) => c.first_action_due && !c.first_action_at && new Date(c.first_action_due) < new Date()).length

  return (
    <>
      <PageHeader
        eyebrow={m.isAdmin ? 'Administrator' : m.org?.name ?? 'Volunteer'}
        title={`Welcome, ${m.full_name.split(' ')[0]}`}
        sub="Your open cases, most urgent first. Taking a case means acting within 48 hours."
        actions={
          <Link href="/desk/board" className={btn.primary}>
            Find a case
          </Link>
        }
      />
      {searchParams.released && <div className="mb-6"><Notice tone="info">Case released back to the board.</Notice></div>}
      {searchParams.spam && <div className="mb-6"><Notice tone="info">Marked as not genuine and removed from the board.</Notice></div>}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Stat label="My open cases" value={cases.length} hint={`capacity ${m.capacity}`} />
        <Stat label="First action overdue" value={overdue} tone={overdue ? 'bad' : 'good'} hint={overdue ? 'Act now or release them' : 'All on time'} />
        <Stat label="Waiting on the board" value={open ?? 0} hint={m.isAdmin ? 'all states' : states.join(', ')} tone={(open ?? 0) ? 'warn' : undefined} />
        <Stat label="Resolved by you" value={done ?? 0} />
      </div>
      <Card pad={false}>
        <div className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardTitle>My cases</CardTitle>
        </div>
        {cases.length ? (
          <CaseList cases={cases} />
        ) : (
          <div className="p-6">
            <Empty title="No cases yet" icon="⚖">
              Take one from the <Link href="/desk/board" className="underline">case board</Link>, or <Link href="/desk/visit" className="underline">record a visit</Link> to a station or prison.
            </Empty>
          </div>
        )}
      </Card>
    </>
  )
}
