import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, Field, Mono, Notice, PageHeader, btn, input } from '@/components/ui'
import { saveJudgment } from '../../actions'

export const metadata = { title: 'Upload judgment' }

export default async function NewJudgment({ searchParams }: { searchParams: { case?: string; edit?: string; error?: string } }) {
  const staff = await requireStaff('judgments.upload')
  const db = createAdminClient()

  // Editing an existing draft, or starting from a case.
  const { data: existing } = searchParams.edit
    ? await db.from('judgments').select('*').eq('id', searchParams.edit).eq('court_id', staff.court_id).neq('status', 'published').maybeSingle()
    : { data: null }
  const caseId = existing?.case_id ?? searchParams.case
  const { data: c } = caseId ? await db.from('cases').select('id, suit_number, title').eq('id', caseId).eq('court_id', staff.court_id).maybeSingle() : { data: null }
  if (!c) notFound()

  const join = (a?: string[]) => (a ?? []).join('\n')

  return (
    <>
      <Link href={`/registry/cases/${c.id}`} className="text-sm text-ink-400 hover:text-ink-700">
        ← Back to case
      </Link>
      <div className="mt-3">
        <PageHeader eyebrow={c.suit_number} title={existing ? 'Edit judgment' : 'Upload judgment'} sub={c.title} />
      </div>
      {searchParams.error === 'short' && (
        <div className="mb-6">
          <Notice tone="bad">Paste the full text of the judgment (at least a few paragraphs).</Notice>
        </div>
      )}
      <form action={saveJudgment} className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <input type="hidden" name="case_id" value={c.id} />
        {existing && <input type="hidden" name="judgment_id" value={existing.id} />}
        <Card>
          <Field label="Full text of the judgment" required hint="Paste the delivered judgment. Remove the names of minors, victims of sexual offences and anything under seal before publishing.">
            <textarea name="full_text" required defaultValue={existing?.full_text} className={input + ' min-h-[520px] font-serif text-[15px] leading-relaxed'} />
          </Field>
        </Card>
        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <Field label="Date delivered">
                <input type="date" name="delivered_on" defaultValue={existing?.delivered_on ?? new Date().toISOString().slice(0, 10)} className={input} />
              </Field>
              <Field label="Holding" hint="The decision in one or two sentences.">
                <textarea name="holding" defaultValue={existing?.holding ?? ''} className={input + ' min-h-[80px] text-sm'} placeholder="The claim succeeds in part. The claimant is declared entitled to…" />
              </Field>
              <Field label="Plain-language summary">
                <textarea name="summary" defaultValue={existing?.summary ?? ''} className={input + ' min-h-[120px] text-sm'} />
              </Field>
            </div>
          </Card>
          <Card>
            <p className="mb-4 text-sm text-ink-500">These help people find the judgment. One per line.</p>
            <div className="space-y-4">
              <Field label="Issues for determination">
                <textarea name="issues" defaultValue={join(existing?.issues)} className={input + ' min-h-[80px] text-sm'} />
              </Field>
              <Field label="Statutes cited">
                <textarea name="statutes_cited" defaultValue={join(existing?.statutes_cited)} className={input + ' min-h-[64px] text-sm'} placeholder="Land Use Act 1978, s. 34" />
              </Field>
              <Field label="Cases cited">
                <textarea name="cases_cited" defaultValue={join(existing?.cases_cited)} className={input + ' min-h-[64px] text-sm'} />
              </Field>
              <Field label="Keywords" hint="Comma-separated">
                <input name="keywords" defaultValue={(existing?.keywords ?? []).join(', ')} className={input + ' text-sm'} placeholder="declaration of title, customary law, trespass" />
              </Field>
            </div>
          </Card>
          <button className={btn.primary + ' w-full !py-3'}>Save as draft</button>
          <p className="text-center text-xs text-ink-400">
            Saved judgments stay private until a registrar publishes them. Suit <Mono>{c.suit_number}</Mono> will be marked “judgment delivered”.
          </p>
        </div>
      </form>
    </>
  )
}
