set lock_timeout = '5s';
set statement_timeout = '60s';

-- Online classes. An online class has no physical location: `building` may be
-- empty and latitude/longitude are null. In-person classes keep both
-- requirements. Synchronous online classes still occupy time slots, so
-- classes_prevent_time_conflict is unchanged; asynchronous classes remain
-- weekdays = '{}'.
alter table public.classes add column if not exists is_online boolean not null default false;

alter table public.classes drop constraint if exists classes_building_check;
alter table public.classes add constraint classes_building_check
  check (char_length(building) <= 100 and (is_online or char_length(building) >= 1)) not valid;
alter table public.classes validate constraint classes_building_check;

alter table public.classes alter column latitude drop not null;
alter table public.classes alter column longitude drop not null;
alter table public.classes drop constraint if exists classes_in_person_coordinates_check;
alter table public.classes add constraint classes_in_person_coordinates_check
  check (is_online or (latitude is not null and longitude is not null)) not valid;
alter table public.classes validate constraint classes_in_person_coordinates_check;

-- The app records an online class's attendance as 'attend_online'.
alter table public.task_completions drop constraint if exists task_completions_task_kind_check;
alter table public.task_completions add constraint task_completions_task_kind_check
  check (task_kind in ('attend', 'prepare', 'attend_online')) not valid;
alter table public.task_completions validate constraint task_completions_task_kind_check;

reset lock_timeout;
reset statement_timeout;
