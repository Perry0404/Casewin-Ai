import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { ROLE_LABELS, type StaffRole } from '@/lib/auth'
import { dateTime, relative } from '@/lib/format'
import { Badge, Card, CardTitle, Empty, Notice, PageHeader, btn, cx, input } from '@/components/ui'
import { approveRegistration, rejectRegistration, setFilerActive } from '../actions'

export const metadata: Metadata = { title: 'Registrations' }

const TABS = [
  ['pending', 'Waiting for you'],
  ['filers', 'Approved filers'],
  ['history', 'History'],
] as const

const FILER_TYPE: Record<string, string> = { lawyer: 'Counsel', litigant: 'Party in person', agency: 'Government agency' }

export default async function Registrations({ searchParams }: { searchParams: { tab?: string; done?: string; error?: string } }) {
  const tab = TABS.find((t) => t[0] === searchParams.tab)?.[0] ?? 'pending'
  const db = createAdminClient()
  const [{ count: pendingCount }, { data: pending }, { data: history }, { data: filers }] = await Promise.all([
    db.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    tab === 'pending' ? db.from('registrations').select('*, court:courts(name)').eq('status', 'pending').order('created_at') : Promise.resolve({ data: [] as never[] }),
    tab === 'history' ? db.from('registrations').select('*, court:courts(name)').neq('status', 'pending').order('reviewed_at', { ascending: false }).limit(100) : Promise.resolve({ data: [] as never[] }),
    tab === 'filers' ? db.from('filer_accounts').select('*').order('approved_at', { ascending: false }).limit(200) : Promise.resolve({ data: [] as never[] }),
  ])
  const courtIds = Array.from(new Set((pending ?? []).map((r: { court_id: string | null }) => r.court_id).filter(Boolean))) as string[]
  const { data: judges } = courtIds.length ? await db.from('judges').select('id, name, court_id').in('court_id', courtIds).eq('is_active', true).order('name') : { data: [] }

  return (
    <>
      <PageHeader
        eyebrow="Platform admin"
        title="Registrations"
        sub="Everyone who registers on CaseWin Court waits here until you approve them. Filers get the e-filing portal; court staff get their court's registry."
      />
      {searchParams.done && (
        <div className="mb-6">
          <Notice tone="good">Registration {searchParams.done}. {searchParams.done === 'approved' ? 'They can sign in now.' : ''}</Notice>
        </div>
      )}
      {searchParams.error && (
        <div className="mb-6">
          <Notice tone="bad">{searchParams.error}</Notice>
        </div>
      )}
      <nav className="mb-6 inline-flex gap-1 rounded-xl bg-white p-1 shadow-card">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/admin/registrations?tab=${k}`} className={cx('rounded-lg px-3.5 py-2 text-sm font-medium transition', tab === k ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-50')}>
            {l}
            {k === 'pending' && pendingCount ? <span className="ml-2 rounded-full bg-brass-400 px-1.5 text-[11px] font-bold text-ink-950">{pendingCount}</span> : null}
          </Link>
        ))}
      </nav>

      {tab === 'pending' &&
        ((pending ?? []).length ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {(pending ?? []).map((r: Record<string, any>) => (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-semibold text-ink-900">{r.full_name}</p>
                    <p className="text-sm text-ink-400">
                      {r.email}
                      {r.phone && ` · ${r.phone}`} · applied {relative(r.created_at)}
                    </p>
                  </div>
                  <Badge tone={r.kind === 'filer' ? 'info' : 'warn'}>{r.kind === 'filer' ? `E-filer · ${FILER_TYPE[r.filer_type] ?? ''}` : 'Court staff'}</Badge>
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-2 rounded-xl bg-parchment p-4 text-sm sm:grid-cols-[140px_1fr]">
                  {r.kind === 'filer' ? (
                    <>
                      {r.bar_number && (
                        <>
                          <dt className="text-ink-400">SCN</dt>
                          <dd className="font-mono text-ink-800">
                            {r.bar_number}
                            {r.year_of_call && <span className="font-sans text-ink-400"> · called {r.year_of_call}</span>}
                          </dd>
                        </>
                      )}
                      <dt className="text-ink-400">{r.filer_type === 'agency' ? 'Agency' : 'Firm / chambers'}</dt>
                      <dd className="text-ink-800">{r.law_firm ?? '—'}</dd>
                      <dt className="text-ink-400">Address</dt>
                      <dd className="text-ink-800">{r.address ?? '—'}</dd>
                    </>
                  ) : (
                    <>
                      <dt className="text-ink-400">Court</dt>
                      <dd className="text-ink-800">{r.court?.name}</dd>
                      <dt className="text-ink-400">Asked for</dt>
                      <dd className="text-ink-800">
                        {ROLE_LABELS[r.requested_role as StaffRole]}
                        {r.position && ` · ${r.position}`}
                      </dd>
                      <dt className="text-ink-400">Staff ID</dt>
                      <dd className="text-ink-800">{r.staff_number ?? '—'}</dd>
                      <dt className="text-ink-400">Can be confirmed by</dt>
                      <dd className="text-ink-800">{r.supervisor ?? '—'}</dd>
                    </>
                  )}
                  {r.note && (
                    <>
                      <dt className="text-ink-400">Note</dt>
                      <dd className="text-ink-700">{r.note}</dd>
                    </>
                  )}
                </dl>

                <p className="mt-3 text-xs text-ink-400">
                  {r.kind === 'filer'
                    ? r.filer_type === 'lawyer'
                      ? 'Before approving: check the SCN and name against the NBA / Supreme Court roll of legal practitioners.'
                      : 'Before approving: confirm the person’s identity and that they are a party to (or acting for) the matter.'
                    : 'Before approving: confirm with the court’s Chief Registrar or court administrator that this person works there in this role.'}
                </p>

                <form action={approveRegistration} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={r.id} />
                  {r.kind === 'court_staff' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select name="role" defaultValue={r.requested_role} className={input + ' text-sm'} aria-label="Role to grant">
                        {(['clerk', 'registrar', 'judge', 'court_admin'] as StaffRole[]).map((x) => (
                          <option key={x} value={x}>
                            Grant: {ROLE_LABELS[x]}
                          </option>
                        ))}
                      </select>
                      <select name="judge_id" defaultValue="" className={input + ' text-sm'} aria-label="Link to judge">
                        <option value="">If judge — link to bench…</option>
                        {(judges ?? [])
                          .filter((j: { court_id: string }) => j.court_id === r.court_id)
                          .map((j: { id: string; name: string }) => (
                            <option key={j.id} value={j.id}>
                              {j.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  <button className={btn.primary + ' w-full'}>Approve</button>
                </form>
                <form action={rejectRegistration} className="mt-2 flex gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input name="note" placeholder="Reason, if declining" className={input + ' text-sm'} />
                  <button className={btn.danger}>Decline</button>
                </form>
              </Card>
            ))}
          </div>
        ) : (
          <Empty title="No one is waiting" icon="✓">
            New applications from court.casewinai.com/register appear here.
          </Empty>
        ))}

      {tab === 'filers' && (
        <Card pad={false}>
          {(filers ?? []).length ? (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-parchment/60 text-[12px] font-medium text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Filer</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Type</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Approved</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {(filers ?? []).map((f: Record<string, any>) => (
                  <tr key={f.user_id} className={f.is_active ? '' : 'opacity-50'}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-900">{f.full_name}</p>
                      <p className="text-xs text-ink-400">
                        {f.email}
                        {f.bar_number && ` · ${f.bar_number}`}
                      </p>
                    </td>
                    <td className="hidden px-5 py-3 text-ink-600 md:table-cell">{FILER_TYPE[f.filer_type]}</td>
                    <td className="hidden px-5 py-3 text-ink-500 md:table-cell">{dateTime(f.approved_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <form action={setFilerActive}>
                        <input type="hidden" name="user_id" value={f.user_id} />
                        <input type="hidden" name="active" value={String(!f.is_active)} />
                        <button className={btn.ghost}>{f.is_active ? 'Suspend' : 'Reactivate'}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <Empty title="No approved filers yet" />
            </div>
          )}
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <CardTitle>Decisions</CardTitle>
          <ul className="divide-y divide-ink-100 text-sm">
            {(history ?? []).map((r: Record<string, any>) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="font-medium text-ink-900">{r.full_name}</span>
                  <span className="text-ink-400"> · {r.kind === 'filer' ? 'e-filer' : `staff, ${r.court?.name ?? ''}`}</span>
                  {r.reviewer_note && <span className="block text-xs text-ink-500">{r.reviewer_note}</span>}
                </span>
                <span className="text-right">
                  <Badge tone={r.status === 'approved' ? 'good' : 'neutral'}>{r.status}</Badge>
                  <span className="block text-xs text-ink-400">{relative(r.reviewed_at)}</span>
                </span>
              </li>
            ))}
            {!(history ?? []).length && <p className="py-3 text-ink-400">No decisions yet.</p>}
          </ul>
        </Card>
      )}
    </>
  )
}
