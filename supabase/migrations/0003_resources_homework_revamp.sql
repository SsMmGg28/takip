-- Kaynak kitap kataloğu + test ilerleme + yeni ödev sistemi (kitap/test bağlantılı ve dosya ekli)
-- Eski sade tabloları kaldırıp yenisini kuruyoruz.

drop table if exists public.homework cascade;
drop table if exists public.student_resource_progress cascade;

-- Kaynak kitap kataloğu (paylaşımlı)
create table public.resource_books (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  approved boolean not null default true,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz
);

-- Bir kitabın bölümleri (Çarpanlar, Kesirler, ...) — her bölümün kaç testi olduğunu tutar
create table public.resource_book_sections (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.resource_books (id) on delete cascade,
  name text not null,
  order_index integer not null default 0,
  test_count integer not null check (test_count > 0 and test_count <= 200)
);

-- Bir öğrencinin tamamladığı testler
create table public.student_test_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  section_id uuid not null references public.resource_book_sections (id) on delete cascade,
  test_number integer not null check (test_number > 0),
  completed_at timestamptz not null default now(),
  marked_by uuid not null references public.profiles (id),
  unique (student_id, section_id, test_number)
);

-- Öğrencinin gönderdiği "yeni kitap ekle" istekleri (öğretmen onayı bekler)
create table public.book_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles (id),
  name text not null,
  subject text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Yeni ödev: serbest metin VEYA kaynak kitap + seçilen testler; opsiyonel dosya eki
create table public.homework (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  book_id uuid references public.resource_books (id) on delete set null,
  attachment_path text,
  attachment_name text,
  attachment_uploaded_at timestamptz,
  status text not null default 'assigned' check (status in ('assigned', 'completed', 'overdue')),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bir ödevin hangi testleri içerdiği (kitap bazlı ödevler için)
create table public.homework_tests (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework (id) on delete cascade,
  section_id uuid not null references public.resource_book_sections (id) on delete cascade,
  test_number integer not null check (test_number > 0),
  unique (homework_id, section_id, test_number)
);

create index on public.resource_book_sections (book_id);
create index on public.student_test_progress (student_id);
create index on public.student_test_progress (section_id);
create index on public.homework (student_id);
create index on public.homework (book_id);
create index on public.homework_tests (homework_id);
create index on public.homework_tests (section_id);
create index on public.book_requests (status);

create trigger set_updated_at before update on public.homework
  for each row execute function public.trigger_set_updated_at();

-- RLS politikaları --------------------------------------------------------------

alter table public.resource_books enable row level security;
alter table public.resource_book_sections enable row level security;
alter table public.student_test_progress enable row level security;
alter table public.book_requests enable row level security;
alter table public.homework enable row level security;
alter table public.homework_tests enable row level security;

-- Kitap kataloğu: onaylananları herkes okur; teacher/parent direkt ekler; sadece teacher onaylar/günceller/siler
create policy "books_select_approved" on public.resource_books
  for select using (
    approved
    or created_by = auth.uid()
    or public.current_role() = 'teacher'
  );

create policy "books_insert_teacher_or_parent" on public.resource_books
  for insert with check (
    public.current_role() in ('teacher', 'parent')
    and created_by = auth.uid()
    and approved = true
  );

create policy "books_update_teacher" on public.resource_books
  for update using (public.current_role() = 'teacher');

create policy "books_delete_teacher" on public.resource_books
  for delete using (public.current_role() = 'teacher');

-- Kitap bölümleri: kitabı görebilen herkes görür; sadece kitabı ekleyen veya teacher yazabilir
create policy "sections_select" on public.resource_book_sections
  for select using (
    exists (
      select 1 from public.resource_books b
      where b.id = book_id
        and (b.approved or b.created_by = auth.uid() or public.current_role() = 'teacher')
    )
  );

create policy "sections_write" on public.resource_book_sections
  for all using (
    public.current_role() = 'teacher'
    or exists (
      select 1 from public.resource_books b
      where b.id = book_id and b.created_by = auth.uid()
    )
  )
  with check (
    public.current_role() = 'teacher'
    or exists (
      select 1 from public.resource_books b
      where b.id = book_id and b.created_by = auth.uid()
    )
  );

-- Test ilerlemesi: öğrenci kendisi, öğretmen hepsi, veli çocuğu
create policy "progress_select" on public.student_test_progress
  for select using (public.can_access_student(student_id));

create policy "progress_write" on public.student_test_progress
  for all using (public.can_access_student(student_id))
  with check (public.can_access_student(student_id));

-- Kitap istekleri: kendi isteğini herkes görür/oluşturur; öğretmen hepsini görür/günceller
create policy "book_requests_select" on public.book_requests
  for select using (
    requested_by = auth.uid() or public.current_role() = 'teacher'
  );

create policy "book_requests_insert" on public.book_requests
  for insert with check (requested_by = auth.uid());

create policy "book_requests_update_teacher" on public.book_requests
  for update using (public.current_role() = 'teacher');

create policy "book_requests_delete" on public.book_requests
  for delete using (requested_by = auth.uid() or public.current_role() = 'teacher');

-- Ödevler: öğretmen yazar, öğrenci/veli okur
create policy "homework_select" on public.homework
  for select using (public.can_access_student(student_id));

create policy "homework_write_teacher" on public.homework
  for all using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');

-- Ödev-test bağlantısı: ödevi görebilen görür; öğretmen yazar
create policy "homework_tests_select" on public.homework_tests
  for select using (
    exists (
      select 1 from public.homework h
      where h.id = homework_id and public.can_access_student(h.student_id)
    )
  );

create policy "homework_tests_write_teacher" on public.homework_tests
  for all using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');

-- Dosya eki için Supabase Storage bucket'ı + politikaları + 3 ay temizlik cron'u
insert into storage.buckets (id, name, public)
values ('homework-attachments', 'homework-attachments', false)
on conflict (id) do nothing;

-- Bir ödevin ekini "kim okuyabilir": ödevi görebilen herkes (öğretmen, ilgili öğrenci, ilgili veli).
-- storage.objects.name formatı: "<homework_id>/<dosya_adı>"
create policy "attachments_read" on storage.objects
  for select using (
    bucket_id = 'homework-attachments'
    and exists (
      select 1 from public.homework h
      where h.id::text = split_part(name, '/', 1)
        and public.can_access_student(h.student_id)
    )
  );

create policy "attachments_write_teacher" on storage.objects
  for insert with check (
    bucket_id = 'homework-attachments'
    and public.current_role() = 'teacher'
  );

create policy "attachments_delete_teacher" on storage.objects
  for delete using (
    bucket_id = 'homework-attachments'
    and public.current_role() = 'teacher'
  );

-- pg_cron uzantısı (Supabase'de mevcut) ile 3 aydan eski ekleri otomatik sil
create extension if not exists pg_cron;

create or replace function public.cleanup_old_homework_attachments()
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  cutoff timestamptz := now() - interval '90 days';
begin
  -- 90 günden eski ek dosyalarını storage'tan sil
  -- (storage.objects'ten DELETE storage'taki gerçek dosyayı da temizler)
  delete from storage.objects o
  where o.bucket_id = 'homework-attachments'
    and exists (
      select 1 from public.homework h
      where h.attachment_path = o.name
        and h.attachment_uploaded_at is not null
        and h.attachment_uploaded_at < cutoff
    );

  -- İlgili homework satırlarındaki ek alanlarını temizle
  update public.homework
  set attachment_path = null,
      attachment_name = null,
      attachment_uploaded_at = null
  where attachment_path is not null
    and attachment_uploaded_at is not null
    and attachment_uploaded_at < cutoff;
end;
$$;

-- Her gece 03:00 UTC'de çalışsın
select cron.schedule(
  'cleanup-old-homework-attachments',
  '0 3 * * *',
  $$select public.cleanup_old_homework_attachments();$$
);
