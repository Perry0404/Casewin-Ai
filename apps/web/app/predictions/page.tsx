'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface PredictionMarket {
  id: string
  title: string
  description: string
  category: string
  deadline: string
  yes_votes: number
  no_votes: number
  total_pool: number
  resolved: boolean
  outcome?: 'yes' | 'no'
}

export default function PredictionMarketPage() {
  const { user, wallet } = useAuth()
  const [markets, setMarkets] = useState<PredictionMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [voteModal, setVoteModal] = useState<{ market: PredictionMarket } | null>(null)
  const [voteAmount, setVoteAmount] = useState(1000)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchMarkets()
  }, [selectedCategory])

  const fetchMarkets = async () => {
    try {
      setLoading(true)
      const url = selectedCategory === 'all'
        ? '/api/predictions'
        : `/api/predictions?category=${encodeURIComponent(selectedCategory)}`

      const response = await fetch(url)
      const data = await response.json()
      setMarkets(data.markets || [])
    } catch (error) {
      console.error('Error fetching markets:', error)
      setMarkets([])
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (vote: 'yes' | 'no') => {
    if (!voteModal) return

    if (!user) {
      alert('Please log in to place a bet')
      return
    }

    if ((wallet?.balance || 0) < voteAmount) {
      alert('Insufficient wallet balance. Please fund your wallet first.')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/predictions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: voteModal.market.id,
          user_id: user.id,
          vote,
          amount: voteAmount
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Bet placed successfully! You bet ₦${voteAmount.toLocaleString()} on ${vote.toUpperCase()}`)
        setVoteModal(null)
        setVoteAmount(1000)
        fetchMarkets()
      } else {
        alert(data.error || 'Failed to place bet')
      }
    } catch (error) {
      console.error('Error voting:', error)
      alert('Failed to place bet. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const categories = [
    { id: 'supreme_court', name: 'Supreme Court' },
    { id: 'appeal', name: 'Court of Appeal' },
    { id: 'high_court', name: 'High Court' },
    { id: 'tribunal', name: 'Tribunal' },
  ]

  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return 'Ended'
    if (days === 0) return 'Ends today'
    return `${days} days left`
  }

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-3xl">⚖️</span>
              <div>
                <h1 className="text-2xl font-bold text-white">CaseWin <span className="text-green-500">AI</span></h1>
                <p className="text-xs text-gray-400">Prediction Markets</p>
              </div>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/tools" className="text-gray-300 hover:text-white">AI Tools</Link>
              <Link href="/marketplace" className="text-gray-300 hover:text-white">Hire Lawyers</Link>
              <Link href="/predictions" className="text-green-400 font-semibold">Predictions</Link>
              {user ? (
                <div className="flex items-center gap-4">
                  <Link href="/wallet" className="bg-gray-700 px-4 py-2 rounded-lg text-green-400">
                    ₦{(wallet?.balance || 0).toLocaleString()}
                  </Link>
                  <Link href="/dashboard" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Dashboard
                  </Link>
                </div>
              ) : (
                <Link href="/auth/login" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-sm font-semibold">
            🇳🇬 NIGERIAN LEGAL PREDICTION MARKETS
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-6 mb-4">
            Predict Nigerian Court Outcomes
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Use your legal knowledge to predict case outcomes. Win real money when courts decide.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl font-bold text-purple-400">{markets.length}</div>
              <div className="text-sm text-gray-400">Active Markets</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl font-bold text-green-400">
                ₦{markets.reduce((sum, m) => sum + m.total_pool, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Pool</div>
            </div>
            {user && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="text-3xl font-bold text-yellow-400">₦{(wallet?.balance || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-400">Your Balance</div>
              </div>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              selectedCategory === 'all' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All Markets
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat.id 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Markets Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading markets...</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Active Markets</h3>
            <p className="text-gray-400 mb-6">
              Check back soon for new prediction markets on Nigerian court cases!
            </p>
            <p className="text-gray-500 text-sm">
              Markets will be added as major cases come before Nigerian courts.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {markets.map(market => {
              const totalVotes = market.yes_votes + market.no_votes
              const yesPercent = totalVotes > 0 ? Math.round((market.yes_votes / totalVotes) * 100) : 50

              return (
                <div key={market.id} className="bg-gray-800 rounded-xl border border-gray-700 hover:border-purple-500 transition-all p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold capitalize">
                      {market.category?.replace('_', ' ') || 'Legal'}
                    </span>
                    <span className="text-gray-400 text-sm">{getTimeRemaining(market.deadline)}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{market.title}</h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2">{market.description}</p>

                  {/* Voting Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-green-400 font-semibold">YES {yesPercent}%</span>
                      <span className="text-red-400 font-semibold">NO {100 - yesPercent}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-400 transition-all" 
                        style={{ width: `${yesPercent}%` }}
                      />
                      <div 
                        className="bg-gradient-to-r from-red-400 to-red-500 transition-all" 
                        style={{ width: `${100 - yesPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div>
                      <div className="text-gray-400 text-xs">Total Pool</div>
                      <div className="text-white font-bold">₦{market.total_pool.toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => setVoteModal({ market })}
                      disabled={market.resolved}
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {market.resolved ? 'Ended' : 'Place Bet'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* How It Works */}
        <div className="mt-16 bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                📊
              </div>
              <h3 className="text-xl font-bold text-white mb-2">1. Choose a Case</h3>
              <p className="text-gray-400">Browse active markets on Nigerian Supreme Court and Court of Appeal cases</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                💰
              </div>
              <h3 className="text-xl font-bold text-white mb-2">2. Place Your Bet</h3>
              <p className="text-gray-400">Use your legal knowledge to predict outcomes. Bet ₦1,000 to ₦100,000</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                🎯
              </div>
              <h3 className="text-xl font-bold text-white mb-2">3. Win Real Money</h3>
              <p className="text-gray-400">When the court decides, correct predictions win from the pool!</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {!user && (
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Start Trading Legal Outcomes</h2>
            <p className="text-purple-100 mb-6">
              Create an account to place bets on Nigerian court decisions and win real money!
            </p>
            <Link
              href="/auth/signup"
              className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100"
            >
              Create Free Account →
            </Link>
          </div>
        )}
      </div>

      {/* Betting Modal */}
      {voteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Place Your Bet</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{voteModal.market.title}</p>
              </div>
              <button onClick={() => setVoteModal(null)} className="text-gray-400 hover:text-white text-2xl">
                &times;
              </button>
            </div>

            {!user ? (
              <div className="text-center py-6">
                <p className="text-gray-400 mb-4">Please log in to place a bet</p>
                <Link href="/auth/login" className="bg-green-600 text-white px-6 py-2 rounded-lg">
                  Log In
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-300">Bet Amount</label>
                    <span className="text-green-400 font-bold">₦{voteAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={voteAmount}
                    onChange={(e) => setVoteAmount(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>₦1,000</span>
                    <span>₦100,000</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Your balance: ₦{(wallet?.balance || 0).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleVote('yes')}
                    disabled={submitting || (wallet?.balance || 0) < voteAmount}
                    className="py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Placing...' : 'BET YES'}
                  </button>
                  <button
                    onClick={() => handleVote('no')}
                    disabled={submitting || (wallet?.balance || 0) < voteAmount}
                    className="py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Placing...' : 'BET NO'}
                  </button>
                </div>

                {(wallet?.balance || 0) < voteAmount && (
                  <Link
                    href="/wallet"
                    className="block text-center text-green-400 hover:text-green-300 mt-4"
                  >
                    Fund your wallet to place bets →
                  </Link>
                )}
              </>
            )}

            <p className="text-xs text-gray-500 mt-4 text-center">
              18+ only • Responsible gambling • Real money betting
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
