-- Rehber ilerlemesi Data API'de yalnız oturum sahibinin ihtiyaç duyduğu
-- SELECT/INSERT/UPDATE işlemlerine açıktır. DELETE özellikle verilmez.

revoke all on table public.user_guide_progress from public;
revoke all on table public.user_guide_progress from anon;
revoke all on table public.user_guide_progress from authenticated;
grant select, insert, update on table public.user_guide_progress to authenticated;
