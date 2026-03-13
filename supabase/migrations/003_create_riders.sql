create type gender_type as enum ('male', 'female', 'non_binary');

create table riders (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references races(id) on delete cascade,
  name text not null,
  bib text,
  category text not null,
  age integer,
  gender gender_type not null,
  created_at timestamptz not null default now()
);

create index idx_riders_race on riders(race_id);
