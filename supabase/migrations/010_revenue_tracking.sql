-- ============================================================
-- Migration 010: Revenue Tracking & Transaction Monitoring
--
-- Tracks all platform revenue from:
--   1. Trading fees (2% on every buy/sell)
--   2. Withdrawal fees (1.5% on bank payouts)
--   3. Deposit processing fees (if applicable)
-- ============================================================

-- Platform revenue ledger
CREATE TABLE IF NOT EXISTS platform_revenue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('trade_fee', 'withdrawal_fee', 'deposit_fee', 'market_creation', 'other')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'NGN',
  user_id UUID REFERENCES auth.users(id),
  market_id UUID REFERENCES prediction_markets(id),
  trade_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_type ON platform_revenue(type);
CREATE INDEX IF NOT EXISTS idx_revenue_created ON platform_revenue(created_at);
CREATE INDEX IF NOT EXISTS idx_revenue_user ON platform_revenue(user_id);

-- Daily revenue summary (materialized for fast dashboard loads)
CREATE TABLE IF NOT EXISTS revenue_daily_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  trade_fee_total NUMERIC DEFAULT 0,
  withdrawal_fee_total NUMERIC DEFAULT 0,
  deposit_fee_total NUMERIC DEFAULT 0,
  other_total NUMERIC DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  total_volume NUMERIC DEFAULT 0,
  total_deposits NUMERIC DEFAULT 0,
  total_withdrawals NUMERIC DEFAULT 0,
  unique_traders INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON revenue_daily_summary(date);

-- Transaction monitoring: all money movements in one place
CREATE TABLE IF NOT EXISTS transaction_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN (
    'crypto_deposit', 'balance_sync', 
    'trade_buy', 'trade_sell', 
    'bank_payout', 'crypto_withdraw',
    'fee_collected', 'market_payout',
    'refund'
  )),
  amount NUMERIC NOT NULL,
  fee NUMERIC DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  balance_before NUMERIC,
  balance_after NUMERIC,
  reference TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_txlog_user ON transaction_log(user_id);
CREATE INDEX IF NOT EXISTS idx_txlog_type ON transaction_log(type);
CREATE INDEX IF NOT EXISTS idx_txlog_created ON transaction_log(created_at);
CREATE INDEX IF NOT EXISTS idx_txlog_status ON transaction_log(status);

-- Admin users table to control dashboard access
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform settings (fee rates, etc.)
INSERT INTO app_config (key, value) VALUES 
  ('TRADE_FEE_PERCENT', '2'),
  ('WITHDRAWAL_FEE_PERCENT', '1.5'),
  ('MIN_WITHDRAWAL', '1000'),
  ('PLATFORM_NAME', 'CaseWin Predictions')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE platform_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (APIs use service role)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service manages revenue' AND tablename = 'platform_revenue') THEN
    CREATE POLICY "Service manages revenue" ON platform_revenue FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service manages daily summary' AND tablename = 'revenue_daily_summary') THEN
    CREATE POLICY "Service manages daily summary" ON revenue_daily_summary FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service manages txlog' AND tablename = 'transaction_log') THEN
    CREATE POLICY "Service manages txlog" ON transaction_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service manages admins' AND tablename = 'admin_users') THEN
    CREATE POLICY "Service manages admins" ON admin_users FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
