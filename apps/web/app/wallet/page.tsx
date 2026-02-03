'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Transaction } from '@/types/database'

export default function WalletPage() {
  const { user, wallet, loading, refreshWallet } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTx, setLoadingTx] = useState(true)
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    if (!user) return
    const supabase = createClient()
    
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    setTransactions(data || [])
    setLoadingTx(false)
  }

  const handleFundWallet = async () => {
    if (!fundAmount || parseFloat(fundAmount) < 100) {
      alert('Minimum funding amount is ₦100')
      return
    }

    setProcessing(true)
    
    // For now, simulate funding (Korapay will be integrated when approved)
    // In production, this will call the Korapay API
    setTimeout(async () => {
      const supabase = createClient()
      
      // Create a pending transaction
      await supabase.from('transactions').insert({
        user_id: user?.id,
        wallet_id: wallet?.id,
        type: 'deposit',
        amount: parseFloat(fundAmount),
        status: 'pending',
        reference: `DEP-${Date.now()}`,
        description: 'Wallet funding via Korapay',
      })

      alert('Payment integration pending. Once Korapay KYC is approved, you can fund your wallet.')
      setShowFundModal(false)
      setFundAmount('')
      setProcessing(false)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please Log In</h1>
          <p className="text-gray-400 mb-6">You need to be logged in to view your wallet.</p>
          <Link href="/auth/login" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Wallet</h1>
          <p className="text-gray-400 mt-2">Manage your funds and transactions</p>
        </div>

        <div className="grid gap-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-8">
            <p className="text-green-100 text-sm mb-2">Available Balance</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold text-white">
                ₦{wallet?.balance?.toLocaleString() || '0'}
              </span>
              <span className="text-green-200 text-2xl">.00</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowFundModal(true)}
                className="flex-1 bg-white text-green-700 py-3 rounded-lg font-semibold hover:bg-green-50 transition"
              >
                + Fund Wallet
              </button>
              <button
                className="flex-1 bg-green-500/30 text-white py-3 rounded-lg font-semibold hover:bg-green-500/40 transition border border-green-400/30"
              >
                Withdraw
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/predictions" className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-white">Bet on Cases</h3>
              <p className="text-gray-400 text-sm mt-1">Use your balance to predict case outcomes</p>
            </Link>
            <Link href="/marketplace" className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition">
              <div className="text-3xl mb-3">👨‍⚖️</div>
              <h3 className="font-semibold text-white">Hire a Lawyer</h3>
              <p className="text-gray-400 text-sm mt-1">Pay for legal consultations</p>
            </Link>
            <Link href="/tools" className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-white">AI Tools</h3>
              <p className="text-gray-400 text-sm mt-1">Premium features coming soon</p>
            </Link>
          </div>

          {/* Transaction History */}
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Transaction History</h3>
            </div>
            
            {loadingTx ? (
              <div className="p-6 text-center text-gray-400">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-4">💳</div>
                <p className="text-gray-400">No transactions yet</p>
                <p className="text-gray-500 text-sm mt-1">Fund your wallet to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'deposit' || tx.type === 'win' || tx.type === 'refund' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'win' || tx.type === 'refund' ? '↓' : '↑'}
                      </div>
                      <div>
                        <p className="text-white font-medium capitalize">{tx.type}</p>
                        <p className="text-gray-400 text-sm">{tx.description || tx.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        tx.type === 'deposit' || tx.type === 'win' || tx.type === 'refund'
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'win' || tx.type === 'refund' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fund Wallet Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Fund Your Wallet</h3>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Amount (₦)</label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Enter amount"
                min="100"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:border-green-500"
              />
              <p className="text-gray-500 text-sm mt-2">Minimum: ₦100</p>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1000, 5000, 10000, 20000, 50000, 100000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setFundAmount(amount.toString())}
                  className="py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm"
                >
                  ₦{amount.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                ⚠️ Payment integration is pending Korapay KYC approval. You'll be able to fund your wallet once approved.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowFundModal(false)}
                className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleFundWallet}
                disabled={processing}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
