'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ArgumentsPage() {
  const [casePosition, setCasePosition] = useState<'plaintiff' | 'defendant'>('plaintiff')
  const [caseFacts, setCaseFacts] = useState('')
  const [legalIssues, setLegalIssues] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [arguments_, setArguments] = useState<{
    mainArguments: { title: string; content: string; authorities: string[] }[]
    counterArguments: { point: string; rebuttal: string }[]
    conclusion: string
  } | null>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!caseFacts.trim()) {
      setError('Please provide case facts')
      return
    }

    setIsGenerating(true)
    setError('')
    
    try {
      const response = await fetch('/api/generate-arguments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          casePosition,
          caseFacts,
          legalIssues,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setArguments(data.arguments)
      } else {
        setError(data.error || 'Failed to generate arguments')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-yellow-500/20">
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
      <div className="bg-gradient-to-r from-yellow-800/50 to-orange-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-3xl">
              ⚖️
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Argument Generation</h1>
              <p className="text-gray-300">Generate persuasive legal arguments with authorities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20">
              <h2 className="text-xl font-semibold text-white mb-4">Case Details</h2>
              
              {/* Position */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Your Position</label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setCasePosition('plaintiff')}
                    className={`flex-1 p-4 rounded-lg border transition ${
                      casePosition === 'plaintiff'
                        ? 'border-yellow-500 bg-yellow-500/20 text-white'
                        : 'border-gray-600 bg-gray-700/30 text-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">🎯</span>
                    <span className="font-medium">Plaintiff/Claimant</span>
                  </button>
                  <button
                    onClick={() => setCasePosition('defendant')}
                    className={`flex-1 p-4 rounded-lg border transition ${
                      casePosition === 'defendant'
                        ? 'border-yellow-500 bg-yellow-500/20 text-white'
                        : 'border-gray-600 bg-gray-700/30 text-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">🛡️</span>
                    <span className="font-medium">Defendant</span>
                  </button>
                </div>
              </div>

              {/* Case Facts */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Case Facts</label>
                <textarea
                  value={caseFacts}
                  onChange={(e) => setCaseFacts(e.target.value)}
                  rows={8}
                  placeholder="Describe the facts of your case in detail...&#10;&#10;Include:&#10;- What happened&#10;- Who is involved&#10;- Key evidence&#10;- Timeline of events"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {/* Legal Issues */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Legal Issues (Optional)</label>
                <textarea
                  value={legalIssues}
                  onChange={(e) => setLegalIssues(e.target.value)}
                  rows={3}
                  placeholder="What specific legal questions need to be addressed?"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !caseFacts.trim()}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Generating Arguments...</span>
                  </>
                ) : (
                  <>
                    <span>⚖️</span>
                    <span>Generate Arguments</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Arguments Section */}
          <div className="space-y-4">
            {arguments_ ? (
              <>
                {/* Main Arguments */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20">
                  <h2 className="text-xl font-semibold text-white mb-4">📜 Main Arguments</h2>
                  <div className="space-y-6">
                    {arguments_.mainArguments.map((arg, i) => (
                      <div key={i} className="border-l-4 border-yellow-500 pl-4">
                        <h3 className="font-semibold text-white mb-2">{i + 1}. {arg.title}</h3>
                        <p className="text-gray-300 text-sm mb-3">{arg.content}</p>
                        <div className="bg-gray-700/30 rounded p-3">
                          <p className="text-xs text-gray-400 mb-1">Authorities:</p>
                          <ul className="text-sm text-yellow-400 space-y-1">
                            {arg.authorities.map((auth, j) => (
                              <li key={j}>• {auth}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Counter-Arguments */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20">
                  <h2 className="text-xl font-semibold text-white mb-4">🛡️ Anticipated Counter-Arguments & Rebuttals</h2>
                  <div className="space-y-4">
                    {arguments_.counterArguments.map((counter, i) => (
                      <div key={i} className="bg-gray-700/30 rounded-lg p-4">
                        <p className="text-red-400 text-sm mb-2">
                          <strong>They may argue:</strong> {counter.point}
                        </p>
                        <p className="text-green-400 text-sm">
                          <strong>Your rebuttal:</strong> {counter.rebuttal}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conclusion */}
                <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-5">
                  <h3 className="font-semibold text-yellow-400 mb-2">🎯 Recommended Conclusion</h3>
                  <p className="text-gray-300">{arguments_.conclusion}</p>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <button className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-semibold transition">
                    📄 Export Arguments
                  </button>
                  <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition">
                    ✏️ Edit & Refine
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20 h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <span className="text-6xl mb-4 block">⚖️</span>
                  <p>Enter case details to generate arguments</p>
                  <p className="text-sm mt-2">Get structured arguments with legal authorities</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
