import { requireAdmin } from '@/lib/auth'
import { COURT_URL } from '@/lib/constants'
import AppBar from '@/components/AppBar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  return (
    <div className="min-h-screen bg-white">
      <AppBar
        area="Legal Aid caseload"
        tabs={[
          ['/admin', 'Overview'],
          ['/admin/cases', 'All cases'],
          ['/admin/complaints', 'Complaints'],
          ['/admin/alerts', 'Alerts'],
          ['/desk', 'Desk'],
        ]}
        user={user.email ?? ''}
        extra={
          <a href={`${COURT_URL}/admin`} className="rounded-md px-2.5 py-1.5 text-ink-600 hover:bg-ink-100 hover:text-ink-950">
            Justice admin ↗
          </a>
        }
      />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}
