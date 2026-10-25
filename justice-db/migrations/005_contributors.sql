-- OpenLegal contributor network.
--
-- Students, lawyers and litigants submit judgments they hold or find — from
-- the website or straight from their AI assistant through the MCP server.
-- A submission is NEVER public until a reviewer verifies it; once verified it
-- becomes a judgments row with source = 'community', shown with its own badge
-- so it is never mistaken for a court-published judgment.
--
-- Points: +10 when your submission is verified as new law; +1 to everyone who
-- independently submitted the same case before it was verified (it helps the
-- reviewer trust the text). Duplicates of already-published judgments earn
-- nothing. Points are contribution points only — no cash value is promised.

ALTER TABLE judgments DROP CONSTRAINT IF EXISTS judgments_source_check;
ALTER TABLE judgments ADD CONSTRAINT judgments_source_check CHECK (source IN ('court_upload', 'import', 'community'));

CREATE TABLE IF NOT EXISTS contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  institution TEXT,                         -- law school, firm or chambers
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'lawyer', 'litigant', 'researcher', 'other')),
  api_key_hash TEXT UNIQUE,                 -- SHA-256 of the key; the key itself is shown once
  api_key_prefix TEXT,
  points INT NOT NULL DEFAULT 0,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE judgments ADD COLUMN IF NOT EXISTS contributed_by UUID REFERENCES contributors(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web', 'mcp', 'api')),

  title TEXT NOT NULL,
  suit_number TEXT,
  court_name TEXT NOT NULL,
  division TEXT,
  delivered_on DATE,
  judges TEXT[] NOT NULL DEFAULT '{}',
  case_type TEXT,
  full_text TEXT NOT NULL,
  source_url TEXT,                          -- where the contributor got it
  source_note TEXT,                         -- e.g. "certified true copy from the registry"

  fingerprint TEXT NOT NULL,                -- SHA-256 of normalised text
  match_key TEXT,                           -- normalised suit number + court
  flags TEXT[] NOT NULL DEFAULT '{}',       -- reviewer hints, e.g. 'possible_law_report_copy'

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'duplicate')),
  duplicate_of_judgment UUID REFERENCES judgments(id) ON DELETE SET NULL,
  confirmations INT NOT NULL DEFAULT 0,     -- other contributors who sent the same case
  judgment_id UUID REFERENCES judgments(id) ON DELETE SET NULL,
  reviewer_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (status, created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_contributor ON submissions (contributor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_fingerprint ON submissions (fingerprint);
CREATE INDEX IF NOT EXISTS idx_submissions_match_key ON submissions (match_key);
CREATE INDEX IF NOT EXISTS idx_submissions_title_trgm ON submissions USING GIN (title gin_trgm_ops);

-- Someone else sent a case already waiting for review: recorded here instead
-- of as a second submission.
CREATE TABLE IF NOT EXISTS submission_confirmations (
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (submission_id, contributor_id)
);

CREATE TABLE IF NOT EXISTS points_ledger (
  id BIGSERIAL PRIMARY KEY,
  contributor_id UUID NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_points_contributor ON points_ledger (contributor_id, created_at DESC);

-- Normalised forms used for duplicate detection.
CREATE OR REPLACE FUNCTION norm_suit(s TEXT) RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT nullif(regexp_replace(upper(coalesce(s, '')), '[^A-Z0-9]', '', 'g'), '')
$$;

ALTER TABLE judgments ADD COLUMN IF NOT EXISTS match_key TEXT
  GENERATED ALWAYS AS (norm_suit(suit_number) || '|' || norm_suit(court_name)) STORED;
CREATE INDEX IF NOT EXISTS idx_judgments_match_key ON judgments (match_key);

-- Finds an existing judgment or pending submission for the same case:
-- same suit number + court, or a very similar title in the same court and year.
CREATE OR REPLACE FUNCTION find_existing_case(p_suit TEXT, p_court TEXT, p_title TEXT, p_year INT, p_fingerprint TEXT)
RETURNS TABLE (kind TEXT, id UUID, slug TEXT, title TEXT, contributor_id UUID, score REAL)
LANGUAGE sql STABLE AS $$
  (SELECT 'judgment', j.id, j.slug, j.title, NULL::uuid, 1.0::real
     FROM judgments j
    WHERE j.status = 'published' AND NOT j.is_sample
      AND norm_suit(p_suit) IS NOT NULL AND j.match_key = norm_suit(p_suit) || '|' || norm_suit(p_court)
    LIMIT 1)
  UNION ALL
  (SELECT 'judgment', j.id, j.slug, j.title, NULL::uuid, similarity(j.title, p_title)
     FROM judgments j
    WHERE j.status = 'published' AND NOT j.is_sample
      AND norm_suit(j.court_name) = norm_suit(p_court)
      AND (p_year IS NULL OR EXTRACT(YEAR FROM j.delivered_on) = p_year)
      AND similarity(j.title, p_title) > 0.6
    ORDER BY similarity(j.title, p_title) DESC LIMIT 1)
  UNION ALL
  (SELECT 'submission', s.id, NULL, s.title, s.contributor_id, 1.0::real
     FROM submissions s
    WHERE s.status = 'pending'
      AND (s.fingerprint = p_fingerprint
           OR (norm_suit(p_suit) IS NOT NULL AND s.match_key = norm_suit(p_suit) || '|' || norm_suit(p_court)))
    LIMIT 1)
  UNION ALL
  (SELECT 'submission', s.id, NULL, s.title, s.contributor_id, similarity(s.title, p_title)
     FROM submissions s
    WHERE s.status = 'pending'
      AND norm_suit(s.court_name) = norm_suit(p_court)
      AND (p_year IS NULL OR EXTRACT(YEAR FROM s.delivered_on) = p_year)
      AND similarity(s.title, p_title) > 0.6
    ORDER BY similarity(s.title, p_title) DESC LIMIT 1)
$$;

-- Public leaderboard (no emails).
CREATE OR REPLACE VIEW contributor_leaderboard AS
  SELECT c.id, c.display_name, c.institution, c.role, c.points,
         (SELECT count(*) FROM submissions s WHERE s.contributor_id = c.id AND s.status = 'verified') AS verified_count
    FROM contributors c
   WHERE NOT c.is_blocked AND c.points > 0;

ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
-- No anon policies: all access goes through server routes after a key or session check.
REVOKE ALL ON contributor_leaderboard FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';
