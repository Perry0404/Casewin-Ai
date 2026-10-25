import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { STATES } from '@/lib/constants'
import { date } from '@/lib/format'
import { INCIDENT_LABELS } from '@/components/NationalPicture'
import IncidentForm from '@/components/IncidentForm'
import { Badge, Card, CardTitle, Empty, Notice, PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Rights register' }

export default async function Incidents({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const m = await requireMember()
  const states = m.isAdmin ? [...STATES] : m.states_covered.length ? m.states_covered : [m.state]
  const { data } = await createAdminClient().from('la_incidents').select('*').in('state', states).order('created_at', { ascending: false }).limit(300)
  const rows = data ?? []
  // Patterns: the same facility named again and again is what advocacy needs.
  const byFacility = new Map<string, number>()
  for (const r of rows) if (r.facility) byFacility.set(`${r.facility}, ${r.state}`, (byFacility.get(`${r.facility}, ${r.state}`) ?? 0) + 1)
  const repeat = [...byFacility.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1])
  return (
    <>
      <PageHeader
        eyebrow="Rights register"
        title="Rights violations"
        sub="Extortion, torture, unlawful detention and other abuses, one record per incident. Facilities and descriptions stay inside CaseWin; the public sees only counts by type and state."
      />
      {searchParams.saved && <div className="mb-6"><Notice tone="good">Incident recorded.</Notice></div>}
      {searchParams.error && <div className="mb-6"><Notice tone="bad">Choose the type of incident and the state.</Notice></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardTitle sub="Not tied to a case — e.g. something you saw on a visit. To record one on a case, use the case file.">Record an incident</CardTitle>
          <IncidentForm defaultState={m.state} />
        </Card>
        <div className="space-y-6">
          {repeat.length > 0 && (
            <Card>
              <CardTitle sub="Facilities named in more than one incident.">Repeat locations</CardTitle>
              <ul className="divide-y divide-ink-200 text-[14px]">
                {repeat.slice(0, 12).map(([f, n]) => (
                  <li key={f} className="flex justify-between py-2">
                    <span className="text-ink-900">{f}</span>
                    <span className="font-semibold tabular-nums text-seal-600">{n}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card pad={false}>
            <div className="p-5 pb-0 sm:p-6 sm:pb-0">
              <CardTitle>Recorded in {m.isAdmin ? 'all states' : 'your states'}</CardTitle>
            </div>
            {rows.length ? (
              <ul className="divide-y divide-ink-200 border-t border-ink-200">
                {rows.map((r) => (
                  <li key={r.id} className="px-5 py-3 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink-950">{INCIDENT_LABELS[r.kind]}</span>
                      <Badge tone={r.verified ? 'good' : 'neutral'}>{r.verified ? 'Verified' : 'Reported'}</Badge>
                    </div>
                    <p className="text-[13px] text-ink-600">
                      {[r.facility, r.town, r.state].filter(Boolean).join(', ')} · {r.agency} · {r.occurred_on ? date(r.occurred_on) : date(r.created_at)}
                      {r.amount_demanded ? ` · ₦${r.amount_demanded.toLocaleString()} demanded` : ''}
                    </p>
                    {(m.isAdmin || r.recorded_by === m.user_id) && r.description && <p className="mt-1 text-[13px] text-ink-800">{r.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6">
                <Empty title="No incidents recorded yet" />
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
