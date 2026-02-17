'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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

// Demo markets for testing
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
    status: 'active'
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
    status: 'active'
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
    status: 'active'
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
    status: 'active'
  },
  {
    id: '5',
    title: 'Gubernatorial Election Petition - Will the tribunal ruling be overturned?',
    description: 'Supreme Court final ruling on Kano State governorship',
    category: 'elections',
    market_type: 'binary',
    yes_price: 0.52,
    no_price: 0.48,
    total_volume: 5600000,
    total_traders: 3421,
    liquidity_pool: 1200000,
    resolution_date: '2025-02-28',
    ai_prediction: 0.55,
    ai_confidence: 0.71,
    image_url: null,
    status: 'active'
  },
  {
    id: '6',
    title: 'Will CBN reverse the cryptocurrency ban by end of 2025?',
    description: 'Based on official CBN circular or policy statement',
    category: 'regulatory',
    market_type: 'binary',
    yes_price: 0.23,
    no_price: 0.77,
    total_volume: 8900000,
    total_traders: 5672,
    liquidity_pool: 2000000,
    resolution_date: '2025-12-31',
    ai_prediction: 0.28,
    ai_confidence: 0.88,
    image_url: null,
    status: 'active'
  },
  {
    id: '7',
    title: 'AFCON 2025 - Will Nigeria win the tournament?',
    description: 'Based on official CAF results',
    category: 'sports',
    market_type: 'binary',
    yes_price: 0.31,
    no_price: 0.69,
    total_volume: 12500000,
    total_traders: 8934,
    liquidity_pool: 3500000,
    resolution_date: '2025-02-15',
    ai_prediction: 0.29,
    ai_confidence: 0.65,
    image_url: null,
    status: 'active'
  },
  {
    id: '8',
    title: 'Nollywood vs Hollywood: Will a Nigerian film win an Oscar by 2026?',
    description: 'Academy Awards official results',
    category: 'entertainment',
    market_type: 'binary',
    yes_price: 0.12,
    no_price: 0.88,
    total_volume: 950000,
    total_traders: 678,
    liquidity_pool: 150000,
    resolution_date: '2026-03-01',
    ai_prediction: 0.15,
    ai_confidence: 0.72,
    image_url: null,
    status: 'active'
  },
];

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `₦${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `₦${(volume / 1000).toFixed(0)}K`;
  }
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
      {/* Header */}
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
          <span className="text-xs text-slate-400">
            Ends {formatDate(market.resolution_date)}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-purple-300 transition-colors">
          {market.title}
        </h3>
        
        {/* AI Prediction Badge */}
        {market.ai_prediction && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-3 py-1.5 rounded-full border border-purple-500/30">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium text-purple-300">
                AI: {Math.round(market.ai_prediction * 100)}% YES
              </span>
              <span className="text-xs text-slate-400">
                ({Math.round((market.ai_confidence || 0) * 100)}% confident)
              </span>
            </div>
          </div>
        )}
        
        {/* Price Bars */}
        <div className="space-y-2 mb-4">
          <button 
            onClick={() => { setOutcome('yes'); setShowTrading(true); }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
          >
            <span className="font-semibold text-emerald-400">YES</span>
            <div className="flex items-center gap-3">
              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${yesPercent}%` }}
                />
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
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                  style={{ width: `${noPercent}%` }}
                />
              </div>
              <span className="text-lg font-bold text-red-400 w-14 text-right">{noPercent}¢</span>
            </div>
          </button>
        </div>
        
        {/* Quick Trading Panel */}
        {showTrading && (
          <div className="bg-slate-900/80 rounded-xl p-4 mb-4 border border-slate-600/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-300">
                Buy <span className={outcome === 'yes' ? 'text-emerald-400' : 'text-red-400'}>{outcome.toUpperCase()}</span> shares
              </span>
              <button onClick={() => setShowTrading(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <button 
                onClick={() => setShares(Math.max(1, shares - 10))}
                className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
              >
                -
              </button>
              <input 
                type="number"
                value={shares}
                onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-10 rounded-lg bg-slate-700 text-center text-white font-semibold border-none focus:ring-2 focus:ring-purple-500"
              />
              <button 
                onClick={() => setShares(shares + 10)}
                className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
              >
                +
              </button>
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
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>{formatVolume(market.total_volume)}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{market.total_traders.toLocaleString()} traders</span>
          </div>
          <Link 
            href={`/predictions/${market.id}`}
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
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
  const [markets, setMarkets] = useState<Market[]>(DEMO_MARKETS);
  const [userBalance, setUserBalance] = useState(50000); // Demo balance
  
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
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/favicon.png" alt="CaseWin AI" width={40} height={40} className="rounded-xl" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  CaseWin Predictions
                </h1>
                <p className="text-xs text-slate-400">AI-Powered Legal & Event Forecasting</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              {/* Balance */}
              <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-sm">Balance:</span>
                <span className="text-emerald-400 font-bold">₦{userBalance.toLocaleString()}</span>
                <button className="ml-2 px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-medium">
                  + Add
                </button>
              </div>
              
              {/* Nav Links */}
              <nav className="hidden md:flex items-center gap-2">
                <Link href="/predictions/portfolio" className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all">
                  Portfolio
                </Link>
                <Link href="/predictions/leaderboard" className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all">
                  Leaderboard
                </Link>
                <Link href="/predictions/create" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all">
                  + Create Market
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Stats */}
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
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
          >
            <option value="volume">🔥 Highest Volume</option>
            <option value="ending_soon">⏰ Ending Soon</option>
            <option value="newest">✨ Newest</option>
          </select>
        </div>
        
        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
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
        
        {/* Markets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMarkets.map(market => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
        
        {sortedMarkets.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No markets found</h3>
            <p className="text-slate-400">Try adjusting your search or filters</p>
          </div>
        )}
        
        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-8 border border-purple-500/20">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Don't see a market you want?
            </h2>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Create your own prediction market on any legal case, policy change, or event. 
              Our AI will provide forecasts and you can earn fees from trading activity.
            </p>
            <Link 
              href="/predictions/create"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Market
            </Link>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/favicon.png" alt="CaseWin AI" width={24} height={24} className="rounded" />
              <span className="text-slate-400">© 2024 CaseWin AI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-slate-400 hover:text-white text-sm">Terms</Link>
              <Link href="/privacy" className="text-slate-400 hover:text-white text-sm">Privacy</Link>
              <Link href="/faq" className="text-slate-400 hover:text-white text-sm">FAQ</Link>
              <Link href="/help" className="text-slate-400 hover:text-white text-sm">Help</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
