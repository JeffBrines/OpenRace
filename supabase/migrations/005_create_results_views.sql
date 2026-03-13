-- Use DISTINCT ON to handle duplicate time records per rider+stage+type
-- (e.g., corrections). Takes the most recent record by created_at.
create or replace view stage_results as
with deduped_starts as (
  select distinct on (rider_id, stage_id)
    id, rider_id, stage_id, timestamp
  from time_records
  where type = 'start' and rider_id is not null
  order by rider_id, stage_id, created_at desc
),
deduped_finishes as (
  select distinct on (rider_id, stage_id)
    id, rider_id, stage_id, timestamp
  from time_records
  where type = 'finish' and rider_id is not null
  order by rider_id, stage_id, created_at desc
)
select
  r.id as rider_id,
  s.id as stage_id,
  s.race_id,
  ds.timestamp as start_time,
  df.timestamp as finish_time,
  case
    when ds.id is null then 'dns'
    when df.id is null then 'dnf'
    else 'ok'
  end as status,
  case
    when ds.id is not null and df.id is not null
    then df.timestamp - ds.timestamp
    else null
  end as elapsed_ms
from riders r
join stages s on s.race_id = r.race_id
left join deduped_starts ds on ds.rider_id = r.id and ds.stage_id = s.id
left join deduped_finishes df on df.rider_id = r.id and df.stage_id = s.id;

create or replace view race_results as
with totals as (
  select
    sr.rider_id,
    sr.race_id,
    case
      when bool_or(sr.status != 'ok') then null
      else sum(sr.elapsed_ms)
    end as total_time_ms,
    jsonb_agg(
      jsonb_build_object(
        'stage_id', sr.stage_id,
        'elapsed_ms', sr.elapsed_ms,
        'status', sr.status
      ) order by s."order", s.id
    ) as stage_results,
    bool_or(sr.status != 'ok') as has_dnf
  from stage_results sr
  join stages s on s.id = sr.stage_id
  group by sr.rider_id, sr.race_id
)
select
  t.*,
  rd.category,
  row_number() over (
    order by t.has_dnf asc, t.total_time_ms asc nulls last
  ) as overall_rank,
  row_number() over (
    partition by rd.category
    order by t.has_dnf asc, t.total_time_ms asc nulls last
  ) as category_rank
from totals t
join riders rd on rd.id = t.rider_id;
