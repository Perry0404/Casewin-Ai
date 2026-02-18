'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  totalProfit: number;
  winRate: number;
  totalTrades: number;
  marketsWon: number;
  streak: number;
  badge: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster';
  rankChange: number; // positive = moved up, negative = moved down
}

const TIER_COLORS = {
  bronze: 'from-amber-700 to-amber-600',
  silver: 'from-gray-400 to-gray-300',
  gold: 'from-yellow-500 to-yellow-400',
  platinum: 'from-cyan-400 to-cyan-300',
  diamond: 'from-blue-400 to-purple-400',
  master: 'from-purple-500 to-pink-500',
  grandmaster: 'from-red-500 via-orange-500 to-yellow-500',
};

const TIER_NAMES = {
  bronze: '🥉 Bronze',
  silver: '🥈 Silver',
  gold: '🥇 Gold',
  platinum: '💎 Platinum',
  diamond: '💠 Diamond',
  master: '👑 Master',
  grandmaster: '🏆 Grandmaster',
};

// Demo data
const DEMO_LEADERBOARD: LeaderboardUser[] = [
  {
    rank: 1,
    userId: '1',
    username: 'LegalEagle_NG',
    avatar: null,
    totalProfit: 2450000,
    winRate: 78.5,
    totalTrades: 342,
    marketsWon: 89,
    streak: 12,
    badge: '🦅',
    tier: 'grandmaster',
    rankChange: 0
  },
  {
    rank: 2,
    userId: '2',
    username: 'SupremePredictor',
    avatar: null,
    totalProfit: 1890000,
    winRate: 75.2,
    totalTrades: 289,
    marketsWon: 76,
    streak: 8,
    badge: '⚖️',
    tier: 'master',
    rankChange: 2
  },
  {
    rank: 3,
    userId: '3',
    username: 'CryptoLawyer',
    avatar: null,
    totalProfit: 1650000,
    winRate: 72.8,
    totalTrades: 256,
    marketsWon: 68,
    streak: 5,
    badge: '💰',
    tier: 'master',
    rankChange: -1
  },
  {
    rank: 4,
    userId: '4',
    username: 'NaijaForecaster',
    avatar: null,
    totalProfit: 1420000,
    winRate: 71.3,
    totalTrades: 312,
    marketsWon: 72,
    streak: 7,
    badge: '🇳🇬',
    tier: 'diamond',
    rankChange: 1
  },
  {
    rank: 5,
    userId: '5',
    username: 'CaseMaster2024',
    avatar: null,
    totalProfit: 1180000,
    winRate: 69.8,
    totalTrades: 198,
    marketsWon: 54,
    streak: 4,
    badge: '📚',
    tier: 'diamond',
    rankChange: -2
  },
  {
    rank: 6,
    userId: '6',
    username: 'ElectionOracle',
    avatar: null,
    totalProfit: 980000,
    winRate: 68.5,
    totalTrades: 167,
    marketsWon: 45,
    streak: 6,
    badge: '🗳️',
    tier: 'platinum',
    rankChange: 3
  },
  {
    rank: 7,
    userId: '7',
    username: 'LagosLawWiz',
    avatar: null,
    totalProfit: 875000,
    winRate: 67.2,
    totalTrades: 234,
    marketsWon: 58,
    streak: 3,
    badge: '🏛️',
    tier: 'platinum',
    rankChange: 0
  },
  {
    rank: 8,
    userId: '8',
    username: 'AbujaAnalyst',
    avatar: null,
    totalProfit: 720000,
    winRate: 65.8,
    totalTrades: 189,
    marketsWon: 42,
    streak: 5,
    badge: '📊',
    tier: 'gold',
    rankChange: -1
  },
  {
    rank: 9,
    userId: '9',
    username: 'CourtWatcher_NG',
    avatar: null,
    totalProfit: 645000,
    winRate: 64.3,
    totalTrades: 156,
    marketsWon: 38,
    streak: 2,
    badge: '👀',
    tier: 'gold',
    rankChange: 4
  },
  {
    rank: 10,
    userId: '10',
    username: 'JudgmentDay',
    avatar: null,
    totalProfit: 580000,
    winRate: 63.1,
    totalTrades: 201,
    marketsWon: 47,
    streak: 4,
    badge: '⚡',
    tier: 'gold',
    rankChange: -2
  },
];

function formatProfit(amount: number): string {
  if (amount >= 1000000) {
    return `₦${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `₦${(amount / 1000).toFixed(0)}K`;
  }
  return `₦${amount}`;
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('all_time');
  const [leaderboard] = useState<LeaderboardUser[]>(DEMO_LEADERBOARD);
  
  // Calculate user's rank (demo)
  const userRank = 156;
  const userProfit = 45000;
  const userWinRate = 58.3;

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
                  Leaderboard
                </h1>
                <p className="text-xs text-slate-400">Top Predictors</p>
              </div>
            </Link>
            
            <nav className="flex items-center gap-2">
              <Link href="/predictions" className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all">
                Markets
              </Link>
              <Link href="/predictions/portfolio" className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all">
                Portfolio
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Your Stats Card */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
                #{userRank}
              </div>
              <div>
                <p className="text-slate-400 text-sm">Your Ranking</p>
                <p className="text-white text-xl font-bold">You&apos;re in the top 15%!</p>
                <p className="text-sm text-slate-400">Keep trading to climb the ranks</p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">+{formatProfit(userProfit)}</p>
                <p className="text-sm text-slate-400">Total Profit</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{userWinRate}%</p>
                <p className="text-sm text-slate-400">Win Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">🥈 Silver</p>
                <p className="text-sm text-slate-400">Current Tier</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Timeframe Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'daily', label: '24h' },
            { id: 'weekly', label: 'Week' },
            { id: 'monthly', label: 'Month' },
            { id: 'all_time', label: 'All Time' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimeframe(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                timeframe === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* 2nd Place */}
          <div className="order-1 md:order-1">
            {leaderboard[1] && (
              <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50 text-center mt-8 md:mt-8">
                <div className="relative inline-block mb-4">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${TIER_COLORS[leaderboard[1].tier]} flex items-center justify-center text-4xl`}>
                    {leaderboard[1].badge}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-sm border-4 border-slate-800">
                    2
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{leaderboard[1].username}</h3>
                <p className="text-sm text-slate-400 mb-3">{TIER_NAMES[leaderboard[1].tier]}</p>
                <p className="text-2xl font-bold text-emerald-400">+{formatProfit(leaderboard[1].totalProfit)}</p>
                <p className="text-sm text-slate-400">{leaderboard[1].winRate}% win rate</p>
              </div>
            )}
          </div>
          
          {/* 1st Place */}
          <div className="order-0 md:order-2">
            {leaderboard[0] && (
              <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-2xl p-6 border border-yellow-500/30 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl">👑</div>
                <div className="relative inline-block mb-4 mt-4">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${TIER_COLORS[leaderboard[0].tier]} flex items-center justify-center text-5xl animate-pulse`}>
                    {leaderboard[0].badge}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold border-4 border-slate-800">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{leaderboard[0].username}</h3>
                <p className="text-sm text-yellow-400 mb-3">{TIER_NAMES[leaderboard[0].tier]}</p>
                <p className="text-3xl font-bold text-emerald-400">+{formatProfit(leaderboard[0].totalProfit)}</p>
                <p className="text-sm text-slate-400">{leaderboard[0].winRate}% win rate</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-400 text-xs font-medium">
                    🔥 {leaderboard[0].streak} win streak
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* 3rd Place */}
          <div className="order-2 md:order-3">
            {leaderboard[2] && (
              <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50 text-center mt-8 md:mt-12">
                <div className="relative inline-block mb-4">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${TIER_COLORS[leaderboard[2].tier]} flex items-center justify-center text-4xl`}>
                    {leaderboard[2].badge}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold text-sm border-4 border-slate-800">
                    3
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{leaderboard[2].username}</h3>
                <p className="text-sm text-slate-400 mb-3">{TIER_NAMES[leaderboard[2].tier]}</p>
                <p className="text-2xl font-bold text-emerald-400">+{formatProfit(leaderboard[2].totalProfit)}</p>
                <p className="text-sm text-slate-400">{leaderboard[2].winRate}% win rate</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Full Leaderboard Table */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Rank</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-4">Trader</th>
                  <th className="text-center text-sm font-medium text-slate-400 px-4 py-4">Tier</th>
                  <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Profit</th>
                  <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Win Rate</th>
                  <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Trades</th>
                  <th className="text-right text-sm font-medium text-slate-400 px-4 py-4">Markets Won</th>
                  <th className="text-center text-sm font-medium text-slate-400 px-4 py-4">Streak</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user, index) => (
                  <tr key={user.userId} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {user.rank}
                        </span>
                        {user.rankChange !== 0 && (
                          <span className={`text-xs ${user.rankChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {user.rankChange > 0 ? `↑${user.rankChange}` : `↓${Math.abs(user.rankChange)}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${TIER_COLORS[user.tier]} flex items-center justify-center text-lg`}>
                          {user.badge}
                        </div>
                        <span className="text-white font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td className="text-center px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${TIER_COLORS[user.tier]} text-white`}>
                        {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                      </span>
                    </td>
                    <td className="text-right px-4 py-4 text-emerald-400 font-bold">
                      +{formatProfit(user.totalProfit)}
                    </td>
                    <td className="text-right px-4 py-4 text-white">
                      {user.winRate}%
                    </td>
                    <td className="text-right px-4 py-4 text-slate-400">
                      {user.totalTrades}
                    </td>
                    <td className="text-right px-4 py-4 text-slate-400">
                      {user.marketsWon}
                    </td>
                    <td className="text-center px-4 py-4">
                      {user.streak > 0 && (
                        <span className="px-2 py-1 bg-orange-500/20 rounded-full text-orange-400 text-xs font-medium">
                          🔥 {user.streak}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Tier Explanation */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-6">Ranking Tiers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(TIER_NAMES).map(([tier, name]) => (
              <div 
                key={tier} 
                className={`p-4 rounded-xl bg-gradient-to-br ${TIER_COLORS[tier as keyof typeof TIER_COLORS]} bg-opacity-20 border border-slate-700/50 text-center`}
              >
                <p className="text-2xl mb-1">{name.split(' ')[0]}</p>
                <p className="text-sm text-white font-medium capitalize">{tier}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* How to Earn Points */}
        <div className="mt-12 bg-slate-800/40 rounded-2xl p-8 border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-6">How to Climb the Leaderboard</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Make Profits</h3>
              <p className="text-slate-400 text-sm">Your total profit determines your ranking. Buy low, sell high!</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Win Markets</h3>
              <p className="text-slate-400 text-sm">Correctly predict market outcomes to boost your win rate and tier.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔥</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Build Streaks</h3>
              <p className="text-slate-400 text-sm">Consecutive wins earn you streak bonuses and special badges.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
