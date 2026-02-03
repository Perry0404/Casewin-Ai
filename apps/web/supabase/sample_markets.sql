-- Sample Nigerian Legal Prediction Markets
-- Run this in your Supabase SQL Editor

INSERT INTO prediction_markets (title, description, case_reference, court, category, outcome_options, total_pool, status, closes_at) VALUES
(
  'FRN v. Orji Uzor Kalu - Will Supreme Court Uphold Conviction?',
  'The Supreme Court is reviewing the conviction of former Abia State Governor Orji Uzor Kalu on fraud charges. Will the conviction be upheld or overturned?',
  'SC/CV/123/2024',
  'Supreme Court of Nigeria',
  'supreme_court',
  '{"yes_votes": 45, "no_votes": 32}',
  850000,
  'open',
  '2026-04-15T00:00:00Z'
),
(
  'EFCC v. Mompha - Money Laundering Verdict',
  'Internet celebrity Ismaila Mustapha (Mompha) faces money laundering charges at the Federal High Court Lagos. Will he be convicted?',
  'FHC/L/CS/456/2023',
  'Federal High Court Lagos',
  'high_court',
  '{"yes_votes": 67, "no_votes": 89}',
  1200000,
  'open',
  '2026-03-30T00:00:00Z'
),
(
  'Peter Obi Election Petition - Court of Appeal Ruling',
  'Peter Obi''s legal team has appealed the Presidential Election Tribunal decision. Will the Court of Appeal rule in his favor?',
  'CA/ABJ/EP/2024/001',
  'Court of Appeal Abuja',
  'appeal',
  '{"yes_votes": 156, "no_votes": 203}',
  3500000,
  'open',
  '2026-05-01T00:00:00Z'
),
(
  'Rivers State Political Crisis - Supreme Court Final Verdict',
  'The Supreme Court will make a final ruling on the Rivers State political crisis involving Governor Fubara and the State Assembly. Will the Governor''s position be upheld?',
  'SC/CV/789/2025',
  'Supreme Court of Nigeria',
  'supreme_court',
  '{"yes_votes": 89, "no_votes": 45}',
  2100000,
  'open',
  '2026-06-15T00:00:00Z'
),
(
  'NNPC vs Oil Marketers - Price Fixing Tribunal',
  'Oil marketers have taken NNPC to tribunal over alleged price manipulation. Will the tribunal rule against NNPC?',
  'NIT/2025/034',
  'National Industrial Tribunal',
  'tribunal',
  '{"yes_votes": 23, "no_votes": 34}',
  450000,
  'open',
  '2026-04-01T00:00:00Z'
);

-- Verify insertion
SELECT id, title, category, total_pool, status FROM prediction_markets;
