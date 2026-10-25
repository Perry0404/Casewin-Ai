import type { Metadata } from 'next'
import Link from 'next/link'
import { requireMember } from '@/lib/auth'
import { nationalPicture } from '@/lib/national'
import { Bars, INCIDENT_LABELS, Monthly, TileMap } from '@/components/NationalPicture'
import { Card, CardTitle, PageHeader, Stat, btn } from '@/components/ui'

export const metadata: Metadata = { title: 'Command' }

export default async function Command({ searchParams }: { searchParams: { map?: string } }) {
  await requireMember()
  const n = await nationalPicture()
  const metric = (['open', 'pastLimit', 'noLawyer', 'released'] as const).find((k) => k === searchParams.map) ?? 'pastLimit'
  const labels = { open: 'Open cases', pastLimit: 'Held past a legal limit', noLawyer: 'Waiting with no lawyer', released: 'People released' }
  const h = n.medianHoursToAction
  return (
    <>
      <PageHeader
        eyebrow="Command"
        title="The national picture"
        sub="Live from every case on the platform. Use it to decide where volunteers and visits are needed most."
        actions={
          <Link href="/desk/interventions" className={btn.primary}>
            Who needs action today
          </Link>
        }
      />
      <div className="mb-10 grid grid-cols-2 gap-6 lg:grid-cols-6">
        <Stat label="Open cases" value={n.totals.open} />
        <Stat label="Held past a legal limit" value={n.totals.pastLimit} tone={n.totals.pastLimit ? 'bad' : undefined} hint={n.totals.pastLimit ? 'See interventions' : undefined} />
        <Stat label="Waiting with no lawyer" value={n.totals.noLawyer} tone={n.totals.noLawyer ? 'warn' : undefined} />
        <Stat label="Children in custody" value={n.totals.children} tone={n.totals.children ? 'bad' : undefined} />
        <Stat label="Diverted" value={n.totals.diverted} hint="mediation / restorative" />
        <Stat label="Median time to first action" value={h == null ? '—' : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} d`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardTitle
            action={
              <form className="flex gap-2">
                <select name="map" defaultValue={metric} className="rounded-md border border-ink-300 bg-white px-2 py-1.5 text-[13px]">
                  {Object.entries(labels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <button className="rounded-md border border-ink-300 px-2 py-1.5 text-[13px] font-medium">Show</button>
              </form>
            }
          >
            By state
          </CardTitle>
          <TileMap states={n.states} metric={metric} label={labels[metric]} />
        </Card>
        <div className="space-y-6">
          <Card>
            <CardTitle sub="Everyone in custody on an open case, by days since arrest.">How long people have been held</CardTitle>
            <Bars rows={n.custody} color="#3B5B9A" />
          </Card>
          <Card>
            <CardTitle sub="Verified incidents only.">Rights violations recorded</CardTitle>
            {n.incidents.byKind.length ? (
              <Bars rows={n.incidents.byKind.map(([k, v]) => ({ label: INCIDENT_LABELS[k]?.split(' (')[0] ?? k, value: v }))} color="#B47D1F" />
            ) : (
              <p className="text-[14px] text-ink-500">None recorded yet.</p>
            )}
            <Link href="/desk/incidents" className="prose-link mt-4 inline-block text-[14px]">
              Rights register
            </Link>
          </Card>
        </div>
      </div>
      <Card className="mt-6">
        <CardTitle sub="Last 12 months.">Requests and outcomes</CardTitle>
        <Monthly m={n.monthly} />
      </Card>
    </>
  )
}
