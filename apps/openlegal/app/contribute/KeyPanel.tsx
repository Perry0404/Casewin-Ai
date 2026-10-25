'use client'

import { useState } from 'react'
import CopyButton from '@/components/CopyButton'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://openlegal.casewinai.com'

export default function KeyPanel({ prefix }: { prefix: string | null }) {
  const [key, setKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function generate() {
    if (prefix && !confirm('Create a new key? Your current key will stop working.')) return
    setBusy(true)
    const res = await fetch('/api/contribute/key', { method: 'POST' })
    const out = await res.json()
    setBusy(false)
    if (res.ok) setKey(out.key)
    else alert(out.error)
  }

  const url = `${SITE}/api/mcp?key=${key ?? 'YOUR_KEY'}`

  return (
    <div className="rounded-3xl border border-ink-line bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-serif text-xl font-semibold text-ink">Connect your AI</p>
          <p className="mt-1 text-sm text-ink-3">{prefix && !key ? `Your key starts ${prefix}…` : 'Your personal link lets your AI contribute on your behalf.'}</p>
        </div>
        <button onClick={generate} disabled={busy} className="shrink-0 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-2 disabled:opacity-60">
          {busy ? '…' : prefix ? 'New key' : 'Get my key'}
        </button>
      </div>

      {key && (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-naija-400 bg-naija-50 p-4">
          <p className="text-sm font-semibold text-naija-700">Copy this now — it is shown only once.</p>
          <p className="mt-2 break-all font-mono text-sm text-ink">{url}</p>
          <div className="mt-3">
            <CopyButton text={url} label="Copy connection URL" />
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3 text-sm text-ink-2">
        <p>
          <b className="text-ink">Claude</b> — Settings → Connectors → Add custom connector → paste your connection URL.
        </p>
        <p>
          <b className="text-ink">Claude Code</b> — <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-xs">claude mcp add --transport http openlegal &quot;{url}&quot;</code>
        </p>
        <p>
          <b className="text-ink">Other MCP clients</b> — add an HTTP server with the same URL.
        </p>
        <p className="text-ink-3">Then just say: “Check if this judgment is on OpenLegal, and upload it if it isn’t.”</p>
      </div>
    </div>
  )
}
