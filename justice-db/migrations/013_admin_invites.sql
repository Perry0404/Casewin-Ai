-- One-time invitations to become a platform admin. The link works only for the invited
-- email address and only once; we keep the sha256 of its secret, never the secret.
create table if not exists admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  token_hash text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null
);
alter table admin_invites enable row level security;
alter table platform_admins add column if not exists added_by uuid references auth.users(id) on delete set null;
