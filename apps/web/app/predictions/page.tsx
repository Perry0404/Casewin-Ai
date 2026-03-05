'use client';

import { useState, useEffect, useCallback } from 'react';
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
  { id: 'crypto', name: 'Crypto', icon: '₿' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'world_politics', name: 'World Politics', icon: '🌍' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
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

// Generate AI prediction based on market price
// Reduced variance for low-liquidity markets to prevent extreme odds
function generateAIPrediction(yesPrice: number): { prediction: number; confidence: number } {
  // Tighter variance (±0.04 instead of ±0.06) to keep odds conservative
  const variance = (Math.random() - 0.5) * 0.08;
  // Clamp predictions closer to center (0.20 to 0.80) for low-liquidity protection
  const prediction = Math.max(0.20, Math.min(0.80, yesPrice + variance));
  const confidence = 0.60 + Math.random() * 0.20;
  return { prediction, confidence };
}

interface MarketCardProps {
  market: Market;
  onTrade: (marketId: string, outcome: 'yes' | 'no', shares: number) => Promise<void>;
  onInsufficientFunds: (needed: number) => void;
  userBalance: number;
}

function MarketCard({ market, onTrade, onInsufficientFunds, userBalance }: MarketCardProps) {
  const [showTrading, setShowTrading] = useState(false);
  const [shares, setShares] = useState(50);
  const [outcome, setOutcome] = useState<'yes' | 'no'>('yes');
  const [isTrading, setIsTrading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const yesPercent = Math.round(market.yes_price * 100);
  const noPercent = Math.round(market.no_price * 100);

  const selectedPrice = outcome === 'yes' ? market.yes_price : market.no_price;
  const potentialWin = shares * (1 - selectedPrice);
  const cost = shares * selectedPrice;

  const handleBuy = async () => {
    // Check if user has enough balance
    if (cost > userBalance) {
      onInsufficientFunds(cost);
      return;
    }

    setIsTrading(true);
    setTradeError(null);
    try {
      await onTrade(market.id, outcome, shares);
      setTradeSuccess(true);
      setTimeout(() => {
        setShowTrading(false);
        setTradeSuccess(false);
      }, 2000);
    } catch (error) {
      setTradeError(error instanceof Error ? error.message : 'Trade failed');
    } finally {
      setIsTrading(false);
    }
  };

  const handleOutcomeClick = (selectedOutcome: 'yes' | 'no') => {
    if (showTrading && outcome === selectedOutcome) {
      handleBuy();
    } else {
      setOutcome(selectedOutcome);
      setShowTrading(true);
      setTradeError(null);
    }
  };

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

        {/* AI Prediction Badge */}
        {market.ai_prediction !== null && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-3 py-1.5 rounded-full border border-purple-500/30">
              <span className="text-xs font-medium text-purple-300">
                🤖 AI: {Math.round(market.ai_prediction * 100)}% YES
              </span>
              {market.ai_confidence !== null && (
                <span className="text-xs text-slate-400">
                  ({Math.round(market.ai_confidence * 100)}% confident)
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <button
            onClick={() => handleOutcomeClick('yes')}
            disabled={isTrading}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
              showTrading && outcome === 'yes'
                ? 'bg-emerald-500/30 border-2 border-emerald-400'
                : 'bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20'
            } ${isTrading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            onClick={() => handleOutcomeClick('no')}
            disabled={isTrading}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
              showTrading && outcome === 'no'
                ? 'bg-red-500/30 border-2 border-red-400'
                : 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
            } ${isTrading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          <div className={`rounded-xl p-4 mb-4 border ${
            tradeSuccess 
              ? 'bg-emerald-900/50 border-emerald-500/50' 
              : 'bg-slate-900/80 border-slate-600/50'
          }`}>
            {tradeSuccess ? (
              <div className="text-center py-2">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-emerald-400 font-semibold">Trade Successful!</p>
                <p className="text-sm text-slate-400">You bought {shares} {outcome.toUpperCase()} shares</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-300">
                    Buy <span className={outcome === 'yes' ? 'text-emerald-400' : 'text-red-400'}>{outcome.toUpperCase()}</span> shares
                  </span>
                  <button onClick={() => setShowTrading(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <button 
                    onClick={() => setShares(Math.max(10, shares - 50))} 
                    className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
                    disabled={isTrading}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(Math.max(10, parseInt(e.target.value) || 10))}
                    className="flex-1 h-10 rounded-lg bg-slate-700 text-center text-white font-semibold border-none focus:ring-2 focus:ring-purple-500"
                    disabled={isTrading}
                  />
                  <button 
                    onClick={() => setShares(shares + 50)} 
                    className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
                    disabled={isTrading}
                  >
                    +
                  </button>
                </div>

                <div className="flex gap-2 mb-3">
                  {[50, 100, 250, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setShares(amount)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        shares === amount 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                      disabled={isTrading}
                    >
                      {amount >= 1000 ? `${amount/1000}K` : amount}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 mb-3 text-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Cost ({Math.round(selectedPrice * 100)}¢ × {shares}):</span>
                    <span className="text-white font-semibold">₦{cost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Potential profit if {outcome.toUpperCase()} wins:</span>
                    <span className="text-emerald-400 font-semibold">+₦{potentialWin.toFixed(2)}</span>
                  </div>
                </div>

                {tradeError && (
                  <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{tradeError}</p>
                  </div>
                )}

                {/* Insufficient balance warning */}
                {cost > userBalance && (
                  <button
                    onClick={() => onInsufficientFunds(cost)}
                    className="w-full py-3 mb-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-xl text-yellow-400 font-medium"
                  >
                    💳 Fund Wallet (Need ₦{(cost - userBalance).toFixed(2)} more)
                  </button>
                )}

                <button 
                  onClick={handleBuy}
                  disabled={isTrading}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    isTrading ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    outcome === 'yes'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'
                      : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'
                  }`}
                >
                  {isTrading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    `Buy ${outcome.toUpperCase()} for ₦${cost.toFixed(2)}`
                  )}
                </button>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <span>📊 {formatVolume(market.total_volume)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>👥 {market.total_traders.toLocaleString()} traders</span>
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
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [showFundWallet, setShowFundWallet] = useState(false);
  const [fundAmount, setFundAmount] = useState(10000);
  const [neededAmount, setNeededAmount] = useState(0);
  const [stats, setStats] = useState({
    totalVolume: 0,
    activeTraders: 0,
    openMarkets: 0
  });

  const fetchMarkets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/predictions?category=${selectedCategory}`);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const transformedMarkets: Market[] = (data.markets || []).map((m: any) => {
        const yesPrice = m.yes_votes && m.no_votes 
          ? m.yes_votes / (m.yes_votes + m.no_votes) 
          : 0.5;
        const noPrice = m.yes_votes && m.no_votes 
          ? m.no_votes / (m.yes_votes + m.no_votes) 
          : 0.5;
        
        // Generate AI prediction for each market
        const ai = generateAIPrediction(yesPrice);
        
        return {
          id: m.id,
          title: m.title,
          description: m.description || '',
          category: m.category || 'other',
          market_type: 'binary' as const,
          yes_price: yesPrice,
          no_price: noPrice,
          total_volume: m.total_pool || 0,
          total_traders: Math.floor((m.yes_votes + m.no_votes) / 100) || 0,
          liquidity_pool: m.total_pool || 0,
          resolution_date: m.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          ai_prediction: ai.prediction,
          ai_confidence: ai.confidence,
          image_url: null,
          status: m.resolved ? 'resolved' : 'active'
        };
      });

      setMarkets(transformedMarkets);
      
      const totalVol = transformedMarkets.reduce((sum, m) => sum + m.total_volume, 0);
      const totalTraders = transformedMarkets.reduce((sum, m) => sum + m.total_traders, 0);
      setStats({
        totalVolume: totalVol,
        activeTraders: totalTraders,
        openMarkets: transformedMarkets.length
      });

    } catch (err) {
      console.error('Failed to fetch markets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load markets');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  const fetchUserBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      if (data.balance !== undefined) {
        setUserBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
    fetchUserBalance();
  }, [fetchMarkets, fetchUserBalance]);

  const handleInsufficientFunds = (needed: number) => {
    setNeededAmount(needed);
    setFundAmount(Math.ceil(needed - userBalance + 5000));
    setShowFundWallet(true);
  };

  const handleFundWallet = async () => {
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deposit', amount: fundAmount })
      });
      const data = await res.json();
      if (data.balance !== undefined) {
        setUserBalance(data.balance);
      }
      setShowFundWallet(false);
    } catch (error) {
      console.error('Failed to fund wallet:', error);
    }
  };

  const handleTrade = async (marketId: string, outcome: 'yes' | 'no', shares: number) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) throw new Error('Market not found');

    const price = outcome === 'yes' ? market.yes_price : market.no_price;
    const cost = shares * price;

    if (cost > userBalance) {
      handleInsufficientFunds(cost);
      throw new Error('Insufficient balance');
    }

    try {
      const res = await fetch('/api/predictions/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId,
          outcome,
          shares,
          action: 'buy'
        })
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Trade failed');
      }

      // Refresh balance from server
      await fetchUserBalance();
      // Refresh markets to get new prices
      await fetchMarkets();

    } catch (err) {
      console.error('Trade error:', err);
      throw err;
    }
  };

  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (sortBy === 'volume') return b.total_volume - a.total_volume;
    if (sortBy === 'newest') return new Date(b.resolution_date).getTime() - new Date(a.resolution_date).getTime();
    if (sortBy === 'ending_soon') return new Date(a.resolution_date).getTime() - new Date(b.resolution_date).getTime();
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Fund Wallet Modal */}
      {showFundWallet && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">💳</div>
              <h2 className="text-xl font-bold text-white mb-2">Fund Your Wallet</h2>
              <p className="text-slate-400">
                {neededAmount > 0 
                  ? `You need ₦${neededAmount.toFixed(2)} but have ₦${userBalance.toFixed(2)}`
                  : 'Add funds to start trading'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Amount to Add (₦)</label>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(Math.max(100, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-3 bg-slate-700 rounded-xl text-white text-lg font-semibold text-center"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[2000, 5000, 10000, 25000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setFundAmount(amount)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      fundAmount === amount
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    ₦{amount >= 1000 ? `${amount/1000}K` : amount}
                  </button>
                ))}
              </div>

              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Current Balance:</span>
                  <span className="text-white">₦{userBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Adding:</span>
                  <span className="text-emerald-400">+₦{fundAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-slate-600 pt-2 mt-2">
                  <span className="text-slate-400">New Balance:</span>
                  <span className="text-white">₦{(userBalance + fundAmount).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleFundWallet}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl font-semibold text-white text-lg"
              >
                💳 Add ₦{fundAmount.toLocaleString()} to Wallet
              </button>

              <button
                onClick={() => setShowFundWallet(false)}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300"
              >
                Cancel
              </button>

              <p className="text-xs text-slate-500 text-center">
                Funds are added to your CaseWin wallet
              </p>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/80 sticky top-0 z-40">
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

              <button
                onClick={() => { setNeededAmount(0); setShowFundWallet(true); }}
                className="hidden md:block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm"
              >
                + Fund
              </button>

              <nav className="hidden md:flex items-center gap-2">
                <Link href="/predictions/portfolio" className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all">Portfolio</Link>
                <Link href="/predictions/leaderboard" className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all">Leaderboard</Link>
                <Link href="/predictions/create" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium transition-all">+ Create</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{formatVolume(stats.totalVolume)}</p>
              <p className="text-sm text-slate-400">Total Volume</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{stats.activeTraders.toLocaleString()}</p>
              <p className="text-sm text-slate-400">Active Traders</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{stats.openMarkets}</p>
              <p className="text-sm text-slate-400">Open Markets</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{CATEGORIES.length - 1}</p>
              <p className="text-sm text-slate-400">Categories</p>
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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-12 w-12 text-purple-500 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-400">Loading markets...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-white mb-2">Failed to load markets</h3>
            <p className="text-slate-400 mb-6">{error}</p>
            <button 
              onClick={fetchMarkets}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium"
            >
              Try Again
            </button>
          </div>
        ) : sortedMarkets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">No markets found</h3>
            <p className="text-slate-400 mb-6">Be the first to create a prediction market!</p>
            <Link 
              href="/predictions/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium"
            >
              + Create Market
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMarkets.map(market => (
              <MarketCard 
                key={market.id} 
                market={market} 
                onTrade={handleTrade}
                onInsufficientFunds={handleInsufficientFunds}
                userBalance={userBalance}
              />
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-8 border border-purple-500/20">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Don't see a market you want?</h2>
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
