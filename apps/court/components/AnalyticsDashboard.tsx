import type { Analytics } from '@/lib/analytics'
import { BarList, ColumnChart, LineChart, ORDINAL } from './charts'
import { Card, CardTitle, Empty, Stat, cx } from './ui'

function months(days: number | null) {
  if (days == null) return '—'
  return days < 60 ? `${Math.round(days)} days` : `${(days / 30.4).toFixed(1)} mo`
}

const INSIGHT_ICON = { good: '↗', warn: '!', bad: '!', info: 'i' }
const INSIGHT_STYLE = {
  good: 'bg-verdict-50 text-verdict-700',
  warn: 'bg-amberline-50 text-amberline-600',
  bad: 'bg-seal-50 text-seal-600',
  info: 'bg-ink-50 text-ink-600',
}

export default function AnalyticsDashboard({ a }: { a: Analytics }) {
  if (!a.hasData) {
    return (
      <Empty title="No cases yet" icon="∑">
        Analytics fill in as the registry accepts filings and records hearings.
      </Empty>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Clearance rate · 12 months"
          value={a.clearanceRate === null ? '—' : `${a.clearanceRate}%`}
          hint={`${a.totals.disposed12.toLocaleString()} disposed of ${a.totals.filed12.toLocaleString()} filed`}
          tone={a.clearanceRate === null ? undefined : a.clearanceRate >= 100 ? 'good' : a.clearanceRate < 85 ? 'bad' : 'warn'}
        />
        <Stat label="Pending cases" value={a.totals.pending.toLocaleString()} hint={`${a.totals.backlog.toLocaleString()} older than 1 year`} tone={a.totals.backlog ? 'warn' : undefined} />
        <Stat label="Median time to disposal" value={months(a.medianDaysToDisposal)} hint="Filing to judgment or other disposal" />
        <Stat
          label="Hearings that went ahead · 90 days"
          value={a.effectiveRate === null ? '—' : `${a.effectiveRate}%`}
          hint={`of ${a.hearingsWithOutcome.toLocaleString()} listed hearings`}
          tone={a.effectiveRate === null ? undefined : a.effectiveRate >= 60 ? 'good' : 'bad'}
        />
      </div>

      {a.insights.length > 0 && (
        <Card>
          <CardTitle sub="Generated from the figures below">Findings for the Chief Judge</CardTitle>
          <ul className="grid gap-3 md:grid-cols-2">
            {a.insights.map((i) => (
              <li key={i.text} className="flex gap-3 rounded-xl border border-ink-100 p-4">
                <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold', INSIGHT_STYLE[i.tone])} aria-hidden>
                  {INSIGHT_ICON[i.tone]}
                </span>
                <p className="text-sm leading-relaxed text-ink-700">{i.text}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle sub="If the brass line stays below the navy line, the backlog grows">Cases filed vs disposed, last 12 months</CardTitle>
        <LineChart
          labels={a.monthly.labels}
          series={[
            { name: 'Filed', values: a.monthly.filed },
            { name: 'Disposed', values: a.monthly.disposed },
          ]}
        />
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle sub={`${a.totals.over3} pending for more than three years`}>Age of pending cases</CardTitle>
          <ColumnChart data={a.ageBuckets.map((b) => ({ ...b, sub: `pending ${b.label}` }))} colors={ORDINAL} />
        </Card>
        <Card>
          <CardTitle sub={`Court average ${Math.round(a.judgeAvg)} · ${a.totals.unassigned} awaiting assignment`}>Active cases per judge</CardTitle>
          {a.perJudge.length ? (
            <BarList data={a.perJudge} highlightAbove={a.judgeAvg * 1.3} note="Brass bars are more than 30% above the court average (marked by the vertical line at that threshold)." />
          ) : (
            <p className="text-sm text-ink-400">Add judges under Court settings.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardTitle sub="Last 90 days">Why hearings did not go ahead</CardTitle>
          {a.adjournmentReasons.length ? <BarList data={a.adjournmentReasons} /> : <p className="text-sm text-ink-400">No adjournments recorded.</p>}
        </Card>
        <Card>
          <CardTitle sub="Pending, by type">Case mix</CardTitle>
          <BarList data={a.byType} />
        </Card>
        <Card>
          <CardTitle sub="Pending, by division">Divisions</CardTitle>
          {a.byDivision.length ? <BarList data={a.byDivision} /> : <p className="text-sm text-ink-400">No divisions set up.</p>}
          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-ink-100 pt-5 text-center">
            <Mini k="E-filed" v={a.efiling.efiled} />
            <Mini k="Accepted" v={a.efiling.accepted} />
            <Mini k="In queue" v={a.efiling.awaiting} />
          </div>
          <p className="mt-2 text-center text-xs text-ink-400">E-filings, last 90 days</p>
        </Card>
      </div>

      <details className="rounded-2xl border border-ink-100 bg-white p-5 text-sm shadow-card">
        <summary className="cursor-pointer font-medium text-ink-700">Data table &amp; definitions</summary>
        <table className="mt-4 w-full text-left">
          <thead className="text-[12px] font-medium text-ink-500">
            <tr>
              <th className="py-2 font-medium">Month</th>
              <th className="py-2 text-right font-medium">Filed</th>
              <th className="py-2 text-right font-medium">Disposed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 tabular-nums">
            {a.monthly.labels.map((m, i) => (
              <tr key={m + i}>
                <td className="py-1.5">{m}</td>
                <td className="py-1.5 text-right">{a.monthly.filed[i]}</td>
                <td className="py-1.5 text-right">{a.monthly.disposed[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-4 space-y-1 text-ink-500">
          <li><b className="text-ink-700">Clearance rate</b>: cases disposed ÷ cases filed over the same 12 months.</li>
          <li><b className="text-ink-700">Backlog</b>: pending cases filed more than one year ago.</li>
          <li><b className="text-ink-700">Hearings that went ahead</b>: held, judgment delivered, settled or struck out, as a share of listed hearings with a recorded outcome.</li>
          <li><b className="text-ink-700">Average adjournments per disposed case</b>: {a.avgAdjournments === null ? '—' : a.avgAdjournments.toFixed(1)}.</li>
        </ul>
      </details>
    </div>
  )
}

function Mini({ k, v }: { k: string; v: number }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold text-ink-900">{v.toLocaleString()}</p>
      <p className="text-xs text-ink-400">{k}</p>
    </div>
  )
}
