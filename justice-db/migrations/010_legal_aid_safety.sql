-- CaseWin Legal Aid: safety, supervision, documents, court link and alerts.
-- Same rule as 009: personal data, RLS on, no policies — server only.

-- Safety: may we call the number given? (domestic violence: an abuser may hold the phone)
alter table la_cases add column if not exists safe_contact text not null default 'yes'
  check (safe_contact in ('yes', 'text_only', 'no_calls', 'other_way'));
alter table la_cases add column if not exists safe_contact_note text;

-- Means: the person's income band and circumstances, for the Legal Aid Act eligibility check.
alter table la_cases add column if not exists income_band text
  check (income_band in ('none', 'below_min_wage', 'up_to_2x', 'above_2x', 'unknown'));
alter table la_cases add column if not exists vulnerable text[] not null default '{}';

-- Supervision and ethics.
alter table la_cases add column if not exists supervisor_id uuid references auth.users(id);
alter table la_cases add column if not exists supervised_at timestamptz;
alter table la_cases add column if not exists conflict_cleared_by uuid references auth.users(id);
alter table la_cases add column if not exists conflict_cleared_at timestamptz;

-- Link to a CaseWin Court case, so hearings come from the registry itself.
alter table la_cases add column if not exists court_case_id uuid references cases(id) on delete set null;

-- Language the report was made in.
alter table la_cases add column if not exists form_language text;

-- Problems reported by families: a volunteer asking for money, no contact, data requests.
create table if not exists la_complaints (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references la_cases(id) on delete cascade,
  kind text not null check (kind in ('asked_for_money', 'no_contact', 'misconduct', 'delete_my_data', 'other')),
  body text,
  against uuid references auth.users(id),
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'dismissed')),
  resolution text,
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists la_complaints_status_idx on la_complaints (status, created_at);

-- Case documents (charge sheet, remand warrant, ID, photos) in a private bucket.
create table if not exists la_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references la_cases(id) on delete cascade,
  kind text not null check (kind in ('charge_sheet', 'remand_warrant', 'court_order', 'bail_bond', 'id', 'photo', 'medical', 'letter', 'other')),
  name text not null,
  path text not null,
  size int not null,
  sha256 text not null,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists la_documents_case_idx on la_documents (case_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('la-documents', 'la-documents', false, 10485760)
on conflict (id) do nothing;

-- Every alert we tried to send, sent or not, so nothing disappears silently.
create table if not exists la_notifications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references la_cases(id) on delete cascade,
  channel text not null check (channel in ('sms', 'email')),
  recipient text not null,
  template text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists la_notifications_case_idx on la_notifications (case_id, created_at);

-- USSD sessions (Africa's Talking calls back once per key press).
create table if not exists la_ussd_sessions (
  session_id text primary key,
  phone text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table la_complaints enable row level security;
alter table la_documents enable row level security;
alter table la_notifications enable row level security;
alter table la_ussd_sessions enable row level security;

notify pgrst, 'reload schema';
