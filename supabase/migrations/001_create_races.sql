-- Create dedicated schema for OpenRace (shared Supabase instance)
create schema if not exists openrace;
set search_path to openrace;

create type race_type as enum ('enduro', 'dh', 'xc');
create type race_status as enum ('draft', 'active', 'complete');
create type rider_id_mode as enum ('name_only', 'bib_only', 'both');

create table races (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  type race_type not null,
  location text,
  organizer_id uuid not null references auth.users(id) on delete cascade,
  categories jsonb not null default '[]'::jsonb,
  rider_id_mode rider_id_mode not null default 'both',
  status race_status not null default 'draft',
  share_code text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_races_organizer on races(organizer_id);
create index idx_races_share_code on races(share_code);
