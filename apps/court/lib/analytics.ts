// Judicial analytics, computed from a court's own records.
//
// Definitions follow common court-performance measures (e.g. the
// International Framework for Court Excellence):
//   clearance rate  = cases disposed ÷ cases filed, over the same 12 months
//   time to disposal = filing → disposal, median, for cases disposed in 12 months
//   backlog          = pending cases older than the court's time standard (1 year here)
//   effective hearing rate = hearings that went ahead ÷ hearings with an outcome

import type { SupabaseClient } from '@supabase/supabase-js'
import { CASE_TYPES, DISPOSED_STATUSES, label } from './constants'

const DAY = 86400000

interface CaseRow {
  id: string
  case_type: string
  status: string
  judge_id: string | null
  division_id: string | null
  filed_at: string
  disposed_at: string | null
  adjournment_count: number
  court_id: string
}
interface HearingRow {
  outcome: string | null
  adjournment_reason: string | null
  scheduled_for: string
}
interface FilingRow {
  status: string
  created_at: string
  case_id: string | null
}

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null }>, cap = 50000): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; from < cap; from += 1000) {
    const { data } = await build(from, from + 999)
    if (!data?.length) break
    out.push(...data)
    if (data.length < 1000) break
  }
  return out
}

function median(xs: number[]) {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function monthKey(d: Date) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }).slice(0, 7)
}

export async function computeAnalytics(db: SupabaseClient, courtId: string | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase builder types don't survive generic helpers
  const scope = (q: any) => (courtId ? q.eq('court_id', courtId) : q)
  const now = Date.now()
  const since90 = new Date(now - 90 * DAY).toISOString()

  const [cases, hearings, filings, judgesRes, divisionsRes] = await Promise.all([
    fetchAll<CaseRow>((a, b) =>
      scope(db.from('cases').select('id, case_type, status, judge_id, division_id, filed_at, disposed_at, adjournment_count, court_id')).range(a, b),
    ),
    fetchAll<HearingRow>((a, b) =>
      scope(db.from('hearings').select('outcome, adjournment_reason, scheduled_for')).gte('scheduled_for', since90).lte('scheduled_for', new Date(now).toISOString()).range(a, b),
    ),
    fetchAll<FilingRow>((a, b) => scope(db.from('filings').select('status, created_at, case_id')).gte('created_at', since90).range(a, b)),
    scope(db.from('judges').select('id, name, courtroom, is_active')),
    scope(db.from('divisions').select('id, name, code')),
  ])
  const judges = (judgesRes.data ?? []) as { id: string; name: string; courtroom: string | null; is_active: boolean }[]
  const divisions = (divisionsRes.data ?? []) as { id: string; name: string; code: string }[]

  const disposed = (c: CaseRow) => DISPOSED_STATUSES.includes(c.status)
  const pending = cases.filter((c) => !disposed(c))
  const yearAgo = now - 365 * DAY
  const filed12 = cases.filter((c) => +new Date(c.filed_at) >= yearAgo)
  const disposed12 = cases.filter((c) => disposed(c) && c.disposed_at && +new Date(c.disposed_at) >= yearAgo)
  const clearanceRate = filed12.length ? Math.round((disposed12.length / filed12.length) * 100) : null
  const disposalDays = disposed12.map((c) => (+new Date(c.disposed_at!) - +new Date(c.filed_at)) / DAY)
  const medianDaysToDisposal = median(disposalDays)

  // Age of the pending docket.
  const buckets = [
    { label: '< 6 mo', max: 182 },
    { label: '6–12 mo', max: 365 },
    { label: '1–2 yrs', max: 730 },
    { label: '2–3 yrs', max: 1095 },
    { label: '3+ yrs', max: Infinity },
  ].map((b) => ({ ...b, value: 0 }))
  for (const c of pending) {
    const age = (now - +new Date(c.filed_at)) / DAY
    buckets.find((b) => age < b.max)!.value++
  }
  const backlog = buckets.slice(2).reduce((n, b) => n + b.value, 0)
  const over3 = buckets[4].value

  // Filed vs disposed, last 12 months.
  const months: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(1)
    d.setUTCMonth(d.getUTCMonth() - i)
    months.push(monthKey(d))
  }
  const filedByMonth = Object.fromEntries(months.map((m) => [m, 0]))
  const disposedByMonth = Object.fromEntries(months.map((m) => [m, 0]))
  for (const c of cases) {
    const fm = monthKey(new Date(c.filed_at))
    if (fm in filedByMonth) filedByMonth[fm]++
    if (c.disposed_at && disposed(c)) {
      const dm = monthKey(new Date(c.disposed_at))
      if (dm in disposedByMonth) disposedByMonth[dm]++
    }
  }
  const monthLabels = months.map((m) => new Date(m + '-15').toLocaleDateString('en-GB', { month: 'short' }))

  // Docket per judge.
  const activeJudges = judges.filter((j) => j.is_active)
  const perJudge = activeJudges
    .map((j) => ({ id: j.id, label: j.name.replace(/^Hon\.?\s*(Justice)?\s*/i, ''), value: pending.filter((c) => c.judge_id === j.id).length, sub: j.courtroom ?? undefined }))
    .sort((a, b) => b.value - a.value)
  const judgeAvg = perJudge.length ? perJudge.reduce((s, j) => s + j.value, 0) / perJudge.length : 0
  const unassigned = pending.filter((c) => !c.judge_id).length

  // Case mix.
  const byType = CASE_TYPES.map((t) => ({ label: t.label, value: pending.filter((c) => c.case_type === t.value).length }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value)

  const byDivision = divisions
    .map((d) => ({ label: d.name.replace(/ Judicial Division$/, ''), value: pending.filter((c) => c.division_id === d.id).length }))
    .sort((a, b) => b.value - a.value)

  // Hearings, last 90 days.
  const withOutcome = hearings.filter((h) => h.outcome)
  const wentAhead = withOutcome.filter((h) => ['held', 'judgment_delivered', 'settled', 'struck_out'].includes(h.outcome!)).length
  const effectiveRate = withOutcome.length ? Math.round((wentAhead / withOutcome.length) * 100) : null
  const reasons = new Map<string, number>()
  for (const h of withOutcome) {
    if (h.outcome === 'adjourned' || h.outcome === 'not_sitting') {
      const r = h.adjournment_reason || (h.outcome === 'not_sitting' ? 'Judge not sitting' : 'Other')
      reasons.set(r, (reasons.get(r) ?? 0) + 1)
    }
  }
  const adjournmentReasons = Array.from(reasons, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  const adjournedTotal = adjournmentReasons.reduce((s, r) => s + r.value, 0)

  const avgAdjournments = disposed12.length ? disposed12.reduce((s, c) => s + c.adjournment_count, 0) / disposed12.length : null

  // E-filing, last 90 days.
  const efiled = filings.length
  const accepted = filings.filter((f) => f.status === 'accepted').length
  const awaiting = filings.filter((f) => ['submitted', 'under_review', 'paid'].includes(f.status)).length

  // Plain-language findings for the Chief Judge.
  const insights: { tone: 'good' | 'warn' | 'bad' | 'info'; text: string }[] = []
  if (clearanceRate !== null) {
    if (clearanceRate >= 100) insights.push({ tone: 'good', text: `The court disposed of more cases than it received over the last 12 months (clearance rate ${clearanceRate}%). The backlog is shrinking.` })
    else insights.push({ tone: clearanceRate < 85 ? 'bad' : 'warn', text: `For every 100 cases filed, ${clearanceRate} were disposed of. At this rate the pending docket grows by about ${Math.max(0, filed12.length - disposed12.length)} cases a year.` })
  }
  const heavy = perJudge.find((j) => judgeAvg && j.value > judgeAvg * 1.3)
  if (heavy) insights.push({ tone: 'warn', text: `${heavy.label} carries ${heavy.value} active cases — ${Math.round((heavy.value / judgeAvg - 1) * 100)}% above the court average of ${Math.round(judgeAvg)}. New matters could be routed elsewhere.` })
  if (adjournmentReasons[0] && adjournedTotal) {
    const top = adjournmentReasons[0]
    insights.push({ tone: 'info', text: `“${top.label}” caused ${Math.round((top.value / adjournedTotal) * 100)}% of adjournments in the last 90 days — the single biggest avoidable delay.` })
  }
  if (over3 > 0) insights.push({ tone: 'bad', text: `${over3} pending case${over3 === 1 ? ' is' : 's are'} more than three years old. A dedicated clearance list would address them first.` })
  if (unassigned > 0) insights.push({ tone: 'warn', text: `${unassigned} case${unassigned === 1 ? ' is' : 's are'} waiting for a judge to be assigned.` })

  return {
    generatedAt: new Date(now).toISOString(),
    hasData: cases.length > 0,
    sampleOnly: false,
    totals: { cases: cases.length, pending: pending.length, filed12: filed12.length, disposed12: disposed12.length, backlog, over3, unassigned },
    clearanceRate,
    medianDaysToDisposal,
    avgAdjournments,
    effectiveRate,
    hearingsWithOutcome: withOutcome.length,
    ageBuckets: buckets.map(({ label, value }) => ({ label, value })),
    monthly: { labels: monthLabels, filed: months.map((m) => filedByMonth[m]), disposed: months.map((m) => disposedByMonth[m]) },
    perJudge,
    judgeAvg,
    byType,
    byDivision,
    adjournmentReasons,
    efiling: { efiled, accepted, awaiting },
    insights,
  }
}

export type Analytics = Awaited<ReturnType<typeof computeAnalytics>>

export function typeLabel(v: string) {
  return label(CASE_TYPES, v)
}
