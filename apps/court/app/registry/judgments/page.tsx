import Link from 'next/link'
import type { Metadata } from 'next'
import { requireStaff } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { CASE_TYPES, OPENLEGAL_URL, label } from '@/lib/constants'
import { date } from '@/lib/format'
import { Badge, Empty, Mono, PageHeader, SampleTag } from '@/components/ui'

export const metadata: Metadata = { title: 'Judgments' }

const STATUS = {
  draft: { label: 'Draft — not public', tone: 'warn' as const },
  published: { label: 'Published', tone: 'good' as const },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' as const },
}

export default async function JudgmentsPage() {
  const staff = await requireStaff()
  const db = createAdminClient()
  const { data: judgments } = await db
    .from('judgments')
    .select('id, slug, title, suit_number, case_type, delivered_on, status, is_sample, judges')
    .eq('court_id', staff.court_id)
    .order('status')
    .order('delivered_on', { ascending: false })
    .limit(200)
  const drafts = (judgments ?? []).filter((j) => j.status === 'draft').length

  return (
    <>
      <PageHeader
        eyebrow="Judgments"
        title="Judgments & publication"
        sub={
          <>
            Upload a judgment from its case file. Once a registrar confirms redaction, it is published free on{' '}
            <a href={OPENLEGAL_URL} className="font-medium text-ink-800 underline decoration-verdict-500/40 underline-offset-4">
              OpenLegal Nigeria
            </a>
            .{drafts > 0 && ` ${drafts} draft${drafts === 1 ? ' is' : 's are'} waiting.`}
          </>
        }
      />
      {judgments?.length ? (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
          <ul className="divide-y divide-ink-100">
            {judgments.map((j) => (
              <li key={j.id} className="relative flex flex-col gap-2 px-5 py-4 transition hover:bg-parchment/50 sm:flex-row sm:items-center">
                <span className="min-w-0 flex-1">
                  <Mono className="text-ink-400">{j.suit_number}</Mono>
                  <Link href={`/registry/judgments/${j.id}`} className="block font-display text-lg font-semibold text-ink-900 after:absolute after:inset-0">
                    {j.title}
                  </Link>
                  <span className="flex items-center gap-2 text-sm text-ink-400">
                    {label(CASE_TYPES, j.case_type)} · delivered {date(j.delivered_on)} · {j.judges.join(', ')}
                    {j.is_sample && <SampleTag />}
                  </span>
                </span>
                <Badge tone={STATUS[j.status as keyof typeof STATUS].tone}>{STATUS[j.status as keyof typeof STATUS].label}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Empty title="No judgments yet">Open a case and choose “Upload judgment” once it is delivered.</Empty>
      )}
    </>
  )
}
