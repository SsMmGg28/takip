-- Öğrenci/veli uygulama rehberlerinin hesap bazlı görülme durumu.
-- İçerik kodda sürümlüdür; bu tablo yalnız son görülen sürüm ve sonucu saklar.

create table if not exists public.user_guide_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  guide_id text not null,
  version integer not null check (version > 0),
  outcome text not null check (outcome in ('completed', 'skipped')),
  updated_at timestamptz not null default now(),
  primary key (user_id, guide_id),
  check (length(btrim(guide_id)) > 0)
);

alter table public.user_guide_progress enable row level security;

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
