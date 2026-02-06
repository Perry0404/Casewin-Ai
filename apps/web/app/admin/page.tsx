'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Market {
  id: string
  title: string
  description: string
  category: string
  total_pool: number
  status: string
  closes_at: string
  outcome_options: { yes_votes: number; no_votes: number }
}

interface Lawyer {
  id: string
  user_id: string
  full_name: string
  is_verified: boolean
  bar_number: string
  specializations: string[]
}

const ADMIN_PASSWORD = 'casewin2024admin'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const [activeTab, setActiveTab] = useState<'markets' | 'lawyers' | 'create'>('markets')
  const [markets, setMarkets] = useState<Market[]>([])
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [loading, setLoading] = useState(true)

  // New market form
  const [newMarket, setNewMarket] = useState({
    title: '',
    description: '',
    case_reference: '',
    court: '',
    category: 'high_court',
    closes_at: ''
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    // Check if already authenticated in this session
    const auth = sessionStorage.getItem('admin_auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
      fetchData()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true')
      setIsAuthenticated(true)
      setError('')
      fetchData()
    } else {
      setError('Invalid password')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [marketsRes, lawyersRes] = await Promise.all([
        fetch('/api/admin/markets'),
        fetch('/api/admin/lawyers')
      ])
      
      const marketsData = await marketsRes.json()
      const lawyersData = await lawyersRes.json()
      
      setMarkets(marketsData.markets || [])
      setLawyers(lawyersData.lawyers || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const response = await fetch('/api/admin/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMarket)
      })

      if (response.ok) {
        alert('Market created successfully!')
        setNewMarket({
          title: '',
          description: '',
          case_reference: '',
          court: '',
          category: 'high_court',
          closes_at: ''
        })
        fetchData()
        setActiveTab('markets')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create market')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to create market')
    } finally {
      setCreating(false)
    }
  }

  const handleResolveMarket = async (marketId: string, outcome: 'yes' | 'no') => {
    if (!confirm(`Are you sure you want to resolve this market as "${outcome.toUpperCase()}"? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/markets/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market_id: marketId, outcome })
      })

      if (response.ok) {
        alert('Market resolved successfully!')
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to resolve market')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to resolve market')
    }
  }

  const handleVerifyLawyer = async (lawyerId: string, verify: boolean) => {
    try {
      const response = await fetch('/api/admin/lawyers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lawyer_id: lawyerId, is_verified: verify })
      })

      if (response.ok) {
        alert(verify ? 'Lawyer verified!' : 'Verification removed')
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update lawyer')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to update lawyer')
    }
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 p-8 rounded-xl max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-white mb-2">🔐 Admin Panel</h1>
          <p className="text-gray-400 mb-6">Enter admin password to continue</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
              autoFocus
            />
            
            <button
              type="submit"
              className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
            >
              Access Admin Panel
            </button>
          </form>
          
          <Link href="/" className="inline-block mt-4 text-gray-400 hover:text-white text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Admin view
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-white">
                CaseWin <span className="text-green-500">AI</span>
              </Link>
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  sessionStorage.removeItem('admin_auth')
                  setIsAuthenticated(false)
                }}
                className="text-gray-400 hover:text-white text-sm"
              >
                Logout
              </button>
              <Link href="/" className="text-gray-300 hover:text-white">
                ← Back to Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('markets')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'markets' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📊 Prediction Markets ({markets.length})
          </button>
          <button
            onClick={() => setActiveTab('lawyers')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'lawyers' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            👨‍⚖️ Lawyers ({lawyers.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'create' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            ➕ Create Market
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Markets Tab */}
            {activeTab === 'markets' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-6">Prediction Markets</h2>
                {markets.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-8 text-center">
                    <p className="text-gray-400">No markets yet. Create one!</p>
                  </div>
                ) : (
                  markets.map(market => (
                    <div key={market.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            market.status === 'open' ? 'bg-green-500/20 text-green-400' : 
                            market.status === 'resolved' ? 'bg-blue-500/20 text-blue-400' : 
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {market.status.toUpperCase()}
                          </span>
                          <span className="ml-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                            {market.category?.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-gray-400 text-sm">
                          Closes: {new Date(market.closes_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2">{market.title}</h3>
                      <p className="text-gray-400 text-sm mb-4">{market.description}</p>

                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-400">
                            YES: {market.outcome_options?.yes_votes || 0}
                          </span>
                          <span className="text-red-400">
                            NO: {market.outcome_options?.no_votes || 0}
                          </span>
                          <span className="text-yellow-400">
                            Pool: ₦{(market.total_pool || 0).toLocaleString()}
                          </span>
                        </div>

                        {market.status === 'open' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolveMarket(market.id, 'yes')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                            >
                              Resolve YES
                            </button>
                            <button
                              onClick={() => handleResolveMarket(market.id, 'no')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                            >
                              Resolve NO
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Lawyers Tab */}
            {activeTab === 'lawyers' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-6">Registered Lawyers</h2>
                {lawyers.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-8 text-center">
                    <p className="text-gray-400">No lawyers registered yet.</p>
                  </div>
                ) : (
                  lawyers.map(lawyer => (
                    <div key={lawyer.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-white">{lawyer.full_name || 'Unknown'}</h3>
                            {lawyer.is_verified && (
                              <span className="text-green-400">✓ Verified</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">
                            Bar: {lawyer.bar_number || 'Not provided'} • 
                            Specializations: {lawyer.specializations?.join(', ') || 'None'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleVerifyLawyer(lawyer.id, !lawyer.is_verified)}
                          className={`px-4 py-2 rounded-lg text-sm ${
                            lawyer.is_verified 
                              ? 'bg-gray-600 text-white hover:bg-gray-700' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {lawyer.is_verified ? 'Remove Verification' : 'Verify Lawyer'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Create Market Tab */}
            {activeTab === 'create' && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Create Prediction Market</h2>
                <form onSubmit={handleCreateMarket} className="space-y-6">
                  <div>
                    <label className="block text-gray-300 mb-2">Market Question *</label>
                    <input
                      type="text"
                      value={newMarket.title}
                      onChange={(e) => setNewMarket({ ...newMarket, title: e.target.value })}
                      placeholder="Will the Supreme Court uphold the conviction of..."
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Description *</label>
                    <textarea
                      value={newMarket.description}
                      onChange={(e) => setNewMarket({ ...newMarket, description: e.target.value })}
                      placeholder="Detailed description of the case and what the market is predicting..."
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2">Case Reference</label>
                      <input
                        type="text"
                        value={newMarket.case_reference}
                        onChange={(e) => setNewMarket({ ...newMarket, case_reference: e.target.value })}
                        placeholder="SC/CV/123/2024"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Court</label>
                      <input
                        type="text"
                        value={newMarket.court}
                        onChange={(e) => setNewMarket({ ...newMarket, court: e.target.value })}
                        placeholder="Supreme Court of Nigeria"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2">Category *</label>
                      <select
                        value={newMarket.category}
                        onChange={(e) => setNewMarket({ ...newMarket, category: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                        required
                      >
                        <option value="supreme_court">Supreme Court</option>
                        <option value="appeal">Court of Appeal</option>
                        <option value="high_court">High Court</option>
                        <option value="tribunal">Tribunal</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Closes At *</label>
                      <input
                        type="datetime-local"
                        value={newMarket.closes_at}
                        onChange={(e) => setNewMarket({ ...newMarket, closes_at: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Market'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

