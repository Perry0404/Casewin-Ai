-- States an organisation's panel takes cases from. Empty = only its home state.
alter table la_organisations add column if not exists states_covered text[] not null default '{}';
