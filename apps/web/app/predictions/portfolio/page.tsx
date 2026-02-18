'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Position {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  purchaseDate: string;
}

interface Trade {
  id: string;
  marketTitle: string;
  type: 'buy' | 'sell';
  outcome: 'yes' | 'no';
  shares: number;
  price: number;
  total: number;
  timestamp: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions');
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage
    const loadData = () => {
      try {
        const savedBalance = localStorage.getItem('casewin_balance');
        setUserBalance(savedBalance ? parseFloat(savedBalance) : 50000);

        const savedPositions = localStorage.getItem('casewin_positions');
        if (savedPositions) {
          setPositions(JSON.parse(savedPositions));
        }

        const savedTrades = localStorage.getItem('casewin_trades');
        if (savedTrades) {
          setTrades(JSON.parse(savedTrades));
        }
      } catch (err) {
        console.error('Failed to load portfolio data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate totals
  const totalInvested = positions.reduce((sum, p) => sum + (p.shares * p.avgPrice), 0);
  const portfolioValue = userBalance + totalInvested;

  const handleSell = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    // Calculate sell value (simplified - assume same price)
    const sellValue = position.shares * position.avgPrice;

    // Update balance
    const newBalance = userBalance + sellValue;
    setUserBalance(newBalance);
    localStorage.setItem('casewin_balance', newBalance.toString());

    // Remove position
    const newPositions = positions.filter(p => p.id !== positionId);
    setPositions(newPositions);
    localStorage.setItem('casewin_positions', JSON.stringify(newPositions));

    // Add to trades
    const newTrade: Trade = {
      id: Date.now().toString(),
      marketTitle: position.marketTitle,
      type: 'sell',
      outcome: position.outcome,
      shares: position.shares,
      price: position.avgPrice,
      total: sellValue,
      timestamp: new Date().toISOString()
    };
    const newTrades = [newTrade, ...trades];
    setTrades(newTrades);
    localStorage.setItem('casewin_trades', JSON.stringify(newTrades));
  };

  const handleDeposit = () => {
    const amount = prompt('Enter deposit amount (₦):');
    if (amount && !isNaN(parseFloat(amount))) {
      const depositAmount = parseFloat(amount);
      const newBalance = userBalance + depositAmount;
      setUserBalance(newBalance);
      localStorage.setItem('casewin_balance', newBalance.toString());
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-purple-500 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/predictions" className="flex items-center gap-3">
              <Image src="/favicon.png" alt="CaseWin AI" width={40} height={40} className="rounded-xl" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  My Portfolio
                </h1>
                <p className="text-xs text-slate-400">Track your predictions</p>
              </div>
            </Link>

            <nav className="flex items-center gap-2">
              <Link href="/predictions" className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all">
                Markets
              </Link>
              <Link href="/predictions/leaderboard" className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all">
                Leaderboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Portfolio Overview */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Total Portfolio Value */}
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30">
            <p className="text-sm text-slate-400 mb-1">Portfolio Value</p>
            <p className="text-3xl font-bold text-white">₦{portfolioValue.toLocaleString()}</p>
          </div>

          {/* Cash Balance */}
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Cash Balance</p>
            <p className="text-3xl font-bold text-emerald-400">₦{userBalance.toLocaleString()}</p>
            <button 
              onClick={handleDeposit}
              className="mt-3 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium text-white"
            >
              + Deposit
            </button>
          </div>

          {/* Positions Value */}
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Positions Value</p>
            <p className="text-3xl font-bold text-white">₦{totalInvested.toFixed(2)}</p>
          </div>

          {/* Active Positions */}
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Active Positions</p>
            <p className="text-3xl font-bold text-white">{positions.length}</p>
            <p className="text-sm text-slate-400 mt-2">
              Across {new Set(positions.map(p => p.marketId)).size} markets
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700/50 pb-4">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'positions'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            📊 Open Positions ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            📜 Trade History ({trades.length})
          </button>
        </div>

        {/* Positions Table */}
        {activeTab === 'positions' && (
          <>
            {positions.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-white mb-2">No open positions</h3>
                <p className="text-slate-400 mb-6">Start trading to build your portfolio!</p>
                <Link 
                  href="/predictions"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium text-white transition-all"
                >
                  Browse Markets
                </Link>
              </div>
            ) : (
              <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Market</th>
                        <th className="text-center text-sm font-medium text-slate-400 px-4 py-4">Position</th>
                        <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Shares</th>
                        <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Avg Price</th>
                        <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Value</th>
                        <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Purchased</th>
                        <th className="text-center text-sm font-medium text-slate-400 px-4 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map(position => (
                        <tr key={position.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4">
                            <Link href={`/predictions/${position.marketId}`} className="text-white hover:text-purple-400 transition-colors line-clamp-2 max-w-xs">
                              {position.marketTitle}
                            </Link>
                          </td>
                          <td className="text-center px-4 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              position.outcome === 'yes'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {position.outcome.toUpperCase()}
                            </span>
                          </td>
                          <td className="text-right px-4 py-4 text-white font-medium">
                            {position.shares}
                          </td>
                          <td className="text-right px-4 py-4 text-slate-400">
                            {Math.round(position.avgPrice * 100)}¢
                          </td>
                          <td className="text-right px-4 py-4 text-white font-medium">
                            ₦{(position.shares * position.avgPrice).toFixed(2)}
                          </td>
                          <td className="text-right px-4 py-4 text-slate-400 text-sm">
                            {formatDate(position.purchaseDate)}
                          </td>
                          <td className="text-center px-4 py-4">
                            <button 
                              onClick={() => handleSell(position.id)}
                              className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white transition-colors"
                            >
                              Sell
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Trade History */}
        {activeTab === 'history' && (
          <>
            {trades.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                <div className="text-6xl mb-4">📜</div>
                <h3 className="text-xl font-semibold text-white mb-2">No trade history</h3>
                <p className="text-slate-400 mb-6">Your trades will appear here</p>
                <Link 
                  href="/predictions"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium text-white transition-all"
                >
                  Start Trading
                </Link>
              </div>
            ) : (
              <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Date</th>
                        <th className="text-left text-sm font-medium text-slate-400 px-4 py-4">Market</th>
                        <th className="text-center text-sm font-medium text-slate-400 px-4 py-4">Type</th>
                        <th className="text-center text-sm font-medium text-slate-400 px-4 py-4">Outcome</th>
                        <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Shares</th>
                        <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Price</th>
                        <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map(trade => (
                        <tr key={trade.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {formatDate(trade.timestamp)}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-white line-clamp-1 max-w-xs">
                              {trade.marketTitle}
                            </span>
                          </td>
                          <td className="text-center px-4 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              trade.type === 'buy'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {trade.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="text-center px-4 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              trade.outcome === 'yes'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {trade.outcome.toUpperCase()}
                            </span>
                          </td>
                          <td className="text-right px-4 py-4 text-white">
                            {trade.shares}
                          </td>
                          <td className="text-right px-4 py-4 text-slate-400">
                            {Math.round(trade.price * 100)}¢
                          </td>
                          <td className="text-right px-4 py-4 text-white font-medium">
                            ₦{trade.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
