-- CaseWin Justice database — shared by court.casewinai.com and
-- openlegal.casewinai.com. This is a SEPARATE Supabase project from the main
-- CaseWin app.
--
-- Access model: every table has RLS enabled. The browser (anon key) can only
-- read what is explicitly public below: published judgments, laws, courts and
-- the public cause list. Everything else goes through server routes using the
-- service-role key, which check the caller's staff role first.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Courts ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                 -- e.g. 'imo-high-court'
  name TEXT NOT NULL,                        -- 'High Court of Imo State'
  short_name TEXT,                           -- 'Imo High Court'
  state TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'state_high_court'
    CHECK (tier IN ('state_high_court', 'federal_high_court', 'magistrate', 'customary', 'sharia', 'national_industrial', 'appeal', 'supreme', 'other')),
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pilot' CHECK (status IN ('pilot', 'active', 'suspended')),
  -- Fee schedule used for assessment, editable by the court admin:
  -- [{ "code": "writ", "label": "Writ of summons", "amount": 5000 }, ...]
  fee_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                        -- 'Owerri Judicial Division'
  code TEXT NOT NULL,                        -- suit-number prefix, e.g. 'HOW'
  next_suit_seq INT NOT NULL DEFAULT 1,      -- per-year sequence, see assign_suit_number
  suit_seq_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (court_id, code)
);

CREATE TABLE IF NOT EXISTS judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,                        -- 'Hon. Justice A. B. Okafor'
  courtroom TEXT,                            -- 'Court 3'
  specialisations TEXT[] DEFAULT '{}',       -- case types they usually take
  is_sample BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── People & roles ───────────────────────────────────────────────────────────

-- CaseWin's own operators. Can onboard courts and see every court.
CREATE TABLE IF NOT EXISTS platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Court staff. One login (Supabase Auth email + password) per person.
--   court_admin — manages staff, judges, divisions and fees for their court
--   registrar   — everything a clerk can do, plus accepts/rejects filings and publishes judgments
--   clerk       — reviews filings, assesses fees, schedules hearings, keeps the cause list
--   judge       — sees their docket and records hearing outcomes
CREATE TABLE IF NOT EXISTS court_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('court_admin', 'registrar', 'clerk', 'judge')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  judge_id UUID REFERENCES judges(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, court_id)
);
CREATE INDEX IF NOT EXISTS idx_court_staff_user ON court_staff (user_id);

-- Courts asking to be onboarded (public form on court.casewinai.com).
CREATE TABLE IF NOT EXISTS court_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_name TEXT NOT NULL,
  state TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_role TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'onboarded', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Filing → case → hearing ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
  reference TEXT UNIQUE NOT NULL,            -- tracking code given to the filer, e.g. 'EF-7K3Q9X'

  filer_name TEXT NOT NULL,
  filer_email TEXT NOT NULL,
  filer_phone TEXT,
  filer_type TEXT NOT NULL DEFAULT 'lawyer' CHECK (filer_type IN ('lawyer', 'litigant', 'agency')),
  bar_number TEXT,                           -- NBA Supreme Court enrolment number, for lawyers
  law_firm TEXT,

  case_type TEXT NOT NULL,                   -- see CASE_TYPES in apps/court/lib/constants.ts
  process_type TEXT NOT NULL,                -- writ / originating summons / petition / motion / charge
  title TEXT NOT NULL,                       -- 'Chukwu v. Okeke'
  claimants JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{ name, address }]
  defendants JSONB NOT NULL DEFAULT '[]'::jsonb,
  claim_amount NUMERIC(16,2),
  reliefs TEXT,
  summary TEXT,
  urgent BOOLEAN NOT NULL DEFAULT FALSE,

  -- [{ name, path, size, sha256, uploaded_at }] — files live in the private 'filings' bucket
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  classification JSONB,                      -- { case_type, confidence, reasons[], suggested_division }

  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'under_review', 'queried', 'assessed', 'paid', 'accepted', 'rejected')),
  query_note TEXT,                           -- what the registry needs fixed
  rejection_reason TEXT,
  fee_assessment JSONB,                      -- { items: [{ label, amount }], total, assessed_by, assessed_at }
  payment_reference TEXT,                    -- receipt / RRR number
  paid_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES court_staff(id) ON DELETE SET NULL,
  case_id UUID,                              -- set once accepted (FK added below)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_filings_court_status ON filings (court_id, status, created_at DESC);
-- Document verification looks filings up by a document's SHA-256.
CREATE INDEX IF NOT EXISTS idx_filings_documents ON filings USING GIN (documents jsonb_path_ops);

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
  filing_id UUID REFERENCES filings(id) ON DELETE SET NULL,
  suit_number TEXT NOT NULL,                 -- 'HOW/142/2026'
  title TEXT NOT NULL,
  case_type TEXT NOT NULL,
  claimants JSONB NOT NULL DEFAULT '[]'::jsonb,
  defendants JSONB NOT NULL DEFAULT '[]'::jsonb,
  claimant_counsel TEXT,
  judge_id UUID REFERENCES judges(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending_assignment'
    CHECK (status IN ('pending_assignment', 'active', 'adjourned', 'reserved', 'judgment_delivered', 'struck_out', 'settled', 'withdrawn', 'transferred')),
  urgent BOOLEAN NOT NULL DEFAULT FALSE,
  next_hearing_at TIMESTAMPTZ,
  adjournment_count INT NOT NULL DEFAULT 0,
  filed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  disposed_at TIMESTAMPTZ,                   -- set when the case leaves the docket
  is_sample BOOLEAN NOT NULL DEFAULT FALSE,  -- demonstration data, labelled in the UI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (court_id, suit_number)
);
CREATE INDEX IF NOT EXISTS idx_cases_court_status ON cases (court_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_judge ON cases (judge_id);

ALTER TABLE filings
  DROP CONSTRAINT IF EXISTS filings_case_id_fkey,
  ADD CONSTRAINT filings_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  judge_id UUID REFERENCES judges(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  courtroom TEXT,
  purpose TEXT NOT NULL DEFAULT 'mention'
    CHECK (purpose IN ('mention', 'hearing', 'trial', 'motion', 'adoption', 'ruling', 'judgment', 'report')),
  outcome TEXT CHECK (outcome IN ('held', 'adjourned', 'not_sitting', 'struck_out', 'judgment_delivered', 'settled')),
  adjournment_reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES court_staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hearings_court_day ON hearings (court_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_hearings_case ON hearings (case_id, scheduled_for);

-- Append-only audit trail for everything that happens to a filing or case.
CREATE TABLE IF NOT EXISTS case_events (
  id BIGSERIAL PRIMARY KEY,
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  filing_id UUID REFERENCES filings(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  actor_staff_id UUID REFERENCES court_staff(id) ON DELETE SET NULL,
  actor_label TEXT,                          -- 'Filer', 'System', or the staff name
  action TEXT NOT NULL,                      -- 'filing.submitted', 'case.accepted', ...
  detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_case_events_case ON case_events (case_id, created_at);
CREATE INDEX IF NOT EXISTS idx_case_events_filing ON case_events (filing_id, created_at);

-- Atomically hands out the next suit number for a division: CODE/SEQ/YEAR.
-- The sequence restarts every calendar year, as registries do.
CREATE OR REPLACE FUNCTION assign_suit_number(p_division_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_seq INT;
  v_year INT := EXTRACT(YEAR FROM NOW())::INT;
BEGIN
  UPDATE divisions
     SET next_suit_seq = CASE WHEN suit_seq_year = v_year THEN next_suit_seq + 1 ELSE 2 END,
         suit_seq_year = v_year
   WHERE id = p_division_id
  -- RETURNING sees the new row, so the number just handed out is new - 1.
  RETURNING code, next_suit_seq - 1
    INTO v_code, v_seq;

  IF v_code IS NULL THEN
    RAISE EXCEPTION 'division % not found', p_division_id;
  END IF;

  RETURN v_code || '/' || v_seq || '/' || v_year;
END;
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- No policies = no anon access. The service role bypasses RLS.

ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;

-- Court directory is public (shown on both sites).
DROP POLICY IF EXISTS "Public can read courts" ON courts;
CREATE POLICY "Public can read courts" ON courts FOR SELECT USING (status <> 'suspended');
DROP POLICY IF EXISTS "Public can read divisions" ON divisions;
CREATE POLICY "Public can read divisions" ON divisions FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Public can read judges" ON judges;
CREATE POLICY "Public can read judges" ON judges FOR SELECT USING (is_active);

-- ── Storage ──────────────────────────────────────────────────────────────────
-- Private bucket for filed documents. Uploads use short-lived signed URLs
-- issued by the server; downloads use signed URLs issued to staff only.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('filings', 'filings', FALSE, 26214400)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
