'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notifications'

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
  const [markets, setMarkets] = useState<PredictionMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null)
  const [voteModal, setVoteModal] = useState<{ marketId: string; marketTitle: string } | null>(null)
  const [voteAmount, setVoteAmount] = useState(100)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const { notify } = useNotification()

  // Fetch markets from API
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
    if (!voteModal || !user?.email) {
      notify({ type: 'error', title: 'Error', message: 'You must be signed in to vote' })
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/predictions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: voteModal.marketId,
          user_identifier: user.email,
          vote,
          amount: voteAmount
        })
      })

      const data = await response.json()

      if (response.ok) {
        notify({ type: 'success', title: 'Bet Placed!', message: data.message || `Successfully placed ₦${voteAmount} on ${vote.toUpperCase()}!` })
        setVoteModal(null)
        setVoteAmount(100)
        fetchMarkets()
      } else {
        notify({ type: 'error', title: 'Failed', message: data.error || 'Failed to place vote' })
      }
    } catch (error) {
      console.error('Error voting:', error)
      notify({ type: 'error', title: 'Error', message: 'Failed to place vote. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const categories = ['Constitutional Law', 'Financial Law', 'Property Law', 'Criminal Law', 'Corporate Law', 'Labour Law']

  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? `${days} days left` : 'Ended'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="flex items-center gap-3">
                <div className="text-4xl">⚖️</div>
                <div>
                  <h1 className="text-3xl font-bold text-white">CaseWin-NG</h1>
                  <p className="text-sm text-purple-300">Legal Prediction Markets</p>
                </div>
              </Link>
            </div>
            <MobileNav currentPath="/predictions" />
          </div>
        </div>
      </header>

      <div className="relative container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-green-400 via-white to-green-400 text-green-900 px-6 py-2 rounded-full text-sm font-bold animate-pulse border-2 border-green-500">
              🇳🇬 NIGERIAN LEGAL MARKETS ONLY
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-white to-green-400">
            Nigerian Legal Prediction Markets
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
            <strong className="text-green-400">For Nigerian legal professionals, lawyers, and legal enthusiasts.</strong> Predict outcomes of Supreme Court rulings, Court of Appeal decisions, National Assembly legislative changes, and landmark Nigerian cases.
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            This platform focuses on Nigerian legal system outcomes. All markets are based on Nigerian Constitution, case law, and Federal/State legislation. Trade ethically based on legal analysis and research.
          </p>
          <div className="flex justify-center gap-8 text-center">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-purple-400">
                {loading ? '...' : `₦${(markets.reduce((sum, m) => sum + m.total_pool, 0) / 1000).toFixed(0)}K`}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Volume</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-pink-400">
                {loading ? '...' : markets.length}
              </div>
              <div className="text-sm text-gray-400 mt-1">Active Markets</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-blue-400">1,247</div>
              <div className="text-sm text-gray-400 mt-1">Traders</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            All Markets
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-full font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading markets...</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-white mb-2">No markets available</h3>
            <p className="text-gray-400">Check back soon for new prediction markets!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {markets.map(market => {
              const totalVotes = market.yes_votes + market.no_votes
              const yesPercent = totalVotes > 0 ? Math.round((market.yes_votes / totalVotes) * 100) : 50
              const noPercent = 100 - yesPercent

              return (
                <div
                  key={market.id}
                  className="group bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-purple-500/20"
                >
                  <div className="p-6">
                    {/* Category Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold border border-purple-500/30">
                        {market.category}
                      </span>
                      <span className="text-gray-400 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {getTimeRemaining(market.deadline)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                      {market.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                      {market.description}
                    </p>

                    {/* Voting Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-green-400 font-semibold">YES {yesPercent}%</span>
                        <span className="text-red-400 font-semibold">NO {noPercent}%</span>
                      </div>
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                          style={{ width: `${yesPercent}%` }}
                        ></div>
                        <div
                          className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                          style={{ width: `${noPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Pool Amount */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div>
                        <div className="text-gray-400 text-xs">Total Pool</div>
                        <div className="text-white font-bold text-lg">₦{(market.total_pool / 1000).toFixed(0)}K</div>
                      </div>
                      <button 
                        onClick={() => setVoteModal({ marketId: market.id, marketTitle: market.title })}
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all group-hover:scale-105"
                      >
                        Trade
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Vote Modal */}
        {voteModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl max-w-md w-full p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Place Your Vote</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{voteModal.marketTitle}</p>
                </div>
                <button 
                  onClick={() => setVoteModal(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-300 mb-2">Signed in as</label>
                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white">
                    {user?.email || 'Not signed in'}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Amount (Naira)</label>
                  <input
                    type="range"
                    min="100"
                    max="50000"
                    step="100"
                    value={voteAmount}
                    onChange={(e) => setVoteAmount(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-2xl font-bold text-purple-400 mt-2">
                    ₦{voteAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleVote('yes')}
                  disabled={submitting || !user}
                  className="py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Placing...' : 'YES'}
                </button>
                <button
                  onClick={() => handleVote('no')}
                  disabled={submitting || !user}
                  className="py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Placing...' : 'NO'}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Real money trading • Secure Korapay payments • 18+ only
              </p>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-green-500/30 p-12">
          <h2 className="text-3xl font-bold text-white text-center mb-4">How Nigerian Legal Prediction Markets Work</h2>
          <p className="text-center text-green-400 mb-8 text-sm">🇳🇬 Exclusively for Nigerian Legal System Outcomes</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                📊
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1. Choose Nigerian Case</h3>
              <p className="text-gray-400">
                Browse predictions on Nigerian Supreme Court, Court of Appeal, Federal High Court rulings, and National Assembly legislation
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                💰
              </div>
              <h3 className="text-xl font-bold text-white mb-3">2. Trade Based on Legal Analysis</h3>
              <p className="text-gray-400">
                Use your knowledge of Nigerian case law, Constitution, and precedents. Trade ethically - no insider information allowed
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                🎯
              </div>
              <h3 className="text-xl font-bold text-white mb-3">3. Win Real Money</h3>
              <p className="text-gray-400">
                Pay with Naira via Korapay. When markets resolve based on actual Nigerian court decisions, winning shares pay ₦1 each. Educational and profitable!
              </p>
            </div>
          </div>
          
          <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <h4 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
              <span>⚠️</span> Ethical Guidelines
            </h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• For educational purposes and legal analysis only</li>
              <li>• No trading on confidential client information</li>
              <li>• No trading by judges, lawyers with direct case involvement, or court staff on cases they're involved in</li>
              <li>• All markets resolve based on publicly available Nigerian court judgments</li>
              <li>• Compliant with Rules of Professional Conduct for Legal Practitioners</li>
            </ul>
          </div>
        </div>

        {/* Legal Compliance Notice */}
        <div className="mt-12 bg-green-500/10 border border-green-500/30 backdrop-blur-xl rounded-3xl p-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">✅</div>
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-2">Real Money Trading - Fully Compliant</h3>
              <p className="text-gray-300 mb-4">
                Operating with real Naira payments via Korapay. All transactions are secure and transparent.
              </p>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">
                  <strong className="text-white">Payment & Legal Status:</strong>
                </p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✅ Real Naira payments via Korapay</li>
                  <li>✅ Secure card, bank transfer & USSD payments</li>
                  <li>✅ Educational and analytical platform for legal professionals</li>
                  <li>✅ Crypto integration coming soon</li>
                  <li>🔒 18+ only - Age verification required</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12">
            <h2 className="text-4xl font-bold text-white mb-4">Start Trading on Legal Outcomes</h2>
            <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
              Join 1,200+ legal professionals trading on Nigerian court outcomes. Analyze cases, place informed bets, win real money. Secure payments via Korapay.
            </p>
            <Link href="/auth/signup" className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all">
              Start Trading Now →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
