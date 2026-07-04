-- ── Web Push abonelikleri + Anasayfa widget yerleşimleri ────────────────────
-- (Uzak projede "push_and_dashboard" + "push_dashboard_reconcile" olarak
-- uygulandı; bu dosya nihai durumu belgeler.)

-- Her kullanıcının cihaz/tarayıcı başına bir push aboneliği olur. Gönderim
-- sunucuda service-role ile yapılır; istemci yalnızca kendi kaydını yönetir.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (user_id = auth.uid());

create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (user_id = auth.uid());

create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update using (user_id = auth.uid());

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (user_id = auth.uid());

-- Anasayfa widget yerleşimi kullanıcı başına tek JSON kaydı olarak tutulur;
-- böylece düzen cihazlar arasında senkron kalır.
create table public.dashboard_layouts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  layout jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_layouts enable row level security;

create policy "dashboard_layouts_select_own" on public.dashboard_layouts
  for select using (user_id = auth.uid());

create policy "dashboard_layouts_upsert_own" on public.dashboard_layouts
  for insert with check (user_id = auth.uid());

create policy "dashboard_layouts_update_own" on public.dashboard_layouts
  for update using (user_id = auth.uid());

create policy "dashboard_layouts_delete_own" on public.dashboard_layouts
  for delete using (user_id = auth.uid());
