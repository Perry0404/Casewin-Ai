-- ============================================================
-- CaseWin-NG: Complete Supabase Database Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. USER WALLETS
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  naira_balance NUMERIC(12,2) DEFAULT 0,
  total_deposits NUMERIC(12,2) DEFAULT 0,
  total_withdrawals NUMERIC(12,2) DEFAULT 0,
  wallet_address TEXT,
  zendfi_subaccount_id TEXT,
  zendfi_wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_email ON user_wallets(user_email);

-- 3. WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  transaction_type TEXT NOT NULL, -- deposit, withdrawal, crypto_withdrawal, bet, fee, payout, wallet_connect
  related_id TEXT,
  balance_after NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_email ON wallet_transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at);

-- 4. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  user_email TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  payment_type TEXT DEFAULT 'wallet_deposit', -- wallet_deposit, booking
  related_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, failed
  provider TEXT DEFAULT 'zendfi',
  provider_payment_id TEXT,
  paystack_data JSONB, -- legacy name; holds provider response data
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(user_email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 5. PREDICTION MARKETS
CREATE TABLE IF NOT EXISTS prediction_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  outcome_options JSONB NOT NULL DEFAULT '{"yes_shares": 20000, "no_shares": 20000}',
  total_pool NUMERIC(12,2) DEFAULT 0,
  liquidity_pool NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'open', -- open, closed, resolved
  actual_outcome TEXT, -- yes, no
  resolution_source TEXT,
  resolved_outcome TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_by TEXT,
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_markets_status ON prediction_markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_category ON prediction_markets(category);
CREATE INDEX IF NOT EXISTS idx_markets_created_by ON prediction_markets(created_by);
CREATE INDEX IF NOT EXISTS idx_markets_closes ON prediction_markets(closes_at);

-- 6. PREDICTION BETS
CREATE TABLE IF NOT EXISTS prediction_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  market_id UUID NOT NULL REFERENCES prediction_markets(id),
  selected_outcome TEXT NOT NULL, -- yes, no
  amount NUMERIC(12,2) NOT NULL,
  potential_payout NUMERIC(12,2),
  payout_amount NUMERIC(12,2),
  status TEXT DEFAULT 'active', -- active, won, lost
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bets_market ON prediction_bets(market_id);
CREATE INDEX IF NOT EXISTS idx_bets_user ON prediction_bets(user_email);
CREATE INDEX IF NOT EXISTS idx_bets_status ON prediction_bets(status);

-- 7. POSITIONS (user share holdings)
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  market_id UUID NOT NULL REFERENCES prediction_markets(id),
  outcome TEXT NOT NULL, -- yes, no
  shares NUMERIC(12,4) DEFAULT 0,
  avg_price NUMERIC(6,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, market_id, outcome)
);

CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);

-- 8. PLATFORM FEES
CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  fee_type TEXT NOT NULL, -- market, deposit
  related_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fees_type ON platform_fees(fee_type);
CREATE INDEX IF NOT EXISTS idx_fees_created ON platform_fees(created_at);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  type TEXT NOT NULL, -- deposit, payment_failed, payout
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_email ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(read);

-- 10. USER BALANCES (gamification / leaderboard)
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  balance NUMERIC(12,2) DEFAULT 0,
  total_deposited NUMERIC(12,2) DEFAULT 0,
  total_withdrawn NUMERIC(12,2) DEFAULT 0,
  streak_count INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  total_trades INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  xp_points INT DEFAULT 0,
  rank_title TEXT DEFAULT 'Rookie',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ub_user ON user_balances(user_id);

-- 11. STREAK EVENTS
CREATE TABLE IF NOT EXISTS streak_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  market_id UUID NOT NULL REFERENCES prediction_markets(id),
  won BOOLEAN NOT NULL,
  streak_after INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  streak_multiplier NUMERIC(4,2) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streak_user ON streak_events(user_id);

-- 12. LAWYER PROFILES
CREATE TABLE IF NOT EXISTS lawyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  bar_number TEXT,
  years_of_experience INT DEFAULT 0,
  specializations TEXT[] DEFAULT '{}',
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  consultation_fee NUMERIC(10,2) DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. LAWYER BOOKINGS
CREATE TABLE IF NOT EXISTS lawyer_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id),
  lawyer_id UUID NOT NULL REFERENCES lawyer_profiles(id),
  booking_type TEXT DEFAULT 'consultation',
  scheduled_at TIMESTAMPTZ,
  amount NUMERIC(10,2),
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_client ON lawyer_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lawyer ON lawyer_bookings(lawyer_id);

-- 14. BOOKINGS (general, used by webhook for payment confirmation)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  total_amount NUMERIC(10,2),
  status TEXT DEFAULT 'pending',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- User wallets: users can read own; server (service role) handles writes
CREATE POLICY "wallets_select" ON user_wallets FOR SELECT USING (auth.jwt()->>'email' = user_email);
CREATE POLICY "wallets_service_all" ON user_wallets FOR ALL USING (auth.role() = 'service_role');

-- Wallet transactions: users can read own; service role writes
CREATE POLICY "tx_select" ON wallet_transactions FOR SELECT USING (auth.jwt()->>'email' = user_email);
CREATE POLICY "tx_service_all" ON wallet_transactions FOR ALL USING (auth.role() = 'service_role');

-- Payments: users can read own; service role writes
CREATE POLICY "payments_select" ON payments FOR SELECT USING (auth.jwt()->>'email' = user_email);
CREATE POLICY "payments_service_all" ON payments FOR ALL USING (auth.role() = 'service_role');

-- Prediction markets: anyone can read open markets; service role manages all
CREATE POLICY "markets_select" ON prediction_markets FOR SELECT USING (true);
CREATE POLICY "markets_service_all" ON prediction_markets FOR ALL USING (auth.role() = 'service_role');

-- Prediction bets: users can read own; service role writes
CREATE POLICY "bets_select" ON prediction_bets FOR SELECT USING (auth.jwt()->>'email' = user_email);
CREATE POLICY "bets_service_all" ON prediction_bets FOR ALL USING (auth.role() = 'service_role');

-- Positions: users can read own; service role writes
CREATE POLICY "positions_select" ON positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "positions_service_all" ON positions FOR ALL USING (auth.role() = 'service_role');

-- Platform fees: service role only
CREATE POLICY "fees_service_all" ON platform_fees FOR ALL USING (auth.role() = 'service_role');

-- Notifications: users can read own; service role writes
CREATE POLICY "notif_select" ON notifications FOR SELECT USING (auth.jwt()->>'email' = user_email);
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (auth.jwt()->>'email' = user_email);
CREATE POLICY "notif_service_all" ON notifications FOR ALL USING (auth.role() = 'service_role');

-- User balances: users can read own; service role manages
CREATE POLICY "ub_select" ON user_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ub_service_all" ON user_balances FOR ALL USING (auth.role() = 'service_role');

-- Streak events: users can read own; service role writes
CREATE POLICY "streak_select" ON streak_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "streak_service_all" ON streak_events FOR ALL USING (auth.role() = 'service_role');

-- Lawyer profiles: anyone can read; service role manages
CREATE POLICY "lawyers_select" ON lawyer_profiles FOR SELECT USING (true);
CREATE POLICY "lawyers_service_all" ON lawyer_profiles FOR ALL USING (auth.role() = 'service_role');

-- Lawyer bookings: users can read own bookings
CREATE POLICY "lbookings_select" ON lawyer_bookings FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id);
CREATE POLICY "lbookings_service_all" ON lawyer_bookings FOR ALL USING (auth.role() = 'service_role');

-- Bookings: service role only
CREATE POLICY "bookings_service_all" ON bookings FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- DONE! All 14 tables created with indexes and RLS policies.
-- ============================================================
