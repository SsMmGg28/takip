-- Dashboard v2: günlük hedefler ve aynı gün program tamamlama geri alması.

alter table public.student_profiles
  add column if not exists daily_goal_minutes integer,
  add column if not exists daily_goal_questions integer;

alter table public.student_profiles
  drop constraint if exists student_profiles_daily_goal_pair_check;

alter table public.student_profiles
  add constraint student_profiles_daily_goal_pair_check check (
    (daily_goal_minutes is null and daily_goal_questions is null)
    or
    (
      daily_goal_minutes between 1 and 1440
      and daily_goal_questions between 1 and 2000
    )
  );

create schema if not exists private;
revoke all on schema private from public;

-- Exposed RPC remains SECURITY INVOKER. The private helper performs the atomic
-- cross-table mutation because schedule writes are intentionally adult-only in
-- RLS; it is not in an exposed Data API schema and repeats all ownership/day guards.
create or replace function private.undo_own_schedule_completion(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid;
  v_log_id uuid;
  v_completed_at timestamptz;
begin
  select entry.student_id, entry.completion_log_id, entry.completed_at
    into v_student_id, v_log_id, v_completed_at
  from public.study_schedule_entries as entry
  where entry.id = p_entry_id
  for update;

  if v_student_id is null or v_student_id <> (select auth.uid()) then
    raise exception 'Program kaydı bulunamadı veya bu kayıt size ait değil.';
  end if;
  if v_log_id is null or v_completed_at is null then
    raise exception 'Bu çalışma tamamlanmış değil veya daha önce geri alındı.';
  end if;
  if (v_completed_at at time zone 'Europe/Istanbul')::date
      <> (now() at time zone 'Europe/Istanbul')::date then
    raise exception 'Program tamamlama yalnız aynı gün geri alınabilir.';
  end if;

  update public.study_schedule_entries
  set completed_at = null,
      completion_log_id = null,
      updated_by = (select auth.uid())
  where id = p_entry_id and student_id = (select auth.uid());

  delete from public.study_log
  where id = v_log_id and student_id = (select auth.uid());

  if not found then
    raise exception 'Bağlı çalışma günlüğü bulunamadı; işlem geri alınmadı.';
  end if;
end;
$$;

create or replace function public.undo_own_schedule_completion(p_entry_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.undo_own_schedule_completion(p_entry_id);
$$;

revoke execute on function public.undo_own_schedule_completion(uuid) from public;
revoke execute on function public.undo_own_schedule_completion(uuid) from anon;
grant execute on function public.undo_own_schedule_completion(uuid) to authenticated;
revoke execute on function private.undo_own_schedule_completion(uuid) from public;
revoke execute on function private.undo_own_schedule_completion(uuid) from anon;
grant usage on schema private to authenticated;
grant execute on function private.undo_own_schedule_completion(uuid) to authenticated;
