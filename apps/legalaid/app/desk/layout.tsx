import { requireMember } from '@/lib/auth'
import AppBar from '@/components/AppBar'

export const dynamic = 'force-dynamic'

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const m = await requireMember()
  const tabs: [string, string][] = [
    ['/desk', 'My cases'],
    ['/desk/board', 'Case board'],
    ['/desk/interventions', 'Interventions'],
    ['/desk/custody', 'Custody clock'],
    ['/desk/command', 'Command'],
    ['/desk/clearing-house', 'Clearing house'],
    ['/desk/incidents', 'Rights register'],
    ['/desk/visit', 'Record a visit'],
    ['/desk/record', 'My record'],
  ]
  if (m.role === 'coordinator' && m.org_id) tabs.splice(2, 0, ['/desk/team', 'Organisation'])
  if (m.isAdmin) tabs.push(['/admin', 'Admin'])
  return (
    <div className="min-h-screen bg-white">
      <AppBar area={m.org?.name ?? 'Volunteer desk'} tabs={tabs} user={m.full_name} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}
