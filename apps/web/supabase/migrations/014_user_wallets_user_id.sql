-- Add user_id column to user_wallets for faster lawyer sub-account lookup
ALTER TABLE user_wallets
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Populate user_id from email where possible
UPDATE user_wallets uw
SET user_id = p.id
FROM profiles p
WHERE p.email = uw.user_email
  AND uw.user_id IS NULL;

CREATE INDEX IF NOT EXISTS user_wallets_user_id_idx ON user_wallets (user_id);

NOTIFY pgrst, 'reload schema';
