'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CASE_TYPES } from '@/lib/constants'

type Result = { status: string; message: string; url?: string }

const field = 'w-full rounded-xl border border-ink-line bg-white px-3.5 py-2.5 text-[15px] focus:border-naija-500 focus:outline-none focus:ring-4 focus:ring-naija-100'

export default function SubmitForm() {
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [chars, setChars] = useState(0)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    const res = await fetch('/api/contribute/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) })
    const out = await res.json()
    setBusy(false)
    setResult(res.ok ? out : { status: 'error', message: out.error })
    if (res.ok && out.status === 'received') (e.target as HTMLFormElement).reset()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const good = result?.status === 'received'
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {result && (
        <div className={`rounded-2xl p-5 ${good ? 'bg-naija-50 text-naija-900 ring-1 ring-naija-100' : 'bg-paper-2 text-ink ring-1 ring-ink-line'}`}>
          <p className="font-semibold">{good ? 'Received — thank you!' : result.status === 'already_published' ? 'Already on OpenLegal' : result.status === 'already_submitted' ? 'Already submitted' : 'Not submitted'}</p>
          <p className="mt-1 text-sm leading-relaxed">{result.message}</p>
          {result.url && (
            <Link href={result.url} className="mt-2 inline-block text-sm font-semibold text-naija-700 underline">
              View the judgment →
            </Link>
          )}
        </div>
      )}
      <div className="grid gap-5 rounded-3xl border border-ink-line bg-white p-6 shadow-card sm:grid-cols-2 sm:p-8">
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-ink-2">Case title *</span>
          <input name="title" required placeholder="Okonkwo v. Eze" className={field} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-ink-2">Court *</span>
          <input name="court" required placeholder="High Court of Imo State" className={field} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-ink-2">Suit / appeal number</span>
          <input name="suit_number" placeholder="HOW/142/2019" className={field + ' font-mono'} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-ink-2">Date delivered</span>
          <input name="delivered_on" type="date" className={field} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-ink-2">Area of law</span>
          <select name="case_type" className={field} defaultValue="">
            <option value="">—</option>
            {CASE_TYPES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-ink-2">Judge(s)</span>
          <input name="judges" placeholder="Hon. Justice …, separated by commas" className={field} />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 flex justify-between text-sm font-medium text-ink-2">
            <span>Full text of the judgment *</span>
            <span className={chars >= 1500 ? 'text-naija-600' : 'text-ink-4'}>{chars.toLocaleString()} characters</span>
          </span>
          <textarea name="full_text" required minLength={1500} onChange={(e) => setChars(e.target.value.length)} className={field + ' min-h-[380px] font-serif leading-relaxed'} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-ink-2">Where did you get it?</span>
          <input name="source_note" placeholder="Certified true copy from the registry" className={field} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-ink-2">Link (if online)</span>
          <input name="source_url" type="url" className={field} />
        </label>
      </div>
      <p className="text-sm text-ink-3">
        Only the court’s own judgment text. Don’t paste headnotes, summaries or page layouts from commercial law reports. Remove the names of
        children and victims of sexual offences.
      </p>
      <button disabled={busy} className="w-full rounded-xl bg-naija-500 px-6 py-3.5 font-semibold text-white transition hover:bg-naija-600 disabled:opacity-60 sm:w-auto">
        {busy ? 'Checking…' : 'Submit judgment'}
      </button>
    </form>
  )
}
