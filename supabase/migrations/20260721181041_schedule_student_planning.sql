-- Öğrencinin kendi program kaydında ders/kazanım seçebilmesi ve tamamlanan
-- çalışmanın günlük kaydıyla ilişkilendirilebilmesi için plan alanları eklenir.
-- Kolonlar nullable tutulur: öğretmen/veli tarafından yazılmış eski serbest
-- metinli kayıtlar çalışmaya devam eder.

alter table public.study_schedule_entries
  add column subject text,
  add column kazanim_code text,
  add column kazanim_name text,
  add column completed_at timestamptz,
  add column completion_log_id uuid references public.study_log(id) on delete set null;

alter table public.study_schedule_entries
  add constraint schedule_kazanim_pair_check check (
    (kazanim_code is null and kazanim_name is null)
    or (kazanim_code is not null and kazanim_name is not null)
  );

create index study_schedule_completion_log_idx
  on public.study_schedule_entries (completion_log_id)
  where completion_log_id is not null;
