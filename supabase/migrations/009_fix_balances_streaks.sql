-- ============================================================
-- Migration 009: Fix user_balances view→table + Streak Rewards
-- 
-- CRITICAL FIX: user_balances is a VIEW (from migration 001)
-- but all code writes to it as a table. This migration:
-- 1. Drops the view
-- 2. Creates a proper table
-- 3. Migrates existing wallet data
-- 4. Fixes the auto-create trigger to create balance rows
-- 5. Adds streak_rewards and ai_analyses tables
-- ============================================================

-- Step 1: Drop the view safely
DROP VIEW IF EXISTS user_balances CASCADE;

-- Step 2: Create proper user_balances table
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 0,
  total_deposited NUMERIC DEFAULT 0,
  total_withdrawn NUMERIC DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  xp_points INTEGER DEFAULT 0,
  rank_title TEXT DEFAULT 'Rookie',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Migrate balances from old wallets table
INSERT INTO user_balances (user_id, balance, total_deposited, total_withdrawn, created_at)
SELECT user_id, balance, 0, 0, created_at FROM wallets
ON CONFLICT (user_id) DO UPDATE SET
  balance = GREATEST(user_balances.balance, EXCLUDED.balance);

-- Step 4: Enable RLS
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own balance' AND tablename = 'user_balances') THEN
    CREATE POLICY "Users can view own balance" ON user_balances FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service can manage balances' AND tablename = 'user_balances') THEN
    CREATE POLICY "Service can manage balances" ON user_balances FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Step 5: Update the auto-create trigger to also create balance row
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client')
  ) ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'NGN')
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO user_balances (user_id, balance, total_deposited, total_withdrawn)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create positions table if not exists
CREATE TABLE IF NOT EXISTS positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  market_id UUID REFERENCES prediction_markets(id) NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('yes', 'no')),
  shares NUMERIC NOT NULL DEFAULT 0,
  avg_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, market_id, outcome)
);

-- Step 7: Create trades table if not exists
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  market_id UUID REFERENCES prediction_markets(id) NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
  outcome TEXT NOT NULL CHECK (outcome IN ('yes', 'no')),
  shares NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 8: AI Market Analysis cache
CREATE TABLE IF NOT EXISTS ai_market_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID REFERENCES prediction_markets(id) NOT NULL,
  ai_probability NUMERIC,
  confidence TEXT CHECK (confidence IN ('low', 'medium', 'high')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'extreme')),
  insight TEXT,
  factors JSONB DEFAULT '[]',
  recommendation TEXT,
  edge_score NUMERIC DEFAULT 0,
  smart_money_signal TEXT DEFAULT 'neutral',
  volatility_forecast TEXT DEFAULT 'medium',
  market_price_at_analysis NUMERIC,
  total_pool_at_analysis NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_market ON ai_market_analyses(market_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created ON ai_market_analyses(created_at);

-- Step 9: Streak rewards log
CREATE TABLE IF NOT EXISTS streak_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  market_id UUID REFERENCES prediction_markets(id),
  won BOOLEAN DEFAULT false,
  streak_after INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  streak_multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streak_events_user ON streak_events(user_id);

-- Step 10: Wallet transactions log
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  balance_after NUMERIC,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);

-- Step 11: Enable RLS on new tables
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own positions' AND tablename = 'positions') THEN
    CREATE POLICY "Users can view own positions" ON positions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service can manage positions' AND tablename = 'positions') THEN
    CREATE POLICY "Service can manage positions" ON positions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own trades' AND tablename = 'trades') THEN
    CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service can manage trades' AND tablename = 'trades') THEN
    CREATE POLICY "Service can manage trades" ON trades FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- DONE! Now:
-- ✅ user_balances is a proper TABLE (not a view)
-- ✅ upserts/inserts/updates work correctly
-- ✅ Crypto deposits will credit properly
-- ✅ Trading will deduct properly
-- ✅ New users auto-get balance rows
-- ✅ Streak rewards + AI analysis tables ready
-- ============================================================
