'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Metrics {
  lawyers: number | null
  verifiedLawyers: number | null
  invoices: number | null
  paidInvoices: number | null
  settledValueNGN: number | null
  evidenceProofs: number | null
  activeSubscriptions: number | null
  bookings: number | null
}

const fmt = (n: number | null) => (n === null ? '—' : n.toLocaleString())
const ngn = (n: number | null) => (n === null ? '—' : `₦${n.toLocaleString()}`)

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/court/analytics')
      .then((r) => r.json())
      .then((d) => { if (d.success) { setMetrics(d.metrics); setNote(d.note) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cards: { label: string; value: string; accent: string }[] = metrics
    ? [
        { label: 'Lawyers on platform', value: fmt(metrics.lawyers), accent: 'text-blue-400' },
        { label: 'Verified lawyers', value: fmt(metrics.verifiedLawyers), accent: 'text-purple-400' },
        { label: 'Invoices issued', value: fmt(metrics.invoices), accent: 'text-emerald-400' },
        { label: 'Invoices paid', value: fmt(metrics.paidInvoices), accent: 'text-emerald-400' },
        { label: 'Value settled', value: ngn(metrics.settledValueNGN), accent: 'text-green-400' },
        { label: 'Evidence proofs', value: fmt(metrics.evidenceProofs), accent: 'text-orange-400' },
        { label: 'Active subscriptions', value: fmt(metrics.activeSubscriptions), accent: 'text-yellow-400' },
        { label: 'Consultations booked', value: fmt(metrics.bookings), accent: 'text-cyan-400' },
      ]
    : []

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-orange-900/40 to-amber-900/30 border-b border-orange-900/40">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/tools#court" className="text-orange-300 text-sm hover:underline">← Court infrastructure</Link>
          <h1 className="text-2xl font-bold mt-2">📈 Justice Analytics</h1>
          <p className="text-gray-400 text-sm">For the first time, justice becomes measurable.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <p className={`text-3xl font-bold ${c.accent}`}>{c.value}</p>
                <p className="text-gray-400 text-xs mt-1">{c.label}</p>
              </div>
            ))}
          </div>
        )}

        {note && (
          <div className="mt-8 bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p className="text-gray-400 text-sm">{note}</p>
            <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
              {['Which courts are overloaded?', 'Which disputes take longest?', 'Which regions need judges?', 'What creates backlogs?'].map((q) => (
                <div key={q} className="bg-gray-800/60 rounded-lg px-4 py-3 text-gray-300 flex items-center justify-between">
                  <span>{q}</span>
                  <span className="text-[10px] text-gray-500 border border-gray-700 rounded-full px-2 py-0.5">awaiting court data</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
