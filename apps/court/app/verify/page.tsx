import type { Metadata } from 'next'
import { PublicShell } from '@/components/site'
import Verifier from './Verifier'

export const metadata: Metadata = { title: 'Verify a document' }

export default function VerifyPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-[13px] text-ink-500">Document verification</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">Was this document altered?</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-500">
          Every document filed through CaseWin Court is fingerprinted with SHA-256 the moment it is received. Drop a copy here: if even one byte
          has changed since filing, the fingerprint will not match.
        </p>
        <div className="mt-10">
          <Verifier />
        </div>
        <p className="mt-6 text-sm text-ink-400">Your file never leaves this device — only its fingerprint is checked.</p>
      </div>
    </PublicShell>
  )
}
