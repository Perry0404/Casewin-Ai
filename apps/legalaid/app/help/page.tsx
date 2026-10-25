import type { Metadata } from 'next'
import { PublicPage } from '@/components/site'
import ReportForm from './ReportForm'

export const metadata: Metadata = { title: 'Get help' }

export default function HelpPage({ searchParams }: { searchParams: { kind?: string } }) {
  return (
    <PublicPage>
      <p className="text-[13px] text-ink-500">Free · about 2 minutes</p>
      <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-950 sm:text-[40px]">Ask for a free lawyer</h1>
      <p className="mt-3 max-w-xl text-lg text-ink-500">
        Fill in what you know — you can leave out what you don’t. You will get a reference number and PIN to follow the case.
      </p>
      <div className="mt-10">
        <ReportForm defaultKind={searchParams.kind} />
      </div>
    </PublicPage>
  )
}
