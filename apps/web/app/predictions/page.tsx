'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notifications'

/* --- Types --- */
interface PredictionMarket {
  id: string
  title: string
  description: string
  category: string
  deadline: string
  yes_shares: number
  no_shares: number
  yes_price: number
  no_price: number
  total_pool: number
  liquidity_pool: number
  resolved: boolean
  outcome?: string
  resolution_source?: string
  created_at: string
}

interface WalletData {
  user_email: string
  naira_balance: number
  total_deposits: number
  total_withdrawals: number
}

interface BaseWallet {
  walletAddress: string
  cdpWalletId: string
  onChainBalance: { eth: number; usdc: number; ethNGN: number; usdcNGN: number; totalNGN: number }
  tradingBalance: number
  totalDeposited: number
  totalWithdrawn: number
  chain: string
  explorer: string
  isNew?: boolean
  message?: string
}

interface AIAnalysis {
  summary: string
  confidence: number
  recommendation: 'YES' | 'NO' | 'HOLD'
  factors: Array<{ factor: string; impact: string; detail: string }>
  risk_level?: string
  disclaimer: string
}

/* --- Constants --- */
const CATEGORIES = [
  'All',
  'Sports',
  'Entertainment',
  'World Politics',
  'Crypto',
  'Technology',
  'Nigerian Law',
  'Financial Law',
  'Criminal Law',
]

/* --- Page --- */
export default function PredictionMarketPage() {
  const { user } = useAuth()
  const { notify } = useNotification()

  // Data
  const [markets, setMarkets] = useState<PredictionMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [walletLoading, setWalletLoading] = useState(true)

  // Base wallet (auto-generated per user)
  const [baseWallet, setBaseWallet] = useState<BaseWallet | null>(null)
  const [baseWalletLoading, setBaseWalletLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Trade modal
  const [tradeMarket, setTradeMarket] = useState<PredictionMarket | null>(null)
  const [voteAmount, setVoteAmount] = useState(500)
  const [submitting, setSubmitting] = useState(false)

  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Deposit modal
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositTab, setDepositTab] = useState<'naira' | 'crypto'>('naira')
  const [depositAmount, setDepositAmount] = useState(5000)

  // Withdraw modal
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawTab, setWithdrawTab] = useState<'naira' | 'crypto'>('naira')
  const [withdrawAmount, setWithdrawAmount] = useState(0)
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [accountName, setAccountName] = useState('')
  const [cryptoWithdrawAddr, setCryptoWithdrawAddr] = useState('')
  const [withdrawToken, setWithdrawToken] = useState<'eth' | 'usdc'>('usdc')

  // Create market modal
  const [showCreateMarket, setShowCreateMarket] = useState(false)
  const [cmTitle, setCmTitle] = useState('')
  const [cmDesc, setCmDesc] = useState('')
  const [cmCategory, setCmCategory] = useState('Sports')
  const [cmDeadline, setCmDeadline] = useState('')
  const [cmSubmitting, setCmSubmitting] = useState(false)

  /* --- Data Fetching --- */
  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true)
      const url = selectedCategory === 'all'
        ? '/api/predictions'
        : `/api/predictions?category=${encodeURIComponent(selectedCategory)}`
      const res = await fetch(url)
      const data = await res.json()
      setMarkets(data.markets || [])
    } catch {
      setMarkets([])
    } finally {
      setLoading(false)
    }
  }, [selectedCategory])

  const fetchWallet = useCallback(async () => {
    try {
      setWalletLoading(true)
      const res = await fetch('/api/wallet')
      const data = await res.json()
      setWallet(data.wallet || null)
    } catch {
      setWallet(null)
    } finally {
      setWalletLoading(false)
    }
  }, [])

  const fetchBaseWallet = useCallback(async () => {
    try {
      setBaseWalletLoading(true)
      const res = await fetch('/api/wallet/base-wallet')
      const data = await res.json()
      if (data.walletAddress) {
        setBaseWallet(data as BaseWallet)
      }
    } catch {
      // Base wallet not available
    } finally {
      setBaseWalletLoading(false)
    }
  }, [])

  const syncCryptoBalance = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/wallet/base-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      })
      const data = await res.json()
      if (data.success && data.credited > 0) {
        notify({ type: 'success', title: 'Deposit Synced!', message: data.message })
        fetchWallet()
      }
      fetchBaseWallet()
    } catch {
      // silent
    } finally {
      setSyncing(false)
    }
  }

  // Auto-sync: check pending payments and credit confirmed ones
  const autoSyncPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/payments/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success && data.credited > 0) {
        notify({ type: 'success', title: 'Deposit Confirmed!', message: data.message })
        fetchWallet()
      }
    } catch {
      // silent
    }
  }, [fetchWallet])

  useEffect(() => { fetchMarkets() }, [fetchMarkets])
  useEffect(() => {
    if (user) {
      fetchWallet()
      fetchBaseWallet()
      // Auto-sync: check for confirmed payments on page load
      autoSyncPayments()
      // Also auto-sync crypto balance
      syncCryptoBalance()
    }
  }, [user, fetchWallet, fetchBaseWallet, autoSyncPayments])

  /* --- AI Analysis --- */
  const fetchAI = async (market: PredictionMarket) => {
    setAiLoading(true)
    setAiAnalysis(null)
    try {
      const res = await fetch('/api/predictions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market })
      })
      const data = await res.json()
      setAiAnalysis(data.analysis || null)
    } catch {
      setAiAnalysis(null)
    } finally {
      setAiLoading(false)
    }
  }

  /* --- Trade --- */
  const openTrade = (market: PredictionMarket) => {
    setTradeMarket(market)
    setVoteAmount(500)
    setAiAnalysis(null)
    fetchAI(market)
  }

  const handleVote = async (vote: 'yes' | 'no') => {
    if (!tradeMarket || !user) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/predictions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market_id: tradeMarket.id, vote, amount: voteAmount })
      })
      const data = await res.json()
      if (res.ok) {
        notify({ type: 'success', title: 'Bet Placed!', message: data.message })
        setTradeMarket(null)
        fetchMarkets()
        fetchWallet()
      } else {
        if (data.need_deposit) {
          notify({ type: 'error', title: 'Insufficient Funds', message: data.error })
          setTradeMarket(null)
          setShowDeposit(true)
        } else {
          notify({ type: 'error', title: 'Failed', message: data.error })
        }
      }
    } catch {
      notify({ type: 'error', title: 'Error', message: 'Failed to place bet. Try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  /* --- Naira Deposit --- */
  const handleNairaDeposit = async () => {
    if (depositAmount < 100) {
      notify({ type: 'error', title: 'Error', message: 'Minimum deposit is N100' })
      return
    }
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositAmount,
          payment_type: 'wallet_deposit',
          callback_url: `${window.location.origin}/predictions`
        })
      })
      const data = await res.json()
      const checkoutUrl = data.data?.checkout_url || data.data?.payment_url
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        notify({ type: 'error', title: 'Error', message: data.error || 'Failed to start payment' })
      }
    } catch {
      notify({ type: 'error', title: 'Error', message: 'Payment initialization failed' })
    }
  }

  /* --- Withdrawal --- */
  const handleWithdraw = async () => {
    if (withdrawAmount < 100) {
      notify({ type: 'error', title: 'Error', message: 'Minimum withdrawal is N100' })
      return
    }
    try {
      const body = withdrawTab === 'naira'
        ? { amount: withdrawAmount, method: 'bank', bank_details: { bank: bankName, account: bankAccount, name: accountName } }
        : { amount: withdrawAmount, method: 'crypto', wallet_address: cryptoWithdrawAddr, token: withdrawToken }

      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (res.ok) {
        notify({ type: 'success', title: 'Withdrawal Submitted', message: data.message })
        fetchWallet()
        setShowWithdraw(false)
      } else {
        notify({ type: 'error', title: 'Error', message: data.error })
      }
    } catch {
      notify({ type: 'error', title: 'Error', message: 'Withdrawal failed' })
    }
  }

  /* --- Create Market --- */
  const handleCreateMarket = async () => {
    if (!cmTitle || cmTitle.length < 10) {
      notify({ type: 'error', title: 'Error', message: 'Title must be at least 10 characters' })
      return
    }
    if (!cmDeadline) {
      notify({ type: 'error', title: 'Error', message: 'Pick a deadline' })
      return
    }
    setCmSubmitting(true)
    try {
      const res = await fetch('/api/predictions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: cmTitle, description: cmDesc, category: cmCategory, deadline: cmDeadline })
      })
      const data = await res.json()
      if (res.ok) {
        notify({ type: 'success', title: 'Market Created!', message: 'Your market is now live' })
        setShowCreateMarket(false)
        setCmTitle(''); setCmDesc(''); setCmDeadline('')
        fetchMarkets()
      } else {
        notify({ type: 'error', title: 'Error', message: data.error })
      }
    } catch {
      notify({ type: 'error', title: 'Error', message: 'Failed to create market' })
    } finally {
      setCmSubmitting(false)
    }
  }

  /* --- Helpers --- */
  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days > 1) return `${days} days left`
    if (days === 1) return '1 day left'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours > 0) return `${hours}h left`
    return 'Ended'
  }

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      'Sports': '⚽',
      'Entertainment': '🎬',
      'World Politics': '🌍',
      'Crypto': '💰',
      'Technology': '🚀',
      'Nigerian Law': '⚖️',
      'Financial Law': '📊',
      'Criminal Law': '👮',
    }
    return icons[cat] || '📊'
  }

  const balance = wallet?.naira_balance || 0

  /* --- Render --- */
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* BG decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Header */}
      <header className="relative bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="text-3xl">⚖️</div>
              <div>
                <h1 className="text-2xl font-bold text-white">CaseWin-NG</h1>
                <p className="text-xs text-green-300">Prediction Markets</p>
              </div>
            </Link>
            <MobileNav currentPath="/predictions" />
          </div>
        </div>
      </header>

      {/* Wallet Bar */}
      <div className="relative bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-lg">💰</span>
                <div>
                  <div className="text-xs text-gray-400">Trading Balance</div>
                  <div className="text-lg font-bold text-white">
                    {walletLoading ? '...' : `N${balance.toLocaleString()}`}
                  </div>
                </div>
              </div>
              {baseWallet && (
                <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                  <span className="text-blue-400 text-lg">🔗</span>
                  <div>
                    <div className="text-xs text-gray-400">Base Wallet</div>
                    <div className="text-sm font-medium text-blue-300">
                      {baseWallet.walletAddress.slice(0, 6)}...{baseWallet.walletAddress.slice(-4)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 ml-2">
                    {baseWallet.onChainBalance.eth.toFixed(4)} ETH | {baseWallet.onChainBalance.usdc.toFixed(2)} USDC
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeposit(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0-16l-4 4m4-4l4 4" /></svg>
                Deposit
              </button>
              <button
                onClick={() => { setShowWithdraw(true); setWithdrawAmount(0) }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all border border-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4m0 16l-4-4m4 4l4-4" /></svg>
                Withdraw
              </button>
              <button
                onClick={() => setShowCreateMarket(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create Market
              </button>
              <Link
                href="/predictions/portfolio"
                className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all border border-yellow-500/30"
              >
                {'\u{1F4BC}'} Portfolio
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-green-400 via-white to-green-400 text-green-900 px-6 py-2 rounded-full text-sm font-bold border-2 border-green-500">
              🇳🇬 PREDICTION MARKETS • REAL MONEY
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-white to-green-400">
            Predict & Win
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">
            Sports, crypto, entertainment, politics, technology & legal markets. Deposit Naira or crypto. Use AI-powered analysis to trade with real money.
          </p>
          <div className="flex justify-center gap-6 text-center">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 min-w-[120px]">
              <div className="text-2xl font-bold text-green-400">
                {loading ? '...' : `N${markets.reduce((s, m) => s + m.total_pool, 0).toLocaleString()}`}
              </div>
              <div className="text-xs text-gray-400 mt-1">Total Volume</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 min-w-[120px]">
              <div className="text-2xl font-bold text-green-400">{loading ? '...' : markets.length}</div>
              <div className="text-xs text-gray-400 mt-1">Active Markets</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-3 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'All' ? 'all' : cat)}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${
                (cat === 'All' ? 'all' : cat) === selectedCategory
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              <span>{cat === 'All' ? '🌐' : getCategoryIcon(cat)}</span>
              {cat}
            </button>
          ))}
        </div>

        {/* Markets Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
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
              const yesP = Math.round((market.yes_price || 0.5) * 100)
              const noP = 100 - yesP

              return (
                <div key={market.id} className="group bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-green-500/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-green-500/10">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold border border-green-500/30 flex items-center gap-1">
                        <span>{getCategoryIcon(market.category)}</span>
                        {market.category}
                      </span>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {getTimeRemaining(market.deadline)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-300 transition-colors leading-tight">{market.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{market.description}</p>

                    {/* Price & Probability */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                        <div className="text-xs text-green-400 mb-1">YES</div>
                        <div className="text-xl font-bold text-green-400">{yesP}%</div>
                        <div className="text-xs text-gray-500">N{(market.yes_price || 0.5).toFixed(2)}/share</div>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                        <div className="text-xs text-red-400 mb-1">NO</div>
                        <div className="text-xl font-bold text-red-400">{noP}%</div>
                        <div className="text-xs text-gray-500">N{(market.no_price || 0.5).toFixed(2)}/share</div>
                      </div>
                    </div>

                    {/* Probability bar */}
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex mb-4">
                      <div className="bg-gradient-to-r from-green-500 to-green-400 transition-all" style={{ width: `${yesP}%` }} />
                      <div className="bg-gradient-to-r from-red-400 to-red-500 transition-all" style={{ width: `${noP}%` }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-gray-500 text-xs">Pool</div>
                        <div className="text-white font-bold">N{market.total_pool.toLocaleString()}</div>
                      </div>
                      <button
                        onClick={() => openTrade(market)}
                        className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-green-500/30 transition-all"
                      >
                        🤖 Trade
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ========= TRADE MODAL ========= */}
        {tradeMarket && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-green-500/30 rounded-2xl max-w-lg w-full my-8">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs font-semibold">{tradeMarket.category}</span>
                    <h3 className="text-xl font-bold text-white mt-2 leading-tight">{tradeMarket.title}</h3>
                  </div>
                  <button onClick={() => setTradeMarket(null)} className="text-gray-400 hover:text-white p-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="p-6 border-b border-white/10">
                <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                  🤖 AI Analysis
                  {aiLoading && <span className="text-xs text-gray-500">analyzing...</span>}
                </h4>
                {aiLoading ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm">Running AI analysis...</span>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        aiAnalysis.recommendation === 'YES' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        aiAnalysis.recommendation === 'NO' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        AI: {aiAnalysis.recommendation}
                      </span>
                      <span className="text-sm text-gray-400">
                        Confidence: <span className="text-white font-semibold">{aiAnalysis.confidence}%</span>
                      </span>
                      {aiAnalysis.risk_level && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          aiAnalysis.risk_level === 'moderate' ? 'bg-yellow-500/10 text-yellow-400' :
                          aiAnalysis.risk_level === 'high' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>{aiAnalysis.risk_level} risk</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{aiAnalysis.summary}</p>
                    <div className="space-y-2">
                      {aiAnalysis.factors.slice(0, 4).map((f, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${f.impact === 'high' ? 'bg-red-400' : f.impact === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                            <span className="text-sm font-medium text-white">{f.factor}</span>
                            <span className="text-xs text-gray-500 ml-auto">{f.impact} impact</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{f.detail}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 italic">{aiAnalysis.disclaimer}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Analysis unavailable</p>
                )}
              </div>

              {/* Trading section */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4 bg-white/5 rounded-lg p-3">
                  <span className="text-sm text-gray-400">Your Balance</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">N{balance.toLocaleString()}</span>
                    {balance < voteAmount && (
                      <button onClick={() => { setTradeMarket(null); setShowDeposit(true) }} className="text-xs text-green-400 hover:text-green-300 underline">
                        Deposit
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">Bet Amount</label>
                  <div className="flex gap-2 mb-2">
                    {[100, 500, 1000, 5000, 10000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setVoteAmount(amt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          voteAmount === amt
                            ? 'bg-green-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >N{amt >= 1000 ? `${amt/1000}K` : amt}</button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="100000"
                    step="100"
                    value={voteAmount}
                    onChange={(e) => setVoteAmount(Number(e.target.value))}
                    className="w-full accent-green-500"
                  />
                  <div className="text-center text-xl font-bold text-green-400 mt-1">N{voteAmount.toLocaleString()}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleVote('yes')}
                    disabled={submitting || !user || balance < voteAmount}
                    className="py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? '...' : `YES (${Math.round((tradeMarket.yes_price || 0.5) * 100)}%)`}
                  </button>
                  <button
                    onClick={() => handleVote('no')}
                    disabled={submitting || !user || balance < voteAmount}
                    className="py-3.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? '...' : `NO (${Math.round((tradeMarket.no_price || 0.5) * 100)}%)`}
                  </button>
                </div>
                {balance < voteAmount && (
                  <p className="text-center text-xs text-red-400 mt-2">Insufficient balance — deposit funds to trade</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========= DEPOSIT MODAL ========= */}
        {showDeposit && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-green-500/30 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Deposit Funds</h3>
                <button onClick={() => setShowDeposit(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setDepositTab('naira')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${depositTab === 'naira' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                >🏦 Bank Transfer (Naira)</button>
                <button
                  onClick={() => setDepositTab('crypto')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${depositTab === 'crypto' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                >🔗 Base (ETH/USDC)</button>
              </div>

              <div className="p-6">
                {depositTab === 'naira' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">Deposit Naira via bank transfer using ZendFi secure checkout.</p>
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Amount ({'₦'})</label>
                      <div className="flex gap-2 mb-3">
                        {[1000, 5000, 10000, 50000].map(amt => (
                          <button
                            key={amt}
                            onClick={() => setDepositAmount(amt)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              depositAmount === amt ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >{'₦'}{amt >= 1000 ? `${amt/1000}K` : amt}</button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min={100}
                        value={depositAmount}
                        onChange={e => setDepositAmount(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <button
                      onClick={handleNairaDeposit}
                      disabled={depositAmount < 100}
                      className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-40"
                    >
                      Deposit {'\u20A6'}{depositAmount.toLocaleString()}
                    </button>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Secured by ZendFi • Bank Transfer
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">Your personal Base wallet accepts ETH and USDC. Deposits are credited automatically.</p>

                    {baseWalletLoading ? (
                      <div className="flex items-center gap-3 py-6 justify-center">
                        <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-400 text-sm">Loading your wallet...</span>
                      </div>
                    ) : baseWallet ? (
                      <>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                          <div className="text-xs text-green-400 mb-1 font-semibold">Your Base Deposit Address</div>
                          <div className="text-sm text-white font-mono break-all bg-black/30 rounded p-2 mt-1 select-all">{baseWallet.walletAddress}</div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(baseWallet.walletAddress)
                              notify({ type: 'success', title: 'Copied!', message: 'Wallet address copied to clipboard' })
                            }}
                            className="mt-2 text-xs text-green-400 hover:text-green-300 underline"
                          >
                            Copy Address
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-400">ETH Balance</div>
                            <div className="text-lg font-bold text-white">{baseWallet.onChainBalance.eth.toFixed(4)}</div>
                            <div className="text-xs text-gray-500">≈ N{baseWallet.onChainBalance.ethNGN.toLocaleString()}</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-400">USDC Balance</div>
                            <div className="text-lg font-bold text-white">{baseWallet.onChainBalance.usdc.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">≈ N{baseWallet.onChainBalance.usdcNGN.toLocaleString()}</div>
                          </div>
                        </div>

                        {syncing && (
                          <div className="flex items-center justify-center gap-2 py-2">
                            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-green-400">Syncing balances...</span>
                          </div>
                        )}

                        <div className="bg-white/5 rounded-lg p-3">
                          <h4 className="text-xs font-semibold text-green-400 mb-2">How it works:</h4>
                          <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                            <li>Send ETH or USDC (Base network) to your address above</li>
                            <li>Your balance is detected and credited automatically</li>
                            <li>Your Naira trading balance updates automatically at live rates</li>
                          </ol>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-sm mb-3">Sign in to get your personal Base wallet</p>
                        <Link href="/auth/login" className="text-green-400 hover:text-green-300 underline text-sm">
                          Sign In
                        </Link>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-green-400">●</span> Base Network (L2) • ETH + USDC • Low fees • Fast confirmation
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========= WITHDRAW MODAL ========= */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-green-500/30 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Withdraw Funds</h3>
                <button onClick={() => setShowWithdraw(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setWithdrawTab('naira')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${withdrawTab === 'naira' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500'}`}
                >🏦 Bank Transfer</button>
                <button
                  onClick={() => setWithdrawTab('crypto')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${withdrawTab === 'crypto' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500'}`}
                >🔗 Base (ETH/USDC)</button>
              </div>

              <div className="p-6">
                <div className="bg-white/5 rounded-lg p-3 mb-4 flex justify-between">
                  <span className="text-sm text-gray-400">Available Balance</span>
                  <span className="text-lg font-bold text-white">N{balance.toLocaleString()}</span>
                </div>

                {withdrawTab === 'naira' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Amount ({"\u20A6"})</label>
                      <input
                        type="number"
                        min={100}
                        max={balance}
                        value={withdrawAmount || ''}
                        onChange={e => setWithdrawAmount(Number(e.target.value))}
                        placeholder="Enter amount"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Bank Name</label>
                      <input
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        placeholder="e.g. GTBank, Access Bank"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Account Number</label>
                      <input
                        value={bankAccount}
                        onChange={e => setBankAccount(e.target.value)}
                        placeholder="0123456789"
                        maxLength={10}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Account Name</label>
                      <input
                        value={accountName}
                        onChange={e => setAccountName(e.target.value)}
                        placeholder="Full name on account"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
                      />
                    </div>
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawAmount < 100 || !bankName || !bankAccount || !accountName}
                      className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-40 mt-2"
                    >
                      Withdraw N{(withdrawAmount || 0).toLocaleString()} to Bank
                    </button>
                    <p className="text-xs text-gray-500 text-center">Processing time: within 24 hours</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Amount ({"\u20A6"})</label>
                      <input
                        type="number"
                        min={100}
                        max={balance}
                        value={withdrawAmount || ''}
                        onChange={e => setWithdrawAmount(Number(e.target.value))}
                        placeholder="Amount in Naira to convert"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Token</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setWithdrawToken('usdc')}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${withdrawToken === 'usdc' ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-400'}`}
                        >USDC</button>
                        <button
                          onClick={() => setWithdrawToken('eth')}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${withdrawToken === 'eth' ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-400'}`}
                        >ETH</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Destination Wallet Address</label>
                      <input
                        value={cryptoWithdrawAddr}
                        onChange={e => setCryptoWithdrawAddr(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawAmount < 100 || !cryptoWithdrawAddr}
                      className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-40 mt-2"
                    >
                      Withdraw as {withdrawToken.toUpperCase()} to Base Wallet
                    </button>
                    <p className="text-xs text-gray-500 text-center">Processing time: within 1 hour</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Market Modal */}
        {showCreateMarket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-purple-500/30 rounded-2xl w-full max-w-lg p-6 space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-purple-400">➕</span> Create a Market
                </h3>
                <button onClick={() => setShowCreateMarket(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <p className="text-xs text-gray-400">Create a prediction market and let others bet on it. Markets start with equal YES/NO pricing.</p>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Question / Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Will Bitcoin hit $100k before July 2025?"
                  value={cmTitle}
                  onChange={e => setCmTitle(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1 text-right">{cmTitle.length}/200</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description (optional)</label>
                <textarea
                  placeholder="Additional context or resolution criteria..."
                  value={cmDesc}
                  onChange={e => setCmDesc(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
                  <select
                    value={cmCategory}
                    onChange={e => setCmCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none appearance-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Deadline *</label>
                  <input
                    type="datetime-local"
                    value={cmDeadline}
                    onChange={e => setCmDeadline(e.target.value)}
                    min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateMarket}
                disabled={cmSubmitting || cmTitle.length < 10 || !cmDeadline}
                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {cmSubmitting ? 'Creating...' : '🚀 Launch Market'}
              </button>

              <div className="text-xs text-gray-500 text-center">Markets are reviewed and may be removed if they violate community guidelines. Max 5 per day.</div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-16 bg-white/5 backdrop-blur-xl rounded-3xl border border-green-500/20 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-white text-center mb-2">How It Works</h2>
          <p className="text-center text-green-400 mb-8 text-xs">🇳🇬 Prediction Markets • Real Money</p>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">💰</div>
              <h3 className="text-lg font-bold text-white mb-2">1. Deposit</h3>
              <p className="text-gray-400 text-sm">Fund with Naira via ZendFi, or send ETH/USDC to your auto-generated Base wallet</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🤖</div>
              <h3 className="text-lg font-bold text-white mb-2">2. AI Analysis</h3>
              <p className="text-gray-400 text-sm">Get AI-powered analysis on any market before you trade</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">📊</div>
              <h3 className="text-lg font-bold text-white mb-2">3. Trade</h3>
              <p className="text-gray-400 text-sm">Buy YES or NO on sports, crypto, politics, entertainment & more</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🏆</div>
              <h3 className="text-lg font-bold text-white mb-2">4. Win & Withdraw</h3>
              <p className="text-gray-400 text-sm">Winning shares pay out. Withdraw to bank or Base wallet anytime</p>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="mt-8 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="text-sm">
              <h4 className="text-yellow-400 font-semibold mb-1">Trading Guidelines</h4>
              <ul className="text-gray-400 space-y-0.5 text-xs">
                <li>• Markets resolve based on official sources and verified outcomes</li>
                <li>• 18+ only — Age verification required</li>
                <li>• Trade responsibly — only bet what you can afford to lose</li>
                <li>• All deposits and withdrawals are secured and auditable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
