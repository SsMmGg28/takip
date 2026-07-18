-- Çalışma günlüğü + seri (streak): öğrenci günlük çalışmasını kaydeder
-- (hangi ders, kaç dakika, opsiyonel not). Seri, kayıt girilen ardışık günlerden
-- hesaplanır. student_schedule_entries'ta tamamlanma takibi olmadığı için bu boşluğu doldurur.

create table public.study_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,                         -- Europe/Istanbul günü
  subject text not null,
  minutes integer not null check (minutes > 0 and minutes <= 1440),
  note text,
  created_at timestamptz not null default now(),
  marked_by uuid not null references public.profiles(id)
);

create index on public.study_log (student_id, log_date);

alter table public.study_log enable row level security;

-- Okuma: öğrenci kendi, veli çocuğunun, öğretmen (demo izolasyonu miras) — can_access_student.
create policy "study_log_select" on public.study_log
  for select using (public.can_access_student(student_id));

-- Yazma: YALNIZ öğrencinin kendisi (öğretmen/veli salt-okunur).
create policy "study_log_write_own" on public.study_log
  for all using (student_id = auth.uid())
  with check (student_id = auth.uid());
