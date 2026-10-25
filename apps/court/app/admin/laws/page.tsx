import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { OPENLEGAL_URL } from '@/lib/constants'
import { Card, CardTitle, Empty, PageHeader, Stat, btn } from '@/components/ui'
import { reviewLaw } from '../actions'

export const metadata: Metadata = { title: 'OpenLegal statutes' }

export default async function LawsReview() {
  const db = createAdminClient()
  const [{ data: held }, published, sections] = await Promise.all([
    db.from('laws').select('id, slug, title, edition, source_url, source_name, law_sections(count)').eq('needs_review', true).order('title').limit(300),
    db.from('laws').select('id', { count: 'exact', head: true }).eq('is_published', true),
    db.from('law_sections').select('id', { count: 'exact', head: true }),
  ])

  return (
    <>
      <PageHeader
        eyebrow="OpenLegal Nigeria"
        title="Statutes"
        sub="Laws are imported automatically. Any whose sections didn’t parse cleanly are held here, unpublished, until you check them against the source."
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Published statutes" value={(published.count ?? 0).toLocaleString()} />
        <Stat label="Sections searchable" value={(sections.count ?? 0).toLocaleString()} />
        <Stat label="Held for review" value={(held ?? []).length} tone={(held ?? []).length ? 'warn' : 'good'} />
      </div>
      <Card pad={false}>
        <div className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardTitle sub="Open the OpenLegal page and the source side by side. Publish if the sections match; otherwise keep it hidden.">Held for review</CardTitle>
        </div>
        {(held ?? []).length ? (
          <ul className="divide-y divide-ink-100 border-t border-ink-100">
            {(held ?? []).map((l) => (
              <li key={l.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-900">{l.title}</p>
                  <p className="text-xs text-ink-400">
                    {(l.law_sections as unknown as { count: number }[])[0]?.count ?? 0} sections parsed · {l.edition} ·{' '}
                    {l.source_url && (
                      <a href={l.source_url} target="_blank" rel="noreferrer" className="underline">
                        compare with source
                      </a>
                    )}
                    {' '}· once published it appears at{' '}
                    <span className="font-mono">{OPENLEGAL_URL.replace('https://', '')}/laws/{l.slug}</span>
                  </p>
                </div>
                <form action={reviewLaw} className="flex gap-2">
                  <input type="hidden" name="id" value={l.id} />
                  <button name="decision" value="publish" className={btn.secondary}>
                    Publish
                  </button>
                  <button name="decision" value="hide" className={btn.ghost}>
                    Keep hidden
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6">
            <Empty title="Nothing held for review" icon="✓" />
          </div>
        )}
      </Card>
    </>
  )
}
