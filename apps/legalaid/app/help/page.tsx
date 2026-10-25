import type { Metadata } from 'next'
import { PublicPage } from '@/components/site'
import ReportForm from './ReportForm'

export const metadata: Metadata = { title: 'Get help' }

export default function HelpPage() {
  return (
    <PublicPage>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brass-600">Free · about 2 minutes</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">Ask for a free lawyer</h1>
      <p className="mt-3 max-w-xl text-lg text-ink-500">
        Fill in what you know — you can leave out what you don’t. You will get a reference number and PIN to follow the case.
      </p>
      <div className="mt-10">
        <ReportForm />
      </div>
    </PublicPage>
  )
}
