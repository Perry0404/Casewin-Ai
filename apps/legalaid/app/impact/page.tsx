import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicPage } from '@/components/site'
import { Bars, INCIDENT_LABELS, Monthly, TileMap } from '@/components/NationalPicture'
import { publicStats } from '@/lib/stats'
import { nationalPicture } from '@/lib/national'

export const metadata: Metadata = { title: 'The record', description: 'Real requests, volunteers and outcomes on CaseWin Legal Aid — counted from the case record, never estimated.' }
export const revalidate = 300

export default async function Impact() {
  const [s, n] = await Promise.all([publicStats(), nationalPicture()])
  const h = s.medianHoursToAction
  return (
    <PublicPage wide>
      <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-950 sm:text-[40px]">The record</h1>
      <p className="mt-3 max-w-2xl text-[17px] text-ink-600">
        Counted live from real cases. Reports marked as not genuine are excluded; outcomes count only after a volunteer verified the facts.{' '}
        <Link href="/how-it-works" className="prose-link">
          How we verify
        </Link>{' '}
        ·{' '}
        <Link href="/clearing-house" className="prose-link">
          Who did the work
        </Link>
      </p>

      <dl className="mt-10 grid grid-cols-2 border-t border-ink-950 sm:grid-cols-4">
        {(
          [
            ['Requests for help', s.requests],
            ['Verified by a volunteer', s.verified],
            ['Taken by a volunteer', s.assigned],
            ['People released', s.released],
            ['Cases with an outcome', s.resolved],
            ['Median time to first action', h == null ? '—' : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} d`],
            ['Verified volunteers', s.volunteers],
            ['States reached', `${s.states.length} of 37`],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="border-b border-ink-200 py-4 pr-4">
            <dt className="text-[13px] text-ink-500">{k}</dt>
            <dd className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink-950 tabular-nums">{typeof v === 'number' ? v.toLocaleString() : v}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-14 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="text-[20px] font-semibold text-ink-950">Requests by state</h2>
          <p className="mb-4 mt-1 text-[14px] text-ink-600">Open cases on the platform.</p>
          <TileMap states={n.states} metric="open" label="Open cases" />
        </div>
        <div className="space-y-10">
          <div>
            <h2 className="text-[20px] font-semibold text-ink-950">How long people have been held</h2>
            <p className="mb-4 mt-1 text-[14px] text-ink-600">Everyone in custody on an open case, by days since arrest. A court must see them within 48 hours.</p>
            <Bars rows={n.custody} />
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-ink-950">Rights violations recorded</h2>
            <p className="mb-4 mt-1 text-[14px] text-ink-600">Verified incidents only. Places and people are not published.</p>
            {n.incidents.byKind.length ? (
              <Bars rows={n.incidents.byKind.map(([k, v]) => ({ label: INCIDENT_LABELS[k]?.split(' (')[0] ?? k, value: v }))} color="#B47D1F" />
            ) : (
              <p className="text-[14px] text-ink-500">None recorded yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-[20px] font-semibold text-ink-950">Requests and outcomes, last 12 months</h2>
        <div className="mt-4 max-w-3xl">
          <Monthly m={n.monthly} />
        </div>
      </section>
    </PublicPage>
  )
}
