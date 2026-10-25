import { requireFiler } from '@/lib/auth'
import AppBar from '@/components/AppBar'

export const dynamic = 'force-dynamic'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const filer = await requireFiler()
  return (
    <div className="min-h-screen bg-white">
      <AppBar
        area="Filer portal"
        tabs={[
          ['/portal', 'My filings'],
          ['/file', 'New filing'],
          ['/e-filing', 'E-filing guide'],
        ]}
        user={filer.full_name}
      />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}
