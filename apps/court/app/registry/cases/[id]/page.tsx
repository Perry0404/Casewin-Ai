import Link from 'next/link'
import { notFound } from 'next/navigation'
import { can, requireStaff } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { ADJOURNMENT_REASONS, CASE_STATUS, CASE_TYPES, DISPOSED_STATUSES, HEARING_PURPOSES, label } from '@/lib/constants'
import { suggestDates } from '@/lib/scheduling'
import { date, dateTime, partyNames, relative } from '@/lib/format'
import { Badge, Card, CardTitle, Field, Mono, Notice, PageHeader, SampleTag, btn, input } from '@/components/ui'
import { assignJudge, recordOutcome, scheduleHearing } from '../../actions'

export const metadata = { title: 'Case file' }

const OUTCOMES = [
  ['held', 'Held — proceeded'],
  ['adjourned', 'Adjourned'],
  ['not_sitting', 'Court did not sit'],
  ['settled', 'Settled / terms of settlement'],
  ['struck_out', 'Struck out'],
  ['judgment_delivered', 'Judgment delivered'],
] as const

export default async function CaseDetail({ params, searchParams }: { params: { id: string }; searchParams: { opened?: string } }) {
  const staff = await requireStaff()
  const db = createAdminClient()
  const { data: c } = await db.from('cases').select('*, judge:judges(id, name, courtroom), division:divisions(name)').eq('id', params.id).eq('court_id', staff.court_id).maybeSingle()
  if (!c) notFound()

  const [{ data: hearings }, { data: events }, { data: judges }, { data: judgment }] = await Promise.all([
    db.from('hearings').select('*').eq('case_id', c.id).order('scheduled_for', { ascending: false }),
    db.from('case_events').select('action, actor_label, detail, created_at').or(`case_id.eq.${c.id}${c.filing_id ? `,filing_id.eq.${c.filing_id}` : ''}`).order('created_at', { ascending: false }).limit(40),
    db.from('judges').select('id, name, courtroom').eq('court_id', staff.court_id).eq('is_active', true).order('name'),
    db.from('judgments').select('id, status').eq('case_id', c.id).maybeSingle(),
  ])

  const disposed = DISPOSED_STATUSES.includes(c.status)
  const now = Date.now()
  const due = (hearings ?? []).filter((h) => !h.outcome && +new Date(h.scheduled_for) <= now + 12 * 3600000)
  const upcoming = (hearings ?? []).filter((h) => !h.outcome && +new Date(h.scheduled_for) > now + 12 * 3600000)

  let openDates: string[] = []
  if (c.judge_id && !disposed && can(staff, 'cases.schedule')) {
    const { data: listed } = await db.from('hearings').select('scheduled_for').eq('judge_id', c.judge_id).gte('scheduled_for', new Date().toISOString()).limit(5000)
    const perDay: Record<string, number> = {}
    for (const h of listed ?? []) {
      const d = new Date(h.scheduled_for).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
      perDay[d] = (perDay[d] ?? 0) + 1
    }
    openDates = suggestDates({ listedPerDay: perDay, from: new Date(now + 7 * 86400000) }).map((d) => d.date)
  }
  const ageDays = Math.floor((now - +new Date(c.filed_at)) / 86400000)
  const isOwnJudge = staff.role !== 'judge' || staff.judge_id === c.judge_id

  return (
    <>
      <Link href="/registry/cases" className="text-sm text-ink-400 hover:text-ink-700">
        ← Cases
      </Link>
      <div className="mt-3">
        <PageHeader
          eyebrow={c.suit_number}
          title={c.title}
          sub={`${label(CASE_TYPES, c.case_type)} · ${c.division?.name ?? ''} · filed ${date(c.filed_at)} (${ageDays.toLocaleString()} days ago)`}
          actions={
            <div className="flex items-center gap-2">
              {c.is_sample && <SampleTag />}
              {c.urgent && <Badge tone="bad">Urgent</Badge>}
              <Badge tone={CASE_STATUS[c.status].tone}>{CASE_STATUS[c.status].label}</Badge>
            </div>
          }
        />
      </div>
      {searchParams.opened && (
        <div className="mb-6">
          <Notice tone="good">
            Case opened. Suit number <Mono className="font-semibold">{c.suit_number}</Mono> has been issued and the filer can see it on their tracking page.
          </Notice>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {due.length > 0 && isOwnJudge && can(staff, 'hearings.record') && (
            <Card className="ring-2 ring-brass-300">
              <CardTitle sub="Record what happened so the cause list and analytics stay true">Outcome to record</CardTitle>
              {due.map((h) => (
                <form key={h.id} action={recordOutcome} className="space-y-4 border-t border-ink-100 pt-4 first-of-type:border-0 first-of-type:pt-0">
                  <input type="hidden" name="hearing_id" value={h.id} />
                  <p className="text-sm text-ink-600">
                    <b className="text-ink-900">{label(HEARING_PURPOSES, h.purpose)}</b> · {dateTime(h.scheduled_for)}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {OUTCOMES.map(([v, l]) => (
                      <label key={v} className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-100 px-3 py-2.5 text-sm has-[:checked]:border-ink-900 has-[:checked]:bg-parchment">
                        <input type="radio" name="outcome" value={v} required className="accent-ink-900" />
                        {l}
                      </label>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="If adjourned — why?">
                      <select name="reason" className={input + ' text-sm'} defaultValue="">
                        <option value="">—</option>
                        {ADJOURNMENT_REASONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Next date">
                      <div className="grid grid-cols-[1fr_5.5rem] gap-2">
                        <input type="date" name="next_date" defaultValue={openDates[0]} className={input + ' text-sm'} />
                        <input type="time" name="next_time" defaultValue="09:00" className={input + ' text-sm'} />
                      </div>
                    </Field>
                    <Field label="Next date is for">
                      <select name="next_purpose" className={input + ' text-sm'} defaultValue={h.purpose}>
                        {HEARING_PURPOSES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Note for the record">
                      <input name="notes" className={input + ' text-sm'} placeholder="e.g. PW1 cross-examined" />
                    </Field>
                  </div>
                  <button className={btn.primary}>Save outcome</button>
                </form>
              ))}
            </Card>
          )}

          <Card>
            <CardTitle>Parties</CardTitle>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[160px_1fr]">
              <dt className="text-ink-400">Claimant(s)</dt>
              <dd className="text-ink-800">{partyNames(c.claimants)}</dd>
              <dt className="text-ink-400">Defendant(s)</dt>
              <dd className="text-ink-800">{partyNames(c.defendants)}</dd>
              {c.claimant_counsel && (
                <>
                  <dt className="text-ink-400">Claimant’s counsel</dt>
                  <dd className="text-ink-800">{c.claimant_counsel}</dd>
                </>
              )}
              {c.filing_id && (
                <>
                  <dt className="text-ink-400">Originating filing</dt>
                  <dd>
                    <Link href={`/registry/filings/${c.filing_id}`} className="font-medium text-ink-800 underline decoration-brass-300 underline-offset-4">
                      View filing &amp; documents
                    </Link>
                  </dd>
                </>
              )}
            </dl>
          </Card>

          <Card>
            <CardTitle sub={`${c.adjournment_count} adjournment${c.adjournment_count === 1 ? '' : 's'} so far`}>Hearings</CardTitle>
            {hearings?.length ? (
              <ol className="relative space-y-0 border-l border-ink-100 pl-6">
                {hearings.map((h) => (
                  <li key={h.id} className="relative pb-5 last:pb-0">
                    <span
                      className={`absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                        !h.outcome ? 'bg-brass-400' : h.outcome === 'held' || h.outcome === 'judgment_delivered' ? 'bg-verdict-500' : h.outcome === 'adjourned' || h.outcome === 'not_sitting' ? 'bg-amberline-500' : 'bg-ink-300'
                      }`}
                    />
                    <p className="text-sm font-medium text-ink-900">
                      {label(HEARING_PURPOSES, h.purpose)} · {dateTime(h.scheduled_for)}
                    </p>
                    <p className="text-sm text-ink-500">
                      {h.outcome ? OUTCOMES.find((o) => o[0] === h.outcome)?.[1] : 'Listed'}
                      {h.adjournment_reason && ` — ${h.adjournment_reason}`}
                      {h.courtroom && ` · ${h.courtroom}`}
                    </p>
                    {h.notes && <p className="mt-1 text-sm text-ink-600">{h.notes}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-ink-400">No hearings listed yet.</p>
            )}
          </Card>

          <Card>
            <CardTitle>Audit trail</CardTitle>
            <ol className="space-y-2.5 text-sm">
              {(events ?? []).map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-28 shrink-0 text-xs text-ink-400">{relative(e.created_at)}</span>
                  <span className="text-ink-700">
                    <span className="font-medium">{e.action}</span>
                    <span className="text-ink-400"> · {e.actor_label}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardTitle>Bench</CardTitle>
            {c.judge ? (
              <div>
                <p className="font-display text-lg font-semibold text-ink-900">{c.judge.name}</p>
                <p className="text-sm text-ink-400">{c.judge.courtroom ?? 'Courtroom not set'}</p>
              </div>
            ) : (
              <Notice tone="warn">No judge assigned yet.</Notice>
            )}
            {!disposed && can(staff, 'cases.schedule') && (
              <form action={assignJudge} className="mt-4 flex gap-2">
                <input type="hidden" name="case_id" value={c.id} />
                <select name="judge_id" defaultValue={c.judge_id ?? ''} className={input + ' text-sm'} required>
                  <option value="" disabled>
                    Choose judge…
                  </option>
                  {(judges ?? []).map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name}
                    </option>
                  ))}
                </select>
                <button className={btn.secondary}>{c.judge_id ? 'Reassign' : 'Assign'}</button>
              </form>
            )}
          </Card>

          {!disposed && c.judge_id && can(staff, 'cases.schedule') && (
            <Card>
              <CardTitle sub={upcoming.length ? `Next: ${dateTime(upcoming[upcoming.length - 1].scheduled_for)}` : 'Nothing listed'}>List a hearing</CardTitle>
              <form action={scheduleHearing} className="space-y-3">
                <input type="hidden" name="case_id" value={c.id} />
                <div className="grid grid-cols-[1fr_6rem] gap-2">
                  <input type="date" name="date" required defaultValue={openDates[0]} className={input + ' text-sm'} />
                  <input type="time" name="time" defaultValue="09:00" className={input + ' text-sm'} />
                </div>
                {openDates.length > 0 && (
                  <p className="text-xs text-ink-400">Days with room on this judge’s list: {openDates.map((d) => date(d + 'T12:00:00+01:00', { day: 'numeric', month: 'short' })).join(', ')}</p>
                )}
                <select name="purpose" className={input + ' text-sm'}>
                  {HEARING_PURPOSES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <button className={btn.primary + ' w-full'}>List hearing</button>
              </form>
            </Card>
          )}

          {can(staff, 'judgments.upload') && (
            <Card>
              <CardTitle sub="Published judgments become searchable on OpenLegal Nigeria">Judgment</CardTitle>
              {judgment ? (
                <Link href={`/registry/judgments/${judgment.id}`} className={btn.secondary + ' w-full'}>
                  View judgment ({judgment.status})
                </Link>
              ) : (
                <Link href={`/registry/judgments/new?case=${c.id}`} className={btn.secondary + ' w-full'}>
                  Upload judgment
                </Link>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
