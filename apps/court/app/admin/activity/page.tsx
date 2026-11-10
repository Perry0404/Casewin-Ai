import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { dateTime } from '@/lib/format'
import { Empty, PageHeader, cx } from '@/components/ui'

export const metadata: Metadata = { title: 'Activity log' }

// Everything that happens in every court's registry, newest first: filings, payments,
// cases, hearings, judgments, staff accounts. Read-only; the record cannot be edited.
const LABEL: Record<string, string> = {
  'filing.submitted': 'Filing submitted',
  'filing.opened': 'Filing opened by registry',
  'filing.queried': 'Filing queried',
  'filing.responded': 'Filer answered a query',
  'filing.assessed': 'Fees assessed',
  'filing.paid': 'Payment recorded',
  'filing.rejected': 'Filing rejected',
  'filing.accepted': 'Filing accepted, suit number issued',
  'case.assigned': 'Judge assigned',
  'case.reassigned': 'Judge reassigned',
  'hearing.listed': 'Hearing listed',
  'judgment.uploaded': 'Judgment uploaded',
  'judgment.published': 'Judgment published',
  'judgment.withdrawn': 'Judgment withdrawn',
  'staff.created': 'Staff account created',
  'staff.password_reset': 'Staff password reset',
  'staff.password_changed': 'Staff changed own password',
  'staff.deactivated': 'Staff account deactivated',
  'staff.reactivated': 'Staff account reactivated',
  'settings.fees_updated': 'Fee schedule changed',
  'settings.sample_removed': 'Sample data removed',
}
const label = (a: string) => LABEL[a] ?? (a.startsWith('hearing.') ? `Hearing: ${a.slice(8).replace(/_/g, ' ')}` : a)

const GROUPS: [string, string][] = [
  ['', 'Everything'],
  ['filing.', 'Filings'],
  ['case.', 'Cases'],
  ['hearing.', 'Hearings'],
  ['judgment.', 'Judgments'],
  ['staff.', 'Staff & access'],
  ['settings.', 'Settings'],
]

export default async function Activity({ searchParams }: { searchParams: { court?: string; kind?: string } }) {
  const db = createAdminClient()
  const kind = GROUPS.find(([k]) => k === searchParams.kind)?.[0] ?? ''
  let q = db
    .from('case_events')
    .select('id, action, actor_label, detail, created_at, court_id, case_id, filing_id, court:courts(name), actor:court_staff(full_name, role), case:cases(suit_number, title)')
    .order('created_at', { ascending: false })
    .limit(300)
  if (searchParams.court) q = q.eq('court_id', searchParams.court)
  if (kind) q = q.like('action', `${kind}%`)
  const [{ data: events }, { data: courts }] = await Promise.all([q, db.from('courts').select('id, name').order('name')])
  const link = (p: { court?: string; kind?: string }) => {
    const s = new URLSearchParams()
    const court = p.court ?? searchParams.court
    const k = p.kind ?? kind
    if (court) s.set('court', court)
    if (k) s.set('kind', k)
    return `/admin/activity${s.size ? `?${s}` : ''}`
  }

  return (
    <>
      <PageHeader
        eyebrow="CaseWin Court"
        title="Activity log"
        sub="Every action taken in every court’s registry, newest first, with who did it. This record cannot be edited or deleted from the app."
      />
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-ink-200 pb-4 text-[14px]">
        <nav className="flex flex-wrap gap-1">
          {GROUPS.map(([k, l]) => (
            <Link key={k} href={link({ kind: k })} className={cx('rounded px-2.5 py-1', kind === k ? 'bg-ink-950 text-white' : 'text-ink-600 hover:bg-ink-100')}>
              {l}
            </Link>
          ))}
        </nav>
        <nav className="flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
          <span className="text-ink-500">Court:</span>
          <Link href={`/admin/activity${kind ? `?kind=${kind}` : ''}`} className={cx(!searchParams.court ? 'font-semibold text-ink-950' : 'text-brass-600 hover:underline')}>
            All
          </Link>
          {(courts ?? []).map((c) => (
            <Link key={c.id} href={link({ court: c.id })} className={cx(searchParams.court === c.id ? 'font-semibold text-ink-950' : 'text-brass-600 hover:underline')}>
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
      {events?.length ? (
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-ink-950 text-[12px] text-ink-500">
            <tr>
              <th className="py-2 pr-4 font-medium">When</th>
              <th className="py-2 pr-4 font-medium">What happened</th>
              <th className="hidden py-2 pr-4 font-medium md:table-cell">Case</th>
              <th className="py-2 pr-4 font-medium">Who</th>
              <th className="hidden py-2 font-medium lg:table-cell">Court</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {events.map((e) => {
              const actor = e.actor as unknown as { full_name: string; role: string } | null
              const c = e.case as unknown as { suit_number: string | null; title: string } | null
              const court = e.court as unknown as { name: string } | null
              const d = (e.detail ?? {}) as Record<string, unknown>
              const extra = [d.email, d.role, d.judge, d.reason].filter((x) => typeof x === 'string').join(' · ')
              return (
                <tr key={e.id} className="align-top">
                  <td className="whitespace-nowrap py-2.5 pr-4 tabular-nums text-ink-500">{dateTime(e.created_at)}</td>
                  <td className="py-2.5 pr-4 text-ink-900">
                    {label(e.action)}
                    {extra && <span className="block text-[12px] text-ink-500">{extra}</span>}
                  </td>
                  <td className="hidden py-2.5 pr-4 md:table-cell">
                    {c ? (
                      <>
                        <span className="font-mono text-[12px] text-ink-500">{c.suit_number}</span>
                        <span className="block text-ink-700">{c.title}</span>
                      </>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-ink-700">{actor ? `${actor.full_name} (${actor.role.replace(/_/g, ' ')})` : e.actor_label ?? 'System'}</td>
                  <td className="hidden py-2.5 text-ink-500 lg:table-cell">{court?.name}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <Empty title="No activity recorded yet" />
      )}
      <p className="mt-6 text-[13px] text-ink-500">Showing the latest 300 entries. Legal Aid case histories are kept on each case file in the Legal Aid desk.</p>
    </>
  )
}
