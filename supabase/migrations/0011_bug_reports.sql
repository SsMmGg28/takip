-- 0011: Hata bildirimleri.
-- Her kullanıcı kendi adına rapor açabilir; raporları öğretmen(ler) ve
-- yönetici görüp çözümleyebilir. Bildirim, notifyUsers ile öğretmenlere
-- (admin de teacher rolünde olduğundan dahil) anlık gönderilir.

create table public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  page text,
  description text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index on public.bug_reports (status);

alter table public.bug_reports enable row level security;

create policy "bug_reports_insert_self" on public.bug_reports
  for insert with check (reporter_id = auth.uid());

create policy "bug_reports_select" on public.bug_reports
  for select using (reporter_id = auth.uid() or public.current_role() = 'teacher');

create policy "bug_reports_update_teacher" on public.bug_reports
  for update using (public.current_role() = 'teacher')
  with check (public.current_role() = 'teacher');

create policy "bug_reports_delete_teacher" on public.bug_reports
  for delete using (public.current_role() = 'teacher');
