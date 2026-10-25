import Link from 'next/link'
import { notFound } from 'next/navigation'
import { can, logEvent, requireStaff } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_TYPES, DISPOSED_STATUSES, FILING_STATUS, PROCESS_TYPES, label } from '@/lib/constants'
import { rankJudges, suggestDates } from '@/lib/scheduling'
import { date, dateTime, naira, partyNames } from '@/lib/format'
import { Badge, Card, CardTitle, Field, Mono, Notice, PageHeader, btn, input } from '@/components/ui'
import { acceptFiling, assessFees, queryFiling, recordPayment, rejectFiling } from '../../actions'

export const metadata = { title: 'Review filing' }

const ERRORS: Record<string, string> = {
  division: 'Choose a valid division.',
  judge: 'Choose a judge from this court.',
  'suit-number': 'Could not issue a suit number. Try again.',
  case: 'Could not open the case. Try again.',
}

export default async function FilingDetail({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const staff = await requireStaff('filings.review')
  const db = createAdminClient()
  const { data: f } = await db.from('filings').select('*, division:divisions(id, name, code)').eq('id', params.id).eq('court_id', staff.court_id).maybeSingle()
  if (!f) notFound()

  if (f.status === 'submitted') {
    await db.from('filings').update({ status: 'under_review', reviewed_by: staff.id }).eq('id', f.id)
    await logEvent({ court_id: staff.court_id, filing_id: f.id, action: 'filing.opened', actor: staff })
    f.status = 'under_review'
  }

  const docs = (f.documents ?? []) as { name: string; path: string; size: number; sha256: string }[]
  const signed = await Promise.all(docs.map((d) => db.storage.from('filings').createSignedUrl(d.path, 600)))
  const { data: events } = await db.from('case_events').select('action, actor_label, detail, created_at').eq('filing_id', f.id).order('created_at')
  const status = FILING_STATUS[f.status]
  const cls = f.classification as { case_type: string; confidence: number; reasons: string[]; urgency_reasons: string[]; runner_up: string | null } | null

  // For the accept step: divisions, judges ranked by fit and load, open dates.
  let acceptCtx: null | {
    divisions: { id: string; name: string }[]
    judges: ReturnType<typeof rankJudges>
    dates: { date: string; listed: number; capacity: number }[]
  } = null
  if (f.status === 'paid' && can(staff, 'filings.decide')) {
    const [{ data: divisions }, { data: judges }, { data: open }] = await Promise.all([
      db.from('divisions').select('id, name').eq('court_id', staff.court_id).order('name'),
      db.from('judges').select('id, name, courtroom, division_id, specialisations').eq('court_id', staff.court_id).eq('is_active', true),
      db.from('cases').select('judge_id').eq('court_id', staff.court_id).not('status', 'in', `(${DISPOSED_STATUSES.join(',')})`).not('judge_id', 'is', null).limit(20000),
    ])
    const load = new Map<string, number>()
    for (const c of open ?? []) load.set(c.judge_id, (load.get(c.judge_id) ?? 0) + 1)
    const ranked = rankJudges((judges ?? []).map((j) => ({ ...j, specialisations: j.specialisations ?? [], active_cases: load.get(j.id) ?? 0 })), f.case_type, f.division_id)
    let dates: { date: string; listed: number; capacity: number }[] = []
    if (ranked[0]) {
      const { data: listed } = await db.from('hearings').select('scheduled_for').eq('judge_id', ranked[0].id).gte('scheduled_for', new Date().toISOString()).limit(5000)
      const perDay: Record<string, number> = {}
      for (const h of listed ?? []) {
        const d = new Date(h.scheduled_for).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
        perDay[d] = (perDay[d] ?? 0) + 1
      }
      dates = suggestDates({ listedPerDay: perDay, from: new Date(Date.now() + (f.urgent ? 2 : 14) * 86400000) })
    }
    acceptCtx = { divisions: divisions ?? [], judges: ranked, dates }
  }

  return (
    <>
      <Link href="/registry/filings" className="text-sm text-ink-400 hover:text-ink-700">
        ← Filing queue
      </Link>
      <div className="mt-3">
        <PageHeader
          eyebrow={f.reference}
          title={f.title}
          sub={`${label(PROCESS_TYPES, f.process_type)} · ${f.division?.name ?? 'No division chosen'} · received ${dateTime(f.created_at)}`}
          actions={
            <div className="flex items-center gap-2">
              {f.urgent && <Badge tone="bad">Urgent</Badge>}
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
          }
        />
      </div>
      {searchParams.error && (
        <div className="mb-6">
          <Notice tone="bad">{ERRORS[searchParams.error] ?? 'Something went wrong.'}</Notice>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardTitle>The filing</CardTitle>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[160px_1fr]">
              <dt className="text-ink-400">Claimant(s)</dt>
              <dd className="text-ink-800">{partyNames(f.claimants)}</dd>
              <dt className="text-ink-400">Defendant(s)</dt>
              <dd className="text-ink-800">{partyNames(f.defendants)}</dd>
              <dt className="text-ink-400">Amount claimed</dt>
              <dd className="text-ink-800">{naira(f.claim_amount)}</dd>
              <dt className="text-ink-400">Filed by</dt>
              <dd className="text-ink-800">
                {f.filer_name} ({f.filer_type === 'lawyer' ? 'counsel' : f.filer_type === 'agency' ? 'agency' : 'party in person'})
                {f.bar_number && <span className="text-ink-400"> · {f.bar_number}</span>}
                {f.law_firm && <span className="block text-ink-500">{f.law_firm}</span>}
                <span className="block text-ink-500">
                  {f.filer_email}
                  {f.filer_phone && ` · ${f.filer_phone}`}
                </span>
              </dd>
            </dl>
            <div className="mt-6 space-y-4 border-t border-ink-100 pt-5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Reliefs claimed</h3>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-800">{f.reliefs}</p>
              </div>
              {f.summary && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Summary of facts</h3>
                  <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-700">{f.summary}</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle sub="Fingerprinted on receipt. The hash proves the document has not changed since filing.">Documents</CardTitle>
            {docs.length ? (
              <ul className="divide-y divide-ink-100">
                {docs.map((d, i) => (
                  <li key={d.path} className="flex items-center gap-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-[10px] font-bold uppercase text-ink-500">{d.name.split('.').pop()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-800">{d.name}</span>
                      <Mono className="block truncate text-[11px] text-ink-400">SHA-256 {d.sha256}</Mono>
                    </span>
                    {signed[i].data?.signedUrl && (
                      <a href={signed[i].data!.signedUrl} target="_blank" rel="noreferrer" className={btn.ghost}>
                        Open
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-400">No documents attached.</p>
            )}
          </Card>

          <Card>
            <CardTitle>History</CardTitle>
            <ol className="space-y-3">
              {(events ?? []).map((e, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass-400" />
                  <span className="flex-1">
                    <span className="font-medium text-ink-800">{e.action.replace('filing.', '').replace('_', ' ')}</span>
                    <span className="text-ink-400"> · {e.actor_label}</span>
                    {e.detail?.note && <span className="mt-1 block rounded-lg bg-parchment px-3 py-2 text-ink-600">{e.detail.note}</span>}
                    {e.detail?.response && <span className="mt-1 block rounded-lg bg-ink-50 px-3 py-2 text-ink-600">“{e.detail.response}”</span>}
                    {e.detail?.reason && <span className="mt-1 block text-ink-500">{e.detail.reason}</span>}
                  </span>
                  <span className="whitespace-nowrap text-xs text-ink-400">{dateTime(e.created_at)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          {cls && (
            <Card>
              <CardTitle sub="Rule-based — every reason is shown">Automatic routing</CardTitle>
              <p className="font-display text-xl font-semibold text-ink-900">{label(CASE_TYPES, cls.case_type)}</p>
              <p className="text-sm text-ink-400">
                {cls.confidence}% confidence{cls.runner_up && ` · next: ${label(CASE_TYPES, cls.runner_up)}`}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-ink-600">
                {[...cls.reasons, ...cls.urgency_reasons].map((r) => (
                  <li key={r}>— The filing {r}.</li>
                ))}
              </ul>
              {f.case_type !== cls.case_type && <p className="mt-3 text-xs text-ink-400">Filer chose: {label(CASE_TYPES, f.case_type)}</p>}
            </Card>
          )}

          {f.status === 'accepted' && f.case_id && (
            <Card>
              <p className="text-sm text-ink-500">Accepted and opened as a case.</p>
              <Link href={`/registry/cases/${f.case_id}`} className={btn.primary + ' mt-4 w-full'}>
                Go to case
              </Link>
            </Card>
          )}

          {f.status === 'under_review' && (
            <>
              <Card>
                <CardTitle sub="From the court’s fee schedule">Assess filing fees</CardTitle>
                <form action={assessFees} className="space-y-3">
                  <input type="hidden" name="id" value={f.id} />
                  {staff.court.fee_schedule.map((fee) => (
                    <label key={fee.code} className="grid grid-cols-[1fr_auto_4.5rem] items-center gap-3 text-sm">
                      <span className="text-ink-700">{fee.label}</span>
                      <span className="tabular-nums text-ink-400">{naira(fee.amount)}</span>
                      <input
                        type="number"
                        min={0}
                        name={`qty_${fee.code}`}
                        defaultValue={defaultQty(fee.code, f.process_type, (f.defendants ?? []).length, docs.length)}
                        className={input + ' !px-2 !py-1.5 text-right'}
                        aria-label={`Quantity: ${fee.label}`}
                      />
                    </label>
                  ))}
                  <div className="grid grid-cols-[1fr_7rem] gap-2 border-t border-ink-100 pt-3">
                    <input name="extra_label" placeholder="Other item" className={input + ' !py-2 text-sm'} />
                    <input name="extra_amount" type="number" min={0} placeholder="₦" className={input + ' !py-2 text-right text-sm'} />
                  </div>
                  <button className={btn.primary + ' w-full'}>Send assessment to filer</button>
                </form>
              </Card>
              <Card>
                <CardTitle sub="The filer sees this note and can respond">Raise a query</CardTitle>
                <form action={queryFiling} className="space-y-3">
                  <input type="hidden" name="id" value={f.id} />
                  <textarea name="note" required className={input + ' min-h-[90px] text-sm'} placeholder="e.g. The writ is not signed by counsel. Please re-upload a signed copy." />
                  <button className={btn.secondary + ' w-full'}>Send query</button>
                </form>
              </Card>
            </>
          )}

          {f.status === 'assessed' && (
            <Card>
              <CardTitle>Waiting for payment</CardTitle>
              <p className="text-sm text-ink-500">
                Assessed at <b className="text-ink-900">{naira(f.fee_assessment?.total)}</b> by {f.fee_assessment?.assessed_by}. The filer enters their receipt online, or you can record a
                payment made at the registry.
              </p>
              <form action={recordPayment} className="mt-4 flex gap-2">
                <input type="hidden" name="id" value={f.id} />
                <input name="receipt" required placeholder="Receipt / RRR" className={input + ' font-mono text-sm'} />
                <button className={btn.secondary}>Record</button>
              </form>
            </Card>
          )}

          {f.status === 'queried' && (
            <Card>
              <CardTitle>Waiting for the filer</CardTitle>
              <p className="text-sm text-ink-500">{f.query_note}</p>
            </Card>
          )}

          {f.status === 'paid' && !can(staff, 'filings.decide') && (
            <Notice tone="info">Payment {f.payment_reference} received. A registrar will confirm it and open the case.</Notice>
          )}

          {acceptCtx && (
            <Card className="ring-2 ring-brass-300">
              <CardTitle sub={`Payment ${f.payment_reference} · ${naira(f.fee_assessment?.total)}`}>Accept &amp; open case</CardTitle>
              <form action={acceptFiling} className="space-y-4">
                <input type="hidden" name="id" value={f.id} />
                <Field label="Division" hint="The suit number is issued from this division’s sequence.">
                  <select name="division_id" defaultValue={f.division_id ?? ''} className={input + ' text-sm'}>
                    {acceptCtx.divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Case type">
                  <select name="case_type" defaultValue={f.case_type} className={input + ' text-sm'}>
                    {CASE_TYPES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <fieldset>
                  <legend className="mb-1.5 text-sm font-medium text-ink-700">Allocate to</legend>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {acceptCtx.judges.map((j, i) => (
                      <label key={j.id} className="flex cursor-pointer gap-3 rounded-xl border border-ink-100 p-3 has-[:checked]:border-ink-900 has-[:checked]:bg-parchment">
                        <input type="radio" name="judge_id" value={j.id} defaultChecked={i === 0} className="mt-1 accent-ink-900" />
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="flex items-center gap-2 font-medium text-ink-900">
                            {j.name}
                            {i === 0 && <Badge tone="good">Suggested</Badge>}
                          </span>
                          <span className="block text-xs text-ink-400">
                            {j.active_cases} active{j.courtroom && ` · ${j.courtroom}`}
                            {j.reasons.length > 0 && ` · ${j.reasons.join(', ')}`}
                          </span>
                        </span>
                      </label>
                    ))}
                    <label className="flex cursor-pointer gap-3 rounded-xl border border-dashed border-ink-200 p-3 text-sm text-ink-500">
                      <input type="radio" name="judge_id" value="" defaultChecked={acceptCtx.judges.length === 0} className="accent-ink-900" />
                      Assign later
                    </label>
                  </div>
                </fieldset>
                <Field label="First mention (optional)" hint={acceptCtx.dates.length ? `Open dates for the suggested judge: ${acceptCtx.dates.map((d) => date(d.date + 'T12:00:00+01:00', { day: 'numeric', month: 'short' })).join(', ')}` : undefined}>
                  <div className="grid grid-cols-[1fr_6.5rem] gap-2">
                    <input type="date" name="first_date" defaultValue={acceptCtx.dates[0]?.date} className={input + ' text-sm'} />
                    <input type="time" name="first_time" defaultValue="09:00" className={input + ' text-sm'} />
                  </div>
                </Field>
                <button className={btn.primary + ' w-full !py-3'}>Issue suit number &amp; open case</button>
              </form>
            </Card>
          )}

          {can(staff, 'filings.decide') && !['accepted', 'rejected'].includes(f.status) && (
            <details className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <summary className="cursor-pointer text-sm font-medium text-seal-600">Reject this filing</summary>
              <form action={rejectFiling} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={f.id} />
                <textarea name="reason" required className={input + ' min-h-[80px] text-sm'} placeholder="Reason, shown to the filer" />
                <button className={btn.danger + ' w-full'}>Reject filing</button>
              </form>
            </details>
          )}
        </div>
      </div>
    </>
  )
}

/** Sensible starting quantities for the assessment form. */
function defaultQty(code: string, process: string, defendants: number, docs: number) {
  if (code === process) return 1
  if (code === 'service') return Math.max(1, defendants)
  if (code === 'exhibit') return Math.max(0, docs - 1)
  return 0
}
