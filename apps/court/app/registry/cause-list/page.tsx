import Link from 'next/link'
import type { Metadata } from 'next'
import { requireStaff } from '@/lib/auth'
import { causeList } from '@/lib/causelist'
import { date, lagosToday } from '@/lib/format'
import CauseListView from '@/components/CauseListView'
import PrintButton from '@/components/PrintButton'
import { PageHeader, btn, input } from '@/components/ui'

export const metadata: Metadata = { title: 'Cause list' }

export default async function RegistryCauseList({ searchParams }: { searchParams: { date?: string } }) {
  const staff = await requireStaff()
  const day = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? '') ? searchParams.date! : lagosToday()
  const groups = await causeList(staff.court_id, day, { judgeId: staff.role === 'judge' && staff.judge_id ? staff.judge_id : undefined })
  const total = groups.reduce((n, g) => n + g.items.length, 0)
  const shift = (n: number) => new Date(new Date(day + 'T12:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10)

  return (
    <>
      <PageHeader
        eyebrow="Cause list"
        title={date(day + 'T12:00:00+01:00', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        sub={`${total} matter${total === 1 ? '' : 's'} listed · the public list at /cause-list/${staff.court.slug} updates automatically`}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <Link href={`?date=${shift(-1)}`} className={btn.secondary} aria-label="Previous day">
              ←
            </Link>
            <form className="flex gap-2">
              <input type="date" name="date" defaultValue={day} className={input + ' !py-2 text-sm'} aria-label="Date" />
              <button className={btn.secondary}>Go</button>
            </form>
            <Link href={`?date=${shift(1)}`} className={btn.secondary} aria-label="Next day">
              →
            </Link>
            <PrintButton label="Print" />
          </div>
        }
      />
      <div className="hidden print:mb-6 print:block">
        <p className="font-display text-xl font-semibold">{staff.court.name}</p>
      </div>
      <CauseListView groups={groups} linkCases />
    </>
  )
}
