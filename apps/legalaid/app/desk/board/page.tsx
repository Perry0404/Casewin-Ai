import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_SELECT, type CaseRow } from '@/lib/cases'
import { KINDS, STATES } from '@/lib/constants'
import { sweepOverdue } from '@/lib/sweep'
import CaseList from '@/components/CaseList'
import { Card, Empty, PageHeader, btn, input } from '@/components/ui'

export const metadata: Metadata = { title: 'Case board' }

export default async function Board({ searchParams }: { searchParams: { state?: string; kind?: string } }) {
  const m = await requireMember()
  await sweepOverdue()
  const mine = m.states_covered.length ? m.states_covered : [m.state]
  const allowed = m.isAdmin ? [...STATES] : mine
  const states = searchParams.state && allowed.includes(searchParams.state) ? [searchParams.state] : allowed
  let q = createAdminClient().from('la_cases').select(CASE_SELECT).eq('status', 'new').in('state', states).limit(300)
  if (searchParams.kind && KINDS[searchParams.kind]) q = q.eq('kind', searchParams.kind)
  const { data } = await q

  return (
    <>
      <PageHeader
        eyebrow="Case board"
        title="People waiting for a lawyer"
        sub="Real requests in the states you cover, ranked by the custody rules. Names show as initials until you take the case."
      />
      <form className="mb-5 flex flex-wrap gap-3">
        <select name="state" defaultValue={searchParams.state ?? ''} className={input + ' !w-auto'}>
          <option value="">{m.isAdmin ? 'All states' : 'All my states'}</option>
          {allowed.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select name="kind" defaultValue={searchParams.kind ?? ''} className={input + ' !w-auto'}>
          <option value="">All kinds</option>
          {Object.entries(KINDS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.short}
            </option>
          ))}
        </select>
        <button className={btn.secondary}>Filter</button>
      </form>
      <Card pad={false}>
        {(data ?? []).length ? (
          <CaseList cases={data as CaseRow[]} masked />
        ) : (
          <div className="p-6">
            <Empty title="Nobody is waiting in your states right now" icon="✓">
              New requests appear here the moment they arrive. Add more states to your profile, or record a visit to find people who need help.
            </Empty>
          </div>
        )}
      </Card>
    </>
  )
}
