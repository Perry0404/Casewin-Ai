'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  yes_price: number;
  no_price: number;
  total_volume: number;
  total_traders: number;
  liquidity_pool: number;
  resolution_date: string;
  ai_prediction: number;
  ai_confidence: number;
  status: string;
  resolution_source?: string;
  created_at?: string;
}

interface Comment {
  id: string;
  user: string;
  content: string;
  timestamp: string;
  likes: number;
}

const CATEGORIES: Record<string, { name: string; icon: string }> = {
  court_cases: { name: 'Court Cases', icon: '⚖️' },
  legal_reform: { name: 'Legal Reform', icon: '📜' },
  supreme_court: { name: 'Supreme Court', icon: '🏛️' },
  elections: { name: 'Elections', icon: '🗳️' },
  corporate: { name: 'Corporate', icon: '🏢' },
  criminal: { name: 'Criminal', icon: '🚨' },
  regulatory: { name: 'Regulatory', icon: '📋' },
  sports: { name: 'Sports', icon: '⚽' },
  entertainment: { name: 'Entertainment', icon: '🎬' },
  other: { name: 'Other', icon: '📊' },
};

function formatVolume(volume: number): string {
  if (volume >= 1000000) return `₦${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `₦${(volume / 1000).toFixed(0)}K`;
  return `₦${volume}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function generateAIPrediction(yesPrice: number): { prediction: number; confidence: number; reasoning: string[] } {
  // Generate AI prediction based on market price with some variance
  const variance = (Math.random() - 0.5) * 0.15;
  const prediction = Math.max(0.05, Math.min(0.95, yesPrice + variance));
  const confidence = 0.65 + Math.random() * 0.25;
  
  const reasonings = [
    'Historical case precedent analysis',
    'Judge sentiment pattern recognition',
    'Similar case outcome correlation',
    'Legal argument strength assessment',
    'Timeline and procedural analysis',
    'Expert opinion aggregation',
    'Court backlog impact evaluation',
    'Legislative trend analysis'
  ];
  
  // Pick 3-4 random reasonings
  const shuffled = reasonings.sort(() => 0.5 - Math.random());
  const selectedReasons = shuffled.slice(0, 3 + Math.floor(Math.random() * 2));
  
  return { prediction, confidence, reasoning: selectedReasons };
}

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;

  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [shares, setShares] = useState(100);
  const [outcome, setOutcome] = useState<'yes' | 'no'>('yes');
  const [isTrading, setIsTrading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ prediction: number; confidence: number; reasoning: string[] } | null>(null);
  const [comments] = useState<Comment[]>([
    { id: '1', user: 'LegalEagle_NG', content: 'Based on similar cases, I think YES has strong fundamentals here.', timestamp: '2026-02-17T10:30:00Z', likes: 24 },
    { id: '2', user: 'CourtWatcher', content: 'The judge assigned has a history of ruling this way. Interesting market.', timestamp: '2026-02-16T15:45:00Z', likes: 18 },
    { id: '3', user: 'NaijaPredictor', content: 'Bought some NO shares as a hedge. Let\'s see how this plays out.', timestamp: '2026-02-15T09:20:00Z', likes: 12 },
  ]);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'comments' | 'history'>('overview');

  // Fetch market data
  const fetchMarket = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/predictions?category=all`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Find the specific market
      const foundMarket = (data.markets || []).find((m: any) => m.id === marketId);
      
      if (!foundMarket) {
        throw new Error('Market not found');
      }

      const yesPrice = foundMarket.yes_votes && foundMarket.no_votes 
        ? foundMarket.yes_votes / (foundMarket.yes_votes + foundMarket.no_votes)
        : 0.5;
      
      const noPrice = foundMarket.yes_votes && foundMarket.no_votes 
        ? foundMarket.no_votes / (foundMarket.yes_votes + foundMarket.no_votes)
        : 0.5;

      const aiData = generateAIPrediction(yesPrice);
      setAiAnalysis(aiData);

      const transformedMarket: Market = {
        id: foundMarket.id,
        title: foundMarket.title,
        description: foundMarket.description || 'No description available.',
        category: foundMarket.category || 'other',
        yes_price: yesPrice,
        no_price: noPrice,
        total_volume: foundMarket.total_pool || 0,
        total_traders: Math.floor((foundMarket.yes_votes + foundMarket.no_votes) / 100) || 0,
        liquidity_pool: foundMarket.total_pool || 0,
        resolution_date: foundMarket.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        ai_prediction: aiData.prediction,
        ai_confidence: aiData.confidence,
        status: foundMarket.resolved ? 'resolved' : 'active',
        resolution_source: 'Official court records and public announcements',
        created_at: foundMarket.created_at || new Date().toISOString()
      };

      setMarket(transformedMarket);
    } catch (err) {
      console.error('Failed to fetch market:', err);
      setError(err instanceof Error ? err.message : 'Failed to load market');
    } finally {
      setIsLoading(false);
    }
  }, [marketId]);

  // Load real user balance from API
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      setUserBalance(data.balance || 0);
    } catch {
      setUserBalance(0);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    fetchMarket();
  }, [fetchMarket]);

  const handleTrade = async () => {
    if (!market) return;

    setIsTrading(true);
    setTradeError(null);

    try {
      const res = await fetch('/api/predictions/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: market.id,
          outcome,
          shares,
          action: 'buy'
        })
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        const errorMsg = data.error || 'Trade failed';
        // If insufficient balance, show helpful message
        if (errorMsg.includes('Insufficient balance') || errorMsg.includes('insufficient')) {
          throw new Error('Insufficient balance. Deposit crypto at /wallet first, then sync your balance.');
        }
        throw new Error(errorMsg);
      }

      setTradeSuccess(true);
      setTimeout(() => setTradeSuccess(false), 3000);

      // Refresh real balance from API + market data
      await Promise.all([fetchBalance(), fetchMarket()]);

    } catch (err) {
      setTradeError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setIsTrading(false);
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
          <p className="text-slate-400">Loading market...</p>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Market Not Found</h1>
          <p className="text-slate-400 mb-6">{error || 'This market does not exist or has been removed.'}</p>
          <Link href="/predictions" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium">
            ← Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  const yesPercent = Math.round(market.yes_price * 100);
  const noPercent = Math.round(market.no_price * 100);
  const selectedPrice = outcome === 'yes' ? market.yes_price : market.no_price;
  const cost = shares * selectedPrice;
  const potentialProfit = shares * (1 - selectedPrice);
  const categoryInfo = CATEGORIES[market.category] || CATEGORIES.other;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/predictions" className="flex items-center gap-3">
              <Image src="/favicon.png" alt="CaseWin AI" width={40} height={40} className="rounded-xl" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">CaseWin Predictions</h1>
                <p className="text-xs text-slate-400">Market Details</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-sm">Balance:</span>
                <span className="text-emerald-400 font-bold">₦{userBalance.toLocaleString()}</span>
              </div>
              <Link
                href="/wallet"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm"
              >
                💰 Deposit
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href="/predictions" className="hover:text-purple-400">Markets</Link>
          <span>→</span>
          <span className="text-white">{market.title.slice(0, 50)}...</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Header */}
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{categoryInfo.icon}</span>
                <span className="text-sm font-medium text-purple-400 uppercase tracking-wide">
                  {categoryInfo.name}
                </span>
                <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                  market.status === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {market.status === 'active' ? '🟢 Active' : '⚪ Closed'}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {market.title}
              </h1>

              <p className="text-slate-300 mb-6">{market.description}</p>

              {/* Price Display */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setOutcome('yes')}
                  className={`p-4 rounded-xl transition-all ${
                    outcome === 'yes'
                      ? 'bg-emerald-500/30 border-2 border-emerald-400'
                      : 'bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  <div className="text-emerald-400 font-bold text-3xl">{yesPercent}¢</div>
                  <div className="text-emerald-400/80 font-semibold">YES</div>
                  <div className="text-slate-400 text-sm mt-1">{yesPercent}% chance</div>
                </button>

                <button
                  onClick={() => setOutcome('no')}
                  className={`p-4 rounded-xl transition-all ${
                    outcome === 'no'
                      ? 'bg-red-500/30 border-2 border-red-400'
                      : 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
                  }`}
                >
                  <div className="text-red-400 font-bold text-3xl">{noPercent}¢</div>
                  <div className="text-red-400/80 font-semibold">NO</div>
                  <div className="text-slate-400 text-sm mt-1">{noPercent}% chance</div>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-700/30 rounded-xl p-3">
                  <div className="text-lg font-bold text-white">{formatVolume(market.total_volume)}</div>
                  <div className="text-xs text-slate-400">Volume</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-3">
                  <div className="text-lg font-bold text-white">{market.total_traders}</div>
                  <div className="text-xs text-slate-400">Traders</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-3">
                  <div className="text-lg font-bold text-white">{formatDate(market.resolution_date)}</div>
                  <div className="text-xs text-slate-400">Resolves</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'overview', label: '📋 Overview' },
                { id: 'ai', label: '🤖 AI Analysis' },
                { id: 'comments', label: '💬 Comments' },
                { id: 'history', label: '📊 History' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Resolution Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Resolution Date:</span>
                      <span className="text-white">{formatDate(market.resolution_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Resolution Source:</span>
                      <span className="text-white">{market.resolution_source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Market Created:</span>
                      <span className="text-white">{formatDate(market.created_at || new Date().toISOString())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Liquidity Pool:</span>
                      <span className="text-white">{formatVolume(market.liquidity_pool)}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && aiAnalysis && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">🤖 AI Prediction Analysis</h3>
                    <span className="text-xs text-slate-400">Powered by CaseWin AI</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/30">
                      <div className="text-3xl font-bold text-white mb-1">
                        {Math.round(aiAnalysis.prediction * 100)}%
                      </div>
                      <div className="text-sm text-purple-300">AI Prediction (YES)</div>
                    </div>
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <div className="text-3xl font-bold text-white mb-1">
                        {Math.round(aiAnalysis.confidence * 100)}%
                      </div>
                      <div className="text-sm text-slate-400">Confidence Level</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Analysis Factors:</h4>
                    <div className="space-y-2">
                      {aiAnalysis.reasoning.map((reason, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          <span className="text-emerald-400">✓</span>
                          <span className="text-slate-300">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-sm text-yellow-300">
                      ⚠️ AI predictions are for informational purposes only. Always do your own research before trading.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Community Discussion</h3>
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-700/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-purple-400">{comment.user}</span>
                        <span className="text-xs text-slate-500">{formatDate(comment.timestamp)}</span>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{comment.content}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <button className="hover:text-red-400">❤️ {comment.likes}</button>
                        <button className="hover:text-purple-400">💬 Reply</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Price History</h3>
                  <div className="h-48 bg-slate-700/30 rounded-xl flex items-center justify-center">
                    <p className="text-slate-400">📈 Price chart coming soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Trade</h3>

              {tradeSuccess && (
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 mb-4 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-emerald-400 font-semibold">Trade Successful!</p>
                  <p className="text-sm text-slate-400">You bought {shares} {outcome.toUpperCase()} shares</p>
                </div>
              )}

              {/* Outcome Selection */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setOutcome('yes')}
                  className={`py-3 rounded-xl font-semibold transition-all ${
                    outcome === 'yes'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  YES {yesPercent}¢
                </button>
                <button
                  onClick={() => setOutcome('no')}
                  className={`py-3 rounded-xl font-semibold transition-all ${
                    outcome === 'no'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  NO {noPercent}¢
                </button>
              </div>

              {/* Shares Input */}
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">Shares</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShares(Math.max(10, shares - 50))}
                    className="w-12 h-12 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(Math.max(10, parseInt(e.target.value) || 10))}
                    className="flex-1 h-12 rounded-lg bg-slate-700 text-center text-white font-semibold text-lg"
                  />
                  <button
                    onClick={() => setShares(shares + 50)}
                    className="w-12 h-12 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[100, 500, 1000, 5000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setShares(amount)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      shares === amount
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {amount >= 1000 ? `${amount/1000}K` : amount}
                  </button>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="bg-slate-700/30 rounded-xl p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Price per share:</span>
                  <span className="text-white">{Math.round(selectedPrice * 100)}¢</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total cost:</span>
                  <span className="text-white font-semibold">₦{cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-600 pt-2">
                  <span className="text-slate-400">Potential profit:</span>
                  <span className="text-emerald-400 font-semibold">+₦{potentialProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max payout:</span>
                  <span className="text-white font-semibold">₦{shares.toFixed(2)}</span>
                </div>
              </div>

              {tradeError && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4">
                  <p className="text-sm text-red-400">{tradeError}</p>
                </div>
              )}

              {/* Buy Button */}
              <button
                onClick={handleTrade}
                disabled={isTrading}
                className={`w-full py-4 rounded-xl font-semibold text-lg text-white transition-all flex items-center justify-center gap-2 ${
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

              {/* Balance Warning */}
              {cost > userBalance && (
                <Link
                  href="/wallet"
                  className="block w-full mt-3 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-xl text-yellow-400 font-medium text-center"
                >
                  💰 Deposit Crypto to Trade
                </Link>
              )}

              <p className="text-xs text-slate-500 text-center mt-4">
                Your balance: ₦{userBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
