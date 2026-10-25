import Link from 'next/link'
import type { Metadata } from 'next'
import { PublicShell } from '@/components/site'
import { Notice } from '@/components/ui'
import { listCourts } from '@/lib/data'
import { isConfigured } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Cause lists' }
export const dynamic = 'force-dynamic'

export default async function CauseListIndex() {
  const courts = isConfigured() ? await listCourts() : []
  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-600">Public cause lists</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900">Which cases are in court today?</h1>
        <p className="mt-3 text-lg text-ink-500">Updated live by each court’s registry.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {courts.map((c) => (
            <Link key={c.id} href={`/cause-list/${c.slug}`} className="group rounded-2xl border border-ink-100 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
              <p className="font-display text-xl font-semibold text-ink-900">{c.name}</p>
              <p className="mt-1 text-sm text-ink-400">
                {c.state} State · {c.divisions.length} division{c.divisions.length === 1 ? '' : 's'}
              </p>
              <p className="mt-4 text-sm font-semibold text-ink-700 group-hover:text-ink-900">Today’s list →</p>
            </Link>
          ))}
          {courts.length === 0 && <Notice>No courts are publishing cause lists yet.</Notice>}
        </div>
      </div>
    </PublicShell>
  )
}
