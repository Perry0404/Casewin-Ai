import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicPage } from '@/components/site'
import { Card, CardTitle, Empty, Stat, btn } from '@/components/ui'
import { publicStats } from '@/lib/stats'

export const metadata: Metadata = { title: 'Impact', description: 'Real requests, volunteers and outcomes on CaseWin Legal Aid — counted from the case record, never estimated.' }
export const revalidate = 300

export default async function Impact() {
  const s = await publicStats()
  const max = Math.max(1, ...s.states.map(([, n]) => n))
  return (
    <PublicPage wide>
      <p className="text-[13px] text-ink-500">The record</p>
      <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-950 sm:text-[40px]">What has actually happened</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-500">
        Counted live from real cases. Reports marked as not genuine are excluded; outcomes count only after a volunteer verified the facts.{' '}
        <Link href="/how-it-works" className="underline">How we verify</Link>.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Requests for help" value={s.requests.toLocaleString()} />
        <Stat label="Verified by a volunteer" value={s.verified.toLocaleString()} />
        <Stat label="Taken by a volunteer" value={s.assigned.toLocaleString()} />
        <Stat label="People released" value={s.released.toLocaleString()} tone="good" hint={`${s.resolved} cases with an outcome`} />
        <Stat label="Median time to first action" value={s.medianHoursToAction == null ? '—' : s.medianHoursToAction < 48 ? `${Math.round(s.medianHoursToAction)} h` : `${Math.round(s.medianHoursToAction / 24)} d`} hint="from report to first call, visit or filing" />
        <Stat label="Verified volunteers" value={s.volunteers} />
        <Stat label="Organisations" value={s.organisations} />
        <Stat label="States reached" value={s.states.length} hint="of 36 + FCT" />
      </div>
      <Card className="mt-6">
        <CardTitle>Requests by state</CardTitle>
        {s.states.length ? (
          <ul className="space-y-2">
            {s.states.map(([st, n]) => (
              <li key={st} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="text-ink-700">{st}</span>
                <span className="h-2.5 rounded-full bg-ink-50">
                  <span className="block h-full rounded-full bg-[#3B5B9A]" style={{ width: `${(n / max) * 100}%` }} />
                </span>
                <span className="text-right tabular-nums text-ink-900">{n}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="The first requests are coming in this week">Every request will appear here as it arrives.</Empty>
        )}
      </Card>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/help" className={btn.primary}>
          Report a case
        </Link>
        <Link href="/volunteer" className={btn.secondary}>
          Volunteer
        </Link>
      </div>
    </PublicPage>
  )
}
