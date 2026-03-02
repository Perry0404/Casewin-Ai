'use client'

import { useState } from 'react'
import Link from 'next/link'

const matterTypes = [
  { id: 'litigation-civil', name: 'Civil Litigation', icon: '⚖️' },
  { id: 'litigation-criminal', name: 'Criminal Defence', icon: '🛡️' },
  { id: 'corporate', name: 'Company Registration/CAMA', icon: '🏢' },
  { id: 'property', name: 'Property/Conveyancing', icon: '🏠' },
  { id: 'family', name: 'Family/Divorce', icon: '👪' },
  { id: 'employment', name: 'Employment Dispute', icon: '👔' },
  { id: 'ip', name: 'Intellectual Property', icon: '💡' },
  { id: 'immigration', name: 'Immigration', icon: '🌍' },
  { id: 'tax', name: 'Tax Advisory', icon: '💰' },
  { id: 'debt', name: 'Debt Recovery', icon: '💳' },
  { id: 'contract', name: 'Contract Drafting/Review', icon: '📝' },
  { id: 'will', name: 'Probate/Estate Planning', icon: '📜' },
]

const courts = ['Not yet determined', 'Federal High Court', 'State High Court', 'Court of Appeal', 'Supreme Court', 'National Industrial Court', 'Magistrate Court', 'Customary Court']
const complexities = ['Simple', 'Medium', 'Complex', 'Very Complex (High Stakes)']

export default function FeesPage() {
  const [matterType, setMatterType] = useState('')
  const [court, setCourt] = useState('Not yet determined')
  const [complexity, setComplexity] = useState('Medium')
  const [jurisdiction, setJurisdiction] = useState('Lagos State')
  const [details, setDetails] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleEstimate = async () => {
    if (!matterType) { setError('Select a matter type'); return }
    setIsLoading(true); setError('')
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matterType, court, complexity, jurisdiction, details }),
      })
      const data = await res.json()
      if (data.success) setResult(data.result)
      else setError(data.error || 'Failed to estimate')
    } catch (_e) { setError('Network error') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">⚖️</span>
            <span className="text-lg sm:text-xl font-bold text-gray-900">CaseWin AI</span>
          </Link>
          <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm">
            <Link href="/tools" className="text-gray-600 hover:text-gray-900 font-medium">All Tools</Link>
            <Link href="/marketplace" className="text-gray-600 hover:text-gray-900 font-medium">Marketplace</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center"><span className="text-xl">💸</span></div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Legal Fee Estimator</h1>
            <p className="text-gray-600 text-xs sm:text-sm">AI estimates legal fees based on Nigerian practice standards</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border p-4 sm:p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Matter Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Matter Type *</label>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {matterTypes.map(mt => (
                    <button key={mt.id} onClick={() => setMatterType(mt.id)}
                      className={`p-2 text-xs rounded-lg border-2 text-left transition-all ${matterType === mt.id ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="block text-sm sm:text-base mb-0.5">{mt.icon}</span>
                      <span className="leading-tight">{mt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
                <select value={court} onChange={e => setCourt(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {courts.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
                <select value={complexity} onChange={e => setComplexity(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {complexities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                <textarea rows={3} value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe the matter..." className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
              <button onClick={handleEstimate} disabled={isLoading}
                className="w-full py-3 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-50 text-sm sm:text-base">
                {isLoading ? 'Estimating...' : '💸 Estimate Fees'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!result && !isLoading && (
              <div className="bg-white rounded-xl border p-8 sm:p-12 text-center">
                <span className="text-4xl sm:text-5xl mb-4 block">💸</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Estimate Legal Fees</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">Select your matter type and details. AI will estimate legal fees based on Nigerian Bar Association guidelines and current market rates.</p>
              </div>
            )}
            {result && (
              <div className="space-y-4 sm:space-y-6">
                {result.estimate && (
                  <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-xl p-4 sm:p-6 text-white">
                    <h3 className="font-semibold text-rose-100 mb-3 text-sm">Fee Estimate Range</h3>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                      <div><p className="text-xs text-rose-200">Low</p><p className="text-lg sm:text-2xl font-bold">{result.estimate.lowRange}</p></div>
                      <div className="border-x border-rose-400/30"><p className="text-xs text-rose-200">Average</p><p className="text-lg sm:text-2xl font-bold">{result.estimate.average}</p></div>
                      <div><p className="text-xs text-rose-200">High</p><p className="text-lg sm:text-2xl font-bold">{result.estimate.highRange}</p></div>
                    </div>
                  </div>
                )}
                {result.breakdown && (
                  <div className="bg-white rounded-xl border p-4 sm:p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">📋 Fee Breakdown</h3>
                    <div className="space-y-2">{result.breakdown.map((b: any, i: number) => (
                      <div key={i} className="flex justify-between items-start p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900">{b.item}</p>{b.notes && <p className="text-xs text-gray-500 mt-0.5">{b.notes}</p>}</div>
                        <span className="font-semibold text-gray-900 text-sm ml-2 flex-shrink-0">{b.amount}</span>
                      </div>
                    ))}</div>
                  </div>
                )}
                {result.courtFees && (
                  <div className="bg-white rounded-xl border p-4 sm:p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">🏛️ Court Fees</h3>
                    <div className="space-y-2">{result.courtFees.map((f: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded"><span className="text-gray-600">{f.item}</span><span className="font-semibold">{f.amount}</span></div>
                    ))}</div>
                  </div>
                )}
                {result.factors && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h3 className="font-semibold text-amber-800 mb-2 text-sm">⚠️ Factors Affecting Fees</h3>
                    <ul className="space-y-1">{result.factors.map((f: string, i: number) => <li key={i} className="text-xs sm:text-sm text-amber-700">• {f}</li>)}</ul>
                  </div>
                )}
                {result.fullAnalysis && !result.breakdown && (
                  <div className="bg-white rounded-xl border p-4 sm:p-6"><pre className="whitespace-pre-wrap text-sm text-gray-700">{result.fullAnalysis}</pre></div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
