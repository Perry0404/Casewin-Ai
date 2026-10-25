import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { clearingHouse } from '@/lib/clearing'
import { ProviderTable, StateFilter } from '@/components/ClearingHouse'
import { PageHeader, Stat } from '@/components/ui'

export const metadata: Metadata = { title: 'Clearing house' }

export default async function DeskClearingHouse({ searchParams }: { searchParams: { state?: string } }) {
  const m = await requireMember()
  // Coordinators and administrators see every volunteer by name, including those with no cases yet.
  const full = m.isAdmin || m.role === 'coordinator'
  const { providers, waiting, totals } = await clearingHouse({ publicView: !full })
  const waitingTotal = waiting.reduce((n, [, v]) => n + v, 0)
  return (
    <>
      <PageHeader
        eyebrow="Clearing house"
        title="Who is handling what, where"
        sub={full ? 'Every organisation and volunteer, with the cases they took and the outcomes, by state and town. Use a case’s suggestions to assign or refer.' : 'Every organisation and listed volunteer, with the cases they took and the outcomes.'}
        actions={<StateFilter state={searchParams.state} action="/desk/clearing-house" />}
      />
      <div className="mb-10 grid grid-cols-2 gap-6 sm:grid-cols-5">
        <Stat label="Cases taken" value={totals.taken} />
        <Stat label="Being worked on" value={totals.active} />
        <Stat label="With an outcome" value={totals.resolved} />
        <Stat label="People released" value={totals.released} tone="good" />
        <Stat label="Waiting for a provider" value={waitingTotal} tone={waitingTotal ? 'warn' : undefined} hint={waiting.slice(0, 3).map(([s, n]) => `${s} ${n}`).join(' · ') || undefined} />
      </div>
      <ProviderTable providers={providers} state={searchParams.state} />
    </>
  )
}
