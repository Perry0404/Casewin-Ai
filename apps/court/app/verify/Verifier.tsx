'use client'

import { useState } from 'react'
import { dateTime } from '@/lib/format'
import { Mono } from '@/components/ui'

type Result = { found: false } | { found: true; court: string; received_at: string; suit_number: string | null }

export default function Verifier() {
  const [name, setName] = useState<string | null>(null)
  const [hash, setHash] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)

  async function check(file: File) {
    setBusy(true)
    setResult(null)
    setName(file.name)
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
    setHash(hex)
    const res = await fetch(`/api/verify?sha256=${hex}`)
    setResult(await res.json())
    setBusy(false)
  }

  return (
    <div className="space-y-5">
      <label
        className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-ink-200 bg-white px-6 py-16 text-center shadow-card transition hover:border-brass-400"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) check(f)
        }}
      >
        <svg viewBox="0 0 24 24" className="h-10 w-10 text-brass-500" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M12 3 5 6v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V6l-7-3Z" strokeLinejoin="round" />
          <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="mt-4 font-display text-xl font-semibold text-ink-900">{busy ? 'Checking…' : 'Drop a document, or click to choose'}</span>
        <span className="mt-1 text-sm text-ink-400">PDF, Word or image</span>
        <input type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && check(e.target.files[0])} />
      </label>

      {hash && (
        <div className="rounded-2xl border border-ink-100 bg-white p-5 text-sm shadow-card">
          <p className="text-ink-400">Fingerprint of {name}</p>
          <Mono className="mt-1 block break-all text-ink-700">{hash}</Mono>
        </div>
      )}

      {result?.found && (
        <div className="animate-rise rounded-2xl border border-verdict-500/30 bg-verdict-50 p-6">
          <p className="font-display text-2xl font-semibold text-verdict-700">✓ Matches the filed record</p>
          <p className="mt-2 text-ink-700">
            This exact document was filed with the <b>{result.court}</b> on {dateTime(result.received_at)}
            {result.suit_number && (
              <>
                {' '}
                in suit <Mono className="font-semibold">{result.suit_number}</Mono>
              </>
            )}
            . It has not been altered since.
          </p>
        </div>
      )}
      {result && !result.found && (
        <div className="animate-rise rounded-2xl border border-amberline-500/30 bg-amberline-50 p-6">
          <p className="font-display text-2xl font-semibold text-amberline-600">No match</p>
          <p className="mt-2 text-ink-700">
            No filed document has this fingerprint. Either it was never filed through CaseWin Court, or it has been changed since — even a re-save
            or re-scan changes the fingerprint. Ask the registry for a certified true copy.
          </p>
        </div>
      )}
    </div>
  )
}
