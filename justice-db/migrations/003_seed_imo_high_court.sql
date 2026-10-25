-- First pilot court. Divisions and fees are starting values only: the court
-- admin should confirm division codes and the current fee schedule with the
-- Chief Registrar and edit them under Registry → Settings.

INSERT INTO courts (slug, name, short_name, state, tier, address, status, fee_schedule)
VALUES (
  'imo-high-court',
  'High Court of Imo State',
  'Imo High Court',
  'Imo',
  'state_high_court',
  'High Court Complex, Owerri, Imo State',
  'pilot',
  '[
    {"code": "writ",            "label": "Writ of summons (filing)",            "amount": 5000},
    {"code": "originating_summons", "label": "Originating summons (filing)",   "amount": 5000},
    {"code": "petition",        "label": "Petition (filing)",                   "amount": 7500},
    {"code": "motion",          "label": "Motion on notice",                    "amount": 2500},
    {"code": "ex_parte",        "label": "Motion ex parte",                     "amount": 2500},
    {"code": "service",         "label": "Service per defendant",               "amount": 1500},
    {"code": "exhibit",         "label": "Exhibits / documents (per document)", "amount": 200},
    {"code": "certified_copy",  "label": "Certified true copy (per page)",      "amount": 100}
  ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO divisions (court_id, name, code)
SELECT c.id, d.name, d.code
  FROM courts c,
       (VALUES ('Owerri Judicial Division', 'HOW'),
               ('Orlu Judicial Division',   'HOR'),
               ('Okigwe Judicial Division', 'HOK')) AS d(name, code)
 WHERE c.slug = 'imo-high-court'
ON CONFLICT (court_id, code) DO NOTHING;
