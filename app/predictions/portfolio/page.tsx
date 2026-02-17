'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Position {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
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

// Demo data
const DEMO_POSITIONS: Position[] = [
  {
    id: '1',
    marketId: '1',
    marketTitle: 'Will the Supreme Court uphold the Electoral Act Amendment by December 2024?',
    outcome: 'yes',
    shares: 250,
    avgPrice: 0.52,
    currentPrice: 0.67,
    investedAmount: 130,
    currentValue: 167.5,
    profitLoss: 37.5,
    profitLossPercent: 28.85
  },
  {
    id: '2',
    marketId: '3',
    marketTitle: 'MTN Nigeria vs FG Tax Dispute - Will MTN win the appeal?',
    outcome: 'no',
    shares: 500,
    avgPrice: 0.45,
    currentPrice: 0.62,
    investedAmount: 225,
    currentValue: 310,
    profitLoss: 85,
    profitLossPercent: 37.78
  },
  {
    id: '3',
    marketId: '4',
    marketTitle: 'Will EFCC secure conviction in the ₦80B fraud case before July 2025?',
    outcome: 'yes',
    shares: 100,
    avgPrice: 0.78,
    currentPrice: 0.71,
    investedAmount: 78,
    currentValue: 71,
    profitLoss: -7,
    profitLossPercent: -8.97
  },
  {
    id: '4',
    marketId: '6',
    marketTitle: 'Will CBN reverse the cryptocurrency ban by end of 2025?',
    outcome: 'yes',
    shares: 1000,
    avgPrice: 0.15,
    currentPrice: 0.23,
    investedAmount: 150,
    currentValue: 230,
    profitLoss: 80,
    profitLossPercent: 53.33
  },
];

const DEMO_TRADES: Trade[] = [
  {
    id: '1',
    marketTitle: 'Will CBN reverse the cryptocurrency ban by end of 2025?',
    type: 'buy',
    outcome: 'yes',
    shares: 500,
    price: 0.15,
    total: 75,
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    marketTitle: 'MTN Nigeria vs FG Tax Dispute - Will MTN win the appeal?',
    type: 'buy',
    outcome: 'no',
    shares: 500,
    price: 0.45,
    total: 225,
    timestamp: '2024-01-14T15:45:00Z'
  },
  {
    id: '3',
    marketTitle: 'Will the Supreme Court uphold the Electoral Act Amendment by December 2024?',
    type: 'buy',
    outcome: 'yes',
    shares: 250,
    price: 0.52,
    total: 130,
    timestamp: '2024-01-12T09:20:00Z'
  },
  {
    id: '4',
    marketTitle: 'Will CBN reverse the cryptocurrency ban by end of 2025?',
    type: 'buy',
    outcome: 'yes',
    shares: 500,
    price: 0.15,
    total: 75,
    timestamp: '2024-01-10T14:15:00Z'
  },
];

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
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'watchlist'>('positions');
  const [positions] = useState<Position[]>(DEMO_POSITIONS);
  const [trades] = useState<Trade[]>(DEMO_TRADES);
  
  // Calculate totals
  const totalInvested = positions.reduce((sum, p) => sum + p.investedAmount, 0);
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalProfitLoss = positions.reduce((sum, p) => sum + p.profitLoss, 0);
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
  
  const userBalance = 50000;
  const portfolioValue = userBalance + totalValue;

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
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-sm font-medium ${totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}₦{totalProfitLoss.toFixed(2)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                totalProfitLoss >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
              </span>
            </div>
          </div>
          
          {/* Cash Balance */}
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Cash Balance</p>
            <p className="text-3xl font-bold text-emerald-400">₦{userBalance.toLocaleString()}</p>
            <button className="mt-3 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium text-white">
              + Deposit
            </button>
          </div>
          
          {/* Positions Value */}
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Positions Value</p>
            <p className="text-3xl font-bold text-white">₦{totalValue.toFixed(2)}</p>
            <p className="text-sm text-slate-400 mt-2">
              Invested: ₦{totalInvested.toFixed(2)}
            </p>
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
            📊 Open Positions
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            📜 Trade History
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'watchlist'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            ⭐ Watchlist
          </button>
        </div>
        
        {/* Positions Table */}
        {activeTab === 'positions' && (
          <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Market</th>
                    <th className="text-center text-sm font-medium text-slate-400 px-4 py-4">Position</th>
                    <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Shares</th>
                    <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Avg Price</th>
                    <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Current</th>
                    <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Value</th>
                    <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">P&L</th>
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
                      <td className="text-right px-4 py-4 text-white">
                        {Math.round(position.currentPrice * 100)}¢
                      </td>
                      <td className="text-right px-4 py-4 text-white font-medium">
                        ₦{position.currentValue.toFixed(2)}
                      </td>
                      <td className="text-right px-4 py-4">
                        <div className={`font-medium ${position.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {position.profitLoss >= 0 ? '+' : ''}₦{position.profitLoss.toFixed(2)}
                          <span className="text-xs ml-1">
                            ({position.profitLoss >= 0 ? '+' : ''}{position.profitLossPercent.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td className="text-center px-4 py-4">
                        <button className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white transition-colors">
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
        
        {/* Trade History */}
        {activeTab === 'history' && (
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
        
        {/* Watchlist */}
        {activeTab === 'watchlist' && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-white mb-2">Your watchlist is empty</h3>
            <p className="text-slate-400 mb-6">Add markets to your watchlist to track them here</p>
            <Link 
              href="/predictions" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium text-white transition-all"
            >
              Browse Markets
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
