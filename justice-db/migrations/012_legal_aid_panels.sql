-- Panels: lawyers an organisation (e.g. a Legal Aid Council state office) vouches for and
-- uploads by name and phone number. They sign in with a personal link sent on WhatsApp,
-- with no email or password, and take cases sent to the panel on WhatsApp.

alter table la_members add column if not exists whatsapp text;
alter table la_members add column if not exists on_panel boolean not null default false;
-- sha256 of the personal sign-in link's secret. Re-sending a link replaces it.
alter table la_members add column if not exists access_token_hash text unique;
alter table la_members add column if not exists access_sent_at timestamptz;
alter table la_members add column if not exists last_link_login_at timestamptz;
alter table la_members add column if not exists added_by uuid references auth.users(id);

-- Each time a case is sent to a panel on WhatsApp.
create table if not exists la_panel_alerts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references la_cases(id) on delete cascade,
  org_id uuid not null references la_organisations(id) on delete cascade,
  sent_by uuid references auth.users(id),
  channel text not null default 'whatsapp_manual',
  created_at timestamptz not null default now()
);
create index if not exists la_panel_alerts_case on la_panel_alerts(case_id);
alter table la_panel_alerts enable row level security;
