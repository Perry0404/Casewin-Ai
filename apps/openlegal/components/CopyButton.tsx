'use client'

import { useState } from 'react'

export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setDone(true)
        setTimeout(() => setDone(false), 1600)
      }}
      className="rounded-lg border border-ink-line px-3 py-1.5 text-xs font-medium text-ink-2 transition hover:border-naija-400 hover:text-naija-700"
    >
      {done ? 'Copied ✓' : label}
    </button>
  )
}
