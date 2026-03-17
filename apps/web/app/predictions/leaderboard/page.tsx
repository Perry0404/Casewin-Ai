'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  balance: number;
  totalTrades: number;
  totalWins: number;
  winRate: number;
  streakCount: number;
  bestStreak: number;
  xpPoints: number;
  rankTitle: string;
  rankBadge: string;
  nextRankTitle: string | null;
  nextRankXP: number | null;
  rankProgress: number;
  profitLoss: number;
  isOnFire: boolean;
}

interface RankInfo {
  title: string;
  minXP: number;
  badge: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [ranks, setRanks] = useState<RankInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRanks, setShowRanks] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/predictions/leaderboard');
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setMyRank(data.myRank || null);
      setRanks(data.ranks || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Trophy Leaderboard
              </h1>
              <p className="text-xs text-slate-400">Top prediction traders</p>
            </div>
            <div className="flex gap-2">
              <Link href="/predictions" className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all">
                Markets
              </Link>
              <Link href="/predictions/portfolio" className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all">
                Portfolio
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {myRank && (
          <div className="mb-6 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-purple-300">#{myRank.rank}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{myRank.rankBadge}</span>
                    <span className="font-bold text-white">{myRank.rankTitle}</span>
                    {myRank.isOnFire && <span className="text-lg animate-pulse">Fire</span>}
                  </div>
                  <p className="text-slate-400 text-sm">{myRank.displayName} - {myRank.xpPoints.toLocaleString()} XP</p>
                  {myRank.nextRankTitle && (
                    <div className="mt-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Next: {myRank.nextRankTitle} ({myRank.nextRankXP?.toLocaleString()} XP)</span>
                      </div>
                      <div className="w-48 h-1.5 bg-slate-700 rounded-full mt-1">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all" style={{ width: `${Math.min(100, myRank.rankProgress)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{myRank.totalTrades}</p>
                  <p className="text-xs text-slate-400">Trades</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{myRank.winRate}%</p>
                  <p className="text-xs text-slate-400">Win Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">
                    {myRank.streakCount > 0 ? myRank.streakCount : myRank.bestStreak || 0}
                  </p>
                  <p className="text-xs text-slate-400">{myRank.streakCount > 0 ? 'Streak' : 'Best'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => setShowRanks(!showRanks)} className="mb-4 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2">
          {showRanks ? 'Hide' : 'Show'} Rank Tiers
        </button>

        {showRanks && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ranks.map((r) => (
              <div key={r.title} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 text-center">
                <div className="text-2xl mb-1">{r.badge}</div>
                <p className="font-bold text-white text-sm">{r.title}</p>
                <p className="text-xs text-slate-400">{r.minXP.toLocaleString()} XP</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700/50 bg-slate-800/50">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Trader</div>
            <div className="col-span-2 text-right">XP</div>
            <div className="col-span-2 text-right">Win Rate</div>
            <div className="col-span-2 text-right">Streak</div>
            <div className="col-span-2 text-right">Trades</div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-4xl mb-3">Trophy</p>
              <p className="font-bold text-white mb-1">No traders yet</p>
              <p className="text-sm">Be the first to trade and claim #1!</p>
              <Link href="/predictions" className="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-all">
                Start Trading
              </Link>
            </div>
          ) : (
            leaderboard.map((entry, idx) => (
              <div key={entry.userId} className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-slate-700/30 hover:bg-slate-700/20 transition-all ${myRank?.userId === entry.userId ? 'bg-purple-500/10 border-purple-500/30' : ''} ${idx < 3 ? 'bg-gradient-to-r ' + (idx === 0 ? 'from-yellow-500/10' : idx === 1 ? 'from-gray-400/10' : 'from-orange-400/10') + ' to-transparent' : ''}`}>
                <div className="col-span-1">
                  {idx === 0 ? 'Gold' : idx === 1 ? 'Silver' : idx === 2 ? 'Bronze' : (
                    <span className="text-slate-400 font-mono text-sm">{entry.rank}</span>
                  )}
                </div>
                <div className="col-span-3 flex items-center gap-2 min-w-0">
                  <span>{entry.rankBadge}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{entry.displayName}</p>
                    <p className="text-xs text-slate-500">{entry.rankTitle}</p>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-sm font-bold text-purple-300">{entry.xpPoints.toLocaleString()}</p>
                </div>
                <div className="col-span-2 text-right">
                  <p className={`text-sm font-bold ${entry.winRate >= 60 ? 'text-green-400' : entry.winRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{entry.winRate}%</p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-sm text-orange-400">{entry.streakCount > 0 ? `${entry.streakCount} fire` : `${entry.bestStreak} best`}</p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-sm text-slate-300">{entry.totalTrades}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 bg-gradient-to-br from-orange-600/10 to-red-600/10 rounded-2xl p-6 border border-orange-500/20">
          <h3 className="text-lg font-bold text-orange-400 mb-3">Streak Rewards</h3>
          <p className="text-sm text-slate-400 mb-4">Win consecutive predictions to earn bonus XP and multipliers!</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { streak: 3, title: 'Hot Streak', xp: '+100 XP', mult: '1.2x' },
              { streak: 5, title: 'Lightning', xp: '+300 XP', mult: '1.5x' },
              { streak: 7, title: 'Legendary', xp: '+700 XP', mult: '2x' },
              { streak: 10, title: 'Diamond', xp: '+1500 XP', mult: '3x' },
              { streak: 15, title: 'Oracle', xp: '+5000 XP', mult: '5x' },
            ].map((s) => (
              <div key={s.streak} className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/50">
                <p className="text-sm font-bold text-white mb-1">{s.title}</p>
                <p className="text-xs text-slate-400">{s.streak}+ wins</p>
                <p className="text-xs text-green-400">{s.xp}</p>
                <p className="text-xs text-yellow-400">{s.mult}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
