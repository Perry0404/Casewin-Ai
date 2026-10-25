import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PublicShell } from '@/components/site'
import { Badge, Card, Field, Mono, Notice, btn, input } from '@/components/ui'
import { createAdminClient, isConfigured } from '@/lib/supabase/server'
import { CASE_TYPES, FILING_STATUS, label } from '@/lib/constants'
import { dateTime, naira } from '@/lib/format'
import { logEvent } from '@/lib/auth'

export const metadata: Metadata = { title: 'Track a filing' }
export const dynamic = 'force-dynamic'

const EVENT_LABELS: Record<string, string> = {
  'filing.submitted': 'Filing submitted',
  'filing.opened': 'Registry opened the filing',
  'filing.queried': 'Registry raised a query',
  'filing.responded': 'Filer responded to the query',
  'filing.assessed': 'Fees assessed',
  'filing.paid': 'Payment reference submitted',
  'filing.accepted': 'Accepted — suit number issued',
  'filing.rejected': 'Filing rejected',
}

async function findFiling(ref: string, email: string) {
  const db = createAdminClient()
  const { data } = await db
    .from('filings')
    .select('id, court_id, reference, title, status, case_type, query_note, rejection_reason, fee_assessment, payment_reference, created_at, filer_email, court:courts(name), case:cases(suit_number)')
    .eq('reference', ref.trim().toUpperCase())
    .maybeSingle()
  // Same answer whether the code or the email is wrong, so codes can't be probed.
  if (!data || data.filer_email !== email.trim().toLowerCase()) return null
  return data as unknown as {
    id: string
    court_id: string
    reference: string
    title: string
    status: string
    case_type: string
    query_note: string | null
    rejection_reason: string | null
    fee_assessment: { items: { label: string; amount: number }[]; total: number } | null
    payment_reference: string | null
    created_at: string
    filer_email: string
    court: { name: string }
    case: { suit_number: string } | null
  }
}

async function submitPayment(form: FormData) {
  'use server'
  const ref = String(form.get('ref'))
  const email = String(form.get('email'))
  const receipt = String(form.get('receipt') ?? '').trim().slice(0, 80)
  const filing = await findFiling(ref, email)
  if (!filing || filing.status !== 'assessed' || !receipt) redirect(`/track?ref=${ref}&email=${encodeURIComponent(email)}&error=payment`)
  await createAdminClient()
    .from('filings')
    .update({ status: 'paid', payment_reference: receipt, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', filing.id)
  await logEvent({ court_id: filing.court_id, filing_id: filing.id, action: 'filing.paid', actor_label: 'Filer', detail: { receipt } })
  redirect(`/track?ref=${ref}&email=${encodeURIComponent(email)}`)
}

async function respondToQuery(form: FormData) {
  'use server'
  const ref = String(form.get('ref'))
  const email = String(form.get('email'))
  const response = String(form.get('response') ?? '').trim().slice(0, 4000)
  const filing = await findFiling(ref, email)
  if (!filing || filing.status !== 'queried' || !response) redirect(`/track?ref=${ref}&email=${encodeURIComponent(email)}&error=response`)
  await createAdminClient().from('filings').update({ status: 'under_review', updated_at: new Date().toISOString() }).eq('id', filing.id)
  await logEvent({ court_id: filing.court_id, filing_id: filing.id, action: 'filing.responded', actor_label: 'Filer', detail: { response } })
  redirect(`/track?ref=${ref}&email=${encodeURIComponent(email)}`)
}

export default async function TrackPage({ searchParams }: { searchParams: { ref?: string; email?: string; error?: string } }) {
  const ref = searchParams.ref ?? ''
  const email = searchParams.email ?? ''
  const filing = ref && email && isConfigured() ? await findFiling(ref, email) : null
  const events = filing
    ? ((await createAdminClient().from('case_events').select('action, actor_label, detail, created_at').eq('filing_id', filing.id).order('created_at')).data ?? [])
    : []

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[13px] text-ink-500">Track a filing</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900">Where is my filing?</h1>

        <form className="mt-8 grid gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card sm:grid-cols-[1fr_1.4fr_auto]">
          <input name="ref" defaultValue={ref} placeholder="EF-XXXXXX" className={input + ' font-mono uppercase'} aria-label="Tracking code" required />
          <input name="email" type="email" defaultValue={email} placeholder="Email used to file" className={input} aria-label="Email" required />
          <button className={btn.primary}>Track</button>
        </form>

        {ref && email && !filing && (
          <div className="mt-6">
            <Notice tone="warn">We couldn’t find a filing with that code and email. Check both and try again.</Notice>
          </div>
        )}

        {filing && (
          <div className="mt-10 space-y-6">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Mono className="text-ink-400">{filing.reference}</Mono>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900">{filing.title}</h2>
                  <p className="mt-1 text-sm text-ink-500">
                    {filing.court.name} · {label(CASE_TYPES, filing.case_type)}
                  </p>
                </div>
                <Badge tone={FILING_STATUS[filing.status]?.tone}>{FILING_STATUS[filing.status]?.label}</Badge>
              </div>
              <p className="mt-4 text-ink-600">{FILING_STATUS[filing.status]?.help}</p>

              {filing.case && (
                <div className="mt-5 rounded-2xl border border-verdict-500/20 bg-verdict-50 p-5">
                  <p className="text-sm text-verdict-700">Your suit number</p>
                  <p className="mt-1 font-mono text-2xl font-medium text-ink-900">{filing.case.suit_number}</p>
                </div>
              )}

              {filing.status === 'queried' && (
                <div className="mt-5 space-y-4">
                  <Notice tone="warn">
                    <span className="font-semibold">The registry asks: </span>
                    {filing.query_note}
                  </Notice>
                  <form action={respondToQuery} className="space-y-3">
                    <input type="hidden" name="ref" value={ref} />
                    <input type="hidden" name="email" value={email} />
                    <Field label="Your response">
                      <textarea name="response" className={input + ' min-h-[100px]'} required />
                    </Field>
                    <button className={btn.primary}>Send to registry</button>
                  </form>
                </div>
              )}

              {filing.status === 'rejected' && filing.rejection_reason && (
                <div className="mt-5">
                  <Notice tone="bad">{filing.rejection_reason}</Notice>
                </div>
              )}

              {filing.fee_assessment && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-ink-800">Fee assessment</h3>
                  <table className="mt-3 w-full text-sm">
                    <tbody className="divide-y divide-ink-100">
                      {filing.fee_assessment.items.map((it, i) => (
                        <tr key={i}>
                          <td className="py-2 text-ink-600">{it.label}</td>
                          <td className="py-2 text-right tabular-nums text-ink-800">{naira(it.amount)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="pt-3 font-semibold text-ink-900">Total</td>
                        <td className="pt-3 text-right font-display text-lg font-semibold tabular-nums text-ink-900">{naira(filing.fee_assessment.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                  {filing.status === 'assessed' && (
                    <form action={submitPayment} className="mt-5 grid gap-3 rounded-2xl bg-parchment p-4 sm:grid-cols-[1fr_auto] sm:items-end">
                      <input type="hidden" name="ref" value={ref} />
                      <input type="hidden" name="email" value={email} />
                      <Field label="Receipt or RRR number" hint="Pay at the court’s designated bank or via Remita, then enter the reference here.">
                        <input name="receipt" className={input + ' font-mono'} required />
                      </Field>
                      <button className={btn.primary}>Submit payment</button>
                    </form>
                  )}
                  {filing.payment_reference && (
                    <p className="mt-3 text-sm text-ink-500">
                      Payment reference: <Mono>{filing.payment_reference}</Mono>
                    </p>
                  )}
                </div>
              )}
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-ink-800">History</h3>
              <ol className="mt-4 space-y-4">
                {events.map((e, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brass-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-800">{EVENT_LABELS[e.action] ?? e.action}</p>
                      <p className="text-xs text-ink-400">{dateTime(e.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        )}
      </div>
    </PublicShell>
  )
}
