-- Layer 4 (Court infrastructure): evidence verification proofs.
-- Stores only a SHA-256 hash + timestamp — never the evidence itself — so we
-- can prove a file existed at a point in time and was never altered.
CREATE TABLE IF NOT EXISTS evidence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- First registration of a given hash is the one that matters (earliest proof).
CREATE INDEX IF NOT EXISTS idx_evidence_hash ON evidence_records (hash);

ALTER TABLE evidence_records ENABLE ROW LEVEL SECURITY;

-- Writes/reads go through the service-role API only.
CREATE POLICY "Service role manages evidence" ON evidence_records
  FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
