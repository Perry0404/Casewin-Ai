import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { Notice, PageHeader } from '@/components/ui'
import VisitForm from './VisitForm'

export const metadata: Metadata = { title: 'Record a visit' }

export default async function VisitPage() {
  const m = await requireMember()
  return (
    <>
      <PageHeader
        eyebrow="Field visit"
        title="Record a station or prison visit"
        sub="Everyone you meet who has no lawyer becomes a file with a custody clock. Because you met them, the file starts verified."
      />
      <div className="mb-6">
        <Notice tone="info">
          Ask each person’s consent before you record them, and record only what you saw or were told by them or the facility. Empty rows are ignored.
        </Notice>
      </div>
      <VisitForm defaultState={m.state} />
    </>
  )
}
