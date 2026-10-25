import Link from 'next/link'
import type { Metadata } from 'next'
import { requireStaff } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_TYPES, FILING_STATUS, label } from '@/lib/constants'
import { relative } from '@/lib/format'
import { Badge, Empty, Mono, PageHeader, cx } from '@/components/ui'

export const metadata: Metadata = { title: 'Filings' }

const TABS = [
  ['action', 'Needs action', ['submitted', 'under_review', 'paid']],
  ['waiting', 'Waiting on filer', ['queried', 'assessed']],
  ['accepted', 'Accepted', ['accepted']],
  ['rejected', 'Rejected', ['rejected']],
] as const

export default async function FilingsPage({ searchParams }: { searchParams: { tab?: string; q?: string } }) {
  const staff = await requireStaff('filings.review')
  const db = createAdminClient()
  const tab = TABS.find((t) => t[0] === searchParams.tab) ?? TABS[0]

  const counts = await Promise.all(
    TABS.map(([, , statuses]) => db.from('filings').select('id', { count: 'exact', head: true }).eq('court_id', staff.court_id).in('status', statuses as unknown as string[])),
  )

  let q = db
    .from('filings')
    .select('id, reference, title, status, case_type, filer_name, law_firm, urgent, created_at, documents, classification')
    .eq('court_id', staff.court_id)
    .in('status', tab[2] as unknown as string[])
    .limit(100)
  q = tab[0] === 'action' ? q.order('urgent', { ascending: false }).order('created_at') : q.order('updated_at', { ascending: false })
  if (searchParams.q) q = q.or(`title.ilike.%${searchParams.q.replace(/[%,()]/g, '')}%,reference.ilike.%${searchParams.q.replace(/[%,()]/g, '')}%`)
  const { data: filings } = await q

  return (
    <>
      <PageHeader eyebrow="Registry" title="Filing queue" sub="Every e-filing lands here. Work the queue top to bottom — urgent matters first." />
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <nav className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-card">
          {TABS.map(([key, name], i) => (
            <Link
              key={key}
              href={`/registry/filings?tab=${key}`}
              className={cx('whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition', tab[0] === key ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900')}
            >
              {name}
              <span className={cx('ml-2 text-xs', tab[0] === key ? 'text-brass-200' : 'text-ink-300')}>{counts[i].count ?? 0}</span>
            </Link>
          ))}
        </nav>
        <form>
          <input type="hidden" name="tab" value={tab[0]} />
          <input name="q" defaultValue={searchParams.q} placeholder="Search title or EF code" className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm sm:w-64" />
        </form>
      </div>

      {filings?.length ? (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-parchment/60 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-5 py-3 font-medium">Filing</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Filed by</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Routed to</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="hidden px-5 py-3 text-right font-medium sm:table-cell">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filings.map((f) => (
                <tr key={f.id} className="group relative transition hover:bg-parchment/50">
                  <td className="px-5 py-4">
                    <Link href={`/registry/filings/${f.id}`} className="font-medium text-ink-900 after:absolute after:inset-0">
                      {f.title}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
                      <Mono className="text-[11px]">{f.reference}</Mono>
                      <span>· {(f.documents as unknown[]).length} docs</span>
                      {f.urgent && <Badge tone="bad">Urgent</Badge>}
                    </div>
                  </td>
                  <td className="hidden px-5 py-4 text-ink-600 md:table-cell">
                    {f.filer_name}
                    {f.law_firm && <span className="block text-xs text-ink-400">{f.law_firm}</span>}
                  </td>
                  <td className="hidden px-5 py-4 lg:table-cell">
                    <span className="text-ink-700">{label(CASE_TYPES, f.case_type)}</span>
                    {f.classification?.confidence && <span className="block text-xs text-ink-400">{f.classification.confidence}% match</span>}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={FILING_STATUS[f.status].tone}>{FILING_STATUS[f.status].label}</Badge>
                  </td>
                  <td className="hidden px-5 py-4 text-right text-ink-500 sm:table-cell">{relative(f.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title={tab[0] === 'action' ? 'The queue is clear' : 'Nothing here'} icon={tab[0] === 'action' ? '✓' : '§'}>
          {tab[0] === 'action' ? 'New e-filings will appear here the moment they are submitted.' : undefined}
        </Empty>
      )}
    </>
  )
}
