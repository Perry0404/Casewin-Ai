'use client'

import { useState } from 'react'
import Link from 'next/link'

const caseTypes = [
  { id: 'contract', name: 'Contract Dispute', icon: '📋' },
  { id: 'tort', name: 'Tort/Negligence', icon: '⚠️' },
  { id: 'land', name: 'Land/Property', icon: '🏠' },
  { id: 'criminal', name: 'Criminal Matter', icon: '⚖️' },
  { id: 'family', name: 'Family/Matrimonial', icon: '👨‍👩‍👧' },
  { id: 'employment', name: 'Employment/Labour', icon: '👔' },
  { id: 'tax', name: 'Tax Dispute', icon: '💰' },
  { id: 'company', name: 'Company/Corporate', icon: '🏢' },
  { id: 'fundamental-rights', name: 'Fundamental Rights', icon: '🏛️' },
  { id: 'election', name: 'Election Petition', icon: '🗳️' },
  { id: 'maritime', name: 'Maritime/Admiralty', icon: '🚢' },
  { id: 'appeal', name: 'Appeal', icon: '📜' },
]

const jurisdictions = [
  'Lagos State', 'FCT Abuja', 'Rivers State', 'Kano State', 'Oyo State',
  'Federal High Court', 'Court of Appeal', 'Supreme Court',
  'National Industrial Court', 'Other State'
]

interface Deadline {
  title: string
  date?: string
  daysRemaining?: number
  category: string
  authority: string
  critical: boolean
  notes: string
}

export default function DeadlinesPage() {
  const [caseType, setCaseType] = useState('')
  const [jurisdiction, setJurisdiction] = useState('Lagos State')
  const [filingDate, setFilingDate] = useState('')
  const [description, setDescription] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<{ deadlines?: Deadline[]; limitationPeriod?: string; warnings?: string[]; fullAnalysis?: string } | null>(null)
  const [error, setError] = useState('')

  const handleCalculate = async () => {
    if (!caseType) { setError('Please select a case type'); return }
    setIsCalculating(true)
    setError('')
    try {
      const res = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseType, jurisdiction, filingDate, description }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.result)
      } else {
        setError(data.error || 'Failed to calculate deadlines')
      }
    } catch { setError('Network error') }
    finally { setIsCalculating(false) }
  }

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'Filing': 'bg-blue-100 text-blue-800',
      'Limitation': 'bg-red-100 text-red-800',
      'Service': 'bg-yellow-100 text-yellow-800',
      'Response': 'bg-green-100 text-green-800',
      'Hearing': 'bg-purple-100 text-purple-800',
    }
    return colors[cat] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <span className="text-xl font-bold text-gray-900">CaseWin AI</span>
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/tools" className="text-gray-600 hover:text-gray-900 font-medium">All Tools</Link>
            <Link href="/marketplace" className="text-gray-600 hover:text-gray-900 font-medium">Marketplace</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">📅</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deadline & Court Date Calculator</h1>
              <p className="text-gray-600">AI calculates all statutory deadlines and limitation periods for your case</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Case Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Case Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {caseTypes.map(ct => (
                    <button key={ct.id} onClick={() => setCaseType(ct.id)}
                      className={`p-2 text-xs rounded-lg border-2 text-left transition-all ${caseType === ct.id ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="block text-base mb-0.5">{ct.icon}</span>
                      {ct.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500">
                  {jurisdictions.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filing / Incident Date</label>
                <input type="date" value={filingDate} onChange={e => setFilingDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Description</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of the legal matter..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500" />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

              <button onClick={handleCalculate} disabled={isCalculating}
                className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors">
                {isCalculating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Calculating...
                  </span>
                ) : '📅 Calculate Deadlines'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!result && !isCalculating && (
              <div className="bg-white rounded-xl border p-12 text-center">
                <span className="text-5xl mb-4 block">📅</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Calculate Your Deadlines</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">Select your case type and jurisdiction. Our AI will calculate all applicable statutory deadlines, limitation periods, and filing timelines under Nigerian law.</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {result.warnings && result.warnings.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="font-semibold text-red-800 mb-2">⚠️ Warnings</h3>
                    <ul className="space-y-1">{result.warnings.map((w, i) => <li key={i} className="text-sm text-red-700">• {w}</li>)}</ul>
                  </div>
                )}

                {result.limitationPeriod && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h3 className="font-semibold text-amber-800 mb-1">⏰ Limitation Period</h3>
                    <p className="text-sm text-amber-700">{result.limitationPeriod}</p>
                  </div>
                )}

                {result.deadlines && result.deadlines.length > 0 ? (
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                      <h3 className="font-semibold text-gray-900">Calculated Deadlines ({result.deadlines.length})</h3>
                    </div>
                    <div className="divide-y">
                      {result.deadlines.map((d, i) => (
                        <div key={i} className={`p-4 ${d.critical ? 'bg-red-50/50' : ''}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {d.critical && <span className="text-red-500 text-xs font-bold">🔴 CRITICAL</span>}
                                <h4 className="font-semibold text-gray-900">{d.title}</h4>
                              </div>
                              <p className="text-xs text-gray-500 mb-1">Authority: {d.authority}</p>
                              {d.notes && <p className="text-sm text-gray-600">{d.notes}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor(d.category)}`}>{d.category}</span>
                              {d.date && <p className="text-sm font-mono text-gray-900 mt-1">{d.date}</p>}
                              {d.daysRemaining !== undefined && (
                                <p className={`text-xs font-medium ${d.daysRemaining < 30 ? 'text-red-600' : 'text-gray-500'}`}>{d.daysRemaining} days</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : result.fullAnalysis ? (
                  <div className="bg-white rounded-xl border p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Analysis</h3>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{result.fullAnalysis}</div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
