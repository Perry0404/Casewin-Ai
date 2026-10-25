import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { PublicPage } from '@/components/site'
import { Mono, btn } from '@/components/ui'

export const metadata: Metadata = { title: 'Request received', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default function Sent() {
  let issued: { ref: string; pin: string } | null = null
  try {
    issued = JSON.parse(cookies().get('issued')?.value ?? 'null')
  } catch {}

  return (
    <PublicPage>
      <div className="border-t-4 border-verdict-500 bg-white pt-8">
        <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-950">We have your request</h1>
        {issued ? (
          <>
            <p className="mt-3 max-w-xl text-ink-600">Write these down or take a screenshot. You need both to follow the case. We cannot show the PIN again.</p>
            <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
              <div className="border border-ink-950 p-5">
                <p className="text-[13px] font-semibold text-ink-500">Reference</p>
                <Mono className="mt-2 block !text-2xl font-semibold text-ink-900">{issued.ref}</Mono>
              </div>
              <div className="border border-ink-950 p-5">
                <p className="text-[13px] font-semibold text-ink-500">PIN</p>
                <Mono className="mt-2 block !text-2xl font-semibold text-ink-900">{issued.pin}</Mono>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-3 max-w-xl text-ink-600">Use the reference number and PIN you were shown to follow the case.</p>
        )}
        <div className="mt-10 max-w-xl space-y-3 text-[15px] text-ink-700">
          <p className="font-semibold text-ink-900">What happens now</p>
          <p>1. Your request goes to verified volunteers covering your state, most urgent first.</p>
          <p>2. The volunteer who takes it will call or WhatsApp the number you gave. They must act within 48 hours or the case passes to the next volunteer.</p>
          <p>3. Nobody from CaseWin will ever ask you for money. If anyone does, tell us at once.</p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/track" className={btn.primary}>
            Track this request
          </Link>
          <Link href="/rights" className={btn.secondary}>
            Read your rights
          </Link>
        </div>
      </div>
    </PublicPage>
  )
}
