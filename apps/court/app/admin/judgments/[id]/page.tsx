import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_TYPES, OPENLEGAL_URL, label } from '@/lib/constants'
import { date, dateTime } from '@/lib/format'
import { redactionHints } from '@/lib/redaction'
import { Badge, Card, CardTitle, Mono, Notice, PageHeader, SampleTag, btn, input } from '@/components/ui'
import { adminPublishJudgment, adminWithdrawJudgment } from '../../actions'

export const metadata: Metadata = { title: 'Court judgment' }

// A judgment uploaded by a court registry, reviewed by the platform administrator.
export default async function AdminJudgment({ params, searchParams }: { params: { id: string }; searchParams: { error?: string; done?: string } }) {
  const db = createAdminClient()
  const { data: j } = await db.from('judgments').select('*, court:courts(name, state)').eq('id', params.id).maybeSingle()
  if (!j) notFound()
  const { data: uploader } = j.uploaded_by ? await db.from('court_staff').select('full_name, role').eq('id', j.uploaded_by).maybeSingle() : { data: null }
  const court = j.court as unknown as { name: string; state: string } | null
  const hints = redactionHints(j.full_text)
  const publicUrl = `${OPENLEGAL_URL}/judgments/${j.slug}`
  const statusLabel = j.status === 'draft' ? 'Waiting for approval' : j.status === 'published' ? 'Published' : 'Withdrawn'

  return (
    <>
      <Link href="/admin/submissions" className="text-sm text-ink-500 hover:text-ink-900">
        ← Judgments
      </Link>
      <div className="mt-3">
        <PageHeader
          eyebrow={`${court?.name ?? j.court_name ?? 'Court'}${j.suit_number ? ` · ${j.suit_number}` : ''}`}
          title={j.title}
          sub={[label(CASE_TYPES, j.case_type), j.delivered_on && `delivered ${date(j.delivered_on)}`, j.judges?.length && j.judges.join(', ')].filter(Boolean).join(' · ')}
          actions={
            <div className="flex items-center gap-2">
              {j.is_sample && <SampleTag />}
              <Badge tone={j.status === 'published' ? 'good' : j.status === 'draft' ? 'warn' : 'neutral'}>{statusLabel}</Badge>
            </div>
          }
        />
      </div>
      {searchParams.error === 'redaction' && (
        <div className="mb-6">
          <Notice tone="bad">Tick the redaction confirmation before publishing.</Notice>
        </div>
      )}
      {searchParams.error === 'reason' && (
        <div className="mb-6">
          <Notice tone="bad">Give a reason for withdrawing.</Notice>
        </div>
      )}
      {searchParams.done && (
        <div className="mb-6">
          <Notice tone="good">Judgment {searchParams.done}. The court’s case file records who did it.</Notice>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          {j.holding && (
            <div className="mb-6 border-l-2 border-brass-600 bg-parchment px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brass-600">Holding</p>
              <p className="mt-1 font-serif text-lg text-ink-900">{j.holding}</p>
            </div>
          )}
          {j.summary && <p className="mb-6 text-[15px] text-ink-700">{j.summary}</p>}
          <article className="max-h-[75vh] overflow-y-auto whitespace-pre-line font-serif text-[16px] leading-[1.75] text-ink-800">{j.full_text}</article>
        </Card>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardTitle>Where it came from</CardTitle>
            <dl className="space-y-2 text-sm">
              <Item k="Court" v={court ? `${court.name}, ${court.state}` : j.court_name} />
              <Item k="Uploaded by" v={uploader ? `${uploader.full_name} (${uploader.role.replace(/_/g, ' ')})` : j.source === 'community' ? 'OpenLegal contributor' : '—'} />
              <Item k="Uploaded" v={dateTime(j.created_at)} />
              {j.published_at && <Item k="Published" v={dateTime(j.published_at)} />}
            </dl>
          </Card>

          {j.status === 'draft' && (
            <>
              <Card>
                <CardTitle sub="Run before every publication">Redaction check</CardTitle>
                {hints.length ? (
                  <ul className="space-y-2">
                    {hints.map((h) => (
                      <li key={h} className="flex gap-2 rounded-md bg-amberline-50 px-3 py-2 text-sm text-amberline-600">
                        <span aria-hidden>⚠</span> The text {h}.
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-500">No obvious sensitive details found. Still read the judgment: this check only catches common patterns.</p>
                )}
              </Card>
              <Card>
                <CardTitle>Approve and publish</CardTitle>
                <form action={adminPublishJudgment} className="space-y-4">
                  <input type="hidden" name="id" value={j.id} />
                  <label className="flex gap-3 text-sm text-ink-700">
                    <input type="checkbox" name="redaction_confirmed" className="mt-0.5 h-4 w-4 accent-ink-900" required />
                    I have read this judgment and confirm that the names of minors, victims of sexual offences and any sealed material have been removed.
                  </label>
                  <button className={btn.primary + ' w-full'}>Approve and publish to OpenLegal</button>
                </form>
                <p className="mt-3 text-xs text-ink-500">
                  Will appear at <Mono className="break-all text-[11px]">{publicUrl}</Mono>
                </p>
              </Card>
            </>
          )}

          {j.status === 'published' && (
            <Card>
              <CardTitle>Live on OpenLegal Nigeria</CardTitle>
              <a href={publicUrl} target="_blank" rel="noreferrer" className={btn.primary + ' w-full'}>
                View public page ↗
              </a>
            </Card>
          )}

          {j.status !== 'withdrawn' && (
            <Card>
              <details>
                <summary className="cursor-pointer text-sm text-seal-600">{j.status === 'draft' ? 'Reject (withdraw this draft)' : 'Withdraw from publication'}</summary>
                <form action={adminWithdrawJudgment} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={j.id} />
                  <input name="reason" required placeholder="Reason (kept in the court’s case file)" className={input + ' text-sm'} />
                  <button className={btn.danger + ' w-full'}>Withdraw</button>
                </form>
              </details>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

function Item({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{k}</dt>
      <dd className="text-right text-ink-900">{v || '—'}</dd>
    </div>
  )
}
