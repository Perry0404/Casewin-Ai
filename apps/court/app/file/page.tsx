import type { Metadata } from 'next'
import { PublicShell } from '@/components/site'
import { Notice } from '@/components/ui'
import { listCourts } from '@/lib/data'
import { isConfigured } from '@/lib/supabase/server'
import FilingForm from './FilingForm'

export const metadata: Metadata = { title: 'File a case' }
export const dynamic = 'force-dynamic'

export default async function FilePage() {
  const courts = isConfigured() ? await listCourts() : []

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-600">E-filing</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">File a new case</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-500">
          Submit your originating process to the registry. You will get a tracking code at once, and the registry will assess fees and issue
          your suit number.
        </p>
        <div className="mt-10">
          {courts.length === 0 ? (
            <Notice tone="warn">No court is accepting e-filings yet. Please check back soon.</Notice>
          ) : (
            <FilingForm courts={courts} />
          )}
        </div>
      </div>
    </PublicShell>
  )
}
