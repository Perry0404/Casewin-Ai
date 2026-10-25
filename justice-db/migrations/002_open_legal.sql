-- OpenLegal Nigeria: the public, searchable side of the Justice database.
--
-- Judgments enter one of two ways:
--   1. A court registrar publishes a judgment from court.casewinai.com
--      (source = 'court_upload', linked to the case it decided), or
--   2. An editor imports an already-public judgment (source = 'import').
-- Only rows with status = 'published' are ever visible to the public, the
-- REST API or the MCP server.

-- array_to_string is only STABLE, which generated columns reject. Joining a
-- text[] is deterministic, so this wrapper is safe to mark IMMUTABLE.
CREATE OR REPLACE FUNCTION immutable_join(arr TEXT[])
RETURNS TEXT LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$ SELECT coalesce(array_to_string(arr, ' '), '') $$;

CREATE TABLE IF NOT EXISTS judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                 -- URL id, e.g. 'how-142-2026-chukwu-v-okeke'
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'court_upload' CHECK (source IN ('court_upload', 'import')),

  title TEXT NOT NULL,                       -- 'Chukwu v. Okeke'
  suit_number TEXT,
  citation TEXT,                             -- law-report citation when one exists
  court_name TEXT NOT NULL,                  -- denormalised so imports need no courts row
  division TEXT,
  state TEXT,
  judges TEXT[] NOT NULL DEFAULT '{}',
  case_type TEXT,
  delivered_on DATE,

  summary TEXT,                              -- plain-language summary
  holding TEXT,                              -- the decision in one or two sentences
  issues TEXT[] NOT NULL DEFAULT '{}',       -- issues for determination
  keywords TEXT[] NOT NULL DEFAULT '{}',
  statutes_cited TEXT[] NOT NULL DEFAULT '{}',
  cases_cited TEXT[] NOT NULL DEFAULT '{}',
  full_text TEXT NOT NULL,
  document_path TEXT,                        -- signed PDF in the 'judgments' bucket, optional

  -- Publication workflow (court uploads only; imports are published directly)
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'withdrawn')),
  redaction_confirmed BOOLEAN NOT NULL DEFAULT FALSE,  -- registrar confirmed minors/victims/sealed details removed
  uploaded_by UUID REFERENCES court_staff(id) ON DELETE SET NULL,
  published_by UUID REFERENCES court_staff(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  is_sample BOOLEAN NOT NULL DEFAULT FALSE,

  search tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(suit_number, '') || ' ' || coalesce(citation, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(holding, '') || ' ' || coalesce(summary, '') || ' ' || immutable_join(keywords) || ' ' || immutable_join(issues)), 'B') ||
    setweight(to_tsvector('english', immutable_join(statutes_cited) || ' ' || immutable_join(cases_cited) || ' ' || immutable_join(judges)), 'C') ||
    setweight(to_tsvector('english', coalesce(full_text, '')), 'D')
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_judgments_search ON judgments USING GIN (search);
CREATE INDEX IF NOT EXISTS idx_judgments_title_trgm ON judgments USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_judgments_public ON judgments (status, delivered_on DESC);
CREATE INDEX IF NOT EXISTS idx_judgments_case ON judgments (case_id);

-- Statutes, stored section by section so search can point at the exact provision.
CREATE TABLE IF NOT EXISTS laws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                 -- 'evidence-act-2011'
  title TEXT NOT NULL,
  short_title TEXT,
  year INT,
  jurisdiction TEXT NOT NULL DEFAULT 'federal', -- 'federal' or a state name
  category TEXT,
  description TEXT,
  source_url TEXT,                           -- official source the text was taken from
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS law_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  law_id UUID NOT NULL REFERENCES laws(id) ON DELETE CASCADE,
  part TEXT,                                 -- 'Part IV — Fundamental Rights'
  number TEXT NOT NULL,                      -- '36' or '36(1)'
  heading TEXT,
  body TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  search tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(heading, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) STORED,
  UNIQUE (law_id, number)
);
CREATE INDEX IF NOT EXISTS idx_law_sections_search ON law_sections USING GIN (search);
CREATE INDEX IF NOT EXISTS idx_law_sections_law ON law_sections (law_id, position);

-- Public API keys for OpenLegal's REST + MCP endpoints. Only the SHA-256 of a
-- key is stored. Anonymous use is allowed at a lower rate limit.
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,                  -- first 8 chars, for display
  owner_email TEXT NOT NULL,
  label TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'research', 'pro')),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Search functions ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_judgments(
  q TEXT,
  p_court TEXT DEFAULT NULL,
  p_case_type TEXT DEFAULT NULL,
  p_year_from INT DEFAULT NULL,
  p_year_to INT DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_include_samples BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  id UUID, slug TEXT, title TEXT, suit_number TEXT, citation TEXT, court_name TEXT,
  division TEXT, state TEXT, judges TEXT[], case_type TEXT, delivered_on DATE,
  holding TEXT, summary TEXT, keywords TEXT[], source TEXT, is_sample BOOLEAN,
  snippet TEXT, rank REAL, total_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  WITH query AS (
    SELECT CASE WHEN coalesce(trim(q), '') = '' THEN NULL ELSE websearch_to_tsquery('english', q) END AS tsq
  ),
  hits AS (
    SELECT j.*,
           CASE WHEN query.tsq IS NULL THEN 0 ELSE ts_rank_cd(j.search, query.tsq, 32) END AS r,
           query.tsq
      FROM judgments j, query
     WHERE j.status = 'published'
       AND (p_include_samples OR NOT j.is_sample)
       AND (query.tsq IS NULL OR j.search @@ query.tsq OR j.title ILIKE '%' || q || '%' OR j.suit_number ILIKE '%' || q || '%')
       AND (p_court IS NULL OR j.court_name = p_court)
       AND (p_case_type IS NULL OR j.case_type = p_case_type)
       AND (p_year_from IS NULL OR EXTRACT(YEAR FROM j.delivered_on) >= p_year_from)
       AND (p_year_to IS NULL OR EXTRACT(YEAR FROM j.delivered_on) <= p_year_to)
  )
  SELECT h.id, h.slug, h.title, h.suit_number, h.citation, h.court_name, h.division, h.state,
         h.judges, h.case_type, h.delivered_on, h.holding, h.summary, h.keywords, h.source, h.is_sample,
         CASE WHEN h.tsq IS NULL THEN left(coalesce(h.summary, h.full_text), 280)
              ELSE ts_headline('english', coalesce(h.summary, '') || ' … ' || left(h.full_text, 20000), h.tsq,
                               'StartSel=<mark>,StopSel=</mark>,MaxWords=45,MinWords=20,MaxFragments=2,FragmentDelimiter= … ')
         END AS snippet,
         h.r AS rank,
         COUNT(*) OVER () AS total_count
    FROM hits h
   ORDER BY h.r DESC, h.delivered_on DESC NULLS LAST
   LIMIT least(p_limit, 50) OFFSET greatest(p_offset, 0);
$$;

CREATE OR REPLACE FUNCTION search_law_sections(q TEXT, p_law_slug TEXT DEFAULT NULL, p_limit INT DEFAULT 20)
RETURNS TABLE (
  id UUID, law_slug TEXT, law_title TEXT, law_year INT, part TEXT, number TEXT,
  heading TEXT, snippet TEXT, rank REAL
)
LANGUAGE sql STABLE
AS $$
  SELECT s.id, l.slug, l.title, l.year, s.part, s.number, s.heading,
         ts_headline('english', s.body, websearch_to_tsquery('english', q),
                     'StartSel=<mark>,StopSel=</mark>,MaxWords=40,MinWords=15') AS snippet,
         ts_rank_cd(s.search, websearch_to_tsquery('english', q)) AS rank
    FROM law_sections s
    JOIN laws l ON l.id = s.law_id
   WHERE l.is_published
     AND s.search @@ websearch_to_tsquery('english', q)
     AND (p_law_slug IS NULL OR l.slug = p_law_slug)
   ORDER BY rank DESC
   LIMIT least(p_limit, 50);
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE laws ENABLE ROW LEVEL SECURITY;
ALTER TABLE law_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads published judgments" ON judgments;
CREATE POLICY "Public reads published judgments" ON judgments FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Public reads laws" ON laws;
CREATE POLICY "Public reads laws" ON laws FOR SELECT USING (is_published);
DROP POLICY IF EXISTS "Public reads law sections" ON law_sections;
CREATE POLICY "Public reads law sections" ON law_sections FOR SELECT
  USING (EXISTS (SELECT 1 FROM laws l WHERE l.id = law_id AND l.is_published));

-- The search functions run as the caller, so RLS above still applies to them.
GRANT EXECUTE ON FUNCTION search_judgments TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_law_sections TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
