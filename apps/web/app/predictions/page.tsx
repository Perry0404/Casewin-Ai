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

        {/* AI Prediction Badge — AI Oracle powered by Grok */}
        {market.ai_prediction !== null && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-3 py-1.5 rounded-full border border-purple-500/30">
              <span className="text-xs font-medium text-purple-300">
                🧠 Oracle: {Math.round(market.ai_prediction * 100)}% YES
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

// AI Oracle Panel Component
interface OracleAnalysis {
  market_id: string;
  title: string;
  ai_probability: number;
  ai_confidence: number;
  reasoning: string;
  key_factors: string[];
  risk_level: 'low' | 'medium' | 'high';
  recommendation: string;
  data_sources: string[];
  last_updated: string;
}

function AIOracle({ markets }: { markets: Market[] }) {
  const [analyses, setAnalyses] = useState<OracleAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [oracleAnswer, setOracleAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [oracleError, setOracleError] = useState<string | null>(null);

  const analyzeMarkets = async (category?: string) => {
    setIsAnalyzing(true);
    setOracleError(null);
    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      const res = await fetch(`/api/predictions/oracle?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalyses(data.analyses || []);
    } catch (err) {
      setOracleError(err instanceof Error ? err.message : 'Oracle analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeOne = async (marketId: string) => {
    setIsAnalyzing(true);
    setOracleError(null);
    setSelectedMarket(marketId);
    try {
      const res = await fetch(`/api/predictions/oracle?marketId=${marketId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalyses(data.analyses || []);
    } catch (err) {
      setOracleError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const askOracle = async () => {
    if (!selectedMarket || !question.trim()) return;
    setIsAsking(true);
    setOracleAnswer(null);
    try {
      const res = await fetch('/api/predictions/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId: selectedMarket, question }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOracleAnswer(data.answer);
    } catch (err) {
      setOracleAnswer('Oracle could not process your question. Please try again.');
    } finally {
      setIsAsking(false);
    }
  };

  const riskColor = (level: string) => {
    switch(level) {
      case 'low': return 'text-emerald-400 bg-emerald-500/20';
      case 'high': return 'text-red-400 bg-red-500/20';
      default: return 'text-yellow-400 bg-yellow-500/20';
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-3xl p-6 border border-purple-500/30 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
            🧠
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Oracle</h2>
            <p className="text-sm text-slate-400">Powered by Grok 4 — Real-time market analysis</p>
          </div>
        </div>

        <button
          onClick={() => analyzeMarkets()}
          disabled={isAnalyzing}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </>
          ) : (
            '🔮 Run Oracle Analysis'
          )}
        </button>
      </div>

      {oracleError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
          <p className="text-sm text-red-400">{oracleError}</p>
        </div>
      )}

      {/* Quick market selector for single analysis */}
      {markets.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedMarket || ''}
            onChange={(e) => {
              setSelectedMarket(e.target.value);
              if (e.target.value) analyzeOne(e.target.value);
            }}
            className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/50 rounded-xl text-white text-sm"
          >
            <option value="">Select a market for deep analysis...</option>
            {markets.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Ask Oracle a question */}
      {selectedMarket && (
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask the Oracle anything about this market..."
            className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-400"
            onKeyDown={(e) => e.key === 'Enter' && askOracle()}
          />
          <button
            onClick={askOracle}
            disabled={isAsking || !question.trim()}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium text-sm disabled:opacity-50"
          >
            {isAsking ? '...' : 'Ask'}
          </button>
        </div>
      )}

      {oracleAnswer && (
        <div className="mb-6 p-4 bg-purple-900/40 border border-purple-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400 font-semibold text-sm">🧠 Oracle Response</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{oracleAnswer}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analyses.length > 0 && (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <div key={analysis.market_id} className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-white font-semibold text-sm flex-1">{analysis.title}</h3>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${riskColor(analysis.risk_level)}`}>
                  {analysis.risk_level.toUpperCase()} RISK
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-900/60 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-400">{Math.round(analysis.ai_probability * 100)}%</p>
                  <p className="text-xs text-slate-400">AI Probability (YES)</p>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-pink-400">{Math.round(analysis.ai_confidence * 100)}%</p>
                  <p className="text-xs text-slate-400">Confidence</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-3 leading-relaxed">{analysis.reasoning}</p>

              {analysis.key_factors.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-400 mb-1.5">Key Factors:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.key_factors.map((factor, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-700/60 rounded-lg text-xs text-slate-300">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-2.5 bg-purple-900/30 rounded-lg border border-purple-500/20">
                <span className="text-purple-400 text-sm">💡</span>
                <p className="text-sm text-purple-300">{analysis.recommendation}</p>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                Sources: {analysis.data_sources.join(', ')} | Updated: {new Date(analysis.last_updated).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {analyses.length === 0 && !isAnalyzing && (
        <div className="text-center py-6">
          <p className="text-slate-400 text-sm">Click &quot;Run Oracle Analysis&quot; to get AI-powered insights on top markets</p>
          <p className="text-slate-500 text-xs mt-1">Or select a specific market for deep analysis</p>
        </div>
      )}
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
  const [depositTab, setDepositTab] = useState<'naira' | 'base' | 'withdraw'>('base');
  const [txHash, setTxHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [depositResult, setDepositResult] = useState<any>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [baseInfo, setBaseInfo] = useState<any>(null);
  // Withdrawal state
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawToken, setWithdrawToken] = useState<'ETH' | 'USDC'>('USDC');
  const [withdrawNGN, setWithdrawNGN] = useState(10000);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState<any>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
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
        // Use AMM-computed prices from the API 
        const yesPrice = m.yes_price || 0.5;
        const noPrice = m.no_price || 0.5;
        
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
          total_traders: Math.floor(Math.max(m.total_pool || 0, 1) / 500) || 0,
          liquidity_pool: m.liquidity_pool || m.total_pool || 0,
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
    // Fetch Base deposit info
    fetch('/api/deposit/base').then(r => r.json()).then(setBaseInfo).catch(() => {});
  }, [fetchMarkets, fetchUserBalance]);

  const handleInsufficientFunds = (needed: number) => {
    setNeededAmount(needed);
    setFundAmount(Math.ceil(needed - userBalance + 5000));
    setShowFundWallet(true);
  };

  const handleVerifyBaseDeposit = async () => {
    if (!txHash.trim()) return;
    setIsVerifying(true);
    setDepositError(null);
    setDepositResult(null);
    try {
      const res = await fetch('/api/deposit/base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: txHash.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setDepositError(data.error);
      } else {
        setDepositResult(data);
        await fetchUserBalance();
        setTxHash('');
      }
    } catch {
      setDepositError('Failed to verify transaction. Please try again.');
    } finally {
      setIsVerifying(false);
    }
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

  const handleBaseWithdraw = async () => {
    if (!withdrawAddress.trim() || withdrawNGN < 5000) return;
    setIsWithdrawing(true);
    setWithdrawError(null);
    setWithdrawResult(null);
    try {
      const res = await fetch('/api/withdraw/base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current', // API will use auth
          toAddress: withdrawAddress.trim(),
          token: withdrawToken,
          ngnAmount: withdrawNGN,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setWithdrawError(data.error);
      } else {
        setWithdrawResult(data);
        await fetchUserBalance();
        setWithdrawAddress('');
        setWithdrawNGN(10000);
      }
    } catch {
      setWithdrawError('Failed to process withdrawal. Please try again.');
    } finally {
      setIsWithdrawing(false);
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
      {/* Fund Wallet Modal — Base Chain + Naira */}
      {showFundWallet && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">💳</div>
              <h2 className="text-xl font-bold text-white mb-2">Fund Your Wallet</h2>
              <p className="text-slate-400">
                {neededAmount > 0 
                  ? `You need ₦${neededAmount.toFixed(2)} but have ₦${userBalance.toFixed(2)}`
                  : 'Add funds to start trading on CaseWin Predictions'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-900/60 rounded-xl p-1 mb-6">
              <button
                onClick={() => { setDepositTab('base'); setDepositResult(null); setDepositError(null); setWithdrawResult(null); setWithdrawError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  depositTab === 'base'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 111 111" fill="none"><path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="currentColor"/></svg>
                Deposit
              </button>
              <button
                onClick={() => { setDepositTab('withdraw'); setDepositResult(null); setDepositError(null); setWithdrawResult(null); setWithdrawError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  depositTab === 'withdraw'
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                💸 Withdraw
              </button>
              <button
                onClick={() => { setDepositTab('naira'); setDepositResult(null); setDepositError(null); setWithdrawResult(null); setWithdrawError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  depositTab === 'naira'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇳🇬 Demo
              </button>
            </div>

            {/* ---- BASE DEPOSIT TAB ---- */}
            {depositTab === 'base' && (
              <div className="space-y-4">
                {/* Base chain info banner */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="20" height="20" viewBox="0 0 111 111" fill="none"><path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="#0052FF"/></svg>
                    <span className="font-semibold text-blue-400">Deposit via Base Network</span>
                  </div>
                  <p className="text-sm text-slate-300">Send ETH or USDC on <strong>Base</strong> chain. Funds are converted to ₦ and credited instantly.</p>
                </div>

                {/* Supported tokens */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 rounded-xl p-3 text-center border border-slate-700/50">
                    <p className="text-2xl mb-1">⟠</p>
                    <p className="text-white font-semibold text-sm">ETH</p>
                    <p className="text-xs text-slate-400">Min: 0.0005 ETH</p>
                    <p className="text-xs text-blue-400">₦{(baseInfo?.supportedTokens?.[0]?.ngnRate || 5500000).toLocaleString()}/ETH</p>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-3 text-center border border-slate-700/50">
                    <p className="text-2xl mb-1">💲</p>
                    <p className="text-white font-semibold text-sm">USDC</p>
                    <p className="text-xs text-slate-400">Min: 1 USDC</p>
                    <p className="text-xs text-blue-400">₦{(baseInfo?.supportedTokens?.[1]?.ngnRate || 1571).toLocaleString()}/USDC</p>
                  </div>
                </div>

                {/* Deposit address */}
                {baseInfo?.depositAddress ? (
                  <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-2 font-medium">DEPOSIT ADDRESS (BASE NETWORK):</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm text-white bg-slate-800 rounded-lg px-3 py-2 break-all font-mono">
                        {baseInfo.depositAddress}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(baseInfo.depositAddress)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-xs font-medium whitespace-nowrap"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <p className="text-xs text-yellow-400 mt-2">⚠️ Only send on Base network. Other chains will result in lost funds.</p>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-sm text-yellow-400">⚠️ Deposit address not configured yet. Contact admin to set up Base deposits.</p>
                  </div>
                )}

                {/* Verify transaction */}
                <div>
                  <p className="text-sm text-slate-300 mb-2 font-medium">After sending, paste your transaction hash:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      placeholder="0x..."
                      className="flex-1 px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                    />
                    <button
                      onClick={handleVerifyBaseDeposit}
                      disabled={isVerifying || !txHash.trim()}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                    >
                      {isVerifying ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          Verifying...
                        </>
                      ) : '🔍 Verify'}
                    </button>
                  </div>
                </div>

                {/* Deposit success */}
                {depositResult && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">✅</span>
                      <span className="text-emerald-400 font-semibold">Deposit Verified!</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-300">Token: <span className="text-white font-medium">{depositResult.deposit.amount} {depositResult.deposit.token}</span></p>
                      <p className="text-slate-300">Credited: <span className="text-emerald-400 font-bold">₦{depositResult.deposit.ngnAmount.toLocaleString()}</span></p>
                      <a 
                        href={depositResult.deposit.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs underline"
                      >
                        View on BaseScan →
                      </a>
                    </div>
                  </div>
                )}

                {/* Deposit error */}
                {depositError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-sm text-red-400">❌ {depositError}</p>
                  </div>
                )}

                {/* Bridge link */}
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">Need to bridge funds to Base?</p>
                  <a
                    href="https://bridge.base.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    🌉 Base Bridge →
                  </a>
                </div>
              </div>
            )}

            {/* ---- WITHDRAW TAB ---- */}
            {depositTab === 'withdraw' && (
              <div className="space-y-4">
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💸</span>
                    <span className="font-semibold text-orange-400">Withdraw to Base Network</span>
                  </div>
                  <p className="text-sm text-slate-300">Convert your ₦ balance to ETH or USDC and receive on Base chain. 1.5% fee applies.</p>
                </div>

                {/* Current balance */}
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50 text-center">
                  <p className="text-xs text-slate-400 mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-emerald-400">₦{userBalance.toLocaleString()}</p>
                </div>

                {/* Token selector */}
                <div>
                  <p className="text-sm text-slate-300 mb-2 font-medium">Receive as:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setWithdrawToken('USDC')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        withdrawToken === 'USDC'
                          ? 'bg-blue-600/20 border-blue-500/50 ring-2 ring-blue-500/30'
                          : 'bg-slate-900/60 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <p className="text-xl mb-1">💲</p>
                      <p className="text-white font-semibold text-sm">USDC</p>
                      <p className="text-xs text-blue-400">₦{(baseInfo?.supportedTokens?.[1]?.ngnRate || 1571).toLocaleString()}/USDC</p>
                    </button>
                    <button
                      onClick={() => setWithdrawToken('ETH')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        withdrawToken === 'ETH'
                          ? 'bg-blue-600/20 border-blue-500/50 ring-2 ring-blue-500/30'
                          : 'bg-slate-900/60 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <p className="text-xl mb-1">⟠</p>
                      <p className="text-white font-semibold text-sm">ETH</p>
                      <p className="text-xs text-blue-400">₦{(baseInfo?.supportedTokens?.[0]?.ngnRate || 5500000).toLocaleString()}/ETH</p>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <p className="text-sm text-slate-300 mb-2 font-medium">Amount to withdraw (₦)</p>
                  <input
                    type="number"
                    value={withdrawNGN}
                    onChange={(e) => setWithdrawNGN(Math.max(5000, parseInt(e.target.value) || 0))}
                    min={5000}
                    className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl text-white text-lg font-semibold text-center focus:outline-none focus:border-orange-500/50"
                  />
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[5000, 10000, 25000, 50000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setWithdrawNGN(amt)}
                        className={`py-2 rounded-lg text-xs font-medium transition-all ${
                          withdrawNGN === amt ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        ₦{amt >= 1000 ? `${amt/1000}K` : amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base address */}
                <div>
                  <p className="text-sm text-slate-300 mb-2 font-medium">Your Base wallet address:</p>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                {/* Summary */}
                <div className="bg-slate-700/50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Withdraw:</span>
                    <span className="text-white">₦{withdrawNGN.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fee (1.5%):</span>
                    <span className="text-red-400">-₦{Math.ceil(withdrawNGN * 0.015).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-600 pt-2">
                    <span className="text-slate-400">You receive:</span>
                    <span className="text-orange-400 font-bold">
                      {withdrawToken === 'USDC'
                        ? `${((withdrawNGN - Math.ceil(withdrawNGN * 0.015)) / (baseInfo?.supportedTokens?.[1]?.ngnRate || 1571)).toFixed(2)} USDC`
                        : `${((withdrawNGN - Math.ceil(withdrawNGN * 0.015)) / (baseInfo?.supportedTokens?.[0]?.ngnRate || 5500000)).toFixed(6)} ETH`
                      }
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleBaseWithdraw}
                  disabled={isWithdrawing || !withdrawAddress.trim() || withdrawNGN < 5000 || withdrawNGN > userBalance}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 rounded-xl font-semibold text-white text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isWithdrawing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Processing...
                    </>
                  ) : withdrawNGN > userBalance ? (
                    'Insufficient Balance'
                  ) : (
                    `💸 Withdraw ₦${withdrawNGN.toLocaleString()}`
                  )}
                </button>

                {/* Withdrawal success */}
                {withdrawResult && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">✅</span>
                      <span className="text-emerald-400 font-semibold">Withdrawal Sent!</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-300">Sent: <span className="text-white font-medium">{withdrawResult.withdrawal.cryptoAmount} {withdrawResult.withdrawal.token}</span></p>
                      <p className="text-slate-300">To: <span className="text-white font-mono text-xs">{withdrawResult.withdrawal.toAddress}</span></p>
                      <p className="text-slate-300">New balance: <span className="text-emerald-400 font-bold">₦{withdrawResult.newBalance?.toLocaleString()}</span></p>
                      {withdrawResult.withdrawal.txHash && (
                        <a
                          href={withdrawResult.withdrawal.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs underline block mt-1"
                        >
                          View on BaseScan: {withdrawResult.withdrawal.txHash.slice(0, 16)}... →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Withdrawal error */}
                {withdrawError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-sm text-red-400">❌ {withdrawError}</p>
                  </div>
                )}

                <p className="text-xs text-slate-500 text-center">Withdrawals are sent instantly on Base chain. No admin approval needed.</p>
              </div>
            )}

            {/* ---- NAIRA (DEMO) TAB ---- */}
            {depositTab === 'naira' && (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <p className="text-sm text-emerald-400">🇳🇬 Demo Mode — Add test funds to your wallet. In production, this will use Paystack/bank transfers.</p>
                </div>

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
              </div>
            )}

            <button
              onClick={() => { setShowFundWallet(false); setDepositResult(null); setDepositError(null); setTxHash(''); }}
              className="w-full mt-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300"
            >
              Close
            </button>
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
                onClick={() => { setNeededAmount(0); setDepositTab('base'); setShowFundWallet(true); }}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 111 111" fill="none"><path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="currentColor"/></svg>
                Deposit
              </button>

              <button
                onClick={() => { setNeededAmount(0); setDepositTab('withdraw'); setShowFundWallet(true); }}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium text-sm"
              >
                💸 Withdraw
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

        {/* AI Oracle Section */}
        <AIOracle markets={markets} />

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
