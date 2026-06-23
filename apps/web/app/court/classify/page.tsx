'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Classification {
  category: string
  subCategory: string
  confidence: number
  suggestedCourt: string
  urgency: 'low' | 'medium' | 'high'
  reasoning: string
  estimatedComplexity: 'simple' | 'moderate' | 'complex'
}

const URGENCY: Record<string, string> = { low: 'text-green-400', medium: 'text-yellow-400', high: 'text-red-400' }

export default function ClassifyPage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Classification | null>(null)
  const [error, setError] = useState('')

  async function run() {
    if (text.trim().length < 20) { setError('Add a bit more detail about the case.'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/court/classify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.success) setResult(data.classification)
      else setError(data.error || 'Failed to classify')
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-orange-900/40 to-amber-900/30 border-b border-orange-900/40">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/tools#court" className="text-orange-300 text-sm hover:underline">← Court infrastructure</Link>
          <h1 className="text-2xl font-bold mt-2">🗂️ Case Classification</h1>
          <p className="text-gray-400 text-sm">Every case, automatically routed to the right division and court.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6}
          placeholder="Paste the case description, statement of claim, or a summary of the dispute..."
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-orange-500 resize-none" />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <button onClick={run} disabled={loading}
          className="mt-3 w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
          {loading ? 'Classifying…' : 'Classify & Route Case'}
        </button>

        {result && (
          <div className="mt-6 bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Category</p>
                <p className="text-2xl font-bold text-orange-400">{result.category}</p>
                <p className="text-gray-300 text-sm">{result.subCategory}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">Confidence</p>
                <p className="text-2xl font-bold">{result.confidence}%</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Suggested court</p>
                <p className="font-semibold">{result.suggestedCourt}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Urgency</p>
                <p className={`font-semibold capitalize ${URGENCY[result.urgency] || ''}`}>{result.urgency}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Complexity</p>
                <p className="font-semibold capitalize">{result.estimatedComplexity}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold mb-1">Reasoning</p>
              <p className="text-sm text-gray-300">{result.reasoning}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
