-- Kaynak kitap + ödev sistemi yeniden tasarımı
-- 1) Kitap isteği akışı kalkıyor: veli kitabı doğrudan ekler, öğretmen onaylar.
-- 2) Öğrenci kitaplığı (student_books): veli katalogdan çocuğuna kitap atar,
--    öğrenci yalnızca atanmış kitaplar üzerinde işlem yapar.
-- 3) Ödevler: toplu gönderim (assignment_group_id), test bazlı kontrol
--    (homework_tests.completed) ve "eksik" durumu.
-- 4) Bildirimler: notifications tablosu + Supabase Realtime yayını.

-- ── Kitap isteği akışı kalkıyor ────────────────────────────────────────────
drop table if exists public.book_requests cascade;

-- ── Kitap ekleme: öğretmen direkt onaylı, veli onay bekler ────────────────
drop policy if exists "books_insert_teacher_or_parent" on public.resource_books;
create policy "books_insert" on public.resource_books
  for insert with check (
    created_by = auth.uid()
    and (
      (public.current_role() = 'teacher' and approved = true)
      or (public.current_role() = 'parent' and approved = false)
    )
  );

-- Veli, henüz onaylanmamış kendi kitabını geri çekebilsin
drop policy if exists "books_delete_teacher" on public.resource_books;
create policy "books_delete" on public.resource_books
  for delete using (
    public.current_role() = 'teacher'
    or (created_by = auth.uid() and not approved)
  );

-- İçerik (bölümler): öğretmen her zaman; veli yalnızca kendi ONAYSIZ kitabında.
-- Onaydan sonra içeriği sadece öğretmen günceller.
drop policy if exists "sections_write" on public.resource_book_sections;
create policy "sections_write" on public.resource_book_sections
  for all using (
    public.current_role() = 'teacher'
    or exists (
      select 1 from public.resource_books b
      where b.id = book_id and b.created_by = auth.uid() and not b.approved
    )
  )
  with check (
    public.current_role() = 'teacher'
    or exists (
      select 1 from public.resource_books b
      where b.id = book_id and b.created_by = auth.uid() and not b.approved
    )
  );

-- ── Öğrenci kitaplığı ──────────────────────────────────────────────────────
create table public.student_books (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.resource_books (id) on delete cascade,
  added_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (student_id, book_id)
);

create index on public.student_books (student_id);
create index on public.student_books (book_id);

alter table public.student_books enable row level security;

create policy "student_books_select" on public.student_books
  for select using (public.can_access_student(student_id));

-- Kitaplığa ekleme: velinin kendi çocuğu (veya öğretmen), yalnızca onaylı kitap
create policy "student_books_insert" on public.student_books
  for insert with check (
    added_by = auth.uid()
    and (public.is_parent_of(student_id) or public.current_role() = 'teacher')
    and exists (
      select 1 from public.resource_books b where b.id = book_id and b.approved
    )
  );

create policy "student_books_delete" on public.student_books
  for delete using (
    public.is_parent_of(student_id) or public.current_role() = 'teacher'
  );

-- ── Ödevler: toplu gönderim + kontrol ─────────────────────────────────────
-- Aynı toplu gönderimin parçası olan ödevler ortak grup kimliği taşır.
alter table public.homework
  add column assignment_group_id uuid not null default gen_random_uuid();

alter table public.homework add column checked_at timestamptz;

alter table public.homework drop constraint homework_status_check;
alter table public.homework
  add constraint homework_status_check
  check (status in ('assigned', 'completed', 'incomplete', 'overdue'));

create index on public.homework (assignment_group_id);

-- Kontrolde işaretlenen testler
alter table public.homework_tests
  add column completed boolean not null default false;
alter table public.homework_tests add column completed_at timestamptz;

-- Ekler artık grup bazında tek kopya tutulur: "<assignment_group_id>/<dosya>".
-- Eski "<homework_id>/<dosya>" yolları da okunabilsin.
drop policy if exists "attachments_read" on storage.objects;
create policy "attachments_read" on storage.objects
  for select using (
    bucket_id = 'homework-attachments'
    and exists (
      select 1 from public.homework h
      where (
        h.id::text = split_part(name, '/', 1)
        or h.assignment_group_id::text = split_part(name, '/', 1)
      )
        and public.can_access_student(h.student_id)
    )
  );

-- ── Bildirimler ────────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());

create policy "notifications_delete_own" on public.notifications
  for delete using (user_id = auth.uid());

-- Bildirim üretimi yalnızca sunucu tarafında service-role ile yapılır
-- (RLS'i zaten atlar); istemcilere insert politikası açılmaz.

-- Canlı bildirim: Supabase Realtime yayınına ekle
alter publication supabase_realtime add table public.notifications;
