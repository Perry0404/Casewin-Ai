-- CaseWin AI Firm Knowledge Base Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS firm_knowledge (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id text NOT NULL,
  user_id text,
  document_name text NOT NULL,
  document_type text DEFAULT 'general',
  chunk_index integer DEFAULT 0,
  chunk_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_firm_knowledge_firm ON firm_knowledge(firm_id);
CREATE INDEX IF NOT EXISTS idx_firm_knowledge_search ON firm_knowledge USING gin(to_tsvector('english', chunk_text));

-- Enable RLS
ALTER TABLE firm_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access firm_knowledge" ON firm_knowledge
  FOR ALL USING (true) WITH CHECK (true);
