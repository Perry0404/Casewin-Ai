-- CaseWin AI Subscription & Usage Tables
-- Run this in Supabase SQL Editor

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  user_email text,
  plan text NOT NULL DEFAULT 'free', -- 'free', 'individual', 'firm'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'expired', 'cancelled'
  amount_usd numeric(10,2) DEFAULT 0,
  amount_ngn numeric(12,2) DEFAULT 0,
  payment_reference text,
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- AI Usage tracking (for free tier limits)
CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  tool text NOT NULL, -- which tool was used
  query_text text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, created_at);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (our API uses service role key)
CREATE POLICY "Service role full access subscriptions" ON subscriptions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access ai_usage" ON ai_usage
  FOR ALL USING (true) WITH CHECK (true);
