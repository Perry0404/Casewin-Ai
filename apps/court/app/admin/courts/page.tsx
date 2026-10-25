import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { computeAnalytics } from '@/lib/analytics'
import { relative } from '@/lib/format'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { Badge, Card, CardTitle, Empty, PageHeader, Stat, btn } from '@/components/ui'
import { setRequestStatus } from '../actions'

export const metadata: Metadata = { title: 'Courts' }

const REQUEST_TONE = { new: 'warn', contacted: 'info', onboarded: 'good', declined: 'neutral' } as const

export default async function AdminHome() {
  const db = createAdminClient()
  const since90 = new Date(Date.now() - 90 * 86400000).toISOString()
  const [{ data: courts }, { data: requests }, staff, filings, published, analytics] = await Promise.all([
    db.from('courts').select('id, name, state, status, created_at').order('created_at'),
    db.from('court_requests').select('*').order('created_at', { ascending: false }).limit(20),
    db.from('court_staff').select('court_id, is_active'),
    db.from('filings').select('court_id').gte('created_at', since90),
    db.from('judgments').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    computeAnalytics(db, null),
  ])

  const staffBy = new Map<string, number>()
  for (const s of staff.data ?? []) if (s.is_active) staffBy.set(s.court_id, (staffBy.get(s.court_id) ?? 0) + 1)
  const filingsBy = new Map<string, number>()
  for (const f of filings.data ?? []) filingsBy.set(f.court_id, (filingsBy.get(f.court_id) ?? 0) + 1)
  const newRequests = (requests ?? []).filter((r) => r.status === 'new').length

  return (
    <>
      <PageHeader
        eyebrow="CaseWin Court · platform"
        title="Courts on the network"
        actions={
          <Link href="/admin/courts/new" className={btn.primary}>
            Onboard a court
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Courts" value={courts?.length ?? 0} hint={`${(courts ?? []).filter((c) => c.status === 'active').length} live · ${(courts ?? []).filter((c) => c.status === 'pilot').length} in pilot`} />
        <Stat label="Court officers with logins" value={(staff.data ?? []).filter((s) => s.is_active).length} />
        <Stat label="E-filings · 90 days" value={(filings.data ?? []).length.toLocaleString()} />
        <Stat label="Judgments on OpenLegal" value={(published.count ?? 0).toLocaleString()} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card pad={false}>
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle>Courts</CardTitle>
          </div>
          {courts?.length ? (
            <table className="w-full text-left text-sm">
              <thead className="border-y border-ink-100 bg-parchment/60 text-[12px] font-medium text-ink-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Court</th>
                  <th className="px-6 py-3 font-medium">Officers</th>
                  <th className="hidden px-6 py-3 font-medium sm:table-cell">E-filings · 90d</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {courts.map((c) => (
                  <tr key={c.id} className="relative hover:bg-parchment/50">
                    <td className="px-6 py-3.5">
                      <Link href={`/admin/courts/${c.id}`} className="font-medium text-ink-900 after:absolute after:inset-0">
                        {c.name}
                      </Link>
                      <span className="block text-xs text-ink-400">{c.state} State</span>
                    </td>
                    <td className="px-6 py-3.5 tabular-nums text-ink-600">{staffBy.get(c.id) ?? 0}</td>
                    <td className="hidden px-6 py-3.5 tabular-nums text-ink-600 sm:table-cell">{filingsBy.get(c.id) ?? 0}</td>
                    <td className="px-6 py-3.5">
                      <Badge tone={c.status === 'active' ? 'good' : c.status === 'pilot' ? 'info' : 'bad'}>{c.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <Empty title="No courts yet" />
            </div>
          )}
        </Card>

        <Card>
          <CardTitle sub={newRequests ? `${newRequests} new` : 'From court.casewinai.com/onboard'}>Onboarding requests</CardTitle>
          {requests?.length ? (
            <ul className="divide-y divide-ink-100">
              {requests.map((r) => (
                <li key={r.id} className="py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink-900">{r.court_name}</p>
                      <p className="text-xs text-ink-400">
                        {r.contact_name}
                        {r.contact_role && `, ${r.contact_role}`} · {relative(r.created_at)}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        <a href={`mailto:${r.contact_email}`} className="underline">
                          {r.contact_email}
                        </a>
                        {r.contact_phone && ` · ${r.contact_phone}`}
                      </p>
                      {r.message && <p className="mt-1.5 text-sm text-ink-600">{r.message}</p>}
                    </div>
                    <Badge tone={REQUEST_TONE[r.status as keyof typeof REQUEST_TONE]}>{r.status}</Badge>
                  </div>
                  <form action={setRequestStatus} className="mt-2 flex gap-1">
                    <input type="hidden" name="id" value={r.id} />
                    {(['contacted', 'onboarded', 'declined'] as const)
                      .filter((s) => s !== r.status)
                      .map((s) => (
                        <button key={s} name="status" value={s} className="rounded-md px-2 py-1 text-xs text-ink-500 hover:bg-ink-50 hover:text-ink-900">
                          Mark {s}
                        </button>
                      ))}
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-400">No requests yet.</p>
          )}
        </Card>
      </div>

      <h2 className="mb-4 mt-12 font-display text-2xl font-semibold text-ink-900">Network analytics — all courts</h2>
      <AnalyticsDashboard a={analytics} />
    </>
  )
}
