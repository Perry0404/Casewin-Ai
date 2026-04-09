'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SubscriptionGuard from '@/components/SubscriptionGuard'

interface BriefSection {
  title: string
  type: 'legislation' | 'court_decision' | 'regulatory' | 'market' | 'compliance' | 'opportunity'
  summary: string
  impact: 'high' | 'medium' | 'low'
  practiceAreas: string[]
  actionItems: string[]
  source?: string
  date?: string
}

interface DailyBrief {
  date: string
  headline: string
  sections: BriefSection[]
  marketInsights: string[]
  upcomingDeadlines: string[]
  generatedAt: string
}

const practiceAreaOptions = [
  'Corporate & Commercial',
  'Litigation & Dispute Resolution',
  'Real Estate & Property',
  'Banking & Finance',
  'Oil & Gas / Energy',
  'Tax Law',
  'Intellectual Property',
  'Employment & Labour',
  'Family Law',
  'Criminal Law',
  'Constitutional Law',
  'Maritime & Admiralty',
  'Telecommunications & Technology',
  'Environmental Law',
]

const typeIcons: Record<string, string> = {
  legislation: '\u{1F4DC}',
  court_decision: '\u{2696}\u{FE0F}',
  regulatory: '\u{1F3DB}\u{FE0F}',
  market: '\u{1F4C8}',
  compliance: '\u{2705}',
  opportunity: '\u{1F4A1}',
}

const typeLabels: Record<string, string> = {
  legislation: 'New Legislation',
  court_decision: 'Court Decision',
  regulatory: 'Regulatory Update',
  market: 'Market Intelligence',
  compliance: 'Compliance Alert',
  opportunity: 'Business Opportunity',
}

const impactColors: Record<string, string> = {
  high: 'bg-red-600/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
}

export default function IntelligenceBriefPage() {
  return (
    <SubscriptionGuard tool="intelligence">
      <IntelligenceBriefContent />
    </SubscriptionGuard>
  )
}

function IntelligenceBriefContent() {
  const [brief, setBrief] = useState<DailyBrief | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [showSetup, setShowSetup] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterImpact, setFilterImpact] = useState<string>('all')

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem('casewin_brief_areas')
    if (saved) {
      try {
        const areas = JSON.parse(saved)
        setSelectedAreas(areas)
        // Auto-generate if areas are saved
        if (areas.length > 0) {
          setShowSetup(false)
          generateBrief(areas)
        }
      } catch { /* ignore */ }
    }
  }, [])

  const toggleArea = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    )
  }

  const generateBrief = async (areas?: string[]) => {
    const areasToUse = areas || selectedAreas
    if (areasToUse.length === 0) {
      setError('Select at least one practice area')
      return
    }

    setIsLoading(true)
    setError('')
    setShowSetup(false)

    // Save preferences
    localStorage.setItem('casewin_brief_areas', JSON.stringify(areasToUse))

    try {
      const res = await fetch('/api/intelligence/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceAreas: areasToUse,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setBrief(data.brief)
      } else {
        setError(data.error || 'Failed to generate brief')
      }
    } catch (err) {
      setError('Network error — please try again')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSections = brief?.sections.filter(s => {
    if (filterType !== 'all' && s.type !== filterType) return false
    if (filterImpact !== 'all' && s.impact !== filterImpact) return false
    return true
  }) || []

  const highImpactCount = brief?.sections.filter(s => s.impact === 'high').length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">{'\u2696\uFE0F'}</span>
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
      <div className="bg-gradient-to-r from-indigo-800/50 to-purple-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-3xl">
                {'\u{1F4F0}'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Daily Intelligence Brief</h1>
                <p className="text-gray-300">Personalized Nigerian legal updates — powered by AI</p>
              </div>
            </div>
            {brief && (
              <div className="hidden md:flex items-center space-x-3">
                {highImpactCount > 0 && (
                  <span className="bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-sm font-semibold">
                    {highImpactCount} High Impact
                  </span>
                )}
                <span className="text-gray-400 text-sm">{brief.date}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Setup / Practice Area Selection */}
        {showSetup && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Personalize Your Brief</h2>
            <p className="text-gray-400 mb-6">Select your practice areas to get relevant intelligence</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {practiceAreaOptions.map(area => (
                <button
                  key={area}
                  onClick={() => toggleArea(area)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition border ${
                    selectedAreas.includes(area)
                      ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                      : 'bg-gray-700/30 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <button
              onClick={() => generateBrief()}
              disabled={selectedAreas.length === 0 || isLoading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              {isLoading ? 'Generating...' : 'Generate My Brief'}
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-16 border border-purple-500/20 text-center">
            <div className="animate-spin text-6xl mb-4">{'\u{1F4F0}'}</div>
            <h3 className="text-xl font-semibold text-white mb-2">Generating Your Intelligence Brief</h3>
            <p className="text-gray-400">Scanning Nigerian legal landscape, court decisions, legislation...</p>
            <div className="mt-6 flex justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}

        {/* Brief Content */}
        {brief && !isLoading && (
          <>
            {/* Headline */}
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl p-6 border border-purple-500/30 mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{'\u{1F4E2}'}</span>
                <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Top Story</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{brief.headline}</h2>
            </div>

            {/* Filters & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Types</option>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select
                  value={filterImpact}
                  onChange={e => setFilterImpact(e.target.value)}
                  className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Impact</option>
                  <option value="high">High Impact</option>
                  <option value="medium">Medium Impact</option>
                  <option value="low">Low Impact</option>
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSetup(true)}
                  className="text-gray-400 hover:text-white text-sm transition"
                >
                  Change Areas
                </button>
                <button
                  onClick={() => generateBrief()}
                  className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 px-4 py-2 rounded-lg text-sm font-medium transition border border-purple-500/30"
                >
                  Refresh Brief
                </button>
              </div>
            </div>

            {/* Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              {filteredSections.map((section, i) => (
                <div
                  key={i}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50 hover:border-purple-500/30 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{typeIcons[section.type] || '\u{1F4CB}'}</span>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {typeLabels[section.type] || section.type}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${impactColors[section.impact]}`}>
                      {section.impact.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">{section.title}</h3>
                  <p className="text-gray-300 text-sm mb-3 leading-relaxed">{section.summary}</p>

                  {/* Practice Areas Tags */}
                  {section.practiceAreas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {section.practiceAreas.map((area, j) => (
                        <span key={j} className="bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded text-xs">
                          {area}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Items */}
                  {section.actionItems.length > 0 && (
                    <div className="bg-gray-900/30 rounded-lg p-3 mt-2">
                      <p className="text-xs font-semibold text-purple-400 mb-1 uppercase tracking-wider">Action Required</p>
                      <ul className="space-y-1">
                        {section.actionItems.map((item, j) => (
                          <li key={j} className="text-sm text-gray-300 flex items-start space-x-2">
                            <span className="text-purple-400 mt-0.5">{'\u2192'}</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {section.source && (
                    <p className="text-xs text-gray-500 mt-2">Source: {section.source}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Row: Market Insights + Deadlines */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Market Insights */}
              {brief.marketInsights.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-xl">{'\u{1F4C8}'}</span>
                    <h3 className="text-lg font-semibold text-white">Market Insights</h3>
                  </div>
                  <ul className="space-y-3">
                    {brief.marketInsights.map((insight, i) => (
                      <li key={i} className="flex items-start space-x-3 text-gray-300 text-sm">
                        <span className="text-green-400 mt-0.5">{'\u2022'}</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upcoming Deadlines */}
              {brief.upcomingDeadlines.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-red-500/20">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-xl">{'\u{23F0}'}</span>
                    <h3 className="text-lg font-semibold text-white">Upcoming Deadlines</h3>
                  </div>
                  <ul className="space-y-3">
                    {brief.upcomingDeadlines.map((deadline, i) => (
                      <li key={i} className="flex items-start space-x-3 text-gray-300 text-sm">
                        <span className="text-red-400 mt-0.5">{'\u{1F534}'}</span>
                        <span>{deadline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Generated timestamp */}
            <p className="text-center text-gray-500 text-xs mt-8">
              Brief generated at {new Date(brief.generatedAt).toLocaleTimeString()} | Powered by CaseWin AI
            </p>
          </>
        )}

        {/* Error */}
        {error && !isLoading && !showSetup && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => generateBrief()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
