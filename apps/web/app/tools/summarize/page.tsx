'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SummarizePage() {
  const [judgmentText, setJudgmentText] = useState('')
  const [summaryLength, setSummaryLength] = useState<'brief' | 'detailed'>('detailed')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summary, setSummary] = useState<{
    title: string
    citation: string
    court: string
    date: string
    parties: { plaintiff: string; defendant: string }
    facts: string
    issues: string[]
    holding: string
    reasoning: string
    ratio: string
    obiter: string[]
  } | null>(null)
  const [error, setError] = useState('')

  const handleSummarize = async () => {
    if (!judgmentText.trim()) {
      setError('Please paste a judgment to summarize')
      return
    }

    setIsSummarizing(true)
    setError('')
    
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judgmentText,
          summaryLength,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setSummary(data.summary)
      } else {
        setError(data.error || 'Failed to summarize')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-green-500/20">
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
      <div className="bg-gradient-to-r from-green-800/50 to-blue-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center text-3xl">
              📋
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Judgment Summarization</h1>
              <p className="text-gray-300">Extract key points from lengthy court judgments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
              <h2 className="text-xl font-semibold text-white mb-4">Judgment Text</h2>
              
              {/* Summary Length */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Summary Type</label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSummaryLength('brief')}
                    className={`flex-1 p-3 rounded-lg border transition ${
                      summaryLength === 'brief'
                        ? 'border-green-500 bg-green-500/20 text-white'
                        : 'border-gray-600 bg-gray-700/30 text-gray-300'
                    }`}
                  >
                    <span className="block font-medium">Brief</span>
                    <span className="text-xs text-gray-400">Key points only</span>
                  </button>
                  <button
                    onClick={() => setSummaryLength('detailed')}
                    className={`flex-1 p-3 rounded-lg border transition ${
                      summaryLength === 'detailed'
                        ? 'border-green-500 bg-green-500/20 text-white'
                        : 'border-gray-600 bg-gray-700/30 text-gray-300'
                    }`}
                  >
                    <span className="block font-medium">Detailed</span>
                    <span className="text-xs text-gray-400">Full analysis</span>
                  </button>
                </div>
              </div>

              <textarea
                value={judgmentText}
                onChange={(e) => setJudgmentText(e.target.value)}
                rows={18}
                placeholder="Paste the full judgment text here...&#10;&#10;Include:&#10;- Case title and citation&#10;- Facts of the case&#10;- Court's decision and reasoning"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSummarize}
                disabled={isSummarizing || !judgmentText.trim()}
                className="w-full mt-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
              >
                {isSummarizing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Summarizing...</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Summarize Judgment</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Summary Section */}
          <div className="space-y-4">
            {summary ? (
              <>
                {/* Case Header */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
                  <h2 className="text-xl font-bold text-white mb-1">{summary.title}</h2>
                  <p className="text-green-400 mb-3">{summary.citation}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span>📍 {summary.court}</span>
                    <span>📅 {summary.date}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-700 text-sm">
                    <p className="text-gray-400"><strong className="text-white">Plaintiff:</strong> {summary.parties.plaintiff}</p>
                    <p className="text-gray-400"><strong className="text-white">Defendant:</strong> {summary.parties.defendant}</p>
                  </div>
                </div>

                {/* Facts */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-green-500/20">
                  <h3 className="font-semibold text-green-400 mb-2">📖 Facts of the Case</h3>
                  <p className="text-gray-300 text-sm">{summary.facts}</p>
                </div>

                {/* Issues */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-green-500/20">
                  <h3 className="font-semibold text-green-400 mb-2">❓ Issues for Determination</h3>
                  <ul className="space-y-2">
                    {summary.issues.map((issue, i) => (
                      <li key={i} className="flex items-start space-x-2 text-gray-300 text-sm">
                        <span className="text-green-400">{i + 1}.</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Holding */}
                <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-5">
                  <h3 className="font-semibold text-green-400 mb-2">⚖️ Holding (Decision)</h3>
                  <p className="text-white">{summary.holding}</p>
                </div>

                {/* Ratio Decidendi */}
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-5">
                  <h3 className="font-semibold text-green-400 mb-2">📜 Ratio Decidendi</h3>
                  <p className="text-gray-300 text-sm">{summary.ratio}</p>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition">
                    📄 Download Summary
                  </button>
                  <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition">
                    💾 Save to Library
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20 h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <span className="text-6xl mb-4 block">📋</span>
                  <p>Paste a judgment to get a structured summary</p>
                  <p className="text-sm mt-2">Extracts facts, issues, holding, and ratio</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
