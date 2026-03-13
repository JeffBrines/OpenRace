set search_path to openrace;

alter table races enable row level security;
alter table stages enable row level security;
alter table riders enable row level security;
alter table time_records enable row level security;

-- Races: organizers manage their own, anyone can read active/complete
create policy "Organizers manage own races" on races
  for all using (auth.uid() = organizer_id);

create policy "Public reads active/complete races" on races
  for select using (status in ('active', 'complete'));

-- Stages: inherit race access
create policy "Organizers manage stages via race" on stages
  for all using (
    exists (select 1 from races where races.id = stages.race_id and races.organizer_id = auth.uid())
  );

create policy "Public reads stages of active races" on stages
  for select using (
    exists (select 1 from races where races.id = stages.race_id and status in ('active', 'complete'))
  );

-- Riders: inherit race access
create policy "Organizers manage riders via race" on riders
  for all using (
    exists (select 1 from races where races.id = riders.race_id and races.organizer_id = auth.uid())
  );

create policy "Public reads riders of active races" on riders
  for select using (
    exists (select 1 from races where races.id = riders.race_id and status in ('active', 'complete'))
  );

-- Time records: anyone can insert (volunteers), organizers manage, public reads active
create policy "Anyone inserts time records for active races" on time_records
  for insert with check (
    exists (
      select 1 from stages s
      join races r on r.id = s.race_id
      where s.id = stage_id and r.status = 'active'
    )
  );

create policy "Organizers manage time records" on time_records
  for all using (
    exists (
      select 1 from stages s
      join races r on r.id = s.race_id
      where s.id = stage_id and r.organizer_id = auth.uid()
    )
  );

create policy "Public reads time records of active races" on time_records
  for select using (
    exists (
      select 1 from stages s
      join races r on r.id = s.race_id
      where s.id = stage_id and r.status in ('active', 'complete')
    )
  );
