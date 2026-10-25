import Link from 'next/link'
import type { Metadata } from 'next'
import { requireStaff } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_STATUS, CASE_TYPES, DISPOSED_STATUSES, label } from '@/lib/constants'
import { date } from '@/lib/format'
import { Badge, Empty, Mono, PageHeader, SampleTag, cx, input } from '@/components/ui'

export const metadata: Metadata = { title: 'Cases' }

const VIEWS = [
  ['pending', 'On the docket'],
  ['unassigned', 'Awaiting judge'],
  ['reserved', 'Judgment reserved'],
  ['disposed', 'Disposed'],
  ['all', 'All'],
] as const

type Search = { view?: string; q?: string; type?: string; judge?: string; page?: string }

export default async function CasesPage({ searchParams }: { searchParams: Search }) {
  const staff = await requireStaff()
  const db = createAdminClient()
  const view = VIEWS.find((v) => v[0] === searchParams.view)?.[0] ?? 'pending'
  const page = Math.max(1, Number(searchParams.page) || 1)
  const per = 50
  const { data: judges } = await db.from('judges').select('id, name').eq('court_id', staff.court_id).order('name')

  let q = db
    .from('cases')
    .select('id, suit_number, title, case_type, status, urgent, filed_at, next_hearing_at, adjournment_count, is_sample, judge:judges(name)', { count: 'exact' })
    .eq('court_id', staff.court_id)
  const disposedList = `(${DISPOSED_STATUSES.join(',')})`
  if (view === 'pending') q = q.not('status', 'in', disposedList)
  if (view === 'unassigned') q = q.eq('status', 'pending_assignment')
  if (view === 'reserved') q = q.eq('status', 'reserved')
  if (view === 'disposed') q = q.in('status', DISPOSED_STATUSES)
  if (staff.role === 'judge' && staff.judge_id) q = q.eq('judge_id', staff.judge_id)
  else if (searchParams.judge) q = q.eq('judge_id', searchParams.judge)
  if (searchParams.type) q = q.eq('case_type', searchParams.type)
  if (searchParams.q) {
    const term = searchParams.q.replace(/[%,()]/g, '')
    q = q.or(`title.ilike.%${term}%,suit_number.ilike.%${term}%`)
  }
  const { data: cases, count } = await q
    .order(view === 'disposed' ? 'disposed_at' : 'filed_at', { ascending: view !== 'disposed' })
    .range((page - 1) * per, page * per - 1)

  const qs = (patch: Partial<Search>) => {
    const merged = { ...searchParams, ...patch } as Record<string, string | undefined>
    const p = new URLSearchParams(Object.entries(merged).filter((e): e is [string, string] => Boolean(e[1])))
    return `/registry/cases?${p}`
  }

  return (
    <>
      <PageHeader
        eyebrow="Registry"
        title={staff.role === 'judge' ? 'Your docket' : 'Cases'}
        sub={`${(count ?? 0).toLocaleString()} ${view === 'pending' ? 'pending ' : ''}cases${view === 'disposed' ? ', most recent first' : ', oldest first'}.`}
      />
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <nav className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-card">
          {VIEWS.map(([key, name]) => (
            <Link
              key={key}
              href={qs({ view: key, page: undefined })}
              className={cx('whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition', view === key ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900')}
            >
              {name}
            </Link>
          ))}
        </nav>
        <form className="flex flex-wrap gap-2">
          <input type="hidden" name="view" value={view} />
          <input name="q" defaultValue={searchParams.q} placeholder="Suit number or parties" className={input + ' !w-56 !py-2 text-sm'} />
          <select name="type" defaultValue={searchParams.type ?? ''} className={input + ' !w-auto !py-2 text-sm'}>
            <option value="">All types</option>
            {CASE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {staff.role !== 'judge' && (
            <select name="judge" defaultValue={searchParams.judge ?? ''} className={input + ' !w-auto !py-2 text-sm'}>
              <option value="">All judges</option>
              {(judges ?? []).map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          )}
          <button className="rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white">Filter</button>
        </form>
      </div>

      {cases?.length ? (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-parchment/60 text-[12px] font-medium text-ink-500">
              <tr>
                <th className="px-5 py-3 font-medium">Suit</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Judge</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Filed</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Next date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {cases.map((c) => (
                <tr key={c.id} className="relative transition hover:bg-parchment/50">
                  <td className="px-5 py-3.5">
                    <Mono className="text-ink-500">{c.suit_number}</Mono>
                    <Link href={`/registry/cases/${c.id}`} className="block font-medium text-ink-900 after:absolute after:inset-0">
                      {c.title}
                    </Link>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
                      {label(CASE_TYPES, c.case_type)}
                      {c.adjournment_count > 0 && ` · ${c.adjournment_count} adjournment${c.adjournment_count === 1 ? '' : 's'}`}
                      {c.urgent && <Badge tone="bad">Urgent</Badge>}
                      {c.is_sample && <SampleTag />}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3.5 text-ink-600 lg:table-cell">
                    {(c.judge as unknown as { name: string } | null)?.name ?? <span className="text-amberline-600">Unassigned</span>}
                  </td>
                  <td className="hidden px-5 py-3.5 text-ink-500 md:table-cell">{date(c.filed_at)}</td>
                  <td className="hidden px-5 py-3.5 text-ink-500 md:table-cell">{date(c.next_hearing_at)}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={CASE_STATUS[c.status].tone}>{CASE_STATUS[c.status].label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No cases match">Try another view or clear the filters.</Empty>
      )}

      {(count ?? 0) > per && (
        <div className="mt-5 flex items-center justify-between text-sm text-ink-500">
          <span>
            Page {page} of {Math.ceil((count ?? 0) / per)}
          </span>
          <span className="flex gap-2">
            {page > 1 && (
              <Link href={qs({ page: String(page - 1) })} className="rounded-lg bg-white px-3 py-1.5 shadow-card">
                ← Previous
              </Link>
            )}
            {page * per < (count ?? 0) && (
              <Link href={qs({ page: String(page + 1) })} className="rounded-lg bg-white px-3 py-1.5 shadow-card">
                Next →
              </Link>
            )}
          </span>
        </div>
      )}
    </>
  )
}
