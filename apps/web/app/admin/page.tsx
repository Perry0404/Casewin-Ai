'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

/* --- Types --- */
interface Stats {
  totalUsers: number
  totalDeposits: number
  totalWithdrawals: number
  totalWalletBalance: number
  totalBetVolume: number
  totalMarketPool: number
  activeMarkets: number
  totalMarkets: number
  totalBets: number
  totalPlatformFees: number
  marketFees: number
  depositFees: number
  successPayments: number
  pendingPayments: number
  netRevenue: number
  totalFeesWithdrawn: number
}

interface Market {
  id: string
  title: string
  total_pool: number
  status: string
  created_at: string
}

interface RecentUser {
  user_email: string
  naira_balance: number
  total_deposits: number
  created_at: string
}

interface Transaction {
  user_email: string
  amount: number
  transaction_type: string
  balance_after: number
  notes: string
  created_at: string
}

interface Lawyer {
  id: string
  full_name: string
  email: string
  location: string
  bar_number: string
  specializations: string[]
  is_verified: boolean
  years_of_experience: number
  hourly_rate: number
  created_at: string
}

/* --- Page --- */
export default function AdminDashboard() {
  // Admin auth (password-based)
  const [adminKey, setAdminKey] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')

  const [stats, setStats] = useState<Stats | null>(null)
  const [markets, setMarkets] = useState<Market[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentTx, setRecentTx] = useState<Transaction[]>([])
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'overview' | 'markets' | 'users' | 'transactions' | 'lawyers'>('overview')
  const [verifyingId, setVerifyingId] = useState('')

  // Resolve market state
  const [resolveId, setResolveId] = useState('')
  const [resolveOutcome, setResolveOutcome] = useState<'yes' | 'no'>('yes')
  const [resolving, setResolving] = useState(false)
  const [resolveMsg, setResolveMsg] = useState('')

  // Create market state
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCategory, setNewCategory] = useState('Sports')
  const [newDeadline, setNewDeadline] = useState('')
  const [creating, setCreating] = useState(false)

  // Fee withdrawal state
  const [feeWithdrawAmount, setFeeWithdrawAmount] = useState(0)
  const [feeBankName, setFeeBankName] = useState('')
  const [feeBankAccount, setFeeBankAccount] = useState('')
  const [feeAccountName, setFeeAccountName] = useState('')
  const [withdrawingFees, setWithdrawingFees] = useState(false)
  const [feeWithdrawMsg, setFeeWithdrawMsg] = useState('')

  // Load saved admin key from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('casewin_admin_key')
    if (saved) setAdminKey(saved)
  }, [])

  const adminHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-admin-key': adminKey
  }), [adminKey])

  const handleLogin = async () => {
    setAuthError('')
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-admin-key': passwordInput }
      })
      if (res.status === 403) {
        setAuthError('Wrong password')
        return
      }
      if (res.ok) {
        setAdminKey(passwordInput)
        sessionStorage.setItem('casewin_admin_key', passwordInput)
        setPasswordInput('')
      } else {
        setAuthError('Login failed')
      }
    } catch {
      setAuthError('Connection error')
    }
  }

  const handleLogout = () => {
    setAdminKey('')
    sessionStorage.removeItem('casewin_admin_key')
    setStats(null)
  }

  const fetchStats = useCallback(async () => {
    if (!adminKey) return
    try {
      setLoading(true)
      const res = await fetch('/api/admin/stats', { headers: { 'x-admin-key': adminKey } })
      if (res.status === 403) {
        setError('Access denied.')
        setAdminKey('')
        sessionStorage.removeItem('casewin_admin_key')
        return
      }
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setStats(data.stats)
      setMarkets(data.markets || [])
      setRecentUsers(data.recentUsers || [])
      setRecentTx(data.recentTransactions || [])
      try {
        const lRes = await fetch('/api/admin/lawyers', { headers: { 'x-admin-key': adminKey } })
        if (lRes.ok) { const lData = await lRes.json(); setLawyers(lData.lawyers || []) }
      } catch { /* ignore */ }
    } catch {
      setError('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => { if (adminKey) fetchStats() }, [adminKey, fetchStats])

  const handleResolve = async () => {
    if (!resolveId) return
    setResolving(true)
    setResolveMsg('')
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ action: 'resolve_market', market_id: resolveId, outcome: resolveOutcome })
      })
      const data = await res.json()
      setResolveMsg(data.message || data.error || 'Done')
      if (data.success) { fetchStats(); setResolveId('') }
    } catch {
      setResolveMsg('Failed to resolve market')
    } finally {
      setResolving(false)
    }
  }

  const handleCreateMarket = async () => {
    if (!newTitle || !newDeadline) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({
          action: 'create_market',
          title: newTitle, description: newDesc, category: newCategory, deadline: newDeadline
        })
      })
      const data = await res.json()
      if (data.success) { setShowCreate(false); setNewTitle(''); setNewDesc(''); setNewDeadline(''); fetchStats() }
    } catch { /* silent */ }
    finally { setCreating(false) }
  }

  const handleFeeWithdraw = async () => {
    if (!feeWithdrawAmount || feeWithdrawAmount < 100 || !feeBankName || !feeBankAccount || !feeAccountName) {
      setFeeWithdrawMsg('Fill all fields. Minimum \u20A6100.')
      return
    }
    setWithdrawingFees(true)
    setFeeWithdrawMsg('')
    try {
      const res = await fetch('/api/admin/withdraw-fees', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({
          amount: feeWithdrawAmount,
          bank_name: feeBankName,
          account_number: feeBankAccount,
          account_name: feeAccountName
        })
      })
      const data = await res.json()
      setFeeWithdrawMsg(data.message || data.error || 'Done')
      if (data.success) { fetchStats(); setFeeWithdrawAmount(0) }
    } catch {
      setFeeWithdrawMsg('Withdrawal failed')
    } finally {
      setWithdrawingFees(false)
    }
  }

  // --- LOGIN SCREEN ---
  if (!adminKey) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">\u2696\uFE0F</div>
            <h1 className="text-2xl font-bold text-white">CaseWin Admin</h1>
            <p className="text-gray-400 text-sm mt-1">Enter admin password</p>
          </div>
          <input
            type="password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-lg tracking-widest focus:outline-none focus:border-green-500 mb-4"
            autoFocus
          />
          <button
            onClick={handleLogin}
            disabled={!passwordInput}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
          >Sign In</button>
          {authError && <p className="text-red-400 text-sm text-center mt-3">{authError}</p>}
          <Link href="/predictions" className="block text-center text-green-400 hover:text-green-300 text-xs mt-4">
            Back to Markets
          </Link>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">\uD83D\uDEAB</div>
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/predictions" className="text-green-400 hover:text-green-300 underline text-sm">
            Back to Markets
          </Link>
        </div>
      </main>
    )
  }

  const N = (n: number) => `₦${n.toLocaleString()}`

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* BG */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Header */}
      <header className="relative bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="text-3xl">⚖️</div>
            <div>
              <h1 className="text-2xl font-bold text-white">CaseWin Admin</h1>
              <p className="text-xs text-green-300">Dashboard</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs border border-red-500/20">
              Logout
            </button>
            <Link href="/predictions" className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs border border-white/10">
              Back to Markets
            </Link>
          </div>
        </div>
      </header>

      <div className="relative container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 mt-4">Loading admin data...</p>
          </div>
        ) : stats ? (
          <>
            {/* Tab Nav */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {(['overview', 'markets', 'users', 'transactions', 'lawyers'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap capitalize ${
                    tab === t
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                  }`}
                >{t}</button>
              ))}
            </div>

            {/* ======= OVERVIEW TAB ======= */}
            {tab === 'overview' && (
              <div className="space-y-8">
                {/* Revenue cards */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">💰 Revenue & Fees</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Platform Revenue" value={N(stats.netRevenue)} color="green" />
                    <StatCard label="Market Fees (1%)" value={N(stats.marketFees)} color="green" />
                    <StatCard label="Deposit Fees (1%)" value={N(stats.depositFees)} color="green" />
                    <StatCard label="Total Fees Collected" value={N(stats.totalPlatformFees)} color="emerald" />
                  </div>
                </div>

                {/* Volume cards */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">📊 Platform Volume</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Deposits" value={N(stats.totalDeposits)} color="blue" />
                    <StatCard label="Total Withdrawals" value={N(stats.totalWithdrawals)} color="red" />
                    <StatCard label="Wallet Balances" value={N(stats.totalWalletBalance)} color="yellow" />
                    <StatCard label="Bet Volume" value={N(stats.totalBetVolume)} color="purple" />
                  </div>
                </div>

                {/* Users & Markets cards */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">👥 Users & Markets</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Users" value={String(stats.totalUsers)} color="blue" />
                    <StatCard label="Active Markets" value={`${stats.activeMarkets} / ${stats.totalMarkets}`} color="green" />
                    <StatCard label="Total Bets" value={String(stats.totalBets)} color="yellow" />
                    <StatCard label="Market Pool" value={N(stats.totalMarketPool)} color="emerald" />
                  </div>
                </div>

                {/* Payments */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">💳 Payments</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Successful Payments" value={String(stats.successPayments)} color="green" />
                    <StatCard label="Pending Payments" value={String(stats.pendingPayments)} color="yellow" />
                  </div>
                </div>

                {/* Fee Withdrawal */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">💸 Withdraw Platform Fees</h2>
                  <div className="bg-white/5 border border-green-500/30 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Available Fees</p>
                        <p className="text-2xl font-bold text-green-400">₦{((stats.totalPlatformFees || 0) - (stats.totalFeesWithdrawn || 0)).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Total Collected</p>
                        <p className="text-lg font-semibold text-gray-300">₦{(stats.totalPlatformFees || 0).toLocaleString()}</p>
                        <p className="text-gray-500 text-xs">Withdrawn: ₦{(stats.totalFeesWithdrawn || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={feeWithdrawAmount || ''}
                        onChange={e => setFeeWithdrawAmount(Number(e.target.value))}
                        placeholder="Amount (₦)"
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
                      />
                      <input
                        value={feeBankName}
                        onChange={e => setFeeBankName(e.target.value)}
                        placeholder="Bank name (e.g. Access)"
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
                      />
                      <input
                        value={feeBankAccount}
                        onChange={e => setFeeBankAccount(e.target.value)}
                        placeholder="Account number"
                        maxLength={10}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
                      />
                      <input
                        value={feeAccountName}
                        onChange={e => setFeeAccountName(e.target.value)}
                        placeholder="Account name"
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
                      />
                    </div>
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={handleFeeWithdraw}
                        disabled={withdrawingFees || !feeWithdrawAmount || !feeBankName || !feeBankAccount}
                        className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-semibold disabled:opacity-40 hover:opacity-90"
                      >{withdrawingFees ? 'Processing...' : 'Withdraw to Bank'}</button>
                      <button
                        onClick={() => setFeeWithdrawAmount((stats.totalPlatformFees || 0) - (stats.totalFeesWithdrawn || 0))}
                        className="px-4 py-2.5 bg-white/10 text-gray-300 rounded-lg text-sm hover:bg-white/20"
                      >Withdraw All</button>
                    </div>
                    {feeWithdrawMsg && (
                      <p className={`text-sm ${feeWithdrawMsg.includes('success') || feeWithdrawMsg.includes('processing') ? 'text-green-400' : 'text-red-400'}`}>
                        {feeWithdrawMsg}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ======= MARKETS TAB ======= */}
            {tab === 'markets' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">📊 Markets ({markets.length})</h2>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold"
                  >+ Create Market</button>
                </div>

                {/* Create market modal */}
                {showCreate && (
                  <div className="bg-white/5 border border-green-500/30 rounded-xl p-6 space-y-4">
                    <h3 className="text-white font-bold">Create New Market</h3>
                    <input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="Market title (question)"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
                    />
                    <textarea
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      placeholder="Description (optional)"
                      rows={2}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
                      >
                        {['Sports', 'Entertainment', 'World Politics', 'Crypto', 'Technology', 'Nigerian Law', 'Financial Law', 'Criminal Law'].map(c => (
                          <option key={c} value={c} className="bg-slate-900">{c}</option>
                        ))}
                      </select>
                      <input
                        type="datetime-local"
                        value={newDeadline}
                        onChange={e => setNewDeadline(e.target.value)}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-500 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateMarket}
                        disabled={creating || !newTitle || !newDeadline}
                        className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold disabled:opacity-40"
                      >{creating ? 'Creating...' : 'Create Market'}</button>
                      <button onClick={() => setShowCreate(false)} className="px-5 py-2 bg-white/10 text-white rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Resolve market */}
                <div className="bg-white/5 border border-yellow-500/30 rounded-xl p-6 space-y-4">
                  <h3 className="text-white font-bold">⚡ Resolve Market</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={resolveId}
                      onChange={e => setResolveId(e.target.value)}
                      className="col-span-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                    >
                      <option value="" className="bg-slate-900">Select market...</option>
                      {markets.filter(m => m.status === 'open').map(m => (
                        <option key={m.id} value={m.id} className="bg-slate-900">{m.title} (Pool: ₦{m.total_pool.toLocaleString()})</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setResolveOutcome('yes')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold ${resolveOutcome === 'yes' ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-400'}`}
                      >YES</button>
                      <button
                        onClick={() => setResolveOutcome('no')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold ${resolveOutcome === 'no' ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400'}`}
                      >NO</button>
                    </div>
                  </div>
                  <button
                    onClick={handleResolve}
                    disabled={resolving || !resolveId}
                    className="px-5 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-semibold disabled:opacity-40"
                  >{resolving ? 'Resolving...' : 'Resolve & Pay Winners'}</button>
                  {resolveMsg && <p className="text-sm text-green-400">{resolveMsg}</p>}
                </div>

                {/* Markets table */}
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400">
                        <th className="text-left p-3">Market</th>
                        <th className="text-right p-3">Pool</th>
                        <th className="text-right p-3">Status</th>
                        <th className="text-right p-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {markets.map(m => (
                        <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 text-white max-w-[300px] truncate">{m.title}</td>
                          <td className="p-3 text-right text-green-400 font-semibold">₦{m.total_pool.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              m.status === 'open' ? 'bg-green-500/20 text-green-400' :
                              m.status === 'resolved' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>{m.status}</span>
                          </td>
                          <td className="p-3 text-right text-gray-500 text-xs">{new Date(m.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======= USERS TAB ======= */}
            {tab === 'users' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-white">👥 Recent Users ({stats.totalUsers} total)</h2>
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400">
                        <th className="text-left p-3">Email</th>
                        <th className="text-right p-3">Balance</th>
                        <th className="text-right p-3">Total Deposits</th>
                        <th className="text-right p-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((u, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 text-white">{u.user_email}</td>
                          <td className="p-3 text-right text-green-400 font-semibold">₦{(u.naira_balance || 0).toLocaleString()}</td>
                          <td className="p-3 text-right text-blue-400">₦{(u.total_deposits || 0).toLocaleString()}</td>
                          <td className="p-3 text-right text-gray-500 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======= TRANSACTIONS TAB ======= */}
            {tab === 'transactions' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-white">💸 Recent Transactions</h2>
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400">
                        <th className="text-left p-3">User</th>
                        <th className="text-right p-3">Amount</th>
                        <th className="text-right p-3">Type</th>
                        <th className="text-right p-3">Balance After</th>
                        <th className="text-left p-3">Notes</th>
                        <th className="text-right p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTx.map((tx, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 text-white text-xs">{tx.user_email}</td>
                          <td className={`p-3 text-right font-semibold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.amount >= 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              tx.transaction_type === 'deposit' ? 'bg-green-500/20 text-green-400' :
                              tx.transaction_type === 'withdrawal' ? 'bg-red-500/20 text-red-400' :
                              tx.transaction_type === 'bet' ? 'bg-yellow-500/20 text-yellow-400' :
                              tx.transaction_type === 'payout' ? 'bg-blue-500/20 text-blue-400' :
                              tx.transaction_type === 'fee' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>{tx.transaction_type}</span>
                          </td>
                          <td className="p-3 text-right text-gray-300">₦{(tx.balance_after || 0).toLocaleString()}</td>
                          <td className="p-3 text-gray-500 text-xs max-w-[200px] truncate">{tx.notes || '—'}</td>
                          <td className="p-3 text-right text-gray-500 text-xs">{tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* ======= LAWYERS TAB ======= */}
            {tab === 'lawyers' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-white">👨‍⚖️ Registered Lawyers ({lawyers.length})</h2>
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400">
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Location</th>
                        <th className="text-left p-3">Bar #</th>
                        <th className="text-left p-3">Specializations</th>
                        <th className="text-right p-3">Rate</th>
                        <th className="text-right p-3">Exp</th>
                        <th className="text-center p-3">Status</th>
                        <th className="text-center p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lawyers.map(l => (
                        <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 text-white font-medium">{l.full_name}</td>
                          <td className="p-3 text-gray-400 text-xs">{l.email || '—'}</td>
                          <td className="p-3 text-gray-400 text-xs">{l.location || '—'}</td>
                          <td className="p-3 text-gray-400 text-xs">{l.bar_number}</td>
                          <td className="p-3 text-xs">
                            <div className="flex flex-wrap gap-1">
                              {(l.specializations || []).slice(0, 3).map((s, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px]">{s}</span>
                              ))}
                              {(l.specializations || []).length > 3 && <span className="text-gray-500">+{l.specializations.length - 3}</span>}
                            </div>
                          </td>
                          <td className="p-3 text-right text-green-400">₦{(l.hourly_rate || 0).toLocaleString()}/hr</td>
                          <td className="p-3 text-right text-gray-400">{l.years_of_experience}yr</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              l.is_verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>{l.is_verified ? 'Verified' : 'Pending'}</span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              disabled={verifyingId === l.id}
                              onClick={async () => {
                                setVerifyingId(l.id)
                                try {
                                  const res = await fetch('/api/admin/lawyers/verify', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ lawyer_id: l.id, verified: !l.is_verified })
                                  })
                                  if (res.ok) {
                                    setLawyers(prev => prev.map(x => x.id === l.id ? { ...x, is_verified: !x.is_verified } : x))
                                  }
                                } catch { /* ignore */ }
                                setVerifyingId('')
                              }}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                                l.is_verified
                                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              }`}
                            >
                              {verifyingId === l.id ? '...' : l.is_verified ? 'Revoke' : 'Verify'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {lawyers.length === 0 && (
                        <tr><td colSpan={9} className="p-8 text-center text-gray-500">No lawyer registrations yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  )
}

/* --- Stat Card Component --- */
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
    emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
    red: 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400',
    yellow: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400',
    purple: 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400',
  }
  const cls = colorMap[color] || colorMap.green

  return (
    <div className={`bg-gradient-to-br ${cls} border rounded-xl p-4`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-xl font-bold ${cls.split(' ').pop()}`}>{value}</div>
    </div>
  )
}
