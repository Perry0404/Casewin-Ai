import Link from 'next/link'
import type { Metadata } from 'next'
import { Shell } from '@/components/site'
import { COURT_URL } from '@/lib/constants'
import { isConfigured } from '@/lib/db'
import { courtsWithCounts } from '@/lib/queries'

export const metadata: Metadata = { title: 'Courts' }
export const revalidate = 600

export default async function CourtsPage() {
  const courts = isConfigured() ? await courtsWithCounts().catch(() => []) : []
  return (
    <Shell query="">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-naija-600">Publishing courts</p>
        <h1 className="mt-2 font-serif text-5xl font-medium tracking-tight text-ink">The courts behind the law</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-2">Every judgment here was published by the registry of the court that delivered it.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {courts.map((c) => (
            <Link key={c.name} href={`/search?court=${encodeURIComponent(c.name)}`} className="group rounded-2xl border border-ink-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
              <p className="font-serif text-2xl font-semibold text-ink group-hover:text-naija-700">{c.name}</p>
              <p className="mt-1 text-sm text-ink-3">{c.state ? `${c.state} State` : ''}</p>
              <p className="mt-5 font-serif text-4xl text-ink">{c.count.toLocaleString()}</p>
              <p className="text-sm text-ink-3">published judgment{c.count === 1 ? '' : 's'}</p>
            </Link>
          ))}
          <a href={`${COURT_URL}/onboard`} className="flex flex-col justify-center rounded-2xl border border-dashed border-ink-4 p-6 text-center transition hover:border-naija-500 hover:bg-white">
            <p className="font-serif text-xl font-semibold text-ink">Is your court missing?</p>
            <p className="mt-1 text-sm text-ink-3">Courts join through CaseWin Court and publish in one click →</p>
          </a>
        </div>
      </div>
    </Shell>
  )
}
