-- CaseWin Legal Aid: clearing house, referrals, diversion and the rights-violation register.

-- Volunteers choose whether their own name appears in the public clearing house.
alter table la_members add column if not exists show_publicly boolean not null default false;

-- An organisation's town, for the clearing house.
alter table la_organisations add column if not exists town text;

-- Referral of a case to an organisation, whose coordinator then assigns a member.
alter table la_cases add column if not exists referred_org uuid references la_organisations(id);
alter table la_cases add column if not exists referred_at timestamptz;
create index if not exists la_cases_referred_idx on la_cases (referred_org) where referred_org is not null;

-- Diversion: mediation or a restorative route instead of (or alongside) prosecution or litigation.
alter table la_cases add column if not exists diversion_status text
  check (diversion_status in ('suitable', 'referred', 'in_progress', 'completed', 'declined', 'unsuitable'));
alter table la_cases add column if not exists diversion_route text
  check (diversion_route in ('multi_door_courthouse', 'citizens_mediation_centre', 'community_mediation', 'restorative_meeting', 'plea_bargain', 'other'));
alter table la_cases add column if not exists diversion_note text;
alter table la_cases add column if not exists diversion_updated_at timestamptz;

-- Rights violations: one row per incident, so patterns by facility and state can be seen.
-- The facility name and description are visible to administrators only; the public sees counts.
create table if not exists la_incidents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references la_cases(id) on delete set null,
  kind text not null check (kind in ('extortion', 'torture', 'unlawful_detention', 'detention_of_relative', 'sexual_violence', 'death_in_custody', 'unlawful_seizure', 'threats', 'other')),
  occurred_on date,
  state text not null,
  town text,
  facility text,
  agency text check (agency in ('police', 'military', 'dss', 'efcc', 'correctional_service', 'other')),
  description text,
  amount_demanded int,
  verified boolean not null default false,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists la_incidents_state_idx on la_incidents (state, kind);
alter table la_incidents enable row level security;

notify pgrst, 'reload schema';
