import Link from 'next/link'
import type { Metadata } from 'next'
import { Shell, Tag, cx } from '@/components/site'
import { db, isConfigured } from '@/lib/db'

export const metadata: Metadata = { title: 'Laws of Nigeria' }
export const revalidate = 600

interface LawRow {
  slug: string
  title: string
  year: number | null
  jurisdiction: string
  edition: string | null
  long_title: string | null
}

async function allLaws(): Promise<LawRow[]> {
  const out: LawRow[] = []
  for (let from = 0; from < 5000; from += 1000) {
    const { data } = await db().from('laws').select('slug, title, year, jurisdiction, edition, long_title').order('title').range(from, from + 999)
    if (!data?.length) break
    out.push(...(data as LawRow[]))
    if (data.length < 1000) break
  }
  return out
}

export default async function LawsPage({ searchParams }: { searchParams: { q?: string; letter?: string } }) {
  const laws = isConfigured() ? await allLaws().catch(() => []) : []
  const q = (searchParams.q ?? '').trim().toLowerCase()
  const letters = Array.from(new Set(laws.map((l) => l.title[0]?.toUpperCase()).filter((c) => /[A-Z]/.test(c)))).sort()
  const letter = searchParams.letter?.toUpperCase()
  const shown = laws.filter((l) => (q ? l.title.toLowerCase().includes(q) || (l.long_title ?? '').toLowerCase().includes(q) : letter ? l.title.toUpperCase().startsWith(letter) : true))

  return (
    <Shell query="">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="text-[13px] text-ink-3">Statutes</p>
        <h1 className="mt-2 font-serif text-5xl font-medium tracking-tight text-ink">Laws of Nigeria</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-2">
          {laws.length.toLocaleString()} statutes, stored section by section so search takes you to the exact provision. Every law shows where its
          text came from and how current it is.
        </p>

        <form className="mt-8 flex max-w-xl gap-2">
          <input name="q" defaultValue={searchParams.q} placeholder="Find a law by name, e.g. “arbitration”" className="w-full rounded-xl border border-ink-line bg-white px-4 py-3 shadow-card focus:border-naija-500 focus:outline-none focus:ring-4 focus:ring-naija-100" />
          <button className="rounded-xl bg-naija-500 px-5 font-semibold text-white hover:bg-naija-600">Find</button>
        </form>
        <p className="mt-2 text-sm text-ink-3">
          Looking for a provision rather than a law?{' '}
          <Link href="/search" className="text-naija-700 underline underline-offset-4">
            Search the text of every section
          </Link>
          .
        </p>

        <nav className="mt-8 flex flex-wrap gap-1" aria-label="Browse by letter">
          <Link href="/laws" className={cx('rounded-lg px-2.5 py-1 text-sm', !letter && !q ? 'bg-ink text-white' : 'text-ink-2 hover:bg-paper-2')}>
            All
          </Link>
          {letters.map((l) => (
            <Link key={l} href={`/laws?letter=${l}`} className={cx('rounded-lg px-2.5 py-1 text-sm', letter === l ? 'bg-ink text-white' : 'text-ink-2 hover:bg-paper-2')}>
              {l}
            </Link>
          ))}
        </nav>

        <div className="mt-6 divide-y divide-ink-line overflow-hidden rounded-2xl border border-ink-line bg-white shadow-card">
          {shown.slice(0, 400).map((l) => (
            <Link key={l.slug} href={`/laws/${l.slug}`} className="group flex flex-col gap-1 px-6 py-4 transition hover:bg-paper sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-lg font-semibold text-ink group-hover:text-naija-700">{l.title}</h2>
                {l.long_title && <p className="line-clamp-1 text-sm text-ink-3">{l.long_title}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                {l.edition && <Tag>{l.edition}</Tag>}
                <Tag tone="green">{l.jurisdiction === 'federal' ? 'Federal' : `${l.jurisdiction} State`}</Tag>
              </div>
            </Link>
          ))}
          {shown.length === 0 && <p className="p-10 text-center text-ink-3">No law matches “{searchParams.q ?? letter}”.</p>}
        </div>
        {shown.length > 400 && <p className="mt-4 text-sm text-ink-3">Showing the first 400 — pick a letter or search to narrow down.</p>}
      </div>
    </Shell>
  )
}
