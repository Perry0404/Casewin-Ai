'use client'

import { useEffect } from 'react'

/**
 * For anyone reporting violence at home: one tap (or Esc twice) replaces this page
 * with a weather site, and the back button doesn't bring it back.
 */
export default function QuickExit({ label = 'Leave this site quickly' }: { label?: string }) {
  useEffect(() => {
    let last = 0
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (Date.now() - last < 800) leave()
      last = Date.now()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <button
      type="button"
      onClick={leave}
      className="no-print fixed bottom-4 right-4 z-50 rounded-md bg-ink-950 px-4 py-3 text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:bg-ink-800 sm:bottom-auto sm:top-[4.5rem]"
    >
      {label} ✕
    </button>
  )
}

function leave() {
  try {
    document.body.innerHTML = ''
    window.open('https://www.accuweather.com', '_blank', 'noopener')
  } finally {
    window.location.replace('https://www.google.com/search?q=weather')
  }
}
