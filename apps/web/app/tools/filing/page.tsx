'use client'

import { useState } from 'react'
import Link from 'next/link'

const courts = [
  { id: 'fhc', name: 'Federal High Court', icon: '🏛️' },
  { id: 'shc-lagos', name: 'State High Court (Lagos)', icon: '⚖️' },
  { id: 'shc-fct', name: 'State High Court (FCT Abuja)', icon: '⚖️' },
  { id: 'ca', name: 'Court of Appeal', icon: '📜' },
  { id: 'sc', name: 'Supreme Court', icon: '🏅' },
  { id: 'nic', name: 'National Industrial Court', icon: '👔' },
  { id: 'magistrate', name: 'Magistrate Court', icon: '📋' },
]

const documentTypes = [
  'Originating Summons', 'Writ of Summons', 'Statement of Claim',
  'Statement of Defence', 'Motion on Notice', 'Motion Ex-Parte',
  'Brief of Argument', 'Written Address', 'Counter-Affidavit',
  'Notice of Appeal', 'Petition', 'Originating Motion',
]

export default function FilingPage() {
  const [court, setCourt] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [caseType, setCaseType] = useState('')
  const [details, setDetails] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!court || !documentType) { setError('Please select court and document type'); return }
    setIsLoading(true); setError('')
    try {
      const res = await fetch('/api/filing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ court, documentType, caseType, details }),
      })
      const data = await res.json()
      if (data.success) setResult(data.result)
      else setError(data.error || 'Failed')
    } catch { setError('Network error') }
    finally { setIsLoading(false) }
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
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center"><span className="text-xl">📝</span></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Court Filing Prep</h1>
              <p className="text-gray-600 text-sm">Get formatting rules, checklists, and fee schedules for Nigerian courts</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Filing Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Court *</label>
                <div className="space-y-2">
                  {courts.map(c => (
                    <button key={c.id} onClick={() => setCourt(c.name)}
                      className={`w-full p-3 text-left rounded-lg border-2 text-sm transition-all ${court === c.name ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="mr-2">{c.icon}</span>{c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                <select value={documentType} onChange={e => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Choose document...</option>
                  {documentTypes.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
                <input value={caseType} onChange={e => setCaseType(e.target.value)} placeholder="Civil, Criminal..."
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                <textarea rows={2} value={details} onChange={e => setDetails(e.target.value)} placeholder="Any specific requirements..."
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
              <button onClick={handleGenerate} disabled={isLoading}
                className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 disabled:opacity-50">
                {isLoading ? 'Generating...' : '📝 Generate Filing Guide'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!result && !isLoading && (
              <div className="bg-white rounded-xl border p-12 text-center">
                <span className="text-5xl mb-4 block">📝</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Court Filing Preparation</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">Select a court and document type. AI will generate the complete filing checklist, formatting rules, fee schedule, and cover page template.</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {result.checklist && (
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-cyan-50"><h3 className="font-semibold text-cyan-900">📋 Filing Checklist</h3></div>
                    <div className="p-4 space-y-2">
                      {result.checklist.map((item: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                          <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs mt-0.5 ${item.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                            {item.required ? '!' : '○'}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.item}</p>
                            {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                          </div>
                          {item.copies && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{item.copies} copies</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.formattingRules && (
                  <div className="bg-white rounded-xl border p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">📐 Formatting Rules</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {Object.entries(result.formattingRules).map(([k, v]) => (
                        <div key={k} className="flex justify-between bg-gray-50 p-2 rounded">
                          <span className="text-gray-600 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-medium text-gray-900">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.filingFees && (
                  <div className="bg-white rounded-xl border p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">💰 Filing Fees</h3>
                    <div className="space-y-2">
                      {result.filingFees.map((fee: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">{fee.item}</span>
                          <span className="font-semibold text-gray-900">{fee.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.tips && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">💡 Pro Tips</h3>
                    <ul className="space-y-1">{result.tips.map((t: string, i: number) => <li key={i} className="text-sm text-yellow-700">• {t}</li>)}</ul>
                  </div>
                )}

                {result.fullAnalysis && !result.checklist && (
                  <div className="bg-white rounded-xl border p-6">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{result.fullAnalysis}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
