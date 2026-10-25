-- Self-registration for CaseWin Court, approved by a platform admin.
--
--   filer        — counsel, a party in person or a government agency who wants
--                  to e-file. Approved filers get the filer portal (/portal) and
--                  are the only people who can e-file.
--   court_staff  — someone who works at an onboarded court (registrar, clerk,
--                  judge, court administrator). Approval creates their
--                  court_staff row with the role the reviewer confirms.
--
-- Court administrators can still create staff logins directly from their
-- registry (they vouch for their own staff); this table is for people who
-- apply on their own.

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('filer', 'court_staff')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- filer
  filer_type TEXT CHECK (filer_type IN ('lawyer', 'litigant', 'agency')),
  bar_number TEXT,                         -- Supreme Court enrolment number (SCN…)
  year_of_call INT,
  law_firm TEXT,
  address TEXT,

  -- court staff
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  requested_role TEXT CHECK (requested_role IN ('court_admin', 'registrar', 'clerk', 'judge')),
  position TEXT,                           -- job title as the court describes it
  staff_number TEXT,                       -- court/civil-service staff ID
  supervisor TEXT,                         -- who can vouch for them (e.g. the Chief Registrar)

  note TEXT,                               -- anything else the applicant wants to say
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations (status, created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations (user_id);

-- Approved e-filers. One per auth user.
CREATE TABLE IF NOT EXISTS filer_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  filer_type TEXT NOT NULL CHECK (filer_type IN ('lawyer', 'litigant', 'agency')),
  bar_number TEXT,
  law_firm TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Filings made through the portal are tied to the filer's account.
ALTER TABLE filings ADD COLUMN IF NOT EXISTS filer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_filings_filer_user ON filings (filer_user_id, created_at DESC);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE filer_accounts ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
