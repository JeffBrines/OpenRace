set search_path to openrace;

create table stages (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references races(id) on delete cascade,
  name text not null,
  "order" integer not null,
  distance real,
  elevation real,
  start_token text unique not null,
  finish_token text unique not null,
  created_at timestamptz not null default now()
);

create index idx_stages_race on stages(race_id);
