'use client'

import { btn } from './ui'

export default function PrintButton({ label = 'Print / save PDF' }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className={btn.secondary + ' no-print'}>
      {label}
    </button>
  )
}
