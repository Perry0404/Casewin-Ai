'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface AnalysisResult {
  overallRisk: 'low' | 'medium' | 'high'
  riskScore: number
  clauses: {
    title: string
    content: string
    risk: 'low' | 'medium' | 'high'
    issue: string
    suggestion: string
  }[]
  missingClauses: string[]
  complianceIssues: string[]
  recommendations: string[]
}

export default function AnalyzePage() {
  const [contractText, setContractText] = useState('')
  const [fileName, setFileName] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setContractText(text)
    }
    reader.readAsText(file)
  }

  const handleAnalyze = async () => {
    if (!contractText.trim()) {
      setError('Please upload a contract or paste contract text')
      return
    }

    setIsAnalyzing(true)
    setError('')
    
    try {
      const response = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText }),
      })

      const data = await response.json()
      
      if (data.success) {
        setAnalysis(data.analysis)
      } else {
        setError(data.error || 'Failed to analyze contract')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/50'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50'
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/50'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50'
    }
  }

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'low': return '✅ Low Risk'
      case 'medium': return '⚠️ Medium Risk'
      case 'high': return '🚨 High Risk'
      default: return risk
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-orange-500/20">
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
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-800/50 to-red-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-3xl">
              📄
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Contract Analysis</h1>
              <p className="text-gray-300">Identify risks, unfair terms, and compliance issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
              <h2 className="text-xl font-semibold text-white mb-4">Upload Contract</h2>
              
              {/* File Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 hover:border-orange-500 rounded-xl p-8 text-center cursor-pointer transition mb-4"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.doc,.docx,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="text-5xl mb-4 block">📁</span>
                {fileName ? (
                  <p className="text-orange-400 font-medium">{fileName}</p>
                ) : (
                  <>
                    <p className="text-gray-300 font-medium">Click to upload or drag and drop</p>
                    <p className="text-gray-500 text-sm mt-1">TXT, DOC, DOCX, or PDF</p>
                  </>
                )}
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">or paste text</span>
                </div>
              </div>

              {/* Text Input */}
              <textarea
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                rows={12}
                placeholder="Paste your contract text here..."
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !contractText.trim()}
                className="w-full mt-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Analyze Contract</span>
                  </>
                )}
              </button>
            </div>

            {/* What We Check */}
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
              <h3 className="font-semibold text-orange-400 mb-2">🔍 What We Check</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Unfair or one-sided clauses</li>
                <li>• Missing essential terms</li>
                <li>• Nigerian law compliance</li>
                <li>• Hidden penalties and fees</li>
                <li>• Termination and exit clauses</li>
                <li>• Liability and indemnity issues</li>
              </ul>
            </div>
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            {analysis ? (
              <>
                {/* Overall Risk Score */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
                  <h2 className="text-xl font-semibold text-white mb-4">Risk Assessment</h2>
                  <div className="text-center">
                    <div className={`inline-block px-6 py-3 rounded-full text-2xl font-bold ${getRiskColor(analysis.overallRisk)}`}>
                      {getRiskLabel(analysis.overallRisk)}
                    </div>
                    <div className="mt-4">
                      <div className="text-4xl font-bold text-white">{analysis.riskScore}/100</div>
                      <p className="text-gray-400 text-sm">Risk Score</p>
                    </div>
                    <div className="mt-4 h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          analysis.riskScore < 30 ? 'bg-green-500' :
                          analysis.riskScore < 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${analysis.riskScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Clause Analysis */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
                  <h3 className="font-semibold text-white mb-4">📋 Clause Analysis</h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {analysis.clauses.map((clause, i) => (
                      <div key={i} className={`p-4 rounded-lg border ${getRiskColor(clause.risk)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{clause.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${getRiskColor(clause.risk)}`}>
                            {clause.risk.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{clause.issue}</p>
                        <p className="text-gray-300 text-sm">
                          <span className="text-orange-400">Suggestion:</span> {clause.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Clauses */}
                {analysis.missingClauses.length > 0 && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                    <h3 className="font-semibold text-yellow-400 mb-2">⚠️ Missing Clauses</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {analysis.missingClauses.map((clause, i) => (
                        <li key={i}>• {clause}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                  <h3 className="font-semibold text-green-400 mb-2">✅ Recommendations</h3>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition">
                    📄 Download Report
                  </button>
                  <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition">
                    👨‍⚖️ Consult Lawyer
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20 h-[500px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <span className="text-6xl mb-4 block">📄</span>
                  <p>Upload or paste a contract to analyze</p>
                  <p className="text-sm mt-2">We'll identify risks and compliance issues</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
