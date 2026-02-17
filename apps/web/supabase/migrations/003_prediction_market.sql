-- CaseWinAI Prediction Market Database Schema
-- Competitor to Polymarket/Kalshi - Nigerian Legal Focus

-- ============================================
-- MARKET CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS market_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#1a2744',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO market_categories (name, slug, description, icon, sort_order) VALUES
('Court Cases', 'court-cases', 'Predict outcomes of ongoing court cases', '⚖️', 1),
('Legal Reform', 'legal-reform', 'Will new laws pass? Constitutional amendments?', '📜', 2),
('Supreme Court', 'supreme-court', 'Supreme Court rulings and appointments', '🏛️', 3),
('Elections & Politics', 'elections', 'Election results and political outcomes', '🗳️', 4),
('Corporate Law', 'corporate', 'Mergers, acquisitions, SEC rulings', '🏢', 5),
('Criminal Justice', 'criminal', 'High-profile criminal case verdicts', '👨‍⚖️', 6),
('International Law', 'international', 'Treaties, sanctions, ICC cases', '🌍', 7),
('Regulatory', 'regulatory', 'CBN, SEC, EFCC decisions and actions', '📋', 8),
('Sports Law', 'sports', 'Player disputes, club ownership, FIFA rulings', '⚽', 9),
('Entertainment', 'entertainment', 'IP disputes, celebrity cases', '🎬', 10);

-- ============================================
-- PREDICTION MARKETS
-- ============================================
CREATE TABLE IF NOT EXISTS prediction_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES market_categories(id),
  
  -- Market Type
  market_type TEXT NOT NULL CHECK (market_type IN ('binary', 'multiple_choice', 'scalar', 'categorical')),
  
  -- Outcomes (for binary: YES/NO, for multiple: array of options)
  outcomes JSONB NOT NULL DEFAULT '["Yes", "No"]',
  
  -- Resolution
  resolution_source TEXT, -- Where will we get the answer?
  resolution_criteria TEXT NOT NULL, -- Clear criteria for resolution
  resolved_outcome TEXT, -- Which outcome won
  resolution_details TEXT, -- Explanation of resolution
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  trading_starts_at TIMESTAMPTZ DEFAULT NOW(),
  trading_ends_at TIMESTAMPTZ NOT NULL,
  resolution_date TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'closed', 'resolved', 'cancelled', 'disputed')),
  
  -- Liquidity & Volume
  initial_liquidity DECIMAL(18, 2) DEFAULT 100000,
  total_volume DECIMAL(18, 2) DEFAULT 0,
  total_traders INTEGER DEFAULT 0,
  
  -- Current Prices (probability 0-100 for each outcome)
  current_prices JSONB DEFAULT '{"Yes": 50, "No": 50}',
  
  -- Fees
  trading_fee_percent DECIMAL(5, 4) DEFAULT 0.02, -- 2% fee
  creator_fee_percent DECIMAL(5, 4) DEFAULT 0.01, -- 1% to market creator
  
  -- Creator
  created_by UUID REFERENCES auth.users(id),
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Engagement
  views INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  
  -- Tags for search
  tags TEXT[] DEFAULT '{}',
  
  -- AI Analysis
  ai_prediction JSONB, -- Our AI's analysis
  ai_confidence DECIMAL(5, 2),
  
  -- Related news/sources
  sources JSONB DEFAULT '[]',
  
  -- Images
  cover_image TEXT,
  thumbnail TEXT
);

-- ============================================
-- USER POSITIONS (What each user holds)
-- ============================================
CREATE TABLE IF NOT EXISTS user_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  market_id UUID REFERENCES prediction_markets(id) NOT NULL,
  
  -- Position details
  outcome TEXT NOT NULL, -- Which outcome they hold
  shares DECIMAL(18, 6) NOT NULL DEFAULT 0,
  avg_price DECIMAL(10, 6) NOT NULL, -- Average buy price
  
  -- P&L tracking
  total_invested DECIMAL(18, 2) DEFAULT 0,
  realized_pnl DECIMAL(18, 2) DEFAULT 0,
  unrealized_pnl DECIMAL(18, 2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, market_id, outcome)
);

-- ============================================
-- ORDERS (Buy/Sell orders)
-- ============================================
CREATE TABLE IF NOT EXISTS market_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  market_id UUID REFERENCES prediction_markets(id) NOT NULL,
  
  -- Order details
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit')),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  outcome TEXT NOT NULL,
  
  -- Amounts
  shares DECIMAL(18, 6) NOT NULL,
  price DECIMAL(10, 6), -- For limit orders
  filled_shares DECIMAL(18, 6) DEFAULT 0,
  avg_fill_price DECIMAL(10, 6),
  
  -- Cost
  total_cost DECIMAL(18, 2),
  fee_amount DECIMAL(18, 2),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'partial', 'filled', 'cancelled', 'expired')),
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,
  
  -- For tracking
  ip_address INET,
  user_agent TEXT
);

-- ============================================
-- TRADES (Executed trades)
-- ============================================
CREATE TABLE IF NOT EXISTS market_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES prediction_markets(id) NOT NULL,
  order_id UUID REFERENCES market_orders(id),
  
  -- Trade parties
  buyer_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  
  -- Trade details
  outcome TEXT NOT NULL,
  shares DECIMAL(18, 6) NOT NULL,
  price DECIMAL(10, 6) NOT NULL, -- Price per share (0-1)
  total_amount DECIMAL(18, 2) NOT NULL,
  
  -- Fees
  buyer_fee DECIMAL(18, 2) DEFAULT 0,
  seller_fee DECIMAL(18, 2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER WALLETS
-- ============================================
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  
  -- Balances
  ngn_balance DECIMAL(18, 2) DEFAULT 0, -- Nigerian Naira
  usd_balance DECIMAL(18, 2) DEFAULT 0, -- USD
  usdc_balance DECIMAL(18, 6) DEFAULT 0, -- USDC crypto
  
  -- Locked (in active positions)
  ngn_locked DECIMAL(18, 2) DEFAULT 0,
  
  -- Bonus/Credits
  bonus_balance DECIMAL(18, 2) DEFAULT 0,
  
  -- Limits
  daily_deposit_limit DECIMAL(18, 2) DEFAULT 1000000,
  daily_withdrawal_limit DECIMAL(18, 2) DEFAULT 500000,
  
  -- Stats
  total_deposited DECIMAL(18, 2) DEFAULT 0,
  total_withdrawn DECIMAL(18, 2) DEFAULT 0,
  total_wagered DECIMAL(18, 2) DEFAULT 0,
  total_won DECIMAL(18, 2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  wallet_id UUID REFERENCES user_wallets(id) NOT NULL,
  
  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'payout', 'refund', 'bonus', 'fee', 'transfer')),
  currency TEXT DEFAULT 'NGN' CHECK (currency IN ('NGN', 'USD', 'USDC')),
  amount DECIMAL(18, 6) NOT NULL,
  
  -- Balance tracking
  balance_before DECIMAL(18, 6),
  balance_after DECIMAL(18, 6),
  
  -- Reference
  reference_type TEXT, -- 'market', 'order', 'trade', etc.
  reference_id UUID,
  
  -- Payment details (for deposits/withdrawals)
  payment_method TEXT,
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending',
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEADERBOARD & ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  
  -- Trading stats
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- P&L
  total_profit DECIMAL(18, 2) DEFAULT 0,
  total_loss DECIMAL(18, 2) DEFAULT 0,
  net_pnl DECIMAL(18, 2) DEFAULT 0,
  best_trade DECIMAL(18, 2) DEFAULT 0,
  worst_trade DECIMAL(18, 2) DEFAULT 0,
  
  -- Engagement
  markets_created INTEGER DEFAULT 0,
  markets_traded INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  prediction_accuracy DECIMAL(5, 2) DEFAULT 0,
  
  -- Ranking
  rank_points INTEGER DEFAULT 1000, -- ELO-style ranking
  rank_tier TEXT DEFAULT 'bronze' CHECK (rank_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster')),
  
  -- Streaks
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  
  -- Badges earned
  badges JSONB DEFAULT '[]',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MARKET COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS market_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES prediction_markets(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  parent_id UUID REFERENCES market_comments(id), -- For replies
  
  content TEXT NOT NULL,
  
  -- Position disclosure
  user_position TEXT, -- 'Yes', 'No', or null
  
  -- Engagement
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRICE HISTORY (for charts)
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES prediction_markets(id) NOT NULL,
  outcome TEXT NOT NULL,
  
  price DECIMAL(10, 6) NOT NULL,
  volume DECIMAL(18, 2) DEFAULT 0,
  
  -- OHLC for candle charts
  open_price DECIMAL(10, 6),
  high_price DECIMAL(10, 6),
  low_price DECIMAL(10, 6),
  close_price DECIMAL(10, 6),
  
  interval TEXT DEFAULT '1h' CHECK (interval IN ('1m', '5m', '15m', '1h', '4h', '1d')),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_markets_category ON prediction_markets(category_id);
CREATE INDEX IF NOT EXISTS idx_markets_status ON prediction_markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_featured ON prediction_markets(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_markets_trading_ends ON prediction_markets(trading_ends_at);
CREATE INDEX IF NOT EXISTS idx_positions_user ON user_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_market ON user_positions(market_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON market_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_market ON market_orders(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_market ON market_trades(market_id);
CREATE INDEX IF NOT EXISTS idx_price_history ON price_history(market_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_user_stats_rank ON user_stats(rank_points DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Markets are public to read
CREATE POLICY "Markets are viewable by everyone" ON prediction_markets
  FOR SELECT USING (true);

-- Users can only see their own positions
CREATE POLICY "Users can view own positions" ON user_positions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own orders
CREATE POLICY "Users can view own orders" ON market_orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only access their own wallet
CREATE POLICY "Users can view own wallet" ON user_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Stats are public (for leaderboard)
CREATE POLICY "Stats are viewable by everyone" ON user_stats
  FOR SELECT USING (true);
