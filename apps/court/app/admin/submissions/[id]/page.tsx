import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_TYPES } from '@/lib/constants'
import { OPENLEGAL_URL } from '@/lib/constants'
import { dateTime } from '@/lib/format'
import { Badge, Card, CardTitle, Field, Notice, PageHeader, btn, input } from '@/components/ui'
import { approveSubmission, rejectSubmission } from '../../actions'

export const metadata = { title: 'Review submission' }

const ERRORS: Record<string, string> = {
  redaction: 'Confirm the redaction check before publishing.',
  publish: 'Could not publish. Try again.',
  note: 'Add a note explaining why — the contributor sees it.',
}

export default async function ReviewSubmission({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const db = createAdminClient()
  const { data: s } = await db.from('submissions').select('*, contributor:contributors(display_name, institution, role, points)').eq('id', params.id).maybeSingle()
  if (!s) notFound()
  const { data: similar } = await db.rpc('find_existing_case', {
    p_suit: s.suit_number,
    p_court: s.court_name,
    p_title: s.title,
    p_year: s.delivered_on ? Number(String(s.delivered_on).slice(0, 4)) : null,
    p_fingerprint: '',
  })
  const others = ((similar ?? []) as { kind: string; id: string; slug: string | null; title: string }[]).filter((x) => x.id !== s.id)
  const pending = s.status === 'pending'

  return (
    <>
      <Link href="/admin/submissions" className="text-sm text-ink-400 hover:text-ink-700">
        ← Submissions
      </Link>
      <div className="mt-3">
        <PageHeader
          eyebrow={`From ${s.contributor?.display_name}${s.contributor?.institution ? ` · ${s.contributor.institution}` : ''} · via ${s.channel} · ${dateTime(s.created_at)}`}
          title={s.title}
          sub={[s.court_name, s.suit_number, s.source_note, s.source_url].filter(Boolean).join(' · ')}
          actions={<Badge tone={pending ? 'warn' : s.status === 'verified' ? 'good' : 'neutral'}>{s.status}</Badge>}
        />
      </div>
      {searchParams.error && (
        <div className="mb-6">
          <Notice tone="bad">{ERRORS[searchParams.error] ?? 'Something went wrong.'}</Notice>
        </div>
      )}
      {(s.flags as string[]).includes('possible_law_report_copy') && (
        <div className="mb-6">
          <Notice tone="bad">This text may be copied from a commercial law report. Publish only the court’s own judgment text — strip any headnotes, summaries or report pagination, or reject it.</Notice>
        </div>
      )}
      {others.length > 0 && (
        <div className="mb-6">
          <Notice tone="warn">
            Possible match already on file:{' '}
            {others.map((o) =>
              o.kind === 'judgment' ? (
                <a key={o.id} href={`${OPENLEGAL_URL}/judgments/${o.slug}`} target="_blank" rel="noreferrer" className="font-semibold underline">
                  {o.title} (published)
                </a>
              ) : (
                <Link key={o.id} href={`/admin/submissions/${o.id}`} className="font-semibold underline">
                  {o.title} (pending)
                </Link>
              ),
            )}
          </Notice>
        </div>
      )}

      <form action={approveSubmission} className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <input type="hidden" name="id" value={s.id} />
        <Card>
          <Field label="Judgment text (edit to remove anything that must not be published)">
            <textarea name="full_text" defaultValue={s.full_text} readOnly={!pending} className={input + ' min-h-[640px] font-serif text-[15px] leading-relaxed'} />
          </Field>
        </Card>
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          {pending ? (
            <>
              <Card>
                <CardTitle sub="Correct anything the contributor got wrong">Details</CardTitle>
                <div className="space-y-3">
                  <Field label="Title">
                    <input name="title" defaultValue={s.title} className={input + ' text-sm'} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Suit no.">
                      <input name="suit_number" defaultValue={s.suit_number ?? ''} className={input + ' font-mono text-sm'} />
                    </Field>
                    <Field label="Delivered">
                      <input name="delivered_on" type="date" defaultValue={s.delivered_on ?? ''} className={input + ' text-sm'} />
                    </Field>
                  </div>
                  <Field label="Court">
                    <input name="court_name" defaultValue={s.court_name} className={input + ' text-sm'} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Division">
                      <input name="division" defaultValue={s.division ?? ''} className={input + ' text-sm'} />
                    </Field>
                    <Field label="State">
                      <input name="state" className={input + ' text-sm'} />
                    </Field>
                  </div>
                  <Field label="Judges (comma-separated)">
                    <input name="judges" defaultValue={(s.judges ?? []).join(', ')} className={input + ' text-sm'} />
                  </Field>
                  <Field label="Area of law">
                    <select name="case_type" defaultValue={s.case_type ?? ''} className={input + ' text-sm'}>
                      <option value="">—</option>
                      {CASE_TYPES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Holding">
                    <textarea name="holding" className={input + ' min-h-[70px] text-sm'} />
                  </Field>
                  <Field label="Keywords">
                    <input name="keywords" className={input + ' text-sm'} placeholder="comma-separated" />
                  </Field>
                </div>
              </Card>
              <Card className="ring-2 ring-verdict-500/30">
                <CardTitle sub={`Contributor earns 10 points${s.confirmations ? `; ${s.confirmations} confirmer${s.confirmations === 1 ? '' : 's'} earn 1 each` : ''}`}>Verify &amp; publish</CardTitle>
                <label className="flex gap-3 text-sm text-ink-700">
                  <input type="checkbox" name="redaction_confirmed" required className="mt-0.5 h-4 w-4 accent-ink-900" />
                  I checked this against a reliable source, it is the court’s own text, and names of minors, victims of sexual offences and sealed material are removed.
                </label>
                <input name="note" placeholder="Note to contributor (optional)" className={input + ' mt-4 text-sm'} />
                <button className={btn.primary + ' mt-4 w-full'}>Verify &amp; publish to OpenLegal</button>
              </Card>
            </>
          ) : (
            <Card>
              <p className="text-sm text-ink-500">Reviewed {dateTime(s.reviewed_at)}.</p>
              {s.reviewer_note && <p className="mt-2 text-sm text-ink-700">{s.reviewer_note}</p>}
            </Card>
          )}
        </div>
      </form>

      {pending && (
        <form action={rejectSubmission} className="mt-6 max-w-xl rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <input type="hidden" name="id" value={s.id} />
          <p className="text-sm font-semibold text-ink-800">Not publishing it?</p>
          <input name="note" required placeholder="Reason — shown to the contributor" className={input + ' mt-3 text-sm'} />
          <div className="mt-3 flex gap-2">
            <button name="status" value="rejected" className={btn.danger}>
              Reject
            </button>
            <button name="status" value="duplicate" className={btn.secondary}>
              Mark duplicate
            </button>
          </div>
        </form>
      )}
    </>
  )
}
