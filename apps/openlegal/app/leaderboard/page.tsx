import Link from 'next/link'
import type { Metadata } from 'next'
import { Shell } from '@/components/site'
import { adminDb } from '@/lib/admin-db'
import { isConfigured } from '@/lib/db'

export const metadata: Metadata = { title: 'Leaderboard' }
export const revalidate = 300

interface Row {
  id: string
  display_name: string
  institution: string | null
  role: string
  points: number
  verified_count: number
}

export default async function Leaderboard() {
  const rows: Row[] = isConfigured()
    ? (((await adminDb().from('contributor_leaderboard').select('*').order('points', { ascending: false }).limit(100)).data ?? []) as Row[])
    : []

  const byInstitution = new Map<string, { points: number; people: number }>()
  for (const r of rows) {
    if (!r.institution) continue
    const e = byInstitution.get(r.institution) ?? { points: 0, people: 0 }
    e.points += r.points
    e.people++
    byInstitution.set(r.institution, e)
  }
  const schools = Array.from(byInstitution, ([name, v]) => ({ name, ...v })).sort((a, b) => b.points - a.points).slice(0, 10)

  return (
    <Shell query="">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-naija-600">Contributor network</p>
        <h1 className="mt-2 font-serif text-5xl font-medium tracking-tight text-ink">Leaderboard</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-2">The people putting Nigerian law online. Points come only from judgments verified as new.</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-ink-line bg-white shadow-card">
            {rows.length ? (
              <ol className="divide-y divide-ink-line">
                {rows.map((r, i) => (
                  <li key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className={`w-8 text-center font-serif text-xl ${i < 3 ? 'text-naija-600' : 'text-ink-4'}`}>{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{r.display_name}</span>
                      <span className="block truncate text-xs text-ink-3">{[r.institution, r.role].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-serif text-xl text-ink">{r.points.toLocaleString()}</span>
                      <span className="block text-xs text-ink-3">{r.verified_count} verified</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="p-12 text-center text-ink-3">
                No points awarded yet. <Link href="/contribute" className="font-semibold text-naija-700 underline">Be the first →</Link>
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card lg:self-start">
            <h2 className="font-serif text-2xl font-semibold text-ink">Top institutions</h2>
            {schools.length ? (
              <ol className="mt-4 space-y-3">
                {schools.map((s, i) => (
                  <li key={s.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="mr-2 text-ink-4">{i + 1}.</span>
                      <span className="text-ink">{s.name}</span>
                      <span className="block pl-5 text-xs text-ink-3">
                        {s.people} contributor{s.people === 1 ? '' : 's'}
                      </span>
                    </span>
                    <span className="font-serif text-lg text-ink">{s.points.toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-ink-3">Law schools and firms appear here as their members contribute.</p>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
