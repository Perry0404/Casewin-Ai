-- CaseWin AI - Seed Prediction Markets & Lawyer Profiles
-- Run this THIRD in Supabase SQL Editor (after 002)

-- Clean any existing seed data first
DELETE FROM prediction_markets WHERE created_by IS NULL;
DELETE FROM lawyer_profiles WHERE email LIKE '%@casewin.example';

-- ============================================================
-- PREDICTION MARKETS
-- ============================================================
INSERT INTO prediction_markets (title, description, case_reference, court, category, outcome_options, total_pool, status, closes_at) VALUES

('Supreme Court Ruling on Digital Assets Classification',
 'Will the Supreme Court classify cryptocurrencies as securities under Nigerian law in the pending CBN v. Digital Assets Dealers case?',
 'SC/CV/2024/001', 'Supreme Court', 'supreme_court',
 '[{"label":"Classified as Securities","probability":0.35},{"label":"Not Securities - Commodities","probability":0.40},{"label":"New Regulatory Category","probability":0.25}]',
 150000, 'open', NOW() + INTERVAL '90 days'),

('Appeal Court Decision on Remote Hearing Validity',
 'Will the Court of Appeal uphold the validity of judgments delivered via remote/virtual hearings during and after the COVID-19 period?',
 'CA/LAG/CV/2024/123', 'Court of Appeal', 'appeal',
 '[{"label":"Fully Valid","probability":0.55},{"label":"Valid with Conditions","probability":0.30},{"label":"Invalid - Physical Presence Required","probability":0.15}]',
 85000, 'open', NOW() + INTERVAL '60 days'),

('NICN Ruling on Gig Workers Status',
 'How will the National Industrial Court classify gig economy workers (ride-hailing, delivery) - as employees or independent contractors?',
 'NICN/LA/2024/045', 'National Industrial Court', 'tribunal',
 '[{"label":"Employees","probability":0.30},{"label":"Independent Contractors","probability":0.45},{"label":"New Hybrid Category","probability":0.25}]',
 200000, 'open', NOW() + INTERVAL '120 days'),

('Federal High Court Decision on Social Media Regulation',
 'Will the Federal High Court uphold the NBC''s authority to regulate social media content under existing broadcasting laws?',
 'FHC/ABJ/CS/2024/789', 'Federal High Court', 'high_court',
 '[{"label":"NBC Authority Upheld","probability":0.25},{"label":"Authority Struck Down","probability":0.50},{"label":"Limited Authority","probability":0.25}]',
 120000, 'open', NOW() + INTERVAL '45 days'),

('Electoral Act Amendment on Electronic Transmission of Results',
 'Will the National Assembly pass the amendment mandating electronic transmission of election results for 2027?',
 'NASS/BILL/2024/EA-AMEND', 'National Assembly', 'legislation',
 '[{"label":"Full Electronic Transmission","probability":0.40},{"label":"Hybrid System","probability":0.35},{"label":"Amendment Rejected","probability":0.25}]',
 300000, 'open', NOW() + INTERVAL '180 days'),

('Supreme Court on State Police Creation',
 'Will the Supreme Court rule that states have the constitutional power to establish state police forces?',
 'SC/CV/2024/FED-v-STATES', 'Supreme Court', 'supreme_court',
 '[{"label":"States Can Create Police","probability":0.20},{"label":"Only Federal Police Allowed","probability":0.50},{"label":"Concurrent Power","probability":0.30}]',
 250000, 'open', NOW() + INTERVAL '150 days'),

('Lagos High Court Tenancy Dispute Resolution',
 'Will the Lagos High Court adopt the new Fast Track procedure for residential tenancy disputes, reducing resolution time?',
 'LD/LH/PRACTICE/2024/01', 'Lagos High Court', 'high_court',
 '[{"label":"Fast Track Adopted","probability":0.60},{"label":"Modified Procedure","probability":0.25},{"label":"Status Quo Maintained","probability":0.15}]',
 75000, 'open', NOW() + INTERVAL '30 days'),

('EFCC v. Former Governor - Asset Forfeiture',
 'Will the court order final forfeiture of assets in the EFCC''s case against the former state governor?',
 'FHC/ABJ/CR/2023/456', 'Federal High Court', 'high_court',
 '[{"label":"Full Forfeiture","probability":0.45},{"label":"Partial Forfeiture","probability":0.35},{"label":"Case Dismissed","probability":0.20}]',
 180000, 'open', NOW() + INTERVAL '75 days'),

('Court of Appeal - Landlord Tenant Act Interpretation',
 'How will the Court of Appeal interpret the notice requirement under the Lagos Tenancy Law for commercial properties?',
 'CA/LAG/CV/2024/567', 'Court of Appeal', 'appeal',
 '[{"label":"Strict 6-Month Notice","probability":0.40},{"label":"3-Month Notice Sufficient","probability":0.35},{"label":"Case-by-Case Basis","probability":0.25}]',
 95000, 'open', NOW() + INTERVAL '60 days'),

('Data Protection Commission Enforcement Action',
 'Will the Nigeria Data Protection Commission issue its first major fine against a telecom company for data breaches?',
 'NDPC/ENF/2024/001', 'Administrative Tribunal', 'tribunal',
 '[{"label":"Major Fine Issued","probability":0.50},{"label":"Warning Only","probability":0.30},{"label":"Settlement Reached","probability":0.20}]',
 160000, 'open', NOW() + INTERVAL '90 days');

-- ============================================================
-- SAMPLE LAWYER PROFILES (no user_id - for display only)
-- ============================================================
INSERT INTO lawyer_profiles (full_name, email, phone, bar_number, years_of_experience, specializations, hourly_rate, consultation_fee, rating, total_reviews, total_cases, win_rate, is_verified, location, state, bio, languages) VALUES

('Adebayo Ogunlesi', 'adebayo.ogunlesi@casewin.example', '+2348012345001', 'NBA/2005/4521',
 19, ARRAY['Corporate Law', 'Mergers & Acquisitions', 'Securities Law'],
 150000, 50000, 4.9, 127, 450, 89.5, true,
 'Victoria Island, Lagos', 'Lagos',
 'Senior Partner at Ogunlesi & Associates with extensive experience in corporate transactions, M&A, and capital markets. Advised on several landmark deals including major bank consolidations.',
 ARRAY['English', 'Yoruba']),

('Amina Mohammed-Bello', 'amina.bello@casewin.example', '+2348012345002', 'NBA/2008/6789',
 16, ARRAY['Human Rights', 'Constitutional Law', 'Criminal Defence'],
 120000, 40000, 4.8, 98, 320, 85.3, true,
 'Wuse, Abuja', 'FCT',
 'Award-winning human rights lawyer and constitutional law expert. Has argued several cases before the Supreme Court and ECOWAS Court.',
 ARRAY['English', 'Hausa', 'French']),

('Chukwuemeka Okafor', 'chukwuemeka.okafor@casewin.example', '+2348012345003', 'NBA/2010/8901',
 14, ARRAY['Oil & Gas Law', 'Environmental Law', 'Energy Law'],
 130000, 45000, 4.7, 76, 280, 82.1, true,
 'Port Harcourt, Rivers State', 'Rivers',
 'Specialized in oil and gas law with particular expertise in JOA disputes, environmental litigation, and regulatory compliance in the Niger Delta region.',
 ARRAY['English', 'Igbo']),

('Folashade Adeyemi-Williams', 'folashade.williams@casewin.example', '+2348012345004', 'NBA/2007/5678',
 17, ARRAY['Family Law', 'Estate Planning', 'Child Rights'],
 100000, 35000, 4.9, 156, 520, 91.2, true,
 'Ikeja, Lagos', 'Lagos',
 'Leading family law practitioner with a passion for child rights advocacy. Has handled complex custody disputes, high net-worth divorce proceedings, and estate administration matters.',
 ARRAY['English', 'Yoruba']),

('Ibrahim Suleiman Danjuma', 'ibrahim.danjuma@casewin.example', '+2348012345005', 'NBA/2003/3456',
 21, ARRAY['Land Law', 'Property Law', 'Real Estate'],
 140000, 48000, 4.6, 89, 380, 87.6, true,
 'Garki, Abuja', 'FCT',
 'One of Nigeria''s foremost land and property lawyers with deep expertise in the Land Use Act, compulsory acquisition, and real estate development transactions across multiple states.',
 ARRAY['English', 'Hausa', 'Fulfulde']),

('Ngozi Eze-Obi', 'ngozi.eze@casewin.example', '+2348012345006', 'NBA/2012/0123',
 12, ARRAY['Intellectual Property', 'Technology Law', 'Startup Law'],
 110000, 38000, 4.8, 65, 190, 88.4, true,
 'Lekki, Lagos', 'Lagos',
 'Tech-savvy IP lawyer specializing in protecting innovation. Advises leading Nigerian startups and tech companies on IP strategy, data protection compliance, and technology licensing.',
 ARRAY['English', 'Igbo']),

('Olumide Bankole SAN', 'olumide.bankole@casewin.example', '+2348012345007', 'NBA/1998/1234',
 26, ARRAY['Commercial Litigation', 'Arbitration', 'Banking Law'],
 200000, 75000, 4.9, 203, 680, 92.3, true,
 'Ikoyi, Lagos', 'Lagos',
 'Senior Advocate of Nigeria with over 25 years of experience in complex commercial litigation and international arbitration. Has appeared in over 50 Supreme Court cases.',
 ARRAY['English', 'Yoruba', 'French']),

('Hauwa Abdullahi-Kolo', 'hauwa.kolo@casewin.example', '+2348012345008', 'NBA/2011/7890',
 13, ARRAY['Immigration Law', 'International Law', 'Diplomatic Law'],
 100000, 35000, 4.5, 48, 160, 80.0, true,
 'Maitama, Abuja', 'FCT',
 'Immigration and international law specialist with expertise in work permits, expatriate quota management, and cross-border legal matters.',
 ARRAY['English', 'Hausa', 'Arabic']),

('Babatunde Fashola-Coker', 'babatunde.coker@casewin.example', '+2348012345009', 'NBA/2009/2345',
 15, ARRAY['Tax Law', 'Revenue Law', 'Customs Law'],
 120000, 42000, 4.7, 71, 240, 84.6, true,
 'Marina, Lagos', 'Lagos',
 'Tax law expert advising corporations and HNIs on tax planning, FIRS disputes, transfer pricing, and customs duty optimization. Former consultant to the Lagos State Internal Revenue Service.',
 ARRAY['English', 'Yoruba']),

('Aisha Garba-Musa', 'aisha.musa@casewin.example', '+2348012345010', 'NBA/2013/4567',
 11, ARRAY['Labour Law', 'Employment Law', 'Industrial Relations'],
 95000, 32000, 4.6, 54, 175, 83.4, true,
 'Central Business District, Abuja', 'FCT',
 'Employment law specialist with experience representing both employers and employees in the National Industrial Court. Expert in collective bargaining agreements and workplace dispute resolution.',
 ARRAY['English', 'Hausa']);
