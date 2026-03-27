'use client'

import { useState } from 'react'
import Link from 'next/link'

const caseTypes = [
  { id: 'civil', name: 'Civil Case', icon: '📋' },
  { id: 'criminal', name: 'Criminal Case', icon: '⚖️' },
  { id: 'family', name: 'Family Law', icon: '👨‍👩‍👧' },
  { id: 'property', name: 'Property/Land', icon: '🏠' },
  { id: 'commercial', name: 'Commercial', icon: '💼' },
  { id: 'constitutional', name: 'Constitutional', icon: '📜' },
  { id: 'employment', name: 'Employment', icon: '👔' },
  { id: 'tax', name: 'Tax', icon: '💰' },
]

const courts = [
  'Supreme Court of Nigeria',
  'Court of Appeal',
  'Federal High Court',
  'State High Court',
  'National Industrial Court',
  'Magistrate Court',
  'Customary Court',
  'Sharia Court',
]

interface PredictionResult {
  winProbability: number
  confidence: string
  keyFactors: string[]
  similarCases: { name: string; outcome: string; relevance: number }[]
  recommendations: string[]
  risks: string[]
}

export default function PredictPage() {
  const [caseType, setCaseType] = useState('')
  const [court, setCourt] = useState('')
  const [caseFacts, setCaseFacts] = useState('')
  const [clientPosition, setClientPosition] = useState<'plaintiff' | 'defendant'>('plaintiff')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [error, setError] = useState('')

  const handlePredict = async () => {
    if (!caseType || !caseFacts) {
      setError('Please select a case type and provide case facts')
      return
    }

    setIsAnalyzing(true)
    setError('')
    
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseType,
          court,
          caseFacts,
          clientPosition,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setPrediction(data.prediction)
      } else {
        setError(data.error || 'Failed to analyze case')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-green-400'
    if (prob >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getProbabilityBg = (prob: number) => {
    if (prob >= 70) return 'from-green-500 to-emerald-500'
    if (prob >= 50) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-emerald-500'
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
              <Link href="/predictions" className="text-gray-300 hover:text-white transition">
                Prediction Markets
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-green-800/50 to-emerald-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-3xl">
              🔮
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Case Prediction</h1>
              <p className="text-gray-300">AI-powered outcome prediction based on Nigerian case law</p>
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
              <h2 className="text-xl font-semibold text-white mb-4">Case Details</h2>
              
              {/* Case Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-3">Case Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {caseTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setCaseType(type.id)}
                      className={`p-3 rounded-lg border text-left transition ${
                        caseType === type.id
                          ? 'border-green-500 bg-green-500/20 text-white'
                          : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-xl mr-2">{type.icon}</span>
                      <span className="text-sm">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Court */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Court</label>
                <select
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Court</option>
                  {courts.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Client Position */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Your Client's Position</label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setClientPosition('plaintiff')}
                    className={`flex-1 p-3 rounded-lg border transition ${
                      clientPosition === 'plaintiff'
                        ? 'border-green-500 bg-green-500/20 text-white'
                        : 'border-gray-600 bg-gray-700/30 text-gray-300'
                    }`}
                  >
                    Plaintiff/Claimant
                  </button>
                  <button
                    onClick={() => setClientPosition('defendant')}
                    className={`flex-1 p-3 rounded-lg border transition ${
                      clientPosition === 'defendant'
                        ? 'border-green-500 bg-green-500/20 text-white'
                        : 'border-gray-600 bg-gray-700/30 text-gray-300'
                    }`}
                  >
                    Defendant
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
                  placeholder="Describe the facts of the case in detail. Include:&#10;- What happened&#10;- When it happened&#10;- Evidence available&#10;- Key witnesses&#10;- Claims being made"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handlePredict}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyzing Case...</span>
                  </>
                ) : (
                  <>
                    <span>🔮</span>
                    <span>Predict Outcome</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {prediction ? (
              <>
                {/* Win Probability */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
                  <h2 className="text-xl font-semibold text-white mb-4">Prediction Result</h2>
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getProbabilityColor(prediction.winProbability)}`}>
                      {prediction.winProbability}%
                    </div>
                    <p className="text-gray-400 mt-2">Probability of Success</p>
                    <div className="mt-4 h-4 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getProbabilityBg(prediction.winProbability)} transition-all duration-1000`}
                        style={{ width: `${prediction.winProbability}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Confidence: {prediction.confidence}</p>
                  </div>
                </div>

                {/* Key Factors */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
                  <h3 className="font-semibold text-white mb-3">📊 Key Factors</h3>
                  <ul className="space-y-2">
                    {prediction.keyFactors.map((factor, i) => (
                      <li key={i} className="flex items-start space-x-2 text-gray-300">
                        <span className="text-green-400 mt-1">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Similar Cases */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
                  <h3 className="font-semibold text-white mb-3">📚 Similar Cases</h3>
                  <div className="space-y-3">
                    {prediction.similarCases.map((case_, i) => (
                      <div key={i} className="p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{case_.name}</span>
                          <span className="text-xs text-green-400">{case_.relevance}% relevant</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Outcome: {case_.outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations & Risks */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                    <h3 className="font-semibold text-green-400 mb-2">✅ Recommendations</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {prediction.recommendations.map((rec, i) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                    <h3 className="font-semibold text-red-400 mb-2">⚠️ Risks</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {prediction.risks.map((risk, i) => (
                        <li key={i}>• {risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20 h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <span className="text-6xl mb-4 block">🔮</span>
                  <p>Enter case details to get a prediction</p>
                  <p className="text-sm mt-2">Analysis based on 10,000+ Nigerian cases</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
