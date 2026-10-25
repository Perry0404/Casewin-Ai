import type { Metadata } from 'next'
import { requireStaff } from '@/lib/auth'
import { computeAnalytics } from '@/lib/analytics'
import { createAdminClient } from '@/lib/supabase/server'
import { dateTime } from '@/lib/format'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { PageHeader } from '@/components/ui'
import PrintButton from '@/components/PrintButton'

export const metadata: Metadata = { title: 'Judicial analytics' }

export default async function AnalyticsPage() {
  const staff = await requireStaff()
  const db = createAdminClient()
  const a = await computeAnalytics(db, staff.court_id)
  const { count: samples } = await db.from('cases').select('id', { count: 'exact', head: true }).eq('court_id', staff.court_id).eq('is_sample', true)

  return (
    <>
      <PageHeader
        eyebrow="Judicial analytics"
        title={staff.court.name}
        sub={`Live from the registry · updated ${dateTime(a.generatedAt)}`}
        actions={<PrintButton />}
      />
      {samples ? (
        <p className="-mt-4 mb-6 inline-flex rounded-lg border border-dashed border-ink-300 px-3 py-1.5 text-xs text-ink-500">
          Includes {samples.toLocaleString()} sample cases for demonstration. A court administrator can remove them under Court settings.
        </p>
      ) : null}
      <AnalyticsDashboard a={a} />
    </>
  )
}
