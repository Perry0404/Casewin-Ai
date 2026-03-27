'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notifications'

/* ─── Types ─── */
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

interface AIAnalysis {
  summary: string
  confidence: number
  recommendation: 'YES' | 'NO' | 'HOLD'
  factors: Array<{ factor: string; impact: string; detail: string }>
  risk_level?: string
  disclaimer: string
}

/* ─── Constants ─── */
const BASE_CHAIN_ID = '0x2105' // Base Mainnet
const BASE_TREASURY = process.env.NEXT_PUBLIC_BASE_TREASURY_ADDRESS || ''
const CATEGORIES = ['Constitutional Law', 'Financial Law', 'Property Law', 'Criminal Law', 'Corporate Law', 'Labour Law']

/* ─── Ethereum type ─── */
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on?: (event: string, cb: (...args: unknown[]) => void) => void
      isMetaMask?: boolean
    }
  }
}

/* ─── Page ─── */
export default function PredictionMarketPage() {
  const { user } = useAuth()
  const { notify } = useNotification()

  // Data
  const [markets, setMarkets] = useState<PredictionMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [walletLoading, setWalletLoading] = useState(true)

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

  // Base crypto
  const [baseAddress, setBaseAddress] = useState('')
  const [baseConnected, setBaseConnected] = useState(false)
  const [cryptoAmount, setCryptoAmount] = useState('')
  const [cryptoSending, setCryptoSending] = useState(false)

  /* ─── Data Fetching ─── */
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

  useEffect(() => { fetchMarkets() }, [fetchMarkets])
  useEffect(() => { if (user) fetchWallet() }, [user, fetchWallet])

  /* ─── AI Analysis ─── */
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

  /* ─── Trade ─── */
  const openTrade = (market: PredictionMarket) => {
    setTradeMarket(market)
    setVoteAmount(500)
    setAiAnalysis(null)
    fetchAI(market) // Auto-load AI analysis
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

  /* ─── Naira Deposit ─── */
  const handleNairaDeposit = async () => {
    if (depositAmount < 100) {
      notify({ type: 'error', title: 'Error', message: 'Minimum deposit is ₦100' })
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
      if (data.data?.checkout_url) {
        window.location.href = data.data.checkout_url
      } else {
        notify({ type: 'error', title: 'Error', message: data.error || 'Failed to start payment' })
      }
    } catch {
      notify({ type: 'error', title: 'Error', message: 'Payment initialization failed' })
    }
  }

  /* ─── Base Crypto ─── */
  const connectBaseWallet = async () => {
    if (!window.ethereum) {
      notify({ type: 'error', title: 'No Wallet', message: 'Install MetaMask or Coinbase Wallet to deposit crypto' })
      return
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      setBaseAddress(accounts[0])
      setBaseConnected(true)

      // Switch to Base network
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BASE_CHAIN_ID }] })
      } catch (switchErr: unknown) {
        const err = switchErr as { code?: number }
        if (err.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: BASE_CHAIN_ID,
              chainName: 'Base',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org']
            }]
          })
        }
      }
      notify({ type: 'success', title: 'Connected', message: `Wallet connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}` })
    } catch {
      notify({ type: 'error', title: 'Error', message: 'Failed to connect wallet' })
    }
  }

  const handleCryptoDeposit = async () => {
    if (!baseConnected || !baseAddress || !cryptoAmount || !BASE_TREASURY) {
      notify({ type: 'error', title: 'Error', message: !BASE_TREASURY ? 'Crypto deposits coming soon' : 'Connect wallet and enter an amount' })
      return
    }
    setCryptoSending(true)
    try {
      const weiHex = '0x' + BigInt(Math.floor(parseFloat(cryptoAmount) * 1e18)).toString(16)
      const txHash = await window.ethereum!.request({
        method: 'eth_sendTransaction',
        params: [{ from: baseAddress, to: BASE_TREASURY, value: weiHex, chainId: BASE_CHAIN_ID }]
      }) as string

      notify({ type: 'success', title: 'Sent!', message: 'Verifying your deposit on Base...' })

      // Wait a few seconds for confirmation then verify
      await new Promise(r => setTimeout(r, 5000))

      const verifyRes = await fetch('/api/wallet/crypto-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_hash: txHash, chain: 'base' })
      })
      const verifyData = await verifyRes.json()

      if (verifyRes.ok) {
        notify({ type: 'success', title: 'Deposit Confirmed!', message: `₦${verifyData.naira_credited?.toLocaleString()} credited to your wallet` })
        fetchWallet()
        setShowDeposit(false)
        setCryptoAmount('')
      } else {
        notify({ type: 'error', title: 'Verification Pending', message: verifyData.error || 'Try again in a minute — the transaction may still be confirming.' })
      }
    } catch (err: unknown) {
      const error = err as { code?: number }
      if (error.code === 4001) {
        notify({ type: 'error', title: 'Cancelled', message: 'Transaction was cancelled' })
      } else {
        notify({ type: 'error', title: 'Error', message: 'Failed to send transaction' })
      }
    } finally {
      setCryptoSending(false)
    }
  }

  /* ─── Withdrawal ─── */
  const handleWithdraw = async () => {
    if (withdrawAmount < 100) {
      notify({ type: 'error', title: 'Error', message: 'Minimum withdrawal is ₦100' })
      return
    }
    try {
      const body = withdrawTab === 'naira'
        ? { amount: withdrawAmount, method: 'bank', bank_details: { bank: bankName, account: bankAccount, name: accountName } }
        : { amount: withdrawAmount, method: 'crypto', wallet_address: cryptoWithdrawAddr }

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

  /* ─── Helpers ─── */
  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days > 1) return `${days} days left`
    if (days === 1) return '1 day left'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours > 0) return `${hours}h left`
    return 'Ended'
  }

  const balance = wallet?.naira_balance || 0

  /* ─── Render ─── */
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* BG decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Header */}
      <header className="relative bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="text-3xl">⚖️</div>
              <div>
                <h1 className="text-2xl font-bold text-white">CaseWin-NG</h1>
                <p className="text-xs text-purple-300">Legal Prediction Markets</p>
              </div>
            </Link>
            <MobileNav currentPath="/predictions" />
          </div>
        </div>
      </header>

      {/* ═══ Wallet Bar ═══ */}
      <div className="relative bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-lg">💰</span>
                <div>
                  <div className="text-xs text-gray-400">Naira Balance</div>
                  <div className="text-lg font-bold text-white">
                    {walletLoading ? '...' : `₦${balance.toLocaleString()}`}
                  </div>
                </div>
              </div>
              {baseConnected && (
                <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                  <span className="text-blue-400 text-lg">🔗</span>
                  <div>
                    <div className="text-xs text-gray-400">Base Wallet</div>
                    <div className="text-sm font-medium text-blue-300">{baseAddress.slice(0, 6)}...{baseAddress.slice(-4)}</div>
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
            </div>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* ═══ Hero ═══ */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-green-400 via-white to-green-400 text-green-900 px-6 py-2 rounded-full text-sm font-bold border-2 border-green-500">
              🇳🇬 NIGERIAN LEGAL MARKETS • REAL MONEY
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-white to-green-400">
            Predict Nigerian Legal Outcomes
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">
            Deposit Naira or ETH on Base. Use AI-powered analysis to trade on Supreme Court rulings, Court of Appeal decisions, and landmark Nigerian cases.
          </p>
          <div className="flex justify-center gap-6 text-center">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 min-w-[120px]">
              <div className="text-2xl font-bold text-purple-400">
                {loading ? '...' : `₦${markets.reduce((s, m) => s + m.total_pool, 0).toLocaleString()}`}
              </div>
              <div className="text-xs text-gray-400 mt-1">Total Volume</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 min-w-[120px]">
              <div className="text-2xl font-bold text-pink-400">{loading ? '...' : markets.length}</div>
              <div className="text-xs text-gray-400 mt-1">Active Markets</div>
            </div>
          </div>
        </div>

        {/* ═══ Category Filter ═══ */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-3 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >All Markets</button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
              }`}
            >{cat}</button>
          ))}
        </div>

        {/* ═══ Markets Grid ═══ */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
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
                <div key={market.id} className="group bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold border border-purple-500/30">{market.category}</span>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {getTimeRemaining(market.deadline)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors leading-tight">{market.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{market.description}</p>

                    {/* Price & Probability */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                        <div className="text-xs text-green-400 mb-1">YES</div>
                        <div className="text-xl font-bold text-green-400">{yesP}%</div>
                        <div className="text-xs text-gray-500">₦{(market.yes_price || 0.5).toFixed(2)}/share</div>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                        <div className="text-xs text-red-400 mb-1">NO</div>
                        <div className="text-xl font-bold text-red-400">{noP}%</div>
                        <div className="text-xs text-gray-500">₦{(market.no_price || 0.5).toFixed(2)}/share</div>
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
                        <div className="text-white font-bold">₦{market.total_pool.toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openTrade(market)}
                          className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                        >
                          🤖 Trade
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* ═══ TRADE MODAL ═══ */}
        {/* ═══════════════════════════════════════ */}
        {tradeMarket && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl max-w-lg w-full my-8">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-semibold">{tradeMarket.category}</span>
                    <h3 className="text-xl font-bold text-white mt-2 leading-tight">{tradeMarket.title}</h3>
                  </div>
                  <button onClick={() => setTradeMarket(null)} className="text-gray-400 hover:text-white p-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="p-6 border-b border-white/10">
                <h4 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                  🤖 AI Legal Analysis
                  {aiLoading && <span className="text-xs text-gray-500">analyzing...</span>}
                </h4>
                {aiLoading ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm">Running AI analysis on Nigerian legal precedents...</span>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-3">
                    {/* Recommendation badge */}
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
                    {/* Summary */}
                    <p className="text-sm text-gray-300 leading-relaxed">{aiAnalysis.summary}</p>
                    {/* Factors */}
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
                {/* Wallet balance */}
                <div className="flex items-center justify-between mb-4 bg-white/5 rounded-lg p-3">
                  <span className="text-sm text-gray-400">Your Balance</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">₦{balance.toLocaleString()}</span>
                    {balance < voteAmount && (
                      <button onClick={() => { setTradeMarket(null); setShowDeposit(true) }} className="text-xs text-green-400 hover:text-green-300 underline">
                        Deposit
                      </button>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">Bet Amount</label>
                  <div className="flex gap-2 mb-2">
                    {[100, 500, 1000, 5000, 10000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setVoteAmount(amt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          voteAmount === amt
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >₦{amt >= 1000 ? `${amt/1000}K` : amt}</button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="100000"
                    step="100"
                    value={voteAmount}
                    onChange={(e) => setVoteAmount(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <div className="text-center text-xl font-bold text-purple-400 mt-1">₦{voteAmount.toLocaleString()}</div>
                </div>

                {/* YES / NO buttons */}
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
                    className="py-3.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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

        {/* ═══════════════════════════════════════ */}
        {/* ═══ DEPOSIT MODAL ═══ */}
        {/* ═══════════════════════════════════════ */}
        {showDeposit && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-green-500/30 rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Deposit Funds</h3>
                <button onClick={() => setShowDeposit(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setDepositTab('naira')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${depositTab === 'naira' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                >🏦 Naira (Korapay)</button>
                <button
                  onClick={() => setDepositTab('crypto')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${depositTab === 'crypto' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                >🔗 Base (ETH)</button>
              </div>

              <div className="p-6">
                {depositTab === 'naira' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">Deposit Naira via card, bank transfer, or USSD using Korapay secure checkout.</p>
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Amount (₦)</label>
                      <div className="flex gap-2 mb-3">
                        {[1000, 5000, 10000, 50000].map(amt => (
                          <button
                            key={amt}
                            onClick={() => setDepositAmount(amt)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              depositAmount === amt ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >₦{amt >= 1000 ? `${amt/1000}K` : amt}</button>
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
                      Pay ₦{depositAmount.toLocaleString()} with Korapay
                    </button>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Secured by Korapay • Card, Bank Transfer, USSD
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">Deposit ETH on Base network. Converted to Naira at current rates.</p>

                    {!baseConnected ? (
                      <button
                        onClick={connectBaseWallet}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
                        Connect Base Wallet
                      </button>
                    ) : (
                      <>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <div className="text-xs text-blue-400 mb-1">Connected Wallet</div>
                          <div className="text-sm text-white font-mono">{baseAddress}</div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-300 mb-2 block">ETH Amount</label>
                          <input
                            type="number"
                            step="0.001"
                            min="0.0001"
                            placeholder="0.01"
                            value={cryptoAmount}
                            onChange={e => setCryptoAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-blue-500"
                          />
                          {cryptoAmount && (
                            <p className="text-xs text-gray-400 mt-1">
                              ≈ ₦{Math.floor(parseFloat(cryptoAmount || '0') * 5500000).toLocaleString()} at current rate
                            </p>
                          )}
                        </div>
                        <button
                          onClick={handleCryptoDeposit}
                          disabled={cryptoSending || !cryptoAmount}
                          className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-40"
                        >
                          {cryptoSending ? 'Sending & Verifying...' : `Send ${cryptoAmount || '0'} ETH on Base`}
                        </button>
                      </>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-blue-400">●</span> Base Network (L2) • Low fees • Fast confirmation
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* ═══ WITHDRAW MODAL ═══ */}
        {/* ═══════════════════════════════════════ */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-orange-500/30 rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Withdraw Funds</h3>
                <button onClick={() => setShowWithdraw(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setWithdrawTab('naira')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${withdrawTab === 'naira' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-500'}`}
                >🏦 Bank Transfer</button>
                <button
                  onClick={() => setWithdrawTab('crypto')}
                  className={`flex-1 py-3 text-sm font-semibold transition-all ${withdrawTab === 'crypto' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500'}`}
                >🔗 Base (ETH)</button>
              </div>

              <div className="p-6">
                <div className="bg-white/5 rounded-lg p-3 mb-4 flex justify-between">
                  <span className="text-sm text-gray-400">Available Balance</span>
                  <span className="text-lg font-bold text-white">₦{balance.toLocaleString()}</span>
                </div>

                {withdrawTab === 'naira' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Amount (₦)</label>
                      <input
                        type="number"
                        min={100}
                        max={balance}
                        value={withdrawAmount || ''}
                        onChange={e => setWithdrawAmount(Number(e.target.value))}
                        placeholder="Enter amount"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Bank Name</label>
                      <input
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        placeholder="e.g. GTBank, Access Bank"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Account Number</label>
                      <input
                        value={bankAccount}
                        onChange={e => setBankAccount(e.target.value)}
                        placeholder="0123456789"
                        maxLength={10}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Account Name</label>
                      <input
                        value={accountName}
                        onChange={e => setAccountName(e.target.value)}
                        placeholder="Full name on account"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500 text-sm"
                      />
                    </div>
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawAmount < 100 || !bankName || !bankAccount || !accountName}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-40 mt-2"
                    >
                      Withdraw ₦{(withdrawAmount || 0).toLocaleString()} to Bank
                    </button>
                    <p className="text-xs text-gray-500 text-center">Processing time: within 24 hours</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Amount (₦)</label>
                      <input
                        type="number"
                        min={100}
                        max={balance}
                        value={withdrawAmount || ''}
                        onChange={e => setWithdrawAmount(Number(e.target.value))}
                        placeholder="Amount in Naira to convert to ETH"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                      {withdrawAmount > 0 && (
                        <p className="text-xs text-gray-400 mt-1">≈ {(withdrawAmount / 5500000).toFixed(6)} ETH at current rate</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Base Wallet Address</label>
                      <input
                        value={cryptoWithdrawAddr}
                        onChange={e => setCryptoWithdrawAddr(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawAmount < 100 || !cryptoWithdrawAddr}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-40 mt-2"
                    >
                      Withdraw to Base Wallet
                    </button>
                    <p className="text-xs text-gray-500 text-center">Processing time: within 1 hour</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ How It Works ═══ */}
        <div className="mt-16 bg-white/5 backdrop-blur-xl rounded-3xl border border-green-500/20 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-white text-center mb-2">How It Works</h2>
          <p className="text-center text-green-400 mb-8 text-xs">🇳🇬 Nigerian Legal Prediction Markets • Real Money</p>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">💰</div>
              <h3 className="text-lg font-bold text-white mb-2">1. Deposit</h3>
              <p className="text-gray-400 text-sm">Fund your wallet with Naira via Korapay or ETH on Base network</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🤖</div>
              <h3 className="text-lg font-bold text-white mb-2">2. AI Analysis</h3>
              <p className="text-gray-400 text-sm">Get AI-powered analysis on Nigerian case law, precedents, and legal factors</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">📊</div>
              <h3 className="text-lg font-bold text-white mb-2">3. Trade</h3>
              <p className="text-gray-400 text-sm">Buy YES or NO shares on Nigerian court outcomes using your wallet balance</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🏆</div>
              <h3 className="text-lg font-bold text-white mb-2">4. Win & Withdraw</h3>
              <p className="text-gray-400 text-sm">Winning shares pay out. Withdraw to your bank or Base wallet anytime</p>
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
                <li>• Markets resolve based on publicly available Nigerian court judgments</li>
                <li>• No trading on confidential client information or by involved parties</li>
                <li>• 18+ only — Age verification required</li>
                <li>• Compliant with Rules of Professional Conduct for Legal Practitioners</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
