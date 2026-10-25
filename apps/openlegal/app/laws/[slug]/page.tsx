import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Shell, Tag } from '@/components/site'
import { isConfigured } from '@/lib/db'
import { getLaw } from '@/lib/queries'

export const revalidate = 600

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const law = isConfigured() ? await getLaw(params.slug) : null
  return { title: law?.short_title ?? law?.title ?? 'Law', description: law?.description ?? undefined }
}

export default async function LawPage({ params }: { params: { slug: string } }) {
  if (!isConfigured()) notFound()
  const law = await getLaw(params.slug)
  if (!law) notFound()

  // Group sections under their part / chapter headings.
  const parts: { part: string | null; sections: typeof law.law_sections }[] = []
  for (const s of law.law_sections) {
    const last = parts[parts.length - 1]
    if (last && last.part === s.part) last.sections.push(s)
    else parts.push({ part: s.part, sections: [s] })
  }

  return (
    <Shell query="">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Link href="/laws" className="text-sm text-ink-3 hover:text-naija-700">
          ← Laws
        </Link>
        <header className="mt-4 max-w-4xl">
          <h1 className="font-serif text-4xl font-medium leading-tight tracking-tight text-ink sm:text-5xl">{law.title}</h1>
          {law.description && <p className="mt-4 text-lg text-ink-2">{law.description}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <Tag>{law.jurisdiction === 'federal' ? 'Federal' : `${law.jurisdiction} State`}</Tag>
            {law.year && <Tag>{law.year}</Tag>}
            <Tag tone="green">{law.law_sections.length} sections on OpenLegal</Tag>
          </div>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav className="hidden lg:sticky lg:top-24 lg:block lg:self-start" aria-label="Sections">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Contents</p>
            <ul className="mt-3 max-h-[70vh] space-y-1 overflow-y-auto text-sm">
              {law.law_sections.map((s) => (
                <li key={s.id}>
                  <a href={`#s-${s.number}`} className="block rounded-md px-2 py-1 text-ink-2 hover:bg-paper-2 hover:text-naija-700">
                    <span className="font-mono text-xs text-ink-4">s.{s.number}</span> {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="max-w-[72ch]">
            {parts.map((p, i) => (
              <section key={i}>
                {p.part && <h2 className="mb-6 border-b border-ink-line pb-3 font-serif text-2xl font-semibold text-ink">{p.part}</h2>}
                <div className="space-y-8">
                  {p.sections.map((s) => (
                    <section key={s.id} id={`s-${s.number}`} className="scroll-mt-24">
                      <h3 className="flex items-baseline gap-3">
                        <a href={`#s-${s.number}`} className="font-mono text-sm text-naija-600 hover:underline">
                          § {s.number}
                        </a>
                        <span className="font-serif text-xl font-semibold text-ink">{s.heading}</span>
                      </h3>
                      <p className="prose-judgment mt-2 whitespace-pre-line">{s.body}</p>
                    </section>
                  ))}
                </div>
              </section>
            ))}
            <p className="mt-12 rounded-xl bg-paper-2 p-4 text-sm text-ink-3">
              {law.source_url ? (
                <>
                  Source:{' '}
                  <a href={law.source_url} className="underline">
                    {law.source_url}
                  </a>
                  .{' '}
                </>
              ) : null}
              Text is provided for reference. Where a provision has been amended, confirm the current text against the official gazette.
            </p>
          </div>
        </div>
      </div>
    </Shell>
  )
}
