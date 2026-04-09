'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SearchResult {
  id: string
  title: string
  citation: string
  court: string
  year: number
  summary: string
  relevance: number
  keyPrinciples: string[]
  source?: 'database' | 'ai'
  category?: string
  isLandmark?: boolean
}

const jurisdictions = [
  'All Courts',
  'Supreme Court of Nigeria',
  'Court of Appeal',
  'Federal High Court',
  'State High Courts',
  'National Industrial Court',
]

const categories = [
  'All Categories',
  'Contract Law',
  'Criminal Law',
  'Constitutional Law',
  'Family Law',
  'Land Law',
  'Tort Law',
  'Company Law',
  'Labour Law',
  'Tax Law',
]

export default function ResearchPage() {
  const [query, setQuery] = useState('')
  const [jurisdiction, setJurisdiction] = useState('All Courts')
  const [category, setCategory] = useState('All Categories')
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedCase, setSelectedCase] = useState<SearchResult | null>(null)
  const [totalResults, setTotalResults] = useState(0)
  const [searchMeta, setSearchMeta] = useState<{ dbCount: number; aiCount: number } | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setSearchMeta(null)
    
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          jurisdiction,
          category,
          yearFrom: yearFrom || undefined,
          yearTo: yearTo || undefined,
        }),
      })

      const data = await response.json()
      
      if (data.success && data.results) {
        setResults(data.results)
        setTotalResults(data.total)
        setSearchMeta({ dbCount: data.dbCount || 0, aiCount: data.aiCount || 0 })
      } else if (data.success && data.research) {
        // Legacy text-only response — convert to display
        setResults([])
        setTotalResults(0)
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
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
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                Dashboard
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
              🔍
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Legal Research</h1>
              <p className="text-gray-300">Search 10,000+ Nigerian court judgments and legal principles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20 mb-8">
          {/* Main Search */}
          <div className="flex space-x-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search cases, statutes, or legal principles..."
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                🔍
              </span>
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-8 rounded-lg font-semibold transition"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Jurisdiction</label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {jurisdictions.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Year From</label>
              <input
                type="number"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                placeholder="1960"
                min="1960"
                max="2026"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Year To</label>
              <input
                type="number"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                placeholder="2026"
                min="1960"
                max="2026"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-400">
              Found <span className="text-white font-semibold">{totalResults}</span> results
              {searchMeta && (
                <span className="ml-2 text-sm">
                  ({searchMeta.dbCount > 0 && <span className="text-green-400">{searchMeta.dbCount} from database</span>}
                  {searchMeta.dbCount > 0 && searchMeta.aiCount > 0 && ', '}
                  {searchMeta.aiCount > 0 && <span className="text-blue-400">{searchMeta.aiCount} from AI</span>})
                </span>
              )}
            </p>
            <select className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option>Sort by Relevance</option>
              <option>Sort by Date (Newest)</option>
              <option>Sort by Date (Oldest)</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Results List */}
          <div className="lg:col-span-2 space-y-4">
            {results.length > 0 ? (
              results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => setSelectedCase(result)}
                  className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border cursor-pointer transition-all ${
                    selectedCase?.id === result.id
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-green-500/20 hover:border-green-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{result.title}</h3>
                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      {result.source === 'database' ? (
                        <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs">DB</span>
                      ) : result.source === 'ai' ? (
                        <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs">AI</span>
                      ) : null}
                      <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs">
                        {result.relevance}% match
                      </span>
                    </div>
                  </div>
                  <p className="text-green-400 text-sm mb-2">{result.citation}</p>
                  <p className="text-gray-400 text-sm mb-3">{result.summary}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>📍 {result.court}</span>
                    <span>📅 {result.year}</span>
                  </div>
                </div>
              ))
            ) : !isSearching && query ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-green-500/20 text-center">
                <span className="text-6xl mb-4 block">🔍</span>
                <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                <p className="text-gray-400">Try different keywords or adjust your filters</p>
              </div>
            ) : !isSearching ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-green-500/20 text-center">
                <span className="text-6xl mb-4 block">📚</span>
                <h3 className="text-xl font-semibold text-white mb-2">Start Your Research</h3>
                <p className="text-gray-400 mb-4">Search through thousands of Nigerian legal cases</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Try searching for:</p>
                  <p className="text-green-400">"breach of contract damages"</p>
                  <p className="text-green-400">"fundamental rights enforcement"</p>
                  <p className="text-green-400">"land ownership certificate of occupancy"</p>
                </div>
              </div>
            ) : null}

            {isSearching && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-green-500/20 text-center">
                <div className="animate-spin text-6xl mb-4">⚖️</div>
                <p className="text-gray-400">Searching Nigerian case law database...</p>
              </div>
            )}
          </div>

          {/* Case Preview */}
          <div className="lg:col-span-1">
            {selectedCase ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-green-500/20 sticky top-8">
                <h3 className="text-lg font-semibold text-white mb-2">{selectedCase.title}</h3>
                <p className="text-green-400 text-sm mb-4">{selectedCase.citation}</p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Legal Principles</h4>
                    <ul className="space-y-2">
                      {selectedCase.keyPrinciples.map((principle, i) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-gray-300">
                          <span className="text-green-400 mt-1">•</span>
                          <span>{principle}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition mb-2">
                      View Full Judgment
                    </button>
                    <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition">
                      Save to Library
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-green-500/20 text-center">
                <span className="text-4xl mb-2 block">👆</span>
                <p className="text-gray-400 text-sm">Click on a case to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
