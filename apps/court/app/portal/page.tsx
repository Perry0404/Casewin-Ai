import Link from 'next/link'
import type { Metadata } from 'next'
import { requireFiler } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_TYPES, FILING_STATUS, HEARING_PURPOSES, label } from '@/lib/constants'
import { dateTime, naira, relative } from '@/lib/format'
import { Badge, Card, CardTitle, Empty, Mono, PageHeader, btn } from '@/components/ui'

export const metadata: Metadata = { title: 'My filings' }

const FILER_TYPE: Record<string, string> = { lawyer: 'Counsel', litigant: 'Party in person', agency: 'Government agency' }

export default async function Portal() {
  const filer = await requireFiler()
  const db = createAdminClient()
  const { data: filings } = await db
    .from('filings')
    .select('id, reference, title, status, case_type, fee_assessment, query_note, created_at, updated_at, court:courts(name), case:cases(id, suit_number, status, next_hearing_at)')
    .or(`filer_user_id.eq.${filer.user_id},filer_email.eq.${filer.email.toLowerCase()}`)
    .order('created_at', { ascending: false })
    .limit(100)

  type Row = NonNullable<typeof filings>[number] & { court: { name: string }; case: { id: string; suit_number: string; status: string; next_hearing_at: string | null } | null }
  const rows = (filings ?? []) as unknown as Row[]
  const attention = rows.filter((f) => f.status === 'assessed' || f.status === 'queried')
  const caseIds = rows.map((f) => f.case?.id).filter(Boolean) as string[]
  const { data: hearings } = caseIds.length
    ? await db.from('hearings').select('scheduled_for, purpose, courtroom, case:cases(suit_number, title), judge:judges(name)').in('case_id', caseIds).is('outcome', null).gte('scheduled_for', new Date().toISOString()).order('scheduled_for').limit(10)
    : { data: [] }

  const track = (ref: string) => `/track?ref=${ref}&email=${encodeURIComponent(filer.email)}`

  return (
    <>
      <PageHeader
        eyebrow={`${FILER_TYPE[filer.filer_type]}${filer.bar_number ? ` · ${filer.bar_number}` : ''}${filer.law_firm ? ` · ${filer.law_firm}` : ''}`}
        title={`Welcome, ${filer.full_name.split(' ')[0]}.`}
        sub="Your e-filing portal: every case you have filed, what the registry needs from you, and your next dates in court."
        actions={
          <Link href="/file" className={btn.primary}>
            File a new case
          </Link>
        }
      />

      {attention.length > 0 && (
        <Card className="mb-6 ring-2 ring-brass-300">
          <CardTitle sub="The registry is waiting on you">Needs your attention</CardTitle>
          <ul className="divide-y divide-ink-100">
            {attention.map((f) => (
              <li key={f.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink-900">{f.title}</span>
                  <span className="block text-sm text-ink-500">
                    {f.status === 'assessed' ? `Pay the assessed fees of ${naira(f.fee_assessment?.total)} and enter your receipt number.` : `The registry asked: ${f.query_note}`}
                  </span>
                </span>
                <Link href={track(f.reference)} className={btn.secondary}>
                  {f.status === 'assessed' ? 'Enter payment' : 'Respond'}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card pad={false}>
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle>Your filings</CardTitle>
          </div>
          {rows.length ? (
            <ul className="divide-y divide-ink-100 border-t border-ink-100">
              {rows.map((f) => (
                <li key={f.id}>
                  <Link href={track(f.reference)} className="flex flex-col gap-2 px-5 py-4 transition hover:bg-parchment/60 sm:flex-row sm:items-center sm:px-6">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <Mono className="text-ink-400">{f.case?.suit_number ?? f.reference}</Mono>
                      </span>
                      <span className="block font-display text-lg font-semibold text-ink-900">{f.title}</span>
                      <span className="block text-sm text-ink-400">
                        {f.court.name} · {label(CASE_TYPES, f.case_type)} · filed {relative(f.created_at)}
                      </span>
                    </span>
                    <Badge tone={FILING_STATUS[f.status].tone}>{FILING_STATUS[f.status].label}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6">
              <Empty title="You haven’t filed anything yet">
                <Link href="/file" className="font-medium text-ink-800 underline">
                  File your first case
                </Link>{' '}
                — it takes about ten minutes.
              </Empty>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle>Your next dates in court</CardTitle>
            {(hearings ?? []).length ? (
              <ul className="space-y-3">
                {(hearings ?? []).map((h: Record<string, any>, i: number) => (
                  <li key={i} className="rounded-xl bg-parchment p-3">
                    <p className="text-sm font-semibold text-ink-900">{dateTime(h.scheduled_for)}</p>
                    <p className="text-sm text-ink-700">{h.case?.title}</p>
                    <p className="text-xs text-ink-400">
                      <Mono className="text-[11px]">{h.case?.suit_number}</Mono> · {label(HEARING_PURPOSES, h.purpose)}
                      {h.judge?.name && ` · ${h.judge.name}`}
                      {h.courtroom && ` · ${h.courtroom}`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-400">No hearings listed yet. Dates appear here once the registry lists your case.</p>
            )}
          </Card>
          <Card>
            <CardTitle>Good to know</CardTitle>
            <ul className="space-y-2 text-sm text-ink-600">
              <li>— Upload signed, stamped processes as PDFs. Every page is fingerprinted on receipt.</li>
              <li>— Fees come from the court’s approved schedule. Pay at the designated bank or via Remita and enter the reference.</li>
              <li>— Your suit number is issued once payment is confirmed.</li>
            </ul>
            <Link href="/e-filing" className="mt-4 inline-block text-sm font-semibold text-ink-800 underline decoration-brass-300 underline-offset-4">
              Read the full e-filing guide
            </Link>
          </Card>
        </div>
      </div>
    </>
  )
}
