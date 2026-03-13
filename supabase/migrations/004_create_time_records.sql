create type time_record_type as enum ('start', 'finish');

create table time_records (
  id uuid primary key,
  stage_id uuid not null references stages(id) on delete cascade,
  rider_id uuid references riders(id) on delete set null,
  timestamp bigint not null,
  type time_record_type not null,
  device_id text not null,
  created_at timestamptz not null default now()
);

create index idx_time_records_stage on time_records(stage_id);
create index idx_time_records_rider on time_records(rider_id);
create index idx_time_records_stage_type on time_records(stage_id, type);
