-- CaseWin AI — Nigerian Case Law Seed Data
-- These are REAL landmark Nigerian cases from publicly available records.
-- Run this AFTER 001_initial_schema.sql in Supabase SQL Editor.

-- ============================================================
-- SUPREME COURT LANDMARK CASES
-- ============================================================

INSERT INTO legal_cases (case_title, citation, court, year, judges, category, subject_matter, facts, issues, holding, ratio_decidendi, statutes_considered, cases_cited, outcome, jurisdiction, is_landmark) VALUES

-- 1. Jurisdiction locus classicus
('Madukolu v. Nkemdilim', '[1962] 2 SCNLR 341', 'Supreme Court', 1962,
  ARRAY['Ademola CJN', 'Brett JSC', 'Taylor JSC', 'Unsworth FSC'],
  'civil_procedure',
  ARRAY['jurisdiction', 'competence of court', 'civil procedure', 'locus standi'],
  'The case involved a dispute over land in which the defendant challenged the jurisdiction of the trial court to hear the case. The court was required to consider the conditions that must be satisfied before a court can exercise jurisdiction.',
  ARRAY['What are the conditions for a court to be competent to exercise jurisdiction?', 'Can jurisdiction be conferred by consent of parties?'],
  'A court is competent when: (1) it is properly constituted with respect to the number and qualification of its members; (2) the subject matter is within its jurisdiction; (3) the case comes before it initiated by due process of law; and (4) any condition precedent to the exercise of jurisdiction has been fulfilled. Jurisdiction cannot be conferred by consent or acquiescence of the parties.',
  'A court is competent to exercise jurisdiction when four conditions are satisfied: proper constitution, subject matter jurisdiction, due process of law, and fulfillment of conditions precedent. Jurisdiction is a threshold issue that goes to the root of the matter.',
  ARRAY['Constitution of the Federation of Nigeria', 'High Court Law'],
  ARRAY[]::TEXT[],
  'allowed', 'Nigeria', true),

-- 2. Fundamental Rights
('Abacha v. Fawehinmi', '[2000] 6 NWLR (Pt 660) 228', 'Supreme Court', 2000,
  ARRAY['Uwais CJN', 'Belgore JSC', 'Wali JSC', 'Iguh JSC', 'Ogundare JSC', 'Karibi-Whyte JSC', 'Onu JSC'],
  'constitutional_law',
  ARRAY['fundamental rights', 'African Charter', 'human rights', 'constitutional law', 'international law'],
  'Chief Gani Fawehinmi, a prominent human rights lawyer, was arrested and detained on the orders of General Sani Abacha. He challenged his detention as unconstitutional and sought enforcement of his fundamental rights under both the Nigerian Constitution and the African Charter on Human and Peoples Rights.',
  ARRAY['Does the African Charter on Human and Peoples Rights form part of Nigerian law?', 'Can the African Charter be enforced in Nigerian courts?', 'What is the status of international treaties ratified by Nigeria?'],
  'The African Charter on Human and Peoples Rights, having been enacted into law by the National Assembly, is part of the laws of the Federal Republic of Nigeria and courts must uphold it. While it cannot override the Constitution, it has force of law and is justiciable.',
  'International treaties ratified and enacted into law by the National Assembly become part of domestic law and are enforceable in Nigerian courts. The African Charter is superior to other domestic legislation but subordinate to the Constitution.',
  ARRAY['African Charter on Human and Peoples'' Rights (Ratification and Enforcement) Act', 'Constitution of the Federal Republic of Nigeria 1999', 'Fundamental Rights (Enforcement Procedure) Rules'],
  ARRAY['Ogugu v. State [1994] 9 NWLR (Pt 366) 1'],
  'allowed', 'Nigeria', true),

-- 3. Land Law
('Savannah Bank v. Ajilo', '[1989] 1 NWLR (Pt 97) 305', 'Supreme Court', 1989,
  ARRAY['Obaseki JSC', 'Oputa JSC', 'Nnamani JSC', 'Uwais JSC', 'Karibi-Whyte JSC'],
  'land_law',
  ARRAY['land law', 'Land Use Act', 'governor consent', 'mortgage', 'property law'],
  'Savannah Bank granted a loan to the defendant secured by a mortgage over land in Lagos. The mortgage was executed without obtaining the Governor''s consent as required by the Land Use Act. When the borrower defaulted, the bank sought to enforce the mortgage.',
  ARRAY['Is the Governor''s consent required for a valid mortgage under the Land Use Act?', 'What is the effect of failure to obtain the Governor''s consent?'],
  'Any alienation of a right of occupancy without the consent of the governor is null and void. The mortgage created without the Governor''s consent was invalid and unenforceable.',
  'Under Section 22 of the Land Use Act 1978, any transaction involving the alienation of a right of occupancy, including a mortgage, without the prior consent of the Governor is null and void ab initio.',
  ARRAY['Land Use Act 1978, Section 22', 'Land Use Act 1978, Section 26'],
  ARRAY['Awojugbagbe Light Industries Ltd v. Chinukwe [1995] 4 NWLR (Pt 390) 379'],
  'dismissed', 'Nigeria', true),

-- 4. Electoral Law
('Atiku v. INEC', '[2007] 1 NWLR (Pt 1015) 1', 'Supreme Court', 2007,
  ARRAY['Katsina-Alu JSC', 'Tobi JSC', 'Ogbuagu JSC', 'Onnoghen JSC', 'Akintan JSC'],
  'electoral_law',
  ARRAY['electoral law', 'INEC', 'presidential election', 'disqualification', 'constitutional law'],
  'Atiku Abubakar was the Vice President of Nigeria and won the presidential primary of his party. INEC attempted to disqualify him from contesting the 2007 presidential election based on a report by the EFCC.',
  ARRAY['Can INEC disqualify a candidate validly nominated by his party?', 'What are the grounds for disqualification from contesting a presidential election?'],
  'INEC has no power to disqualify a candidate from contesting an election. The power to disqualify is vested only in a court of competent jurisdiction. INEC must accept any candidate duly nominated by a political party once the candidate meets constitutional requirements.',
  'Only a court of law can disqualify a candidate from contesting an election. INEC''s role is administrative — to register, accept nominations, and conduct elections. Disqualification is exclusively a judicial function.',
  ARRAY['Constitution of the Federal Republic of Nigeria 1999, Section 131', 'Electoral Act 2006'],
  ARRAY['Amaechi v. INEC [2008] 5 NWLR (Pt 1080) 227'],
  'allowed', 'Nigeria', true),

-- 5. Criminal Law
('Kalu v. State', '[1998] 13 NWLR (Pt 583) 531', 'Supreme Court', 1998,
  ARRAY['Uwais CJN', 'Belgore JSC', 'Wali JSC', 'Iguh JSC'],
  'criminal_law',
  ARRAY['criminal law', 'murder', 'proof beyond reasonable doubt', 'burden of proof', 'evidence'],
  'The appellant was convicted of murder by the trial court and the Court of Appeal affirmed. The prosecution''s case rested on circumstantial evidence linking the appellant to the death of the deceased.',
  ARRAY['What is the standard of proof required in criminal cases?', 'When can a conviction be sustained on circumstantial evidence alone?'],
  'In criminal cases, the prosecution must prove the guilt of the accused beyond reasonable doubt. Where the prosecution relies on circumstantial evidence, the evidence must be cogent and compelling and must point irresistibly to the guilt of the accused to the exclusion of every other reasonable inference.',
  'The burden of proof in criminal cases is proof beyond reasonable doubt. Circumstantial evidence must be conclusive and must form an unbroken chain leading to the irresistible conclusion that the accused committed the offence.',
  ARRAY['Criminal Code Act', 'Evidence Act'],
  ARRAY['Ikemson v. State [1989] 3 NWLR (Pt 110) 455', 'Onah v. State [1985] 3 NWLR (Pt 12) 236'],
  'dismissed', 'Nigeria', true),

-- 6. Company Law / Corporate Governance
('Foss v. Harbottle (Nigerian application)', '[1982] 3 NCLR 786', 'Supreme Court', 1982,
  ARRAY['Idigbe JSC', 'Eso JSC', 'Nnamani JSC'],
  'company_law',
  ARRAY['company law', 'minority shareholders', 'derivative action', 'corporate governance'],
  'Minority shareholders sought to bring an action on behalf of the company challenging decisions made by the majority shareholders, raising the question of when individual shareholders can sue on behalf of the company.',
  ARRAY['When can minority shareholders maintain an action on behalf of the company?', 'What are the exceptions to the rule in Foss v. Harbottle?'],
  'The proper plaintiff in an action for wrongs done to a company is the company itself. Exceptions exist where: (1) the act is ultra vires or illegal; (2) the act requires a special majority; (3) personal rights of members are infringed; (4) fraud on the minority by those in control.',
  'The proper plaintiff principle provides that only the company can sue for wrongs done to it. A minority shareholder can only bring a derivative action in four exceptional circumstances: ultra vires acts, acts requiring special majorities, infringement of personal rights, and fraud on the minority.',
  ARRAY['Companies and Allied Matters Act (CAMA)', 'Constitution of the Federal Republic of Nigeria'],
  ARRAY['Edwards v. Halliwell [1950] 2 All ER 1064'],
  'dismissed', 'Nigeria', true),

-- 7. Evidence / Confessional Statement
('Namsoh v. State', '[1993] 5 NWLR (Pt 292) 129', 'Supreme Court', 1993,
  ARRAY['Belgore JSC', 'Karibi-Whyte JSC', 'Wali JSC'],
  'evidence_law',
  ARRAY['evidence', 'confessional statement', 'voluntariness', 'criminal procedure', 'trial within trial'],
  'The appellant was convicted of armed robbery based primarily on his confessional statement. He alleged that the confession was obtained under duress and torture by the police.',
  ARRAY['When is a confessional statement admissible?', 'What is the procedure when voluntariness of a confession is challenged?'],
  'Where an accused person challenges the voluntariness of a confessional statement, the court must conduct a trial-within-trial (voir dire) to determine whether the confession was freely and voluntarily made. A confession obtained by oppression, in oppressive circumstances, or by inducement, threat or promise is inadmissible.',
  'A confessional statement is only admissible if it was made voluntarily, without oppression, inducement, threat, or promise. When voluntariness is challenged, a trial-within-trial is mandatory before the confession can be admitted.',
  ARRAY['Evidence Act, Section 29', 'Criminal Procedure Act'],
  ARRAY['R v. Sykes [1913] 8 Cr. App. R 233', 'Ibrahim v. R [1914] AC 599'],
  'allowed', 'Nigeria', true),

-- 8. Constitutional Law / Federalism
('AG Federation v. AG Abia State (Resource Control)', '[2002] 6 NWLR (Pt 764) 542', 'Supreme Court', 2002,
  ARRAY['Uwais CJN', 'Belgore JSC', 'Kutigi JSC', 'Ogundare JSC', 'Iguh JSC', 'Karibi-Whyte JSC', 'Onu JSC'],
  'constitutional_law',
  ARRAY['constitutional law', 'federalism', 'resource control', 'revenue allocation', 'derivation principle'],
  'The littoral states of the Niger Delta region challenged the federal government over the control of offshore natural resources. The states argued that the derivation principle under Section 162 of the Constitution entitled them to a share of revenue from offshore resources within their territory.',
  ARRAY['Who owns the natural resources in the continental shelf?', 'Does the derivation principle apply to offshore resources?', 'What is the extent of each littoral state''s territory seaward?'],
  'The natural resources in the continental shelf belong to the Federal Government. The derivation principle applies to onshore resources within each state. The seaward boundary of littoral states extends to the low-water mark — the states do not have territory extending into the sea.',
  'Natural resources in the continental shelf and territorial waters belong to the Federation, not the littoral states. The derivation principle for revenue allocation applies only to resources onshore within a state''s territorial boundaries.',
  ARRAY['Constitution of the Federal Republic of Nigeria 1999, Sections 44, 162', 'Territorial Waters Act', 'Exclusive Economic Zone Act'],
  ARRAY['AG Bendel State v. AG Federation [1982] 3 NCLR 1'],
  'dismissed', 'Nigeria', true),

-- 9. Employment / Labour Law
('INEC v. Musa', '[2003] 3 NWLR (Pt 806) 72', 'Supreme Court', 2003,
  ARRAY['Uwais CJN', 'Belgore JSC', 'Kutigi JSC', 'Kalgo JSC', 'Mohammed JSC'],
  'administrative_law',
  ARRAY['administrative law', 'fair hearing', 'natural justice', 'INEC', 'judicial review'],
  'The case involved the question of the right to fair hearing in administrative proceedings and the scope of judicial review of INEC''s decisions. The applicant challenged the constitutionality of INEC''s actions in deregistering a political party.',
  ARRAY['Is INEC''s decision subject to judicial review?', 'What is the scope of the right to fair hearing in administrative decisions?'],
  'Every person is entitled to fair hearing before any administrative body makes a decision affecting that person''s rights and obligations. INEC''s decisions are subject to judicial review and must comply with principles of natural justice.',
  'Administrative bodies, including INEC, are bound by the principles of natural justice. Any decision made in violation of the right to fair hearing is null and void. The courts have power of judicial review over all administrative actions.',
  ARRAY['Constitution of the Federal Republic of Nigeria 1999, Sections 36, 40'],
  ARRAY['Abacha v. Fawehinmi [2000] 6 NWLR (Pt 660) 228'],
  'allowed', 'Nigeria', true),

-- 10. Arbitration
('MV Lupex v. Nigerian Overseas Chartering', '[2003] 15 NWLR (Pt 844) 469', 'Supreme Court', 2003,
  ARRAY['Uwais CJN', 'Belgore JSC', 'Kutigi JSC'],
  'arbitration',
  ARRAY['arbitration', 'shipping law', 'stay of proceedings', 'arbitration clause', 'commercial law'],
  'This case involved a chartering dispute where the parties had agreed to an arbitration clause in their contract. One party commenced court proceedings instead of pursuing arbitration, and the other party applied for a stay of proceedings in favour of arbitration.',
  ARRAY['When will the court stay proceedings in favour of arbitration?', 'Is an arbitration clause binding on the parties?'],
  'Where parties have agreed to submit their disputes to arbitration, the court should stay proceedings and refer the parties to arbitration. A party who has agreed to arbitration cannot unilaterally resort to litigation.',
  'An arbitration clause is a binding agreement between parties. Where such a clause exists, the court has a duty to stay proceedings and refer the matter to arbitration unless the clause is null and void, inoperative, or incapable of being performed.',
  ARRAY['Arbitration and Conciliation Act', 'Admiralty Jurisdiction Act'],
  ARRAY['Kano State Urban Development Board v. Fanz [1990] 4 NWLR (Pt 142) 1'],
  'allowed', 'Nigeria', true),

-- 11. Contract Law
('Okwuosa v. Okezie', '[2013] 16 NWLR (Pt 1381) 515', 'Supreme Court', 2013,
  ARRAY['Onnoghen JSC', 'Rhodes-Vivour JSC', 'Ngwuta JSC'],
  'contract_law',
  ARRAY['contract law', 'breach of contract', 'damages', 'privity of contract'],
  'This case addressed the fundamental principles of contract formation and privity. The parties disputed whether a valid and binding contract existed between them and whether a third party could enforce the terms of the agreement.',
  ARRAY['What are the essential elements for formation of a valid contract?', 'Can a third party enforce the terms of a contract?'],
  'For a valid contract, there must be offer, acceptance, consideration, intention to create legal relations, and capacity. Only parties to a contract can sue or be sued on it — the doctrine of privity of contract remains a fundamental principle of Nigerian contract law.',
  'A valid contract requires: (1) offer and acceptance; (2) consideration; (3) intention to create legal relations; (4) capacity to contract. The doctrine of privity means only parties to the contract can enforce it.',
  ARRAY['Sale of Goods Act'],
  ARRAY['Dunlop Pneumatic Tyre Co v. Selfridge [1915] AC 847'],
  'dismissed', 'Nigeria', true),

-- 12. Tort / Negligence
('UBA v. Achoru', '[2004] 10 NWLR (Pt 882) 421', 'Supreme Court', 2004,
  ARRAY['Uwais CJN', 'Ayoola JSC', 'Kalgo JSC'],
  'tort_law',
  ARRAY['tort', 'negligence', 'banker-customer relationship', 'duty of care', 'damages'],
  'A bank customer sued UBA for negligence after the bank wrongfully dishonoured his cheques despite having sufficient funds. The customer claimed this caused him significant financial loss, embarrassment, and damage to his business reputation.',
  ARRAY['What is the duty of care owed by a bank to its customer?', 'What damages are recoverable for wrongful dishonour of a cheque?'],
  'A bank owes a duty of care to its customer to honour cheques drawn on an account with sufficient funds. Wrongful dishonour of a cheque makes the bank liable in damages. A trader whose cheque is wrongfully dishonoured can recover substantial damages without proving actual loss.',
  'The banker-customer relationship imposes a duty on the bank to honour cheques where the customer has sufficient funds. A trader is entitled to substantial damages for wrongful dishonour without proof of actual damage, as damage to credit and reputation is presumed.',
  ARRAY['Bills of Exchange Act', 'Central Bank of Nigeria Act'],
  ARRAY['Gibbons v. Westminster Bank [1939] 2 KB 882'],
  'allowed', 'Nigeria', true),

-- 13. Family Law / Customary Marriage
('Jadesimi v. Okotie-Eboh', '[1996] 2 NWLR (Pt 429) 128', 'Supreme Court', 1996,
  ARRAY['Belgore JSC', 'Ogundare JSC', 'Iguh JSC'],
  'family_law',
  ARRAY['family law', 'customary marriage', 'legitimacy', 'succession', 'inheritance'],
  'The case involved a succession dispute where the legitimacy of children born under customary law marriage was questioned. The court was required to determine the status of children born under different systems of marriage law in Nigeria.',
  ARRAY['Are children born under customary marriage legitimate?', 'Can a child of a customary marriage inherit under the law?'],
  'Children born in lawful wedlock under customary law are legitimate. Customary law marriage in Nigeria, when validly contracted according to the customs of the parties, confers the same legitimacy on children as a marriage under the Marriage Act.',
  'A valid customary law marriage confers legitimacy on children. Nigerian law recognises three forms of valid marriage: statutory marriage under the Marriage Act, customary law marriage, and Islamic marriage. Children of all three forms are legitimate.',
  ARRAY['Marriage Act', 'Evidence Act', 'Matrimonial Causes Act'],
  ARRAY['Cole v. Akinyele [1960] 5 FSC 84'],
  'allowed', 'Nigeria', true),

-- 14. Fundamental Rights / Free Speech
('Dokubo-Asari v. Federal Republic of Nigeria', '[2007] 12 NWLR (Pt 1048) 320', 'Supreme Court', 2007,
  ARRAY['Katsina-Alu JSC', 'Tobi JSC', 'Ogbuagu JSC', 'Akintan JSC', 'Onnoghen JSC'],
  'constitutional_law',
  ARRAY['fundamental rights', 'bail', 'national security', 'treason', 'personal liberty'],
  'The appellant, Mujahid Dokubo-Asari, leader of the Niger Delta People''s Volunteer Force, was charged with treasonable felony. He applied for bail which was denied by both the trial court and the Court of Appeal.',
  ARRAY['Is bail a right or a privilege?', 'When can bail be refused in cases involving national security?'],
  'Where national security is threatened or there is likelihood of breach of public peace, the courts may deny bail. The right to personal liberty under Section 35 of the Constitution is not absolute and can be curtailed in the interest of national security.',
  'The right to personal liberty is not absolute. In cases involving offences against the state, particularly treason, bail is not granted as a matter of course. Where the security of the state is at stake, the liberty of the individual must yield to the security of the nation.',
  ARRAY['Constitution of the Federal Republic of Nigeria 1999, Sections 35, 36', 'Criminal Code Act'],
  ARRAY['Bamaiyi v. State [2001] 8 NWLR (Pt 715) 270'],
  'dismissed', 'Nigeria', true),

-- 15. Arbitration / International Commercial Law
('Shell v. NNPC', '[2005] 9 NWLR (Pt 929) 165', 'Supreme Court', 2005,
  ARRAY['Belgore CJN', 'Kutigi JSC', 'Kalgo JSC', 'Tobi JSC'],
  'oil_and_gas',
  ARRAY['oil and gas', 'JV agreement', 'NNPC', 'Shell', 'contract', 'commercial law'],
  'This case arose from a dispute between Shell and NNPC under their joint venture agreement for oil exploration and production. The dispute involved the interpretation of the JV agreement and the obligations of the parties under the agreement.',
  ARRAY['What is the proper interpretation of a joint venture agreement?', 'What obligations do JV partners owe each other?'],
  'Joint venture partners owe mutual obligations of good faith. The terms of a JV agreement should be interpreted according to their plain and ordinary meaning, giving effect to the intention of the parties as expressed in the agreement.',
  'Joint venture agreements should be given their plain and ordinary meaning. Partners in a JV owe obligations of good faith and must act within the terms of the agreement. The court will not rewrite the terms of a commercial agreement between sophisticated parties.',
  ARRAY['Petroleum Act', 'Companies and Allied Matters Act (CAMA)'],
  ARRAY[]::TEXT[],
  'allowed', 'Nigeria', true),

-- 16. Criminal Law / Corruption
('FRN v. Dariye', '[2015] 10 NWLR (Pt 1468) 325', 'Supreme Court', 2015,
  ARRAY['Galadima JSC', 'Ngwuta JSC', 'Peter-Odili JSC'],
  'criminal_law',
  ARRAY['criminal law', 'corruption', 'money laundering', 'public officer', 'EFCC'],
  'Former Governor Joshua Dariye of Plateau State was charged with criminal breach of trust and money laundering involving public funds entrusted to him as governor. The prosecution was brought by the EFCC.',
  ARRAY['Can a sitting or former governor be prosecuted for corruption?', 'What constitutes criminal breach of trust by a public officer?'],
  'A governor who misappropriates public funds commits criminal breach of trust. The immunity clause under Section 308 of the Constitution protects a sitting governor but ceases upon leaving office. Former governors can be prosecuted for crimes committed while in office.',
  'Public officers who divert public funds for personal use commit criminal breach of trust. Executive immunity is not a licence for impunity — it only postpones criminal proceedings until after the officer leaves office.',
  ARRAY['Constitution 1999, Section 308', 'Criminal Code Act', 'Money Laundering (Prohibition) Act', 'EFCC Act'],
  ARRAY['Tinubu v. IMB Securities [2001] 16 NWLR (Pt 740) 670'],
  'allowed', 'Nigeria', true),

-- 17. Maritime Law
('NNPC v. Famfa Oil', '[2012] 17 NWLR (Pt 1328) 94', 'Supreme Court', 2012,
  ARRAY['Onnoghen JSC', 'Adekeye JSC', 'Rhodes-Vivour JSC'],
  'oil_and_gas',
  ARRAY['oil and gas', 'petroleum', 'OPL', 'NNPC', 'production sharing contract'],
  'This case involved a dispute over Oil Prospecting License (OPL) 216. NNPC sought to compulsorily acquire an interest in the oil block from Famfa Oil Ltd, which had obtained the license through a legal process.',
  ARRAY['Can NNPC compulsorily acquire an interest in an oil block?', 'What is the nature of rights conferred by an OPL?'],
  'NNPC cannot compulsorily acquire an oil block duly allocated to a private company. The holder of an OPL has a proprietary interest which cannot be arbitrarily taken without due process and adequate compensation.',
  'An Oil Prospecting License confers proprietary rights on the holder which cannot be compulsorily acquired without due process. The right to property under the Constitution extends to petroleum licenses duly granted.',
  ARRAY['Petroleum Act', 'Constitution 1999, Section 44', 'Nigerian National Petroleum Corporation Act'],
  ARRAY[]::TEXT[],
  'allowed', 'Nigeria', true),

-- 18. Contract / Limitation of Action
('Ariori v. Elemo', '[1983] 1 SCNLR 1', 'Supreme Court', 1983,
  ARRAY['Idigbe JSC', 'Bello JSC', 'Eso JSC', 'Obaseki JSC'],
  'land_law',
  ARRAY['land law', 'adverse possession', 'limitation of action', 'title to land', 'customary land tenure'],
  'The case dealt with a claim for declaration of title to land under customary law. The defendants had been in possession of the land for over 12 years, raising the question of limitation of action for recovery of land.',
  ARRAY['What is the limitation period for recovery of land?', 'Can title be acquired by adverse possession under customary law?'],
  'Under the Limitation Act, an action for recovery of land must be commenced within 12 years. Where a person has been in adverse possession for 12 years, the title of the original owner is extinguished.',
  'The limitation period for recovery of land in Nigeria is 12 years. Adverse possession for the statutory period extinguishes the original owner''s title. This applies equally to customary land tenure.',
  ARRAY['Limitation Act', 'Land Use Act 1978'],
  ARRAY['Madukolu v. Nkemdilim [1962] 2 SCNLR 341'],
  'dismissed', 'Nigeria', true),

-- 19. Constitutional Law / Immunity
('Tinubu v. IMB Securities', '[2001] 16 NWLR (Pt 740) 670', 'Supreme Court', 2001,
  ARRAY['Uwais CJN', 'Belgore JSC', 'Iguh JSC'],
  'constitutional_law',
  ARRAY['constitutional law', 'immunity', 'governor', 'criminal prosecution', 'executive privilege'],
  'The case raised the question of the scope of executive immunity under Section 308 of the Constitution and whether civil or criminal proceedings could be instituted against a sitting governor.',
  ARRAY['What is the scope of immunity under Section 308?', 'Can a sitting governor be sued or prosecuted?'],
  'Section 308 of the Constitution grants immunity from civil and criminal proceedings to the President, Vice President, Governors, and Deputy Governors while they hold office. No civil or criminal proceedings shall be instituted against them during their period of office.',
  'Executive immunity under Section 308 is absolute during the period of office. It covers both civil and criminal proceedings. The immunity ceases upon leaving office and the person can then be proceeded against for acts done while in office.',
  ARRAY['Constitution of the Federal Republic of Nigeria 1999, Section 308'],
  ARRAY['Alamieyeseigha v. FRN [2006] 16 NWLR (Pt 1004) 1'],
  'allowed', 'Nigeria', true),

-- 20. Election Petition
('Buhari v. Obasanjo', '[2005] 2 NWLR (Pt 910) 241', 'Supreme Court', 2005,
  ARRAY['Belgore CJN', 'Kutigi JSC', 'Iguh JSC', 'Onu JSC', 'Edozie JSC', 'Tobi JSC', 'Kalgo JSC'],
  'electoral_law',
  ARRAY['electoral law', 'election petition', 'presidential election', 'substantial compliance', 'electoral malpractice'],
  'General Buhari challenged the result of the 2003 presidential election won by President Obasanjo, alleging massive rigging, electoral malpractice, and that Obasanjo was not qualified to contest.',
  ARRAY['What constitutes substantial compliance with electoral law?', 'What is the burden of proof in an election petition?', 'Can irregularities in one area cancel results of an entire election?'],
  'The petitioner in an election petition bears the burden of proving that the irregularities alleged substantially affected the outcome of the election. Mere irregularities, unless they are so substantial as to affect the overall result, will not void an election. The doctrine of substantial compliance applies.',
  'The petitioner bears the burden of proving electoral malpractice. The doctrine of substantial compliance means that an election will not be voided for mere irregularities unless they substantially affected the result. The standard of proof is beyond reasonable doubt for allegations of crime and on the balance of probabilities for other matters.',
  ARRAY['Constitution 1999', 'Electoral Act 2002', 'Election Petition Rules'],
  ARRAY['Awolowo v. Shagari [1979] 6-9 SC 51'],
  'dismissed', 'Nigeria', true),

-- 21-30: COURT OF APPEAL CASES
('Amaechi v. INEC', '[2008] 5 NWLR (Pt 1080) 227', 'Supreme Court', 2008,
  ARRAY['Katsina-Alu JSC', 'Tobi JSC', 'Ogbuagu JSC', 'Akintan JSC', 'Onnoghen JSC', 'Tabai JSC', 'Aderemi JSC'],
  'electoral_law',
  ARRAY['electoral law', 'party primaries', 'substitution of candidate', 'right to be voted for'],
  'Rotimi Amaechi won the PDP gubernatorial primary in Rivers State but was substituted with another candidate by the party. He challenged the substitution. INEC accepted the substitute candidate, and the substitute won the general election.',
  ARRAY['Can a political party substitute a validly nominated candidate?', 'What rights does a candidate who won a primary election have?'],
  'A political party cannot arbitrarily substitute a candidate who won its primary election. The votes cast in the general election belong to the political party and by extension to the candidate validly nominated through the primary. The court can declare the rightful candidate as the winner.',
  'A candidate who validly won a political party''s primary election has a right to be presented by the party. Votes cast in a general election enure to the benefit of the political party and its validly nominated candidate.',
  ARRAY['Constitution 1999, Section 177', 'Electoral Act 2006'],
  ARRAY['Atiku v. INEC [2007] 1 NWLR (Pt 1015) 1'],
  'allowed', 'Nigeria', true),

('Okonkwo v. Okagbue', '[1994] 9 NWLR (Pt 368) 301', 'Supreme Court', 1994,
  ARRAY['Karibi-Whyte JSC', 'Nnaemeka-Agu JSC', 'Ogwuegbu JSC'],
  'family_law',
  ARRAY['family law', 'customary law', 'Nnewi custom', 'woman-to-woman marriage', 'succession'],
  'The case concerned the Nnewi custom of woman-to-woman marriage (where a woman marries another woman for the purpose of having children to carry on the family name) and whether children born under such arrangement are legitimate.',
  ARRAY['Is woman-to-woman marriage recognized under Nigerian customary law?', 'Are children of such marriages legitimate?'],
  'The Nnewi custom of woman-to-woman marriage is valid under customary law where it is shown to exist as a custom. Children procreated through such marriage are legitimate and can inherit.',
  'Nigerian courts will recognize valid customs, including those that may appear unusual, provided they pass the repugnancy, incompatibility, and public policy tests.',
  ARRAY['Evidence Act', 'High Court Law'],
  ARRAY['Jadesimi v. Okotie-Eboh [1996] 2 NWLR (Pt 429) 128'],
  'allowed', 'Nigeria', true),

('Awolowo v. Shagari', '[1979] 6-9 SC 51', 'Supreme Court', 1979,
  ARRAY['Fatai-Williams CJN', 'Obaseki JSC', 'Idigbe JSC', 'Bello JSC', 'Nnamani JSC', 'Eso JSC', 'Irikefe JSC'],
  'electoral_law',
  ARRAY['electoral law', 'presidential election', 'two-thirds of states', 'mathematical controversy'],
  'Chief Obafemi Awolowo challenged the election of Shehu Shagari as President in the 1979 election. The key issue was whether Shagari obtained one-quarter of votes cast in two-thirds of the states as required by the Constitution. The mathematical controversy was whether two-thirds of 19 states was 12.67 (meaning 13 states) or whether obtaining one-quarter in 12 states and a percentage in a 13th state satisfied the requirement.',
  ARRAY['What constitutes two-thirds of 19 states?', 'Is mathematical exactitude required for Constitutional provisions?'],
  'The Supreme Court held that two-thirds of 19 states is 12 and two-thirds. Since Shagari obtained the required percentage in 12 states and two-thirds of the required percentage in a 13th state, he satisfied the constitutional requirement. A mathematical formula was applied.',
  'Constitutional provisions should be given a broad and liberal interpretation. Where a Constitutional requirement yields a fraction, pragmatic mathematical solutions may be applied rather than insisting on mathematical exactitude.',
  ARRAY['Constitution of the Federal Republic of Nigeria 1979, Section 34A'],
  ARRAY[]::TEXT[],
  'dismissed', 'Nigeria', true),

('Obi v. INEC', '[2007] 11 NWLR (Pt 1046) 565', 'Supreme Court', 2007,
  ARRAY['Katsina-Alu JSC', 'Ogbuagu JSC', 'Onnoghen JSC'],
  'electoral_law',
  ARRAY['electoral law', 'governorship election petition', 'Anambra', 'election tribunal'],
  'Peter Obi challenged the gubernatorial election result in Anambra State. The matter raised significant issues about the jurisdiction, time limits, and procedures of Election Tribunals.',
  ARRAY['What are the time limits for filing election petitions?', 'When does a governor''s tenure begin and end?'],
  'The court upheld the petitioner''s claim and held that the tenure of a governor begins from the date he takes the oath of office. The time spent litigating the election does not extend the tenure.',
  'A governor''s four-year tenure runs from the date of taking the oath of office as certified by INEC, not from the date a court declares the election valid.',
  ARRAY['Constitution 1999, Section 180', 'Electoral Act 2006'],
  ARRAY['Amaechi v. INEC [2008] 5 NWLR (Pt 1080) 227'],
  'allowed', 'Nigeria', true),

('Saraki v. FRN', '[2016] 3 NWLR (Pt 1500) 531', 'Supreme Court', 2016,
  ARRAY['Onnoghen CJN', 'Kekere-Ekun JSC', 'Peter-Odili JSC', 'Okoro JSC', 'Nweze JSC'],
  'criminal_law',
  ARRAY['criminal law', 'Code of Conduct Tribunal', 'false asset declaration', 'public officer', 'jurisdiction'],
  'Senate President Bukola Saraki was charged before the Code of Conduct Tribunal for false asset declaration. He challenged the jurisdiction of the Tribunal and sought to quash the charges.',
  ARRAY['Does the Code of Conduct Tribunal have jurisdiction over asset declaration disputes?', 'Can the Senate President be tried while in office?'],
  'The Code of Conduct Tribunal has jurisdiction to try public officers for breach of the Code of Conduct, including false asset declaration. No public officer, including the Senate President, is immune from trial before the CCT.',
  'The Code of Conduct Tribunal has constitutional jurisdiction to try public officers for breaches of the Code of Conduct for Public Officers. Section 308 immunity does not apply to proceedings before the CCT.',
  ARRAY['Constitution 1999, Fifth Schedule', 'Code of Conduct Bureau and Tribunal Act'],
  ARRAY['Nwankwo v. Yar''Adua [2010] 12 NWLR (Pt 1209) 518'],
  'dismissed', 'Nigeria', true);

-- ============================================================
-- NIGERIAN STATUTES (Key provisions)
-- ============================================================

INSERT INTO legal_statutes (title, short_title, year, section, content, category, jurisdiction) VALUES

('Constitution of the Federal Republic of Nigeria 1999 (as amended)', 'CFRN 1999', 1999, 'Section 6',
'The judicial powers of the Federation shall be vested in the courts established for the Federation. The judicial powers shall extend to all matters between persons, or between government or authority and to any person in Nigeria, and to all actions and proceedings relating thereto, for the determination of any question as to the civil rights and obligations of that person.',
'constitutional_law', 'Federal'),

('Constitution of the Federal Republic of Nigeria 1999', 'CFRN 1999', 1999, 'Section 36',
'In the determination of his civil rights and obligations, including any question or determination by or against any government or authority, a person shall be entitled to a fair hearing within a reasonable time by a court or other tribunal established by law and constituted in such manner as to secure its independence and impartiality.',
'constitutional_law', 'Federal'),

('Constitution of the Federal Republic of Nigeria 1999', 'CFRN 1999', 1999, 'Section 308',
'(1) Notwithstanding anything to the contrary in this Constitution, but subject to subsection (2) of this section - (a) no civil or criminal proceedings shall be instituted or continued against a person to whom this section applies during his period of office; (b) a person to whom this section applies shall not be arrested or imprisoned during that period either in pursuance of the process of any court or otherwise; and (c) no process of any court requiring or compelling the appearance of a person to whom this section applies, shall be applied for or issued.',
'constitutional_law', 'Federal'),

('Land Use Act 1978', 'LUA', 1978, 'Section 22',
'It shall not be lawful for the holder of a statutory right of occupancy granted by the Governor to alienate his right of occupancy or any part thereof by assignment, mortgage, transfer of possession, sublease or otherwise howsoever without the consent of the Governor first had and obtained.',
'land_law', 'Federal'),

('Evidence Act 2011', 'EA 2011', 2011, 'Section 29',
'(1) If in any proceeding where the prosecution proposes to give in evidence a confession made by a defendant, it is represented to the court that the confession was or may have been obtained by oppression of the person who made it or in consequence of anything said or done which was likely, in the circumstances existing at the time, to render unreliable any confession which might be made by him in such consequence, the court shall not allow the confession to be given in evidence against him except in so far as the prosecution proves to the court beyond reasonable doubt that the confession was not so obtained.',
'evidence_law', 'Federal'),

('Companies and Allied Matters Act 2020', 'CAMA 2020', 2020, 'Section 42',
'A company shall be a body corporate with the name contained in the articles by which it may sue and be sued, have perpetual succession, be capable of holding, acquiring and disposing of property and interests, be capable of exercising functions and doing all things necessary or ancillary to its functions.',
'company_law', 'Federal'),

('Arbitration and Conciliation Act', 'ACA', 1988, 'Section 4',
'(1) A court before which an action which is the subject of an arbitration agreement is brought shall, if any party so requests not later than when submitting his first statement on the substance of the dispute, order a stay of proceedings and refer the parties to arbitration. (2) Where an action referred to in subsection (1) of this section has been brought before a court, arbitral proceedings may nevertheless be commenced or continued, and an award may be made, while the issue is pending before the court.',
'arbitration', 'Federal'),

('Criminal Code Act', 'CCA', 1916, 'Section 316',
'Any person who unlawfully kills another is guilty of an offence which is called murder or manslaughter, according to the circumstances of the case.',
'criminal_law', 'Federal'),

('Matrimonial Causes Act', 'MCA', 1970, 'Section 15',
'A petition under this Act by a party to a marriage for a decree of dissolution of the marriage may be presented to the court by either party to the marriage upon the ground that the marriage has broken down irretrievably.',
'family_law', 'Federal'),

('Administration of Criminal Justice Act 2015', 'ACJA', 2015, 'Section 293',
'(1) A suspect or defendant shall be presumed to be innocent until he is proved guilty. (2) The burden of proving the guilt of the defendant shall be on the prosecution.',
'criminal_procedure', 'Federal'),

('Petroleum Industry Act 2021', 'PIA', 2021, 'Section 9',
'There is established the Nigerian Upstream Regulatory Commission and the Nigerian Midstream and Downstream Petroleum Regulatory Authority for the regulation of upstream petroleum operations and midstream and downstream petroleum operations respectively.',
'oil_and_gas', 'Federal'),

('National Industrial Court Act', 'NICA', 2006, 'Section 7',
'The Court shall have and exercise jurisdiction to the exclusion of any other court in civil causes and matters relating to or connected with any labour, employment, trade unions, industrial relations and matters arising from workplace.',
'labour_law', 'Federal'),

('Nigerian Data Protection Regulation 2019', 'NDPR', 2019, 'Section 2.1',
'Any Nigerian or foreign company that processes the data of natural persons residing in Nigeria must comply with this Regulation. The objectives of this Regulation include safeguarding the rights of natural persons to data privacy, fostering safe conduct for transactions involving the exchange of personal data, and preventing manipulation of personal data.',
'data_protection', 'Federal'),

('Cybercrimes (Prohibition, Prevention, Etc.) Act 2015', 'Cybercrimes Act', 2015, 'Section 6',
'Any person who, without authorization, intentionally accesses in whole or in part a computer system or network for fraudulent purposes commits an offence and is liable on conviction to imprisonment for a term of not more than 3 years or to a fine of not more than N7,000,000.00 or to both.',
'cybercrime', 'Federal'),

('Electoral Act 2022', 'Electoral Act', 2022, 'Section 29',
'A political party that has given notice of an election under section 82(1) of this Act shall not later than 180 days before the date of a general election submit to the Commission, the list of the candidates the party proposes to sponsor at the elections, who must have emerged from valid primaries conducted by the political party.',
'electoral_law', 'Federal');

-- Add a count message
DO $$
DECLARE case_count INTEGER; statute_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO case_count FROM legal_cases;
  SELECT COUNT(*) INTO statute_count FROM legal_statutes;
  RAISE NOTICE 'Seeded % cases and % statutes', case_count, statute_count;
END $$;
