import Link from 'next/link'
import type { Metadata } from 'next'
import { Shell, Tag } from '@/components/site'
import { isConfigured } from '@/lib/db'
import { listLaws } from '@/lib/queries'

export const metadata: Metadata = { title: 'Laws of Nigeria' }
export const revalidate = 600

export default async function LawsPage() {
  const laws = isConfigured() ? await listLaws().catch(() => []) : []
  return (
    <Shell query="">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-naija-600">Statutes</p>
        <h1 className="mt-2 font-serif text-5xl font-medium tracking-tight text-ink">Laws of Nigeria</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-2">Stored section by section, so search can take you to the exact provision.</p>
        <div className="mt-10 divide-y divide-ink-line overflow-hidden rounded-2xl border border-ink-line bg-white shadow-card">
          {laws.map((l) => (
            <Link key={l.id} href={`/laws/${l.slug}`} className="group flex flex-col gap-2 p-6 transition hover:bg-paper sm:flex-row sm:items-center">
              <div className="flex-1">
                <h2 className="font-serif text-2xl font-semibold text-ink group-hover:text-naija-700">{l.title}</h2>
                {l.description && <p className="mt-1 text-ink-2">{l.description}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <Tag>{l.jurisdiction === 'federal' ? 'Federal' : `${l.jurisdiction} State`}</Tag>
                <Tag tone="green">
                  {l.sections} section{l.sections === 1 ? '' : 's'}
                </Tag>
              </div>
            </Link>
          ))}
          {laws.length === 0 && <p className="p-10 text-center text-ink-3">Statutes are being loaded.</p>}
        </div>
      </div>
    </Shell>
  )
}
