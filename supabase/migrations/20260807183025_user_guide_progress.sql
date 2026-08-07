-- Öğrenci/veli rehberlerinin hesap bazında ve cihazlar arasında senkron ilerlemesi.
create table public.user_guide_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  guide_id text not null check (char_length(guide_id) between 1 and 100),
  version integer not null check (version > 0),
  outcome text not null check (outcome in ('completed', 'skipped')),
  updated_at timestamptz not null default now(),
  primary key (user_id, guide_id)
);

alter table public.user_guide_progress enable row level security;

-- 2026 Data API varsayılanları projeden projeye değişebildiği için erişimi
-- açıkça tanımla: anon erişemez, authenticated yalnız RLS kapsamındaki satırları
-- okuyup/yazar; service_role yönetim/seed işlemleri için tam erişimi korur.
revoke all on table public.user_guide_progress from anon;
grant select, insert, update on table public.user_guide_progress to authenticated;
grant all on table public.user_guide_progress to service_role;

create policy "user_guide_progress_select_own"
  on public.user_guide_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_guide_progress_insert_own"
  on public.user_guide_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_guide_progress_update_own"
  on public.user_guide_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
