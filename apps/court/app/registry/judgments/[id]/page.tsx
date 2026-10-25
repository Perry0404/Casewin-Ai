import Link from 'next/link'
import { notFound } from 'next/navigation'
import { can, requireStaff } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_TYPES, OPENLEGAL_URL, label } from '@/lib/constants'
import { date, dateTime } from '@/lib/format'
import { Badge, Card, CardTitle, Mono, Notice, PageHeader, SampleTag, btn, input } from '@/components/ui'
import { publishJudgment, withdrawJudgment } from '../../actions'

export const metadata = { title: 'Judgment' }

// Patterns that often signal details which must be redacted before publication.
const REDACTION_HINTS: [RegExp, string][] = [
  [/\b(minor|child|aged \d{1,2}|\d{1,2}[- ]year[- ]old)\b/i, 'mentions a child or a person’s age'],
  [/\b(rape|sexual|defilement|indecent)\b/i, 'concerns a sexual offence — the victim’s identity must be withheld'],
  [/\b(in camera|under seal|sealed)\b/i, 'refers to sealed or in-camera proceedings'],
  [/\b(\+?234|0)[789][01]\d{8}\b/, 'contains what looks like a phone number'],
  [/\b\d{11}\b/, 'contains an 11-digit number (possible NIN or BVN)'],
]

export default async function JudgmentDetail({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const staff = await requireStaff()
  const db = createAdminClient()
  const { data: j } = await db.from('judgments').select('*').eq('id', params.id).eq('court_id', staff.court_id).maybeSingle()
  if (!j) notFound()

  const hints = REDACTION_HINTS.filter(([re]) => re.test(j.full_text)).map(([, why]) => why)
  const publicUrl = `${OPENLEGAL_URL}/judgments/${j.slug}`

  return (
    <>
      <Link href="/registry/judgments" className="text-sm text-ink-400 hover:text-ink-700">
        ← Judgments
      </Link>
      <div className="mt-3">
        <PageHeader
          eyebrow={j.suit_number}
          title={j.title}
          sub={`${label(CASE_TYPES, j.case_type)} · delivered ${date(j.delivered_on)} · ${j.judges.join(', ')}`}
          actions={
            <div className="flex items-center gap-2">
              {j.is_sample && <SampleTag />}
              <Badge tone={j.status === 'published' ? 'good' : j.status === 'draft' ? 'warn' : 'neutral'}>{j.status === 'draft' ? 'Draft — not public' : j.status === 'published' ? 'Published' : 'Withdrawn'}</Badge>
            </div>
          }
        />
      </div>
      {searchParams.error === 'redaction' && (
        <div className="mb-6">
          <Notice tone="bad">Confirm the redaction check before publishing.</Notice>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          {j.holding && (
            <div className="mb-6 rounded-xl border-l-4 border-brass-400 bg-parchment px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brass-600">Holding</p>
              <p className="mt-1 font-display text-lg text-ink-900">{j.holding}</p>
            </div>
          )}
          <article className="max-h-[70vh] overflow-y-auto whitespace-pre-line font-serif text-[16px] leading-[1.75] text-ink-800">{j.full_text}</article>
        </Card>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          {j.status === 'published' ? (
            <Card>
              <CardTitle sub={`Published ${dateTime(j.published_at)}`}>Live on OpenLegal Nigeria</CardTitle>
              <a href={publicUrl} target="_blank" rel="noreferrer" className={btn.primary + ' w-full'}>
                View public page ↗
              </a>
              {can(staff, 'judgments.publish') && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-seal-600">Withdraw from publication</summary>
                  <form action={withdrawJudgment} className="mt-3 space-y-2">
                    <input type="hidden" name="id" value={j.id} />
                    <input name="reason" required placeholder="Reason" className={input + ' text-sm'} />
                    <button className={btn.danger + ' w-full'}>Withdraw</button>
                  </form>
                </details>
              )}
            </Card>
          ) : (
            <>
              <Card>
                <CardTitle sub="Run before every publication">Redaction check</CardTitle>
                {hints.length ? (
                  <ul className="space-y-2">
                    {hints.map((h) => (
                      <li key={h} className="flex gap-2 rounded-lg bg-amberline-50 px-3 py-2 text-sm text-amberline-600">
                        <span aria-hidden>⚠</span> The text {h}.
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-500">No obvious sensitive details detected. Still read the judgment before publishing — this check only catches common patterns.</p>
                )}
                <Link href={`/registry/judgments/new?edit=${j.id}`} className={btn.secondary + ' mt-4 w-full'}>
                  Edit text
                </Link>
              </Card>
              {can(staff, 'judgments.publish') ? (
                <Card className="ring-2 ring-verdict-500/30">
                  <CardTitle>Publish to OpenLegal Nigeria</CardTitle>
                  <form action={publishJudgment} className="space-y-4">
                    <input type="hidden" name="id" value={j.id} />
                    <label className="flex gap-3 text-sm text-ink-700">
                      <input type="checkbox" name="redaction_confirmed" className="mt-0.5 h-4 w-4 accent-ink-900" required />
                      I have read this judgment and confirm that the names of minors, victims of sexual offences and any sealed material have been removed.
                    </label>
                    <button className={btn.primary + ' w-full'}>Publish</button>
                  </form>
                  <p className="mt-3 text-xs text-ink-400">
                    Will appear at <Mono className="break-all text-[11px]">{publicUrl}</Mono>
                  </p>
                </Card>
              ) : (
                <Notice tone="info">A registrar or court administrator publishes judgments.</Notice>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
