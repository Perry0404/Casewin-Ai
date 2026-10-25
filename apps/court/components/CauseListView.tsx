import Link from 'next/link'
import type { ListedHearing } from '@/lib/causelist'
import { HEARING_PURPOSES, label } from '@/lib/constants'
import { time } from '@/lib/format'
import { Badge, Empty, Mono, SampleTag } from './ui'

const OUTCOME: Record<string, { label: string; tone: 'good' | 'warn' | 'neutral' | 'bad' }> = {
  held: { label: 'Held', tone: 'good' },
  adjourned: { label: 'Adjourned', tone: 'warn' },
  not_sitting: { label: 'Not sitting', tone: 'bad' },
  struck_out: { label: 'Struck out', tone: 'neutral' },
  judgment_delivered: { label: 'Judgment delivered', tone: 'neutral' },
  settled: { label: 'Settled', tone: 'neutral' },
}

export default function CauseListView({
  groups,
  linkCases = false,
}: {
  groups: { judge: ListedHearing['judge']; items: ListedHearing[] }[]
  linkCases?: boolean
}) {
  if (groups.length === 0) return <Empty title="No matters listed for this day">Choose another date, or check back later.</Empty>

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.judge?.id ?? 'unassigned'} className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card print:break-inside-avoid print:shadow-none">
          <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink-100 bg-parchment/70 px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-ink-900">{g.judge?.name ?? 'Not yet assigned'}</h2>
            <span className="text-sm text-ink-500">
              {g.judge?.courtroom ?? g.items[0]?.courtroom ?? ''} · {g.items.length} matter{g.items.length === 1 ? '' : 's'}
            </span>
          </header>
          <ol className="divide-y divide-ink-100">
            {g.items.map((h, i) => (
              <li key={h.id} className="grid grid-cols-[2rem_1fr] gap-x-3 gap-y-1 px-5 py-3.5 sm:grid-cols-[2rem_4.5rem_9rem_1fr_auto] sm:items-center">
                <span className="text-sm tabular-nums text-ink-300">{i + 1}.</span>
                <span className="hidden text-sm tabular-nums text-ink-500 sm:block">{time(h.scheduled_for)}</span>
                <Mono className="col-start-2 text-ink-600 sm:col-start-auto">{h.case.suit_number}</Mono>
                <span className="col-start-2 min-w-0 sm:col-start-auto">
                  {linkCases ? (
                    <Link href={`/registry/cases/${h.case.id}`} className="font-medium text-ink-900 hover:underline">
                      {h.case.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-ink-900">{h.case.title}</span>
                  )}
                  <span className="ml-2 text-sm text-ink-400">{label(HEARING_PURPOSES, h.purpose)}</span>
                  {h.case.is_sample && <span className="ml-2 align-middle"><SampleTag /></span>}
                </span>
                <span className="col-start-2 sm:col-start-auto">
                  {h.outcome ? <Badge tone={OUTCOME[h.outcome]?.tone}>{OUTCOME[h.outcome]?.label}</Badge> : <span className="text-xs text-ink-300">Listed</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
