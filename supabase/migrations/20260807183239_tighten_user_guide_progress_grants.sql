-- Eski projelerdeki varsayılan DELETE yetkisini açıkça kaldır.
revoke all on table public.user_guide_progress from authenticated;
grant select, insert, update on table public.user_guide_progress to authenticated;
