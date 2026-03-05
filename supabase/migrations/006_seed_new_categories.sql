-- CaseWin AI - Seed Crypto, Technology & World Politics Markets
-- Run this in Supabase SQL Editor after 005

-- ============================================================
-- CRYPTO PREDICTION MARKETS
-- ============================================================
INSERT INTO prediction_markets (title, description, category, outcome_options, total_pool, liquidity_pool, status, closes_at) VALUES

('Bitcoin Price Above $150,000 by End of 2025',
 'Will Bitcoin (BTC) reach and sustain a price above $150,000 USD before December 31, 2025?',
 'crypto',
 '{"yes_shares": 12000, "no_shares": 8000}',
 45000, 10000, 'open', NOW() + INTERVAL '180 days'),

('Nigeria CBN to Approve Crypto Exchange Licensing',
 'Will the Central Bank of Nigeria officially license at least one cryptocurrency exchange before Q2 2026?',
 'crypto',
 '{"yes_shares": 9000, "no_shares": 11000}',
 38000, 10000, 'open', NOW() + INTERVAL '365 days'),

('Ethereum ETF Approval in More Countries',
 'Will at least 3 additional countries approve spot Ethereum ETFs in the next 12 months?',
 'crypto',
 '{"yes_shares": 11000, "no_shares": 9000}',
 52000, 10000, 'open', NOW() + INTERVAL '365 days'),

('Stablecoin Regulation Framework in Nigeria',
 'Will the SEC Nigeria publish a formal stablecoin regulatory framework by end of 2025?',
 'crypto',
 '{"yes_shares": 7000, "no_shares": 13000}',
 28000, 10000, 'open', NOW() + INTERVAL '200 days'),

('Bitcoin Adoption as Legal Tender in Another African Nation',
 'Will any African country besides CAR adopt Bitcoin as legal tender in the next 2 years?',
 'crypto',
 '{"yes_shares": 6000, "no_shares": 14000}',
 22000, 10000, 'open', NOW() + INTERVAL '730 days'),

-- ============================================================
-- TECHNOLOGY PREDICTION MARKETS
-- ============================================================

('OpenAI to Release GPT-5 Before 2026',
 'Will OpenAI officially release GPT-5 (or equivalent next-gen model) to the public before January 1, 2026?',
 'technology',
 '{"yes_shares": 13000, "no_shares": 7000}',
 61000, 10000, 'open', NOW() + INTERVAL '180 days'),

('Nigeria Digital ID Coverage Above 80%',
 'Will the National Identity Management Commission (NIMC) achieve 80% NIN coverage of the Nigerian population by end of 2025?',
 'technology',
 '{"yes_shares": 5000, "no_shares": 15000}',
 33000, 10000, 'open', NOW() + INTERVAL '180 days'),

('First Autonomous Ride-Hailing in Lagos',
 'Will any company launch an autonomous (self-driving) ride-hailing service in Lagos before 2027?',
 'technology',
 '{"yes_shares": 3000, "no_shares": 17000}',
 18000, 10000, 'open', NOW() + INTERVAL '730 days'),

('AI Regulation Bill Passed in Nigeria',
 'Will the National Assembly pass a comprehensive AI regulation bill before the end of 2026?',
 'technology',
 '{"yes_shares": 8000, "no_shares": 12000}',
 40000, 10000, 'open', NOW() + INTERVAL '540 days'),

('Starlink Subscriber Count in Nigeria Above 1 Million',
 'Will Starlink Nigeria surpass 1 million active subscribers by end of 2025?',
 'technology',
 '{"yes_shares": 10000, "no_shares": 10000}',
 47000, 10000, 'open', NOW() + INTERVAL '180 days'),

-- ============================================================
-- WORLD POLITICS PREDICTION MARKETS
-- ============================================================

('US Presidential Election 2028 - Democratic Nominee',
 'Will the Democratic Party nominate a candidate under age 60 for the 2028 US Presidential Election?',
 'world_politics',
 '{"yes_shares": 11000, "no_shares": 9000}',
 55000, 10000, 'open', NOW() + INTERVAL '1000 days'),

('ECOWAS Single Currency Launch Before 2030',
 'Will ECOWAS successfully launch the ECO as a single currency before 2030?',
 'world_politics',
 '{"yes_shares": 4000, "no_shares": 16000}',
 25000, 10000, 'open', NOW() + INTERVAL '1800 days'),

('African Union Permanent UN Security Council Seat',
 'Will Africa secure at least one permanent seat on the UN Security Council through reform by 2030?',
 'world_politics',
 '{"yes_shares": 6000, "no_shares": 14000}',
 30000, 10000, 'open', NOW() + INTERVAL '1800 days'),

('Nigeria to Become Africa Largest Economy Again',
 'Will Nigeria reclaim its position as Africas largest economy (by GDP) from South Africa before 2027?',
 'world_politics',
 '{"yes_shares": 9000, "no_shares": 11000}',
 42000, 10000, 'open', NOW() + INTERVAL '730 days'),

('Russia-Ukraine Ceasefire Agreement',
 'Will Russia and Ukraine reach a formal ceasefire or peace agreement before the end of 2025?',
 'world_politics',
 '{"yes_shares": 7000, "no_shares": 13000}',
 58000, 10000, 'open', NOW() + INTERVAL '180 days');
