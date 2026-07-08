-- 0012: Kapalı duyuru panosu.
-- Öğretmen tüm okula, sınıf düzeyine veya seçili öğrencilere mesaj/belge
-- paylaşır; rol filtresi (herkes / yalnız öğrenciler / yalnız veliler) ile
-- daraltılabilir. Öğrenci ve veliler birbirini göremez, etkileşim/yorum yok —
-- tablo tek yönlüdür, yanıt/yorum kolonu bilinçli olarak bulunmaz.

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience_role text not null default 'all' check (audience_role in ('all', 'students', 'parents')),
  target_scope text not null default 'all' check (target_scope in ('all', 'grade', 'students')),
  grade_level smallint check (grade_level between 5 and 8),
  attachment_path text,
  attachment_name text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint grade_required check (target_scope <> 'grade' or grade_level is not null)
);

create table public.announcement_targets (
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  primary key (announcement_id, student_id)
);

create index on public.announcements (created_at desc);

alter table public.announcements enable row level security;
alter table public.announcement_targets enable row level security;

-- Görünürlük: öğretmen tümünü görür; öğrenci/veli audience + scope
-- kombinasyonuna göre (veli, çocukları üzerinden nitelenir).
create policy "announcements_select" on public.announcements
  for select using (
    public.current_role() = 'teacher'
    or (
      (
        audience_role = 'all'
        or (audience_role = 'students' and public.current_role() = 'student')
        or (audience_role = 'parents' and public.current_role() = 'parent')
      )
      and (
        target_scope = 'all'
        or (
          target_scope = 'grade'
          and exists (
            select 1
            from public.student_profiles sp
            where sp.grade_level = announcements.grade_level
              and (
                sp.id = auth.uid()
                or exists (
                  select 1 from public.parent_student_links l
                  where l.parent_id = auth.uid() and l.student_id = sp.id
                )
              )
          )
        )
        or (
          target_scope = 'students'
          and exists (
            select 1
            from public.announcement_targets t
            where t.announcement_id = announcements.id
              and (
                t.student_id = auth.uid()
                or exists (
                  select 1 from public.parent_student_links l
                  where l.parent_id = auth.uid() and l.student_id = t.student_id
                )
              )
          )
        )
      )
    )
  );

create policy "announcements_write_teacher" on public.announcements
  for all using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');

create policy "announcement_targets_select" on public.announcement_targets
  for select using (
    public.current_role() = 'teacher'
    or student_id = auth.uid()
    or exists (
      select 1 from public.parent_student_links l
      where l.parent_id = auth.uid() and l.student_id = announcement_targets.student_id
    )
  );

create policy "announcement_targets_write_teacher" on public.announcement_targets
  for all using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');

-- Belgeler: özel bucket; yol biçimi "<announcement_id>/<dosya_adı>".
-- Okuma, çağıranın announcements select RLS'inden miras alınır (alt sorgu
-- kullanıcının kendi yetkisiyle çalışır) — homework-attachments'taki desen.
insert into storage.buckets (id, name, public)
values ('announcement-files', 'announcement-files', false)
on conflict (id) do nothing;

create policy "announcement_files_read" on storage.objects
  for select using (
    bucket_id = 'announcement-files'
    and exists (
      select 1 from public.announcements a
      where a.id::text = split_part(name, '/', 1)
    )
  );

create policy "announcement_files_write_teacher" on storage.objects
  for insert with check (
    bucket_id = 'announcement-files' and public.current_role() = 'teacher'
  );

create policy "announcement_files_delete_teacher" on storage.objects
  for delete using (
    bucket_id = 'announcement-files' and public.current_role() = 'teacher'
  );
