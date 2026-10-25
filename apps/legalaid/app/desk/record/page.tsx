import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { ACTIONS, KINDS, OUTCOMES } from '@/lib/constants'
import { date } from '@/lib/format'
import PrintButton from '@/components/PrintButton'
import { Card, CardTitle, Empty, Mono, PageHeader, Stat } from '@/components/ui'

export const metadata: Metadata = { title: 'My pro bono record' }

export default async function Record() {
  const m = await requireMember()
  const db = createAdminClient()
  const [{ data: cases }, { data: events }] = await Promise.all([
    db.from('la_cases').select('id, ref, kind, state, outcome, outcome_on, assigned_at').eq('assigned_to', m.user_id).order('assigned_at', { ascending: false }),
    db.from('la_case_events').select('kind').eq('actor', m.user_id),
  ])
  const actions = (events ?? []).filter((e) => ACTIONS[e.kind] && e.kind !== 'note').length
  const releases = (cases ?? []).filter((c) => c.outcome && OUTCOMES[c.outcome]?.release).length
  return (
    <>
      <PageHeader
        eyebrow="Pro bono record"
        title={m.full_name}
        sub={`Generated from the CaseWin Legal Aid case record on ${date(new Date())}. Each line can be verified by its reference.`}
        actions={<PrintButton />}
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Cases taken" value={(cases ?? []).length} />
        <Stat label="Recorded actions" value={actions} />
        <Stat label="People released" value={releases} tone="good" />
      </div>
      <Card pad={false}>
        <div className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardTitle>Cases</CardTitle>
        </div>
        {(cases ?? []).length ? (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-ink-100 border-t border-ink-100">
              {(cases ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-3">
                    <Mono>{c.ref}</Mono>
                  </td>
                  <td className="px-3 py-3 text-ink-600">{KINDS[c.kind]?.short}</td>
                  <td className="px-3 py-3 text-ink-600">{c.state}</td>
                  <td className="px-3 py-3 text-ink-600">taken {date(c.assigned_at)}</td>
                  <td className="px-6 py-3 text-right text-ink-900">{c.outcome ? `${OUTCOMES[c.outcome]?.label} · ${date(c.outcome_on)}` : 'Ongoing'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6">
            <Empty title="Your record starts with your first case" />
          </div>
        )}
      </Card>
    </>
  )
}
