-- Yetki modeli: RLS politikaları
-- Kural: öğretmen her şeye tam erişir; öğrenci/veli sadece kendi/çocuğunun verisini görür.
-- study_schedule_entries hariç (öğrenci+veli de yazabilir), öğrenci/veli her zaman salt okunur.

-- Recursive RLS'i önlemek için security definer yardımcı fonksiyonlar.
-- Bunlar RLS'i bypass ederek profiles tablosuna güvenle bakar.

create function public.current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_parent_of(target_student uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.parent_student_links
    where parent_id = auth.uid() and student_id = target_student
  );
$$;

create function public.can_access_student(target_student uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_student = auth.uid()
    or public.is_parent_of(target_student)
    or public.current_role() = 'teacher';
$$;

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.homework enable row level security;
alter table public.student_resource_progress enable row level security;
alter table public.calendar_events enable row level security;
alter table public.study_schedule_entries enable row level security;
alter table public.exams enable row level security;
alter table public.exam_subjects enable row level security;
alter table public.exam_topics enable row level security;

-- profiles -----------------------------------------------------------------

create policy "profiles_select" on public.profiles
  for select using (public.can_access_student(id));

create policy "profiles_insert_teacher" on public.profiles
  for insert with check (public.current_role() = 'teacher');

create policy "profiles_update_self_or_teacher" on public.profiles
  for update using (id = auth.uid() or public.current_role() = 'teacher');

create policy "profiles_delete_teacher" on public.profiles
  for delete using (public.current_role() = 'teacher');

-- student_profiles -----------------------------------------------------------------

create policy "student_profiles_select" on public.student_profiles
  for select using (public.can_access_student(id));

create policy "student_profiles_write_teacher" on public.student_profiles
  for all using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');

-- parent_student_links -----------------------------------------------------------------

create policy "parent_student_links_select" on public.parent_student_links
  for select using (
    parent_id = auth.uid() or student_id = auth.uid() or public.current_role() = 'teacher'
  );

create policy "parent_student_links_write_teacher" on public.parent_student_links
  for all using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');

-- homework (öğretmen yazar, öğrenci/veli okur) -----------------------------------------------------------------

create policy "homework_select" on public.homework
  for select using (public.can_access_student(student_id));

create policy "homework_write_teacher" on public.homework
  for all using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');

-- student_resource_progress (öğretmen yazar, öğrenci/veli okur) -----------------------------------------------------------------

create policy "resource_progress_select" on public.student_resource_progress
  for select using (public.can_access_student(student_id));

create policy "resource_progress_write_teacher" on public.student_resource_progress
  for all using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');

-- calendar_events (öğretmen yazar, öğrenci/veli okur; student_id null ise genel etkinlik) ----------------

create policy "calendar_events_select" on public.calendar_events
  for select using (
    student_id is null or public.can_access_student(student_id)
  );

create policy "calendar_events_write_teacher" on public.calendar_events
  for all using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');

-- study_schedule_entries (öğrenci+veli+öğretmen ortak yazabilir) -----------------------------------------------------------------

create policy "study_schedule_select" on public.study_schedule_entries
  for select using (public.can_access_student(student_id));

create policy "study_schedule_write" on public.study_schedule_entries
  for all using (public.can_access_student(student_id))
  with check (public.can_access_student(student_id));

-- exams (öğretmen yazar, öğrenci/veli okur) -----------------------------------------------------------------

create policy "exams_select" on public.exams
  for select using (public.can_access_student(student_id));

create policy "exams_write_teacher" on public.exams
  for all using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');

-- exam_subjects (üst tablo exams üzerinden öğrenciye bağlı) -----------------------------------------------------------------

create policy "exam_subjects_select" on public.exam_subjects
  for select using (
    exists (
      select 1 from public.exams e
      where e.id = exam_subjects.exam_id and public.can_access_student(e.student_id)
    )
  );

create policy "exam_subjects_write_teacher" on public.exam_subjects
  for all using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');

-- exam_topics (exam_subjects -> exams üzerinden öğrenciye bağlı) -----------------------------------------------------------------

create policy "exam_topics_select" on public.exam_topics
  for select using (
    exists (
      select 1 from public.exam_subjects es
      join public.exams e on e.id = es.exam_id
      where es.id = exam_topics.exam_subject_id and public.can_access_student(e.student_id)
    )
  );

create policy "exam_topics_write_teacher" on public.exam_topics
  for all using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');
