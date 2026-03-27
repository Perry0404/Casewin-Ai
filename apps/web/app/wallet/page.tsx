'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface WalletData {
  walletAddress: string;
  onChainBalance: {
    eth: number;
    usdc: number;
    ethNGN: number;
    usdcNGN: number;
    totalNGN: number;
  };
  tradingBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  explorer: string;
  isNew?: boolean;
  message?: string;
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/wallet/base-wallet');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load wallet');
        return;
      }
      setWalletData(data);
      if (data.message) setSyncMessage(data.message);
    } catch (err) {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      // Also fetch wallet_transactions from the wallet API for history
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user, fetchWallet]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await fetch('/api/wallet/base-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(data.message);
        if (data.credited > 0) {
          // Refresh wallet data to show new balance
          await fetchWallet();
        } else {
          // Still refresh on-chain data
          setWalletData(prev => prev ? {
            ...prev,
            onChainBalance: data.onChainBalance || prev.onChainBalance
          } : prev);
        }
      } else {
        setSyncMessage(data.error || 'Sync failed');
      }
    } catch {
      setSyncMessage('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const copyAddress = () => {
    if (walletData?.walletAddress) {
      navigator.clipboard.writeText(walletData.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 max-w-md">
          <p className="text-4xl mb-4">🔐</p>
          <h1 className="text-xl font-bold text-white mb-2">Login Required</h1>
          <p className="text-slate-400 text-sm mb-4">Log in to access your wallet and start trading.</p>
          <Link href="/auth/login" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-500 font-medium">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              My Wallet
            </h1>
            <p className="text-xs text-slate-400">Base Chain · Deposit &amp; Trade</p>
          </div>
          <div className="flex gap-2">
            <Link href="/predictions" className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500">
              🎯 Bet Now
            </Link>
            <Link href="/" className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700">
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={fetchWallet} className="text-sm text-red-300 hover:text-white underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-400">Setting up your Base wallet...</p>
          </div>
        ) : walletData ? (
          <>
            {/* Trading Balance Card */}
            <div className="bg-gradient-to-r from-green-600/90 to-emerald-700/90 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
              <p className="text-green-100 text-sm mb-1">Trading Balance</p>
              <p className="text-4xl font-bold text-white mb-1">
                ₦{(walletData.tradingBalance || 0).toLocaleString()}
              </p>
              <p className="text-green-200 text-xs mb-4">This is your balance for betting on prediction markets</p>
              <div className="flex gap-3">
                <Link href="/predictions" className="flex-1 bg-white text-green-700 py-3 rounded-xl font-semibold hover:bg-green-50 text-center text-sm">
                  🎯 Place Bets
                </Link>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex-1 bg-green-500/30 text-white py-3 rounded-xl font-semibold hover:bg-green-500/40 border border-green-400/30 text-sm disabled:opacity-50"
                >
                  {syncing ? '⏳ Syncing...' : '🔄 Sync Deposits'}
                </button>
              </div>
            </div>

            {syncMessage && (
              <div className={`rounded-xl p-4 text-sm ${
                syncMessage.includes('✅') || syncMessage.includes('credited')
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : syncMessage.includes('No new')
                  ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                  : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
              }`}>
                {syncMessage}
              </div>
            )}

            {/* Deposit Address */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="font-bold text-white mb-1">📥 Deposit Address (Base Chain)</h3>
              <p className="text-xs text-slate-400 mb-4">Send USDC or ETH on Base network to this address. Then tap "Sync Deposits" above.</p>

              <div className="flex items-center gap-2 bg-slate-900/50 rounded-xl p-3 border border-slate-600/50">
                <code className="flex-1 text-green-400 text-sm font-mono break-all select-all">
                  {walletData.walletAddress}
                </code>
                <button
                  onClick={copyAddress}
                  className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-xs hover:bg-slate-600 whitespace-nowrap"
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-slate-900/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400">ETH</p>
                  <p className="text-sm font-bold text-white">{walletData.onChainBalance.eth.toFixed(6)}</p>
                  <p className="text-xs text-slate-500">≈ ₦{walletData.onChainBalance.ethNGN.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400">USDC</p>
                  <p className="text-sm font-bold text-white">{walletData.onChainBalance.usdc.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">≈ ₦{walletData.onChainBalance.usdcNGN.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400">Total On-Chain</p>
                  <p className="text-sm font-bold text-green-400">₦{walletData.onChainBalance.totalNGN.toLocaleString()}</p>
                </div>
              </div>

              <a
                href={walletData.explorer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-xs text-blue-400 hover:text-blue-300"
              >
                View on BaseScan ↗
              </a>
            </div>

            {/* How It Works */}
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="font-bold text-white mb-4">🔄 How It Works</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-400 font-bold">1</span>
                  </div>
                  <p className="text-white text-sm font-medium">Send Crypto</p>
                  <p className="text-slate-400 text-xs mt-1">Send USDC or ETH to your deposit address above (on Base chain)</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-400 font-bold">2</span>
                  </div>
                  <p className="text-white text-sm font-medium">Sync Balance</p>
                  <p className="text-slate-400 text-xs mt-1">Tap "Sync Deposits" to convert on-chain balance to Naira trading balance</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-400 font-bold">3</span>
                  </div>
                  <p className="text-white text-sm font-medium">Place Bets</p>
                  <p className="text-slate-400 text-xs mt-1">Use your NGN balance to bet on Nigerian legal case outcomes</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
                <p className="text-xs text-slate-400">Total Deposited</p>
                <p className="text-xl font-bold text-green-400">₦{(walletData.totalDeposited || 0).toLocaleString()}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
                <p className="text-xs text-slate-400">Total Withdrawn</p>
                <p className="text-xl font-bold text-red-400">₦{(walletData.totalWithdrawn || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/predictions" className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-green-500/50 transition group">
                <p className="text-2xl mb-2">🎯</p>
                <h3 className="font-semibold text-white group-hover:text-green-400 transition">Prediction Markets</h3>
                <p className="text-slate-400 text-xs mt-1">Bet on case outcomes with your balance</p>
              </Link>
              <Link href="/predictions/portfolio" className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-green-500/50 transition group">
                <p className="text-2xl mb-2">📊</p>
                <h3 className="font-semibold text-white group-hover:text-green-400 transition">My Portfolio</h3>
                <p className="text-slate-400 text-xs mt-1">View your positions and P&amp;L</p>
              </Link>
              <Link href="/predictions/leaderboard" className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-yellow-500/50 transition group">
                <p className="text-2xl mb-2">🏆</p>
                <h3 className="font-semibold text-white group-hover:text-yellow-400 transition">Leaderboard</h3>
                <p className="text-slate-400 text-xs mt-1">See top traders and rankings</p>
              </Link>
            </div>

            {/* Important Info */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-400 text-sm font-medium mb-1">⚠️ Important</p>
              <ul className="text-yellow-300/80 text-xs space-y-1">
                <li>• Only send assets on <strong>Base</strong> network (Chain ID: 8453). Other networks will result in loss.</li>
                <li>• USDC and ETH are supported. Balances are converted to Naira at live rates.</li>
                <li>• After sending, tap "Sync Deposits" to credit your trading balance.</li>
                <li>• Platform charges 2% fee on trades and 1.5% on bank withdrawals.</li>
              </ul>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
