'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Slot { date: string; score: number; load: number; reasons: string[] }

const fmt = (iso: string) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export default function SchedulingPage() {
  const [form, setForm] = useState({
    earliestDate: '',
    complexity: 'moderate',
    judgeBusyDates: '',
    lawyerBusyDates: '',
    courtCapacityPerDay: '8',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ recommended: Slot | null; alternatives: Slot[]; hearingHours: number } | null>(null)
  const [error, setError] = useState('')

  async function run() {
    setError(''); setLoading(true); setResult(null)
    const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)
    try {
      const res = await fetch('/api/court/scheduling', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          earliestDate: form.earliestDate || undefined,
          complexity: form.complexity,
          judgeBusyDates: split(form.judgeBusyDates),
          lawyerBusyDates: split(form.lawyerBusyDates),
          courtCapacityPerDay: Number(form.courtCapacityPerDay) || 8,
        }),
      })
      const data = await res.json()
      if (data.success) setResult(data)
      else setError(data.error || 'Failed')
    } catch { setError('Network error.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-orange-900/40 to-amber-900/30 border-b border-orange-900/40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/tools#court" className="text-orange-300 text-sm hover:underline">← Court infrastructure</Link>
          <h1 className="text-2xl font-bold mt-2">📅 Scheduling Optimizer</h1>
          <p className="text-gray-400 text-sm">Airline logic applied to justice — find the earliest hearing date that fits everyone, with no wasted adjournments.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Earliest possible date</label>
            <input type="date" value={form.earliestDate} onChange={(e) => setForm((f) => ({ ...f, earliestDate: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Case complexity</label>
            <select value={form.complexity} onChange={(e) => setForm((f) => ({ ...f, complexity: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
              <option value="simple">Simple (1h)</option>
              <option value="moderate">Moderate (2h)</option>
              <option value="complex">Complex (4h)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Judge unavailable dates (comma-separated YYYY-MM-DD)</label>
          <input value={form.judgeBusyDates} onChange={(e) => setForm((f) => ({ ...f, judgeBusyDates: e.target.value }))}
            placeholder="2026-07-01, 2026-07-02"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Lead counsel unavailable dates</label>
          <input value={form.lawyerBusyDates} onChange={(e) => setForm((f) => ({ ...f, lawyerBusyDates: e.target.value }))}
            placeholder="2026-07-03"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Court capacity (hearing-hours/day)</label>
          <input type="number" value={form.courtCapacityPerDay} onChange={(e) => setForm((f) => ({ ...f, courtCapacityPerDay: e.target.value }))}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button onClick={run} disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
          {loading ? 'Optimizing…' : 'Find Optimal Hearing Date'}
        </button>

        {result?.recommended && (
          <div className="mt-4 space-y-3">
            <div className="bg-orange-950/40 rounded-xl p-5 border border-orange-900/50">
              <p className="text-orange-300 text-xs font-semibold">RECOMMENDED · {result.hearingHours}h hearing</p>
              <p className="text-2xl font-bold mt-1">{fmt(result.recommended.date)}</p>
              <p className="text-gray-400 text-sm mt-1">{result.recommended.reasons.join(' · ')}</p>
            </div>
            {result.alternatives.length > 0 && (
              <div className="space-y-2">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Alternatives</p>
                {result.alternatives.map((a) => (
                  <div key={a.date} className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
                    <span className="text-sm">{fmt(a.date)}</span>
                    <span className="text-xs text-gray-500">{a.reasons.join(' · ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {result && !result.recommended && (
          <p className="text-gray-400 text-sm mt-4">No slot found in the next 120 days within these constraints. Loosen capacity or unavailable dates.</p>
        )}
      </div>
    </div>
  )
}
