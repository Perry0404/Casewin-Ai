import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PublicShell } from '@/components/site'
import CauseListView from '@/components/CauseListView'
import { input, btn } from '@/components/ui'
import { getCourtBySlug } from '@/lib/data'
import { causeList } from '@/lib/causelist'
import { date, lagosToday } from '@/lib/format'
import { isConfigured } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const court = isConfigured() ? await getCourtBySlug(params.slug) : null
  return { title: court ? `Cause list — ${court.name}` : 'Cause list' }
}

export default async function PublicCauseList({ params, searchParams }: { params: { slug: string }; searchParams: { date?: string } }) {
  if (!isConfigured()) notFound()
  const court = await getCourtBySlug(params.slug)
  if (!court) notFound()
  const day = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? '') ? searchParams.date! : lagosToday()
  const groups = await causeList(court.id, day, { publicView: true })
  const total = groups.reduce((n, g) => n + g.items.length, 0)

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/cause-list" className="no-print text-sm text-ink-400 hover:text-ink-700">
          ← All courts
        </Link>
        <div className="mt-4 flex flex-col justify-between gap-6 border-b border-ink-200 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-600">Cause list</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900">{court.name}</h1>
            <p className="mt-2 text-lg text-ink-500">
              {date(day + 'T12:00:00+01:00', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {total} matter{total === 1 ? '' : 's'}
            </p>
          </div>
          <form className="no-print flex gap-2">
            <input type="date" name="date" defaultValue={day} className={input} aria-label="Date" />
            <button className={btn.secondary}>Go</button>
          </form>
        </div>
        <div className="mt-8">
          <CauseListView groups={groups} />
        </div>
        <p className="mt-6 text-xs text-ink-400">Times are West Africa Time. Lists can change on the day; confirm with the registry.</p>
      </div>
    </PublicShell>
  )
}
