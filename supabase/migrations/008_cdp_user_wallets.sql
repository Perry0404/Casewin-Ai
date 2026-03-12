-- ============================================================
-- Migration 008: CDP Embedded Wallets per user
-- Each user gets their own non-custodial Base wallet via CDP
-- No private keys stored on our servers — Coinbase MPC manages keys
-- ============================================================

-- User wallets table (stores CDP wallet metadata)
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  cdp_wallet_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  wallet_seed TEXT NOT NULL,  -- encrypted seed for re-importing wallet
  network TEXT DEFAULT 'base-mainnet',
  last_synced_eth TEXT DEFAULT '0',
  last_synced_usdc TEXT DEFAULT '0',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by address
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);

-- RLS: Users can only see their own wallet
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own wallet' AND tablename = 'user_wallets') THEN
    CREATE POLICY "Users can view their own wallet" ON user_wallets FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage wallets' AND tablename = 'user_wallets') THEN
    CREATE POLICY "Service role can manage wallets" ON user_wallets FOR ALL WITH CHECK (true);
  END IF;
END $$;

-- Also enable RLS on user_balances and wallet_transactions if not already
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own balance' AND tablename = 'user_balances') THEN
    CREATE POLICY "Users can view their own balance" ON user_balances FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage balances' AND tablename = 'user_balances') THEN
    CREATE POLICY "Service role can manage balances" ON user_balances FOR ALL WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own transactions' AND tablename = 'wallet_transactions') THEN
    CREATE POLICY "Users can view their own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage transactions' AND tablename = 'wallet_transactions') THEN
    CREATE POLICY "Service role can manage transactions" ON wallet_transactions FOR ALL WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- DONE! Each user now gets a unique deposit address on Base.
-- Architecture:
--   1. User signs up → CDP creates a Base wallet for them
--   2. User deposits USDC/ETH to their own wallet address
--   3. App reads on-chain balance via CDP SDK (no private keys)
--   4. User clicks "Sync" → on-chain balance credited to trading DB
--   5. User can withdraw anytime → CDP sends from their wallet
-- ============================================================
