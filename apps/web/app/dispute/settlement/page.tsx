'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Analysis {
  settlementProbability: number
  recommendedSettlement: { low: number; mid: number; high: number }
  expectedTimeline: { settle: string; litigate: string }
  litigationRisk: 'low' | 'medium' | 'high'
  winProbabilityIfLitigated: number
  estimatedLitigationCostNGN: number
  rationale: string
  recommendation: string
  keyFactors: string[]
}

const RISK_COLORS: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
}

const ngn = (n?: number) => (typeof n === 'number' ? `₦${n.toLocaleString()}` : '—')

export default function SettlementEnginePage() {
  const [form, setForm] = useState({
    matter: '',
    claimAmount: '',
    facts: '',
    evidenceStrength: 'moderate',
    party: 'claimant',
    priorOffers: '',
  })
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState('')

  async function run() {
    if (!form.matter.trim() || !form.facts.trim()) {
      setError('Please provide the matter and the facts.')
      return
    }
    setError('')
    setLoading(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/dispute/settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          claimAmount: form.claimAmount ? Number(form.claimAmount) : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) setAnalysis(data.analysis)
      else setError(data.error || 'Failed to analyze')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-emerald-900/50 to-green-900/30 border-b border-emerald-900/40">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/tools#dispute" className="text-emerald-400 text-sm hover:underline">← Dispute resolution</Link>
          <h1 className="text-2xl font-bold mt-2">📊 Settlement Engine</h1>
          <p className="text-gray-400 text-sm">Not predicting justice — predicting probability. Estimate a settlement zone, timeline and litigation risk before a matter reaches court.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Matter / dispute title *</label>
            <input value={form.matter} onChange={(e) => setForm((f) => ({ ...f, matter: e.target.value }))}
              placeholder="e.g. Unpaid supply contract — Obi v. Adeyemi"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Claim amount (₦)</label>
              <input type="number" value={form.claimAmount} onChange={(e) => setForm((f) => ({ ...f, claimAmount: e.target.value }))}
                placeholder="5000000"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">I am the…</label>
              <select value={form.party} onChange={(e) => setForm((f) => ({ ...f, party: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                <option value="claimant">Claimant</option>
                <option value="defendant">Defendant</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Evidence strength</label>
            <select value={form.evidenceStrength} onChange={(e) => setForm((f) => ({ ...f, evidenceStrength: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
              <option value="weak">Weak</option>
              <option value="moderate">Moderate</option>
              <option value="strong">Strong</option>
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Facts of the dispute *</label>
            <textarea value={form.facts} onChange={(e) => setForm((f) => ({ ...f, facts: e.target.value }))}
              rows={6} placeholder="What happened, who is involved, what is owed or contested, and what evidence exists..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none" />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Prior settlement offers (optional)</label>
            <input value={form.priorOffers} onChange={(e) => setForm((f) => ({ ...f, priorOffers: e.target.value }))}
              placeholder="e.g. Defendant offered ₦1.5M"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={run} disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
            {loading ? '📊 Analyzing…' : 'Estimate Settlement'}
          </button>
          <p className="text-gray-600 text-xs">For guidance only. Not legal advice; verify with a lawyer before acting.</p>
        </div>

        {/* Results */}
        <div>
          {!analysis && !loading && (
            <div className="bg-gray-900 rounded-xl border border-dashed border-gray-700 p-10 text-center text-gray-500 text-sm">
              Enter the dispute details to see a settlement zone, timeline and litigation risk.
            </div>
          )}
          {loading && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-10 text-center text-gray-400 text-sm animate-pulse">
              Modelling outcomes…
            </div>
          )}
          {analysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 rounded-xl p-4 border border-emerald-900/40">
                  <p className="text-gray-400 text-xs">Settlement probability</p>
                  <p className="text-3xl font-bold text-emerald-400">{analysis.settlementProbability}%</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-gray-400 text-xs">Litigation risk</p>
                  <p className={`text-3xl font-bold capitalize ${RISK_COLORS[analysis.litigationRisk] || 'text-white'}`}>{analysis.litigationRisk}</p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs mb-2">Recommended settlement range</p>
                <div className="flex items-end justify-between">
                  <div><p className="text-gray-500 text-xs">Low</p><p className="font-bold">{ngn(analysis.recommendedSettlement?.low)}</p></div>
                  <div className="text-center"><p className="text-gray-500 text-xs">Target</p><p className="text-xl font-bold text-emerald-400">{ngn(analysis.recommendedSettlement?.mid)}</p></div>
                  <div className="text-right"><p className="text-gray-500 text-xs">High</p><p className="font-bold">{ngn(analysis.recommendedSettlement?.high)}</p></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-gray-400 text-xs">If you settle</p>
                  <p className="font-semibold">{analysis.expectedTimeline?.settle}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-gray-400 text-xs">If you litigate</p>
                  <p className="font-semibold">{analysis.expectedTimeline?.litigate}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-gray-400 text-xs">Win probability if litigated</p>
                  <p className="font-semibold">{analysis.winProbabilityIfLitigated}%</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-gray-400 text-xs">Est. litigation cost</p>
                  <p className="font-semibold">{ngn(analysis.estimatedLitigationCostNGN)}</p>
                </div>
              </div>

              <div className="bg-emerald-950/40 rounded-xl p-4 border border-emerald-900/40">
                <p className="text-emerald-300 text-xs font-semibold mb-1">Recommendation</p>
                <p className="text-sm text-gray-200">{analysis.recommendation}</p>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs font-semibold mb-1">Rationale</p>
                <p className="text-sm text-gray-300">{analysis.rationale}</p>
                {Array.isArray(analysis.keyFactors) && analysis.keyFactors.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {analysis.keyFactors.map((k, i) => (
                      <li key={i} className="text-xs text-gray-400 flex gap-2"><span className="text-emerald-400">•</span>{k}</li>
                    ))}
                  </ul>
                )}
              </div>

              <Link href="/invoices" className="block text-center bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
                Settled? Generate the agreement & invoice →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
