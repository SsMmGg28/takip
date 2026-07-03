-- Deneme sistemi v2
-- * Öğrenci sınıf düzeyi zorunlu (5-8). Mevcut kayıtlar 8 olarak varsayılır
--   (eski kazanım/konu takibi 8. sınıfa göre yapılıyordu).
-- * exams tablosuna puan (score) eklenir; yeni girişlerde uygulama zorunlu tutar.
-- * Kazanım sonuçları için exam_kazanim_results tablosu eklenir. Kazanım
--   kataloğu uygulama içinde gömülüdür; satırın hiç olmaması "bu denemede bu
--   kazanımdan soru gelmedi" anlamına gelir.
-- * Veli kendi çocuğu için deneme girebilir; girilen denemede değişiklik/silme
--   ancak öğretmenin onayladığı bir düzenleme talebiyle mümkündür.
-- * Eski exam_topics tablosu geriye dönük veri için yerinde bırakılır, yeni
--   sistem tarafından kullanılmaz.

-- Sınıf düzeyi ---------------------------------------------------------------

update public.student_profiles set grade_level = 8 where grade_level is null;

alter table public.student_profiles
  alter column grade_level set not null;

alter table public.student_profiles
  add constraint student_profiles_grade_level_check
  check (grade_level between 5 and 8);

-- Deneme puanı ---------------------------------------------------------------

alter table public.exams
  add column score numeric(6, 2);

-- Kazanım sonuçları ----------------------------------------------------------

create table public.exam_kazanim_results (
  id uuid primary key default gen_random_uuid(),
  exam_subject_id uuid not null references public.exam_subjects (id) on delete cascade,
  kazanim_code text not null,
  kazanim_name text not null,
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  blank_count integer not null default 0 check (blank_count >= 0),
  unique (exam_subject_id, kazanim_code)
);

create index on public.exam_kazanim_results (exam_subject_id);
create index on public.exam_kazanim_results (kazanim_code);

-- Düzenleme talepleri --------------------------------------------------------

create table public.exam_edit_requests (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'used')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.exam_edit_requests (exam_id);
create index on public.exam_edit_requests (requested_by);

-- RLS ------------------------------------------------------------------------

alter table public.exam_kazanim_results enable row level security;
alter table public.exam_edit_requests enable row level security;

-- Velinin bu deneme için kullanılabilir (onaylı) düzenleme talebi var mı?
create function public.has_approved_exam_edit(target_exam uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.exam_edit_requests r
    where r.exam_id = target_exam
      and r.requested_by = auth.uid()
      and r.status = 'approved'
  );
$$;

-- exams: eski "öğretmen yazar" politikası genişletilir -----------------------

drop policy "exams_write_teacher" on public.exams;

create policy "exams_insert" on public.exams
  for insert with check (
    public.current_role() = 'teacher'
    or (public.current_role() = 'parent' and public.is_parent_of(student_id))
  );

create policy "exams_update" on public.exams
  for update using (
    public.current_role() = 'teacher' or public.has_approved_exam_edit(id)
  );

create policy "exams_delete" on public.exams
  for delete using (
    public.current_role() = 'teacher' or public.has_approved_exam_edit(id)
  );

-- exam_subjects: veli, deneme eklerken/onaylı düzenlemede yazabilmeli --------

drop policy "exam_subjects_write_teacher" on public.exam_subjects;

create policy "exam_subjects_write" on public.exam_subjects
  for all using (
    public.current_role() = 'teacher'
    or exists (
      select 1 from public.exams e
      where e.id = exam_subjects.exam_id
        and (
          (public.current_role() = 'parent' and public.is_parent_of(e.student_id)
            and e.created_by = auth.uid())
          or public.has_approved_exam_edit(e.id)
        )
    )
  )
  with check (
    public.current_role() = 'teacher'
    or exists (
      select 1 from public.exams e
      where e.id = exam_subjects.exam_id
        and (
          (public.current_role() = 'parent' and public.is_parent_of(e.student_id)
            and e.created_by = auth.uid())
          or public.has_approved_exam_edit(e.id)
        )
    )
  );

-- exam_kazanim_results --------------------------------------------------------

create policy "exam_kazanim_results_select" on public.exam_kazanim_results
  for select using (
    exists (
      select 1 from public.exam_subjects es
      join public.exams e on e.id = es.exam_id
      where es.id = exam_kazanim_results.exam_subject_id
        and public.can_access_student(e.student_id)
    )
  );

create policy "exam_kazanim_results_write" on public.exam_kazanim_results
  for all using (
    exists (
      select 1 from public.exam_subjects es
      join public.exams e on e.id = es.exam_id
      where es.id = exam_kazanim_results.exam_subject_id
        and (
          public.current_role() = 'teacher'
          or (public.current_role() = 'parent' and public.is_parent_of(e.student_id)
            and e.created_by = auth.uid())
          or public.has_approved_exam_edit(e.id)
        )
    )
  )
  with check (
    exists (
      select 1 from public.exam_subjects es
      join public.exams e on e.id = es.exam_id
      where es.id = exam_kazanim_results.exam_subject_id
        and (
          public.current_role() = 'teacher'
          or (public.current_role() = 'parent' and public.is_parent_of(e.student_id)
            and e.created_by = auth.uid())
          or public.has_approved_exam_edit(e.id)
        )
    )
  );

-- exam_edit_requests -----------------------------------------------------------

create policy "exam_edit_requests_select" on public.exam_edit_requests
  for select using (
    requested_by = auth.uid() or public.current_role() = 'teacher'
  );

-- Veli yalnızca kendi çocuğunun denemesi için talep açabilir.
create policy "exam_edit_requests_insert" on public.exam_edit_requests
  for insert with check (
    requested_by = auth.uid()
    and public.current_role() = 'parent'
    and exists (
      select 1 from public.exams e
      where e.id = exam_id and public.is_parent_of(e.student_id)
    )
  );

-- Öğretmen onaylar/reddeder; veli kendi talebini yalnızca "used" durumuna
-- çekebilir (with check, velinin kendi talebini onaylamasını engeller).
create policy "exam_edit_requests_update" on public.exam_edit_requests
  for update using (
    public.current_role() = 'teacher' or requested_by = auth.uid()
  )
  with check (
    public.current_role() = 'teacher'
    or (requested_by = auth.uid() and status = 'used')
  );

create policy "exam_edit_requests_delete" on public.exam_edit_requests
  for delete using (
    public.current_role() = 'teacher' or requested_by = auth.uid()
  );
