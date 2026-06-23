-- The spine of CaseWin's justice pipeline — open to ANYONE with a dispute.
--
-- A "matter" is a single dispute, created once by any party (a business, an
-- individual, or a lawyer), that MOVES through the four layers:
-- intake → analysis → settlement → agreement (transactions) → closed, or
-- escalated to court (filed). A lawyer can JOIN a matter when needed; they do
-- not own it. Every layer reads and writes the same matter so nothing is ever
-- re-entered — the dispute genuinely advances toward a just outcome.
CREATE TABLE IF NOT EXISTS matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The disputing party who opened the matter. Any authenticated account,
  -- NOT limited to lawyers/firms.
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_email TEXT,

  -- A lawyer who joins to review / represent. Optional — most matters should
  -- resolve without one.
  lawyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  counterparty TEXT,            -- who the dispute is against
  claim_amount NUMERIC(15,2),

  -- Pipeline stage. The workspace advances this as the matter moves forward.
  stage TEXT NOT NULL DEFAULT 'intake'
    CHECK (stage IN ('intake', 'analysis', 'settlement', 'agreement', 'closed', 'filed')),

  -- Structured knowledge accumulated as the matter progresses.
  narrative TEXT,               -- AI-built "one story" from the chaos
  facts JSONB DEFAULT '{}'::jsonb,        -- who / what / when / against whom / claims
  evidence JSONB DEFAULT '[]'::jsonb,     -- [{ name, type, hash, addedAt }]
  settlement JSONB,             -- settlement engine output
  invoice_id UUID,              -- links to invoices (transactions layer)
  payment_link TEXT,
  resolution TEXT,              -- 'settled' | 'filed' | null

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matters_owner ON matters (owner_id);
CREATE INDEX IF NOT EXISTS idx_matters_lawyer ON matters (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_matters_stage ON matters (stage);

ALTER TABLE matters ENABLE ROW LEVEL SECURITY;

-- The owner and any joined lawyer can access the matter; the service-role API
-- also operates on it.
CREATE POLICY "Owner and joined lawyer access matter" ON matters
  FOR ALL
  USING (auth.uid() = owner_id OR auth.uid() = lawyer_id)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = lawyer_id);

NOTIFY pgrst, 'reload schema';
