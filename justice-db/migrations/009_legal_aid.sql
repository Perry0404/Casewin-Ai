-- CaseWin Legal Aid: real requests for help, verified volunteers, tracked outcomes.
-- Shares the justice database (auth.users, platform_admins). Every table here
-- holds personal data about people in custody, so RLS is on with no policies:
-- only the server (service role) reads or writes, after its own role checks.

create table if not exists la_organisations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kind text not null check (kind in ('legal_aid_council', 'pdss', 'ngo', 'law_clinic', 'nba_branch', 'chambers', 'faith_community', 'other')),
  state text not null,
  address text,
  email text,
  phone text,
  website text,
  cac_number text,
  description text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  reviewer_note text,
  created_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- One row per volunteer. Lawyers give their Supreme Court enrolment number,
-- which the admin checks against the NBA / Supreme Court roll before approving.
create table if not exists la_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references la_organisations(id),
  role text not null check (role in ('lawyer', 'paralegal', 'law_student', 'coordinator')),
  full_name text not null,
  email text not null,
  phone text not null,
  state text not null,
  states_covered text[] not null default '{}',
  languages text[] not null default '{}',
  practice_areas text[] not null default '{}',
  enrolment_number text,
  year_called int,
  nba_branch text,
  institution text,
  capacity int not null default 3 check (capacity between 1 and 50),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  reviewer_note text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists la_members_status_idx on la_members (status);

create table if not exists la_cases (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  kind text not null check (kind in ('detention', 'police_abuse', 'family', 'land_housing', 'employment', 'other_civil')),
  status text not null default 'new' check (status in ('new', 'assigned', 'in_progress', 'resolved', 'closed', 'spam')),
  channel text not null default 'web' check (channel in ('web', 'visit', 'partner', 'phone')),
  -- where
  state text not null,
  lga text,
  facility text,
  facility_type text check (facility_type in ('police_station', 'correctional_centre', 'efcc_dss_other', 'unknown')),
  -- who needs help
  person_name text not null,
  person_age int check (person_age between 0 and 120),
  person_sex text check (person_sex in ('female', 'male', 'unspecified')),
  person_phone text,
  -- who is asking
  reporter_name text,
  reporter_phone text,
  reporter_email text,
  reporter_relationship text,
  language text,
  -- the matter
  arrested_on date,
  remanded_on date,
  last_hearing_on date,
  next_hearing_on date,
  court_name text,
  charge_number text,
  allegation text,
  story text not null,
  has_lawyer boolean not null default false,
  can_pay boolean not null default false,
  consent_at timestamptz not null,
  -- verification: a report is unconfirmed until a volunteer has checked the person and facts are real
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  verification_method text,
  -- assignment
  assigned_to uuid references auth.users(id),
  assigned_org uuid references la_organisations(id),
  assigned_at timestamptz,
  first_action_due timestamptz,
  first_action_at timestamptz,
  -- outcome
  outcome text check (outcome in ('released_bail', 'released_unconditional', 'charges_struck_out', 'discharged', 'acquitted', 'settled', 'judgment_won', 'referred', 'withdrawn', 'other')),
  outcome_on date,
  outcome_note text,
  -- reporter's private tracking PIN (sha-256), and a hashed IP for abuse limits
  pin_hash text not null,
  ip_hash text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists la_cases_status_idx on la_cases (status, state);
create index if not exists la_cases_assigned_idx on la_cases (assigned_to) where assigned_to is not null;
create index if not exists la_cases_ip_idx on la_cases (ip_hash, created_at);

create table if not exists la_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references la_cases(id) on delete cascade,
  actor uuid references auth.users(id),
  actor_label text,
  kind text not null,
  body text,
  public boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists la_case_events_case_idx on la_case_events (case_id, created_at);

alter table la_organisations enable row level security;
alter table la_members enable row level security;
alter table la_cases enable row level security;
alter table la_case_events enable row level security;

-- Failed tracking look-ups, to stop PIN guessing.
create table if not exists la_track_attempts (
  ip_hash text not null,
  at timestamptz not null default now()
);
create index if not exists la_track_attempts_idx on la_track_attempts (ip_hash, at);
alter table la_track_attempts enable row level security;
