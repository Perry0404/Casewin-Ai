-- ============================================================
-- Migration 007: Clear old markets + seed real markets 
-- Base deposits + withdrawals tables
-- Run in Supabase SQL Editor
-- ============================================================

-- Create base_deposits table for tracking on-chain deposits
CREATE TABLE IF NOT EXISTS base_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  from_address TEXT NOT NULL,
  token TEXT NOT NULL, -- 'ETH' or 'USDC'
  amount NUMERIC NOT NULL,
  ngn_amount NUMERIC NOT NULL,
  rate_used NUMERIC NOT NULL,
  block_number BIGINT,
  block_time TIMESTAMPTZ,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on base_deposits
ALTER TABLE base_deposits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own deposits' AND tablename = 'base_deposits') THEN
    CREATE POLICY "Users can view their own deposits" ON base_deposits FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can insert deposits' AND tablename = 'base_deposits') THEN
    CREATE POLICY "Service role can insert deposits" ON base_deposits FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Create base_withdrawals table for tracking withdrawal requests
CREATE TABLE IF NOT EXISTS base_withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  to_address TEXT NOT NULL,
  token TEXT NOT NULL, -- 'ETH' or 'USDC'
  crypto_amount NUMERIC NOT NULL,
  ngn_amount NUMERIC NOT NULL,
  fee_ngn NUMERIC DEFAULT 0,
  net_ngn NUMERIC NOT NULL,
  rate_used NUMERIC NOT NULL,
  tx_hash TEXT, -- filled when admin processes it
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on base_withdrawals
ALTER TABLE base_withdrawals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own withdrawals' AND tablename = 'base_withdrawals') THEN
    CREATE POLICY "Users can view their own withdrawals" ON base_withdrawals FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage withdrawals' AND tablename = 'base_withdrawals') THEN
    CREATE POLICY "Service role can manage withdrawals" ON base_withdrawals FOR ALL WITH CHECK (true);
  END IF;
END $$;

-- Create user_balances if not exists (might already exist)
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 0,
  total_deposited NUMERIC DEFAULT 0,
  total_withdrawn NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallet_transactions if not exists
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'bet', 'win'
  amount NUMERIC NOT NULL,
  balance_after NUMERIC,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLEAR ALL EXISTING PREDICTION MARKETS
-- ============================================================
DELETE FROM prediction_markets;

-- ============================================================
-- SEED REAL MARKETS — March 2026
-- ============================================================

-- ⚽ SPORTS — Today's UCL Round of 16 Second Legs (March 11, 2026)
-- 2025/26 UCL new format: 36-team league phase → playoff → R16 → QF → SF → Final
INSERT INTO prediction_markets (title, description, category, status, closes_at, total_pool, liquidity_pool, outcome_options, resolution_source)
VALUES
(
  'Liverpool to beat Bayern Munich in UCL R16 2nd Leg (March 11)',
  'UEFA Champions League 2025/26 Round of 16, 2nd Leg: Liverpool vs Bayern Munich at Anfield. Liverpool won the first leg 2-1 in Munich. Salah and Núñez vs Musiala and Kane in a blockbuster tie. Kick-off 21:00 CET.',
  'sports', 'open',
  '2026-03-11T23:59:00Z',
  195000, 25000,
  '{"yes_shares": 24000, "no_shares": 26000}',
  'UEFA official results'
),
(
  'Real Madrid to beat Manchester City in UCL R16 2nd Leg (March 11)',
  'UEFA Champions League 2025/26 Round of 16, 2nd Leg: Real Madrid vs Manchester City at the Bernabéu. The first leg ended 1-1 at the Etihad. Mbappé and Vinícius Jr. vs Haaland and De Bruyne in this modern classic rivalry. Kick-off 21:00 CET.',
  'sports', 'open',
  '2026-03-11T23:59:00Z',
  210000, 28000,
  '{"yes_shares": 25000, "no_shares": 25000}',
  'UEFA official results'
),
(
  'Over 2.5 goals in Liverpool vs Bayern Munich UCL R16 (March 11)',
  'Will there be 3 or more total goals in the Liverpool vs Bayern Munich Champions League R16 second leg at Anfield? First leg produced 3 goals. Both sides have been prolific in Europe this season.',
  'sports', 'open',
  '2026-03-11T23:59:00Z',
  88000, 20000,
  '{"yes_shares": 23000, "no_shares": 17000}',
  'UEFA official match stats'
),
(
  'Mbappé to score in Real Madrid vs Man City UCL R16',
  'Will Kylian Mbappé score at least one goal in the Real Madrid vs Manchester City Champions League Round of 16 second leg at the Bernabéu?',
  'sports', 'open',
  '2026-03-11T23:59:00Z',
  72000, 20000,
  '{"yes_shares": 18000, "no_shares": 22000}',
  'UEFA official match stats'
),
(
  'Atlético Madrid to eliminate Arsenal in UCL R16 (March 11)',
  'Will Atlético Madrid advance past Arsenal over two legs in the UCL Round of 16? First leg ended 0-0 at the Emirates. Simeone''s side have a strong home record in European knockouts at the Metropolitano.',
  'sports', 'open',
  '2026-03-11T23:59:00Z',
  105000, 22000,
  '{"yes_shares": 20000, "no_shares": 24000}',
  'UEFA official results'
);

-- ₿ CRYPTO
INSERT INTO prediction_markets (title, description, category, status, closes_at, total_pool, liquidity_pool, outcome_options, resolution_source)
VALUES
(
  'Bitcoin above $120,000 by March 31, 2026',
  'Will BTC/USD close above $120,000 on any major exchange (Coinbase, Binance) by March 31, 2026? Bitcoin is currently trading around $108,000 after the post-halving rally.',
  'crypto', 'open',
  '2026-03-31T23:59:00Z',
  320000, 30000,
  '{"yes_shares": 26000, "no_shares": 34000}',
  'CoinGecko, CoinMarketCap'
),
(
  'Ethereum to flip $5,000 before Q2 2026',
  'Will ETH/USD reach $5,000 on any major exchange before April 1, 2026? ETH has been riding the Base L2 adoption wave and EIP upgrades.',
  'crypto', 'open',
  '2026-04-01T23:59:00Z',
  210000, 25000,
  '{"yes_shares": 21000, "no_shares": 29000}',
  'CoinGecko, CoinMarketCap'
),
(
  'Base TVL to exceed $20 billion by end of March 2026',
  'Will Coinbase Base L2 total value locked surpass $20B by March 31? Base has seen explosive DeFi growth with over $15B TVL currently.',
  'crypto', 'open',
  '2026-03-31T23:59:00Z',
  95000, 20000,
  '{"yes_shares": 24000, "no_shares": 16000}',
  'DefiLlama'
);

-- 💻 TECHNOLOGY
INSERT INTO prediction_markets (title, description, category, status, closes_at, total_pool, liquidity_pool, outcome_options, resolution_source)
VALUES
(
  'Apple to announce AR glasses at WWDC 2026',
  'Will Apple officially announce consumer AR glasses (not Vision Pro successor) at WWDC June 2026? Multiple supply chain leaks suggest a lighter, cheaper device.',
  'technology', 'open',
  '2026-06-15T23:59:00Z',
  175000, 25000,
  '{"yes_shares": 19000, "no_shares": 31000}',
  'Apple official announcement'
),
(
  'OpenAI to release GPT-5 before May 2026',
  'Will OpenAI publicly release (not just preview) GPT-5 to ChatGPT users before May 1, 2026? CEO hinted at a "major model release" in Q1/Q2.',
  'technology', 'open',
  '2026-05-01T23:59:00Z',
  250000, 28000,
  '{"yes_shares": 27000, "no_shares": 23000}',
  'OpenAI official release'
);

-- 🌍 WORLD POLITICS
INSERT INTO prediction_markets (title, description, category, status, closes_at, total_pool, liquidity_pool, outcome_options, resolution_source)
VALUES
(
  'Ukraine-Russia ceasefire agreement signed by June 2026',
  'Will Ukraine and Russia sign a formal ceasefire or peace agreement before July 1, 2026? Diplomatic talks have intensified with US and EU mediation.',
  'world_politics', 'open',
  '2026-07-01T23:59:00Z',
  280000, 30000,
  '{"yes_shares": 16000, "no_shares": 34000}',
  'UN, Reuters, AP News'
),
(
  'Nigeria GDP growth above 4% for Q1 2026',
  'Will Nigeria report GDP growth above 4% for Q1 2026? The CBN reforms and oil production recovery have boosted economic outlook.',
  'world_politics', 'open',
  '2026-06-30T23:59:00Z',
  120000, 22000,
  '{"yes_shares": 23000, "no_shares": 21000}',
  'NBS (National Bureau of Statistics)'
);

-- 🗳️ ELECTIONS
INSERT INTO prediction_markets (title, description, category, status, closes_at, total_pool, liquidity_pool, outcome_options, resolution_source)
VALUES
(
  'Anambra State Governor race: APGA to retain seat',
  'Will APGA win the 2025 Anambra gubernatorial election re-run/by-election? The party has held the seat since 2006.',
  'elections', 'open',
  '2026-04-15T23:59:00Z',
  85000, 20000,
  '{"yes_shares": 22000, "no_shares": 18000}',
  'INEC official results'
),
(
  'US 2026 Midterms: Democrats to win Senate',
  'Will the Democratic Party hold or gain a majority in the US Senate after the November 2026 midterm elections?',
  'elections', 'open',
  '2026-11-10T23:59:00Z',
  340000, 30000,
  '{"yes_shares": 20000, "no_shares": 30000}',
  'AP/Reuters election calls'
);

-- ⚖️ COURT CASES
INSERT INTO prediction_markets (title, description, category, status, closes_at, total_pool, liquidity_pool, outcome_options, resolution_source)
VALUES
(
  'SEC vs Coinbase case: Coinbase to win/settle favorably',
  'Will Coinbase receive a favorable ruling or settlement in the ongoing SEC enforcement action before July 2026? Recent court filings suggest the judge is skeptical of SEC''s position.',
  'court_cases', 'open',
  '2026-07-01T23:59:00Z',
  195000, 25000,
  '{"yes_shares": 26000, "no_shares": 24000}',
  'US Court filings, PACER'
),
(
  'Trump civil fraud appeal: Penalty to be reduced',
  'Will the New York appellate court reduce Trump''s civil fraud penalty from the original $454M judgment?',
  'court_cases', 'open',
  '2026-06-30T23:59:00Z',
  150000, 22000,
  '{"yes_shares": 28000, "no_shares": 22000}',
  'NYS Court records'
);

-- 🎬 ENTERTAINMENT
INSERT INTO prediction_markets (title, description, category, status, closes_at, total_pool, liquidity_pool, outcome_options, resolution_source)
VALUES
(
  'GTA 6 to release before September 2026',
  'Will Grand Theft Auto VI be released (publicly playable) before September 1, 2026? Rockstar confirmed a Fall 2025 window but delays are rumored.',
  'entertainment', 'open',
  '2026-09-01T23:59:00Z',
  420000, 35000,
  '{"yes_shares": 18000, "no_shares": 32000}',
  'Rockstar Games official release'
),
(
  'Wizkid to win Grammy for Best Global Music Album 2027',
  'Will Wizkid''s latest album win the Grammy for Best Global Music Album at the 2027 ceremony?',
  'entertainment', 'open',
  '2026-12-31T23:59:00Z',
  75000, 20000,
  '{"yes_shares": 17000, "no_shares": 23000}',
  'Recording Academy / Grammy.com'
);

-- 🏢 CORPORATE
INSERT INTO prediction_markets (title, description, category, status, closes_at, total_pool, liquidity_pool, outcome_options, resolution_source)
VALUES
(
  'Nvidia market cap to exceed $5 trillion by June 2026',
  'Will Nvidia''s market capitalization surpass $5 trillion USD before July 1, 2026? Currently at ~$4.2T driven by AI chip demand.',
  'corporate', 'open',
  '2026-07-01T23:59:00Z',
  290000, 28000,
  '{"yes_shares": 25000, "no_shares": 25000}',
  'Yahoo Finance, Bloomberg'
),
(
  'TikTok US ban to be enforced in 2026',
  'Will TikTok be banned or forced to divest its US operations in 2026? Despite legislative action, enforcement has been repeatedly delayed.',
  'corporate', 'open',
  '2026-12-31T23:59:00Z',
  180000, 25000,
  '{"yes_shares": 15000, "no_shares": 35000}',
  'US government official actions'
);

-- 🚨 CRIMINAL
INSERT INTO prediction_markets (title, description, category, status, closes_at, total_pool, liquidity_pool, outcome_options, resolution_source)
VALUES
(
  'Binance founder CZ: Full sentence to be served',
  'Will Changpeng Zhao (CZ) complete his full custodial sentence without early release or commutation?',
  'criminal', 'open',
  '2026-06-30T23:59:00Z',
  88000, 20000,
  '{"yes_shares": 20000, "no_shares": 20000}',
  'US Bureau of Prisons'
);

-- 📋 REGULATORY
INSERT INTO prediction_markets (title, description, category, status, closes_at, total_pool, liquidity_pool, outcome_options, resolution_source)
VALUES
(
  'Nigeria SEC to approve crypto exchange licensing framework in 2026',
  'Will the Nigerian Securities and Exchange Commission finalize and publish a crypto exchange licensing framework in 2026? Consultation papers were released in late 2025.',
  'regulatory', 'open',
  '2026-12-31T23:59:00Z',
  105000, 22000,
  '{"yes_shares": 25000, "no_shares": 19000}',
  'Nigerian SEC official gazette'
);

-- 📜 LEGAL REFORM
INSERT INTO prediction_markets (title, description, category, status, closes_at, total_pool, liquidity_pool, outcome_options, resolution_source)
VALUES
(
  'Nigeria Electoral Act amendment to pass in 2026',
  'Will the Nigerian National Assembly pass amendments to the Electoral Act before end of 2026? Key proposals include electronic voting expansion and diaspora voting.',
  'legal_reform', 'open',
  '2026-12-31T23:59:00Z',
  95000, 20000,
  '{"yes_shares": 21000, "no_shares": 19000}',
  'Nigerian National Assembly records'
);

-- 🏛️ SUPREME COURT
INSERT INTO prediction_markets (title, description, category, status, closes_at, total_pool, liquidity_pool, outcome_options, resolution_source)
VALUES
(
  'US Supreme Court to rule on AI copyright by end of 2026 term',
  'Will the US Supreme Court accept and rule on a case involving AI-generated content copyright during its 2025-2026 term?',
  'supreme_court', 'open',
  '2026-10-01T23:59:00Z',
  160000, 24000,
  '{"yes_shares": 17000, "no_shares": 23000}',
  'SCOTUSblog, US Supreme Court docket'
);

-- ============================================================
-- DONE! Markets are live.
-- ============================================================
