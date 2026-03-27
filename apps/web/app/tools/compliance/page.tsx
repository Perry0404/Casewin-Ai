'use client'

import { useState } from 'react'
import Link from 'next/link'

const regulations = [
  { id: 'cama', name: 'CAMA 2020', description: 'Companies and Allied Matters Act' },
  { id: 'ndpr', name: 'NDPR', description: 'Nigeria Data Protection Regulation' },
  { id: 'firs', name: 'FIRS', description: 'Federal Inland Revenue Service Tax Laws' },
  { id: 'cbn', name: 'CBN Regulations', description: 'Central Bank of Nigeria Guidelines' },
  { id: 'sec', name: 'SEC Rules', description: 'Securities and Exchange Commission' },
  { id: 'labour', name: 'Labour Act', description: 'Nigerian Labour Laws' },
  { id: 'consumer', name: 'FCCPC', description: 'Consumer Protection Regulations' },
  { id: 'environment', name: 'NESREA', description: 'Environmental Regulations' },
]

export default function CompliancePage() {
  const [documentText, setDocumentText] = useState('')
  const [selectedRegulations, setSelectedRegulations] = useState<string[]>(['cama', 'ndpr'])
  const [isChecking, setIsChecking] = useState(false)
  const [results, setResults] = useState<{
    overallCompliance: number
    issues: { regulation: string; issue: string; severity: 'critical' | 'major' | 'minor'; recommendation: string }[]
    compliantAreas: string[]
    actionItems: string[]
  } | null>(null)
  const [error, setError] = useState('')

  const toggleRegulation = (id: string) => {
    setSelectedRegulations(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const handleCheck = async () => {
    if (!documentText.trim()) {
      setError('Please paste document text to check')
      return
    }

    if (selectedRegulations.length === 0) {
      setError('Please select at least one regulation')
      return
    }

    setIsChecking(true)
    setError('')
    
    try {
      const response = await fetch('/api/compliance-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText,
          regulations: selectedRegulations,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setResults(data.results)
      } else {
        setError(data.error || 'Failed to check compliance')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-500/10 text-red-400'
      case 'major': return 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
      case 'minor': return 'border-blue-500 bg-blue-500/10 text-blue-400'
      default: return 'border-gray-500 bg-gray-500/10 text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-pink-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">⚖️</span>
              <span className="text-xl font-bold text-white">CaseWin AI</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/tools" className="text-gray-300 hover:text-white transition">
                All Tools
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800/50 to-rose-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-rose-500 rounded-xl flex items-center justify-center text-3xl">
              ✅
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Compliance Check</h1>
              <p className="text-gray-300">Check documents against Nigerian regulations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Regulations Selection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20">
              <h2 className="text-lg font-semibold text-white mb-4">Select Regulations to Check</h2>
              <div className="grid grid-cols-2 gap-3">
                {regulations.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => toggleRegulation(reg.id)}
                    className={`p-3 rounded-lg border text-left transition ${
                      selectedRegulations.includes(reg.id)
                        ? 'border-pink-500 bg-green-500/20 text-white'
                        : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className="font-medium block">{reg.name}</span>
                    <span className="text-xs text-gray-400">{reg.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Input */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20">
              <h2 className="text-lg font-semibold text-white mb-4">Document Text</h2>
              <textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                rows={14}
                placeholder="Paste your document, contract, or policy text here to check for compliance issues..."
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleCheck}
                disabled={isChecking || !documentText.trim()}
                className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-rose-600 hover:from-emerald-700 hover:to-rose-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
              >
                {isChecking ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Checking Compliance...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>Check Compliance</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {results ? (
              <>
                {/* Compliance Score */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20 text-center">
                  <h2 className="text-lg font-semibold text-white mb-4">Compliance Score</h2>
                  <div className={`text-6xl font-bold ${
                    results.overallCompliance >= 80 ? 'text-green-400' :
                    results.overallCompliance >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {results.overallCompliance}%
                  </div>
                  <div className="mt-4 h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        results.overallCompliance >= 80 ? 'bg-green-500' :
                        results.overallCompliance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${results.overallCompliance}%` }}
                    />
                  </div>
                </div>

                {/* Issues */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20">
                  <h3 className="font-semibold text-white mb-4">🚨 Compliance Issues ({results.issues.length})</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {results.issues.map((issue, i) => (
                      <div key={i} className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{issue.regulation}</span>
                          <span className="text-xs px-2 py-1 rounded uppercase">
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{issue.issue}</p>
                        <p className="text-sm">
                          <span className="text-emerald-400">Fix:</span> {issue.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliant Areas */}
                {results.compliantAreas.length > 0 && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                    <h3 className="font-semibold text-green-400 mb-2">✅ Compliant Areas</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {results.compliantAreas.map((area, i) => (
                        <li key={i}>• {area}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Items */}
                <div className="bg-pink-900/20 border border-pink-500/30 rounded-xl p-4">
                  <h3 className="font-semibold text-emerald-400 mb-2">📋 Action Items</h3>
                  <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                    {results.actionItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <button className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-semibold transition">
                    📄 Download Report
                  </button>
                  <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition">
                    👨‍⚖️ Get Legal Help
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20 h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <span className="text-6xl mb-4 block">✅</span>
                  <p>Paste a document to check compliance</p>
                  <p className="text-sm mt-2">We'll analyze against Nigerian regulations</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
