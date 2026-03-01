-- CaseWin AI — Seed Prediction Markets
-- Real Nigerian legal questions based on ongoing legal issues
-- Run AFTER 001_initial_schema.sql

INSERT INTO prediction_markets (title, description, case_reference, court, category, outcome_options, total_pool, status, closes_at) VALUES

('Will the Supreme Court uphold the new Electoral Act amendments on electronic transmission of results?',
 'The 2022 Electoral Act introduced electronic transmission of election results. Several petitions challenge the constitutionality of specific provisions, particularly regarding the role of INEC in determining the mode of transmission.',
 'Electoral Act 2022, Section 50(2)',
 'Supreme Court of Nigeria',
 'supreme_court',
 '[{"id": "yes", "label": "Yes - Upheld", "odds": 1.65}, {"id": "no", "label": "No - Struck Down", "odds": 2.80}, {"id": "partial", "label": "Partially Modified", "odds": 3.20}]',
 0, 'open', NOW() + INTERVAL '90 days'),

('Will the Code of Conduct Tribunal convict in the pending asset declaration case against a serving governor?',
 'Multiple serving and former state governors face charges at the Code of Conduct Tribunal for alleged false asset declarations. The CCT has historically had mixed results in high-profile cases.',
 'CCT/ABJ/01/2025',
 'Code of Conduct Tribunal',
 'tribunal',
 '[{"id": "conviction", "label": "Conviction", "odds": 4.50}, {"id": "acquittal", "label": "Acquittal", "odds": 1.45}, {"id": "discharged", "label": "Discharged/No Case", "odds": 3.00}]',
 0, 'open', NOW() + INTERVAL '120 days'),

('Will the appeal on the Lagos State revenue allocation dispute succeed at the Supreme Court?',
 'Lagos State has been in a protracted legal battle with the Federal Government over the allocation of revenues, particularly regarding the status of Local Government Areas and direct allocation from the Federation Account.',
 'AG Lagos v. AG Federation',
 'Supreme Court of Nigeria',
 'supreme_court',
 '[{"id": "lagos_wins", "label": "Lagos State Wins", "odds": 2.10}, {"id": "fg_wins", "label": "Federal Government Wins", "odds": 2.20}, {"id": "compromise", "label": "Compromise/Split Decision", "odds": 3.50}]',
 0, 'open', NOW() + INTERVAL '60 days'),

('Will the National Assembly pass the Petroleum Industry Act amendment on host community share?',
 'Host communities in the Niger Delta have challenged the 3% operating expenditure allocation under the Petroleum Industry Act 2021, arguing it is insufficient. Bills to amend this provision are before the National Assembly.',
 'PIA 2021, Section 235',
 'National Assembly',
 'legislation',
 '[{"id": "increased", "label": "Host Community Share Increased", "odds": 3.00}, {"id": "unchanged", "label": "No Amendment Passed", "odds": 1.50}, {"id": "reduced", "label": "Share Restructured/Reduced", "odds": 8.00}]',
 0, 'open', NOW() + INTERVAL '180 days'),

('Will EFCC secure conviction in the high-profile money laundering case involving a former bank CEO?',
 'The Economic and Financial Crimes Commission is prosecuting a former bank CEO for money laundering and fraudulent diversion of bank funds. The case has been ongoing for several years with multiple adjournments.',
 'FRN v. Former Bank CEO (FHC/L/CS/2024)',
 'Federal High Court',
 'high_court',
 '[{"id": "guilty", "label": "Guilty - All Counts", "odds": 3.50}, {"id": "partial_guilty", "label": "Guilty - Some Counts", "odds": 2.20}, {"id": "acquitted", "label": "Acquitted", "odds": 2.80}, {"id": "plea_bargain", "label": "Plea Bargain", "odds": 4.00}]',
 0, 'open', NOW() + INTERVAL '150 days'),

('Will the Court of Appeal overturn the lower court ruling on Nigeria''s digital currency regulations?',
 'The CBN''s directive restricting cryptocurrency transactions was challenged in court. The Federal High Court ruled in favour of the challengers, but the CBN and FG have appealed, arguing it falls within CBN''s regulatory powers.',
 'CBN Crypto Ban Appeal 2024',
 'Court of Appeal',
 'appeal',
 '[{"id": "overturned", "label": "Lower Court Overturned", "odds": 2.00}, {"id": "upheld", "label": "Lower Court Upheld", "odds": 2.40}, {"id": "modified", "label": "Modified/Remanded", "odds": 3.80}]',
 0, 'open', NOW() + INTERVAL '75 days'),

('Will the National Data Protection Commission impose a major fine under the Nigeria Data Protection Act 2023?',
 'The NDPC has been investigating multiple companies for data breaches. Stakeholders are watching whether the Commission will exercise its new enforcement powers under the NDPA 2023 to impose significant fines.',
 'NDPA 2023',
 'National Data Protection Commission',
 'tribunal',
 '[{"id": "major_fine", "label": "Fine > ₦500M Imposed", "odds": 3.20}, {"id": "minor_fine", "label": "Fine < ₦500M Imposed", "odds": 1.80}, {"id": "no_fine", "label": "No Fine / Settlement", "odds": 2.50}]',
 0, 'open', NOW() + INTERVAL '90 days'),

('Will the Supreme Court resolve the conflict between the CAMA 2020 and religious organizations'' autonomy?',
 'Religious organizations challenged provisions of CAMA 2020 that require them to register with the Corporate Affairs Commission and submit to regulatory oversight, arguing it violates freedom of religion under Section 38 of the Constitution.',
 'CAN v. CAC & FRN',
 'Supreme Court of Nigeria',
 'supreme_court',
 '[{"id": "cama_upheld", "label": "CAMA Provisions Upheld", "odds": 1.90}, {"id": "exemption", "label": "Religious Exemption Granted", "odds": 2.80}, {"id": "modified", "label": "Modified Compliance", "odds": 3.50}]',
 0, 'open', NOW() + INTERVAL '120 days'),

('Will the election tribunal uphold the 2027 gubernatorial election result in a key swing state?',
 'Election petition tribunals across Nigeria continue to adjudicate challenges to gubernatorial elections. In one major swing state, the opposition has presented substantial evidence of irregularities.',
 'Election Petition EPT/2027',
 'Election Petition Tribunal',
 'tribunal',
 '[{"id": "result_upheld", "label": "Result Upheld", "odds": 1.60}, {"id": "winner_changes", "label": "New Winner Declared", "odds": 4.00}, {"id": "fresh_election", "label": "Fresh Election Ordered", "odds": 5.00}]',
 0, 'open', NOW() + INTERVAL '60 days'),

('Will the LFN review commission recommend decriminalizing sedition provisions in the Criminal Code Act?',
 'The ongoing review of the Laws of the Federation of Nigeria has raised questions about whether colonial-era sedition provisions in the Criminal Code Act should be repealed or amended to align with modern free speech guarantees.',
 'LFN Review Commission 2025',
 'National Assembly',
 'legislation',
 '[{"id": "decriminalize", "label": "Recommend Decriminalization", "odds": 2.50}, {"id": "retain", "label": "Retain Current Provisions", "odds": 1.70}, {"id": "amend", "label": "Amend but Keep Criminal", "odds": 3.50}]',
 0, 'open', NOW() + INTERVAL '180 days');

-- ============================================================
-- SEED SAMPLE LAWYERS
-- ============================================================

INSERT INTO lawyer_profiles (full_name, email, phone, bar_number, years_of_experience, specializations, hourly_rate, consultation_fee, rating, total_reviews, total_cases, win_rate, is_verified, verification_date, location, state, bio, languages) VALUES

('Adebayo Ogunlesi SAN', 'a.ogunlesi@casewin.example', '+2348012345678', 'SCN/2004/1234', 22,
  ARRAY['Corporate Law', 'Oil & Gas', 'Arbitration', 'Commercial Litigation'],
  150000, 50000, 4.9, 87, 340, 82.5, true, NOW(),
  'Victoria Island, Lagos', 'Lagos',
  'Senior Advocate of Nigeria with over 22 years of experience in corporate transactions, oil and gas disputes, and international commercial arbitration. Former partner at a leading law firm. Member of the Chartered Institute of Arbitrators.',
  ARRAY['English', 'Yoruba']),

('Amina Bello', 'a.bello@casewin.example', '+2348023456789', 'SCN/2012/5678', 14,
  ARRAY['Family Law', 'Human Rights', 'Constitutional Law', 'Child Rights'],
  80000, 25000, 4.7, 62, 210, 78.0, true, NOW(),
  'Garki, Abuja', 'FCT',
  'Passionate advocate for family rights and gender justice. Handled over 200 cases involving domestic violence, child custody, and women''s rights. Regular consultant to the National Human Rights Commission.',
  ARRAY['English', 'Hausa']),

('Chukwuemeka Okafor', 'c.okafor@casewin.example', '+2348034567890', 'SCN/2008/9012', 18,
  ARRAY['Criminal Law', 'EFCC Defence', 'Money Laundering', 'White Collar Crime'],
  120000, 40000, 4.8, 95, 280, 75.5, true, NOW(),
  'Ikeja, Lagos', 'Lagos',
  'Leading criminal defence attorney specializing in economic and financial crimes. Successfully defended clients in high-profile EFCC and ICPC cases. Former Director of Public Prosecutions.',
  ARRAY['English', 'Igbo']),

('Fatima Mohammed-Lawal', 'f.mohammed@casewin.example', '+2348045678901', 'SCN/2015/3456', 11,
  ARRAY['Land Law', 'Property Law', 'Conveyancing', 'Real Estate'],
  70000, 20000, 4.6, 48, 160, 80.0, true, NOW(),
  'Kano City, Kano', 'Kano',
  'Expert in land disputes across Northern Nigeria. Deep knowledge of both statutory and customary land tenure systems. Handles property transactions, Land Use Act compliance, and Governor''s Consent matters.',
  ARRAY['English', 'Hausa', 'Arabic']),

('Olumide Bankole', 'o.bankole@casewin.example', '+2348056789012', 'SCN/2010/7890', 16,
  ARRAY['Employment Law', 'Labour Law', 'Industrial Relations', 'Pension Law'],
  90000, 30000, 4.5, 55, 190, 76.0, true, NOW(),
  'Ring Road, Ibadan', 'Oyo',
  'Specializes in employment and labour law with experience representing both employers and employees before the National Industrial Court. Advises multinational corporations on Nigerian employment compliance.',
  ARRAY['English', 'Yoruba']),

('Ngozi Eze', 'n.eze@casewin.example', '+2348067890123', 'SCN/2011/2345', 15,
  ARRAY['Intellectual Property', 'Technology Law', 'Data Protection', 'Cybercrime'],
  100000, 35000, 4.8, 41, 130, 85.0, true, NOW(),
  'Lekki, Lagos', 'Lagos',
  'Pioneer in Nigerian tech law. Advises startups and established tech companies on IP protection, data privacy compliance (NDPA & NDPR), and cybercrime defence. Member of the Nigeria Computer Society.',
  ARRAY['English', 'Igbo']),

('Ibrahim Suleiman', 'i.suleiman@casewin.example', '+2348078901234', 'SCN/2009/6789', 17,
  ARRAY['Electoral Law', 'Constitutional Law', 'Administrative Law', 'Political Party Law'],
  130000, 45000, 4.7, 73, 250, 72.0, true, NOW(),
  'Maitama, Abuja', 'FCT',
  'Constitutional law expert who has appeared in numerous election petition tribunals across Nigeria. Handled landmark cases at the Supreme Court on electoral matters. Regular commentator on constitutional issues.',
  ARRAY['English', 'Hausa', 'Fulfulde']),

('Blessing Odiase', 'b.odiase@casewin.example', '+2348089012345', 'SCN/2016/0123', 10,
  ARRAY['Maritime Law', 'Shipping', 'Insurance Law', 'International Trade'],
  85000, 28000, 4.4, 32, 95, 79.0, true, NOW(),
  'GRA, Benin City', 'Edo',
  'Maritime and admiralty law practitioner. Handles shipping disputes, cargo claims, marine insurance, and international trade compliance. Member of the Maritime Law Association of Nigeria.',
  ARRAY['English', 'Edo']),

('Abdulrahman Yusuf', 'a.yusuf@casewin.example', '+2348090123456', 'SCN/2013/4567', 13,
  ARRAY['Tax Law', 'Revenue Law', 'Corporate Tax', 'Transfer Pricing'],
  110000, 38000, 4.6, 38, 120, 81.0, true, NOW(),
  'Central Area, Abuja', 'FCT',
  'Tax law specialist with experience advising Fortune 500 companies on Nigerian tax compliance, transfer pricing, and disputes with FIRS. Former tax consultant at a Big Four accounting firm.',
  ARRAY['English', 'Hausa']),

('Chidinma Nwosu', 'c.nwosu@casewin.example', '+2348001234567', 'SCN/2017/8901', 9,
  ARRAY['Banking & Finance', 'Fintech Law', 'Securities Regulation', 'CBN Compliance'],
  95000, 32000, 4.5, 28, 85, 83.0, true, NOW(),
  'Victoria Island, Lagos', 'Lagos',
  'Specializes in financial services regulation, fintech licensing, and CBN compliance. Advises payment service providers, microfinance banks, and digital lending platforms on regulatory requirements.',
  ARRAY['English', 'Igbo']);
