'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  market_type: 'binary' | 'multiple_choice' | 'scalar';
  yes_price: number;
  no_price: number;
  total_volume: number;
  total_traders: number;
  liquidity_pool: number;
  resolution_date: string;
  ai_prediction: number | null;
  ai_confidence: number | null;
  image_url: string | null;
  status: string;
}

const CATEGORIES = [
  { id: 'all', name: 'All Markets', icon: '🌐' },
  { id: 'court_cases', name: 'Court Cases', icon: '⚖️' },
  { id: 'legal_reform', name: 'Legal Reform', icon: '📜' },
  { id: 'supreme_court', name: 'Supreme Court', icon: '🏛️' },
  { id: 'elections', name: 'Elections', icon: '🗳️' },
  { id: 'corporate', name: 'Corporate', icon: '🏢' },
  { id: 'criminal', name: 'Criminal', icon: '🚨' },
  { id: 'regulatory', name: 'Regulatory', icon: '📋' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
];

const DEMO_MARKETS: Market[] = [
  {
    id: '1',
    title: 'Will the Supreme Court uphold the Electoral Act Amendment by December 2024?',
    description: 'Resolution based on official Supreme Court ruling',
    category: 'supreme_court',
    market_type: 'binary',
    yes_price: 0.67,
    no_price: 0.33,
    total_volume: 2500000,
    total_traders: 1247,
    liquidity_pool: 500000,
    resolution_date: '2024-12-31',
    ai_prediction: 0.72,
    ai_confidence: 0.85,
    image_url: null,
    status: 'active',
  },
  {
    id: '2',
    title: 'Will the Anti-Money Laundering Bill pass in Q1 2025?',
    description: 'Based on National Assembly official records',
    category: 'legal_reform',
    market_type: 'binary',
    yes_price: 0.45,
    no_price: 0.55,
    total_volume: 1800000,
    total_traders: 892,
    liquidity_pool: 350000,
    resolution_date: '2025-03-31',
    ai_prediction: 0.48,
    ai_confidence: 0.78,
    image_url: null,
    status: 'active',
  },
  {
    id: '3',
    title: 'MTN Nigeria vs FG Tax Dispute - Will MTN win the appeal?',
    description: 'Court of Appeal ruling on the ₦2.3 trillion tax case',
    category: 'corporate',
    market_type: 'binary',
    yes_price: 0.38,
    no_price: 0.62,
    total_volume: 4200000,
    total_traders: 2156,
    liquidity_pool: 800000,
    resolution_date: '2025-06-30',
    ai_prediction: 0.35,
    ai_confidence: 0.82,
    image_url: null,
    status: 'active',
  },
  {
    id: '4',
    title: 'Will EFCC secure conviction in the ₦80B fraud case before July 2025?',
    description: 'Based on Federal High Court final judgment',
    category: 'criminal',
    market_type: 'binary',
    yes_price: 0.71,
    no_price: 0.29,
    total_volume: 3100000,
    total_traders: 1589,
    liquidity_pool: 600000,
    resolution_date: '2025-07-01',
    ai_prediction: 0.68,
    ai_confidence: 0.79,
    image_url: null,
    status: 'active',
  },
];

function formatVolume(volume: number): string {
  if (volume >= 1000000) return `₦${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `₦${(volume / 1000).toFixed(0)}K`;
  return `₦${volume}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MarketCard({ market }: { market: Market }) {
  const [showTrading, setShowTrading] = useState(false);
  const [shares, setShares] = useState(10);
  const [outcome, setOutcome] = useState<'yes' | 'no'>('yes');

  const yesPercent = Math.round(market.yes_price * 100);
  const noPercent = Math.round(market.no_price * 100);

  const potentialWin = outcome === 'yes'
    ? (shares / market.yes_price) - shares
    : (shares / market.no_price) - shares;

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 overflow-hidden group">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {CATEGORIES.find(c => c.id === market.category)?.icon || '📊'}
            </span>
            <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">
              {market.category.replace('_', ' ')}
            </span>
          </div>
          <span className="text-xs text-slate-400">Ends {formatDate(market.resolution_date)}</span>
        </div>

        <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-purple-300 transition-colors">
          {market.title}
        </h3>

        {market.ai_prediction && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-3 py-1.5 rounded-full border border-purple-500/30">
              <span className="text-xs font-medium text-purple-300">
                AI: {Math.round(market.ai_prediction * 100)}% YES
              </span>
              <span className="text-xs text-slate-400">
                ({Math.round((market.ai_confidence || 0) * 100)}% confident)
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <button
            onClick={() => { setOutcome('yes'); setShowTrading(true); }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
          >
            <span className="font-semibold text-emerald-400">YES</span>
            <div className="flex items-center gap-3">
              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${yesPercent}%` }} />
              </div>
              <span className="text-lg font-bold text-emerald-400 w-14 text-right">{yesPercent}¢</span>
            </div>
          </button>

          <button
            onClick={() => { setOutcome('no'); setShowTrading(true); }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all"
          >
            <span className="font-semibold text-red-400">NO</span>
            <div className="flex items-center gap-3">
              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" style={{ width: `${noPercent}%` }} />
              </div>
              <span className="text-lg font-bold text-red-400 w-14 text-right">{noPercent}¢</span>
            </div>
          </button>
        </div>

        {showTrading && (
          <div className="bg-slate-900/80 rounded-xl p-4 mb-4 border border-slate-600/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-300">
                Buy <span className={outcome === 'yes' ? 'text-emerald-400' : 'text-red-400'}>{outcome.toUpperCase()}</span> shares
              </span>
              <button onClick={() => setShowTrading(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setShares(Math.max(1, shares - 10))} className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold">-</button>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-10 rounded-lg bg-slate-700 text-center text-white font-semibold border-none focus:ring-2 focus:ring-purple-500"
              />
              <button onClick={() => setShares(shares + 10)} className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold">+</button>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
              <span>Potential profit:</span>
              <span className="text-emerald-400 font-semibold">+₦{potentialWin.toFixed(2)}</span>
            </div>

            <button className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
              outcome === 'yes'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'
                : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'
            }`}>
              Buy {outcome.toUpperCase()} for ₦{shares.toFixed(2)}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <span>{formatVolume(market.total_volume)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{market.total_traders.toLocaleString()} traders</span>
          </div>
          <Link href={`/predictions/${market.id}`} className="text-purple-400 hover:text-purple-300 font-medium">
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'newest' | 'ending_soon'>('volume');
  const [markets] = useState<Market[]>(DEMO_MARKETS);
  const [userBalance] = useState(50000);

  const filteredMarkets = markets.filter(market => {
    const matchesCategory = selectedCategory === 'all' || market.category === selectedCategory;
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (sortBy === 'volume') return b.total_volume - a.total_volume;
    if (sortBy === 'newest') return new Date(b.resolution_date).getTime() - new Date(a.resolution_date).getTime();
    if (sortBy === 'ending_soon') return new Date(a.resolution_date).getTime() - new Date(b.resolution_date).getTime();
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/favicon.png" alt="CaseWin AI" width={40} height={40} className="rounded-xl" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">CaseWin Predictions</h1>
                <p className="text-xs text-slate-400">AI-Powered Legal & Event Forecasting</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-sm">Balance:</span>
                <span className="text-emerald-400 font-bold">₦{userBalance.toLocaleString()}</span>
              </div>

              <nav className="hidden md:flex items-center gap-2">
                <Link href="/predictions/portfolio" className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all">Portfolio</Link>
                <Link href="/predictions/leaderboard" className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all">Leaderboard</Link>
                <Link href="/predictions/experts" className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all">Expert Predictors</Link>
                <Link href="/predictions/create" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium transition-all">+ Create Market</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">₦45.2M</p>
              <p className="text-sm text-slate-400">Total Volume</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">24.5K</p>
              <p className="text-sm text-slate-400">Active Traders</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">156</p>
              <p className="text-sm text-slate-400">Open Markets</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">87%</p>
              <p className="text-sm text-slate-400">AI Accuracy</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white"
          >
            <option value="volume">🔥 Highest Volume</option>
            <option value="ending_soon">⏰ Ending Soon</option>
            <option value="newest">✨ Newest</option>
          </select>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              <span>{category.icon}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMarkets.map(market => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-8 border border-purple-500/20">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Don’t see a market you want?</h2>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">Create your own market and earn fees from trading activity.</p>
            <Link href="/predictions/create" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold transition-all">
              Create New Market
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
