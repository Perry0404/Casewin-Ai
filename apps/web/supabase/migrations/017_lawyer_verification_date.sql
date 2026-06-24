-- Fix: lawyer verification was silently failing.
--
-- verification_date existed only in schema.sql, never in a migration, so on the
-- live (migration-built) database the column was missing. The admin verify
-- route wrote { is_verified, verification_date } in one update — the missing
-- column made the whole update error, so is_verified never persisted: verified
-- lawyers never appeared on the marketplace and never got tool access.
--
-- The route no longer depends on this column, but we add it so the timestamp
-- is recorded going forward.
ALTER TABLE lawyer_profiles
  ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ;

NOTIFY pgrst, 'reload schema';
