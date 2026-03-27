'use client'

import { useState } from 'react'
import Link from 'next/link'

const reporters = [
  { id: 'nwlr', name: 'NWLR', full: 'Nigerian Weekly Law Reports' },
  { id: 'lpelr', name: 'LPELR', full: 'Law Pavilion Electronic Reports' },
  { id: 'fwlr', name: 'FWLR', full: 'Federation Weekly Law Reports' },
  { id: 'sc', name: 'SC', full: 'Supreme Court Reports' },
  { id: 'nsc', name: 'NSCC', full: 'Nigerian Supreme Court Cases' },
  { id: 'allnlr', name: 'All NLR', full: 'All Nigeria Law Reports' },
  { id: 'wrn', name: 'WRN', full: 'Weekly Reports of Nigeria' },
]

const courtList = [
  'Supreme Court', 'Court of Appeal', 'Federal High Court',
  'State High Court', 'National Industrial Court', 'Customary Court of Appeal',
  'Sharia Court of Appeal'
]

export default function CitationsPage() {
  const [mode, setMode] = useState<'format' | 'extract'>('format')
  const [caseName, setCaseName] = useState('')
  const [year, setYear] = useState('')
  const [court, setCourt] = useState('')
  const [volume, setVolume] = useState('')
  const [page, setPage] = useState('')
  const [reporter, setReporter] = useState('')
  const [extractText, setExtractText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (mode === 'format' && !caseName) { setError('Enter a case name'); return }
    if (mode === 'extract' && !extractText.trim()) { setError('Paste text to extract citations from'); return }
    setIsLoading(true); setError('')
    try {
      const res = await fetch('/api/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'format' ? { mode, caseName, year, court, volume, page, reporter } : { mode, text: extractText }),
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
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><span className="text-xl">📚</span></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Legal Citation Generator</h1>
              <p className="text-gray-600 text-sm">Format Nigerian legal citations in NWLR, LPELR, SC, and more</p>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border p-1 w-fit">
          <button onClick={() => { setMode('format'); setResult(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'format' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            ✏️ Format Citation
          </button>
          <button onClick={() => { setMode('extract'); setResult(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'extract' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            🔍 Extract Citations
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-6 space-y-4">
              {mode === 'format' ? (
                <>
                  <h2 className="font-semibold text-gray-900">Case Details</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Case Name *</label>
                    <input value={caseName} onChange={e => setCaseName(e.target.value)} placeholder="e.g., Abacha v. Fawehinmi"
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <input value={year} onChange={e => setYear(e.target.value)} placeholder="2000"
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
                      <select value={court} onChange={e => setCourt(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="">Select...</option>
                        {courtList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                      <input value={volume} onChange={e => setVolume(e.target.value)} placeholder="6"
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Page</label>
                      <input value={page} onChange={e => setPage(e.target.value)} placeholder="228"
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reporter Series</label>
                    <div className="flex flex-wrap gap-2">
                      {reporters.map(r => (
                        <button key={r.id} onClick={() => setReporter(r.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${reporter === r.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-semibold text-gray-900">Extract Citations</h2>
                  <p className="text-sm text-gray-500">Paste any legal text and AI will find and format all citations.</p>
                  <textarea rows={12} value={extractText} onChange={e => setExtractText(e.target.value)}
                    placeholder="Paste legal text here... e.g., judgment, brief of argument, or any document containing case citations"
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </>
              )}
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
              <button onClick={handleSubmit} disabled={isLoading}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50">
                {isLoading ? 'Processing...' : mode === 'format' ? '📚 Format Citation' : '🔍 Extract & Format'}
              </button>
            </div>
          </div>

          <div>
            {!result && (
              <div className="bg-white rounded-xl border p-12 text-center">
                <span className="text-5xl mb-4 block">📚</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nigerian Legal Citations</h3>
                <p className="text-gray-500 text-sm">Generate properly formatted citations in NWLR, LPELR, FWLR, SC, and other Nigerian law report formats.</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {result.citations && result.citations.map((c: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {c.format && <span className="text-xs text-green-600 font-semibold uppercase">{c.format}</span>}
                        {c.caseName && <p className="text-sm font-medium text-gray-900 mt-0.5">{c.caseName}</p>}
                        <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1 text-gray-800">{c.citation || c.formatted}</p>
                        {c.original && <p className="text-xs text-gray-400 mt-1">Original: {c.original}</p>}
                        {c.court && <p className="text-xs text-gray-500 mt-0.5">{c.court} {c.year && `• ${c.year}`}</p>}
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(c.citation || c.formatted)}
                        className="text-xs text-green-600 hover:text-green-700 flex-shrink-0">Copy</button>
                    </div>
                  </div>
                ))}

                {result.caseInfo && (
                  <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                    <h3 className="font-semibold text-green-900 mb-1">{result.caseInfo.caseName}</h3>
                    <p className="text-sm text-green-700">{result.caseInfo.court} • {result.caseInfo.year}</p>
                    {result.caseInfo.summary && <p className="text-sm text-green-600 mt-1">{result.caseInfo.summary}</p>}
                  </div>
                )}

                {result.totalFound !== undefined && (
                  <p className="text-sm text-gray-500 text-center">{result.totalFound} citation{result.totalFound !== 1 ? 's' : ''} found</p>
                )}

                {result.fullAnalysis && !result.citations && (
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
