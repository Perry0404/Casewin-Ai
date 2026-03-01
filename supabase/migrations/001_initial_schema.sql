-- CaseWin AI - Complete Database Schema (Clean Install)
-- Drops ALL old tables and recreates with correct schema
-- Run this FIRST in Supabase SQL Editor

-- ============================================================
-- DROP EXISTING TABLES/VIEWS (handles both cases safely)
-- ============================================================
DO $$ BEGIN EXECUTE 'DROP VIEW IF EXISTS market_votes CASCADE'; EXCEPTION WHEN wrong_object_type THEN EXECUTE 'DROP TABLE IF EXISTS market_votes CASCADE'; END $$;
DO $$ BEGIN EXECUTE 'DROP VIEW IF EXISTS trades CASCADE'; EXCEPTION WHEN wrong_object_type THEN EXECUTE 'DROP TABLE IF EXISTS trades CASCADE'; END $$;
DO $$ BEGIN EXECUTE 'DROP VIEW IF EXISTS positions CASCADE'; EXCEPTION WHEN wrong_object_type THEN EXECUTE 'DROP TABLE IF EXISTS positions CASCADE'; END $$;
DO $$ BEGIN EXECUTE 'DROP VIEW IF EXISTS user_balances CASCADE'; EXCEPTION WHEN wrong_object_type THEN EXECUTE 'DROP TABLE IF EXISTS user_balances CASCADE'; END $$;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS case_predictions CASCADE;
DROP TABLE IF EXISTS research_history CASCADE;
DROP TABLE IF EXISTS saved_documents CASCADE;
DROP TABLE IF EXISTS prediction_bets CASCADE;
DROP TABLE IF EXISTS prediction_markets CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS lawyer_bookings CASCADE;
DROP TABLE IF EXISTS lawyer_profiles CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS legal_cases CASCADE;
DROP TABLE IF EXISTS legal_statutes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  user_type TEXT NOT NULL DEFAULT 'client' CHECK (user_type IN ('client', 'lawyer', 'law_firm')),
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. WALLETS & TRANSACTIONS
-- ============================================================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE VIEW user_balances AS SELECT * FROM wallets;

-- Auto-create profile + wallet on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client')
  );
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'NGN');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund', 'earning', 'bet', 'win')),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);

-- ============================================================
-- 3. LAWYER PROFILES & MARKETPLACE
-- ============================================================
CREATE TABLE lawyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bar_number TEXT,
  years_of_experience INTEGER NOT NULL DEFAULT 0,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  hourly_rate DECIMAL(10,2),
  consultation_fee DECIMAL(10,2),
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  total_cases INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_date TIMESTAMPTZ,
  location TEXT,
  state TEXT,
  bio TEXT,
  languages TEXT[] DEFAULT '{English}',
  education JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_lawyer_verified ON lawyer_profiles(is_verified) WHERE is_verified = true;
CREATE INDEX idx_lawyer_specializations ON lawyer_profiles USING GIN(specializations);
CREATE INDEX idx_lawyer_state ON lawyer_profiles(state);

CREATE TABLE lawyer_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id),
  lawyer_id UUID NOT NULL REFERENCES lawyer_profiles(id),
  booking_type TEXT NOT NULL DEFAULT 'consultation' CHECK (booking_type IN ('consultation', 'case_review', 'document_review', 'representation')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  meeting_link TEXT,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_client ON lawyer_bookings(client_id);
CREATE INDEX idx_bookings_lawyer ON lawyer_bookings(lawyer_id);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  lawyer_id UUID NOT NULL REFERENCES lawyer_profiles(id),
  booking_id UUID REFERENCES lawyer_bookings(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, booking_id)
);

-- ============================================================
-- 4. PREDICTION MARKETS
-- ============================================================
CREATE TABLE prediction_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  case_reference TEXT,
  court TEXT,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('supreme_court', 'appeal', 'high_court', 'tribunal', 'legislation', 'other')),
  outcome_options JSONB NOT NULL DEFAULT '[]',
  total_pool DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved', 'cancelled')),
  resolution_date TIMESTAMPTZ,
  actual_outcome TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closes_at TIMESTAMPTZ
);

CREATE INDEX idx_markets_status ON prediction_markets(status);

CREATE TABLE prediction_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  market_id UUID NOT NULL REFERENCES prediction_markets(id),
  selected_outcome TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  potential_payout DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bets_user ON prediction_bets(user_id);
CREATE INDEX idx_bets_market ON prediction_bets(market_id);

CREATE VIEW positions AS
  SELECT id, user_id, market_id, selected_outcome, amount, potential_payout, status, created_at
  FROM prediction_bets;

CREATE VIEW trades AS
  SELECT id, user_id, market_id, selected_outcome, amount, status, created_at
  FROM prediction_bets;

CREATE VIEW market_votes AS
  SELECT id, user_id, market_id, selected_outcome, amount, status, created_at
  FROM prediction_bets;

-- ============================================================
-- 5. SAVED DOCUMENTS & RESEARCH HISTORY
-- ============================================================
CREATE TABLE saved_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other' CHECK (document_type IN ('contract', 'letter', 'pleading', 'affidavit', 'mou', 'power-of-attorney', 'will', 'tenancy', 'other')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_docs_user ON saved_documents(user_id);

CREATE TABLE research_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results JSONB,
  jurisdiction TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_user ON research_history(user_id);

CREATE TABLE case_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_type TEXT,
  case_facts TEXT,
  legal_issues TEXT,
  jurisdiction TEXT,
  client_position TEXT,
  prediction_result JSONB,
  win_probability DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. NIGERIAN CASE LAW DATABASE
-- ============================================================
CREATE TABLE legal_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_title TEXT NOT NULL,
  citation TEXT NOT NULL,
  court TEXT NOT NULL,
  year INTEGER NOT NULL,
  judges TEXT[],
  category TEXT NOT NULL,
  subject_matter TEXT[] NOT NULL DEFAULT '{}',
  facts TEXT,
  issues TEXT[],
  holding TEXT NOT NULL,
  ratio_decidendi TEXT,
  obiter_dicta TEXT,
  full_text TEXT,
  statutes_considered TEXT[],
  cases_cited TEXT[],
  outcome TEXT NOT NULL CHECK (outcome IN ('allowed', 'dismissed', 'struck_out', 'settled', 'other')),
  jurisdiction TEXT NOT NULL DEFAULT 'Nigeria',
  state TEXT,
  is_landmark BOOLEAN NOT NULL DEFAULT false,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cases_search ON legal_cases USING GIN(search_vector);
CREATE INDEX idx_cases_court ON legal_cases(court);
CREATE INDEX idx_cases_year ON legal_cases(year);
CREATE INDEX idx_cases_category ON legal_cases(category);
CREATE INDEX idx_cases_subjects ON legal_cases USING GIN(subject_matter);
CREATE INDEX idx_cases_citation ON legal_cases(citation);
CREATE INDEX idx_cases_landmark ON legal_cases(is_landmark) WHERE is_landmark = true;

CREATE OR REPLACE FUNCTION update_case_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.case_title, '') || ' ' ||
    COALESCE(NEW.citation, '') || ' ' ||
    COALESCE(NEW.court, '') || ' ' ||
    COALESCE(NEW.category, '') || ' ' ||
    COALESCE(NEW.holding, '') || ' ' ||
    COALESCE(NEW.ratio_decidendi, '') || ' ' ||
    COALESCE(NEW.facts, '') || ' ' ||
    COALESCE(array_to_string(NEW.subject_matter, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.issues, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.statutes_considered, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS case_search_update ON legal_cases;
CREATE TRIGGER case_search_update
  BEFORE INSERT OR UPDATE ON legal_cases
  FOR EACH ROW EXECUTE FUNCTION update_case_search_vector();

-- ============================================================
-- 7. NIGERIAN STATUTES
-- ============================================================
CREATE TABLE legal_statutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  short_title TEXT,
  year INTEGER,
  chapter TEXT,
  part TEXT,
  section TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'Federal',
  is_active BOOLEAN NOT NULL DEFAULT true,
  amendments JSONB DEFAULT '[]',
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_statutes_search ON legal_statutes USING GIN(search_vector);
CREATE INDEX idx_statutes_category ON legal_statutes(category);
CREATE INDEX idx_statutes_title ON legal_statutes(title);

CREATE OR REPLACE FUNCTION update_statute_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.short_title, '') || ' ' ||
    COALESCE(NEW.content, '') || ' ' ||
    COALESCE(NEW.category, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS statute_search_update ON legal_statutes;
CREATE TRIGGER statute_search_update
  BEFORE INSERT OR UPDATE ON legal_statutes
  FOR EACH ROW EXECUTE FUNCTION update_statute_search_vector();

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'payment', 'booking', 'prediction')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- 9. PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  provider TEXT NOT NULL DEFAULT 'paystack',
  reference TEXT UNIQUE,
  provider_reference TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_reference ON payments(reference);

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_statutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own bookings" ON lawyer_bookings FOR SELECT USING (auth.uid() = client_id OR auth.uid() IN (SELECT user_id FROM lawyer_profiles WHERE id = lawyer_id));
CREATE POLICY "Users can create bookings" ON lawyer_bookings FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can write reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Anyone can read markets" ON prediction_markets FOR SELECT USING (true);
CREATE POLICY "Authenticated can create markets" ON prediction_markets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view own bets" ON prediction_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can place bets" ON prediction_bets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own documents" ON saved_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create documents" ON saved_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON saved_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON saved_documents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users own research" ON research_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save research" ON research_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own predictions" ON case_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save predictions" ON case_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view verified lawyers" ON lawyer_profiles FOR SELECT USING (true);
CREATE POLICY "Lawyers can update own profile" ON lawyer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can register as lawyer" ON lawyer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can read cases" ON legal_cases FOR SELECT USING (true);
CREATE POLICY "Anyone can read statutes" ON legal_statutes FOR SELECT USING (true);
