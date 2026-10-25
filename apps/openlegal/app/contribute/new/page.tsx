import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Shell } from '@/components/site'
import { currentContributor } from '@/lib/session'
import SubmitForm from './SubmitForm'

export const metadata: Metadata = { title: 'Upload a judgment' }
export const dynamic = 'force-dynamic'

export default async function NewSubmission() {
  const { contributor } = await currentContributor()
  if (!contributor) redirect('/contribute')
  return (
    <Shell query="">
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <Link href="/contribute" className="text-sm text-ink-3 hover:text-naija-700">
          ← Your contributions
        </Link>
        <h1 className="mt-4 font-serif text-5xl font-medium tracking-tight text-ink">Upload a judgment</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-2">
          Paste the court’s judgment text. We check for duplicates instantly; a reviewer verifies new cases before they go live.
        </p>
        <div className="mt-10">
          <SubmitForm />
        </div>
      </div>
    </Shell>
  )
}
