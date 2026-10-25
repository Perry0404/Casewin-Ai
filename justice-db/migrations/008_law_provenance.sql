-- Where each statute's text came from, which edition it is, and whether it
-- still needs a human check. Shown on every law page.
ALTER TABLE laws ADD COLUMN IF NOT EXISTS source_name TEXT;          -- e.g. 'PLAC — Laws of the Federation of Nigeria 2004'
ALTER TABLE laws ADD COLUMN IF NOT EXISTS edition TEXT;              -- e.g. 'LFN 2004', 'As enacted 2018'
ALTER TABLE laws ADD COLUMN IF NOT EXISTS currency_note TEXT;        -- e.g. 'Text as at 31 Dec 2002; may since have been amended or repealed.'
ALTER TABLE laws ADD COLUMN IF NOT EXISTS long_title TEXT;           -- "An Act to …"
ALTER TABLE laws ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE laws ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;
ALTER TABLE laws ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;   -- source's own id, so re-imports update instead of duplicating

-- Searching by title as well as by section text.
CREATE INDEX IF NOT EXISTS idx_laws_title_trgm ON laws USING GIN (title gin_trgm_ops);

NOTIFY pgrst, 'reload schema';
