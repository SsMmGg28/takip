-- 0013: Çalışma programı hafta bazlı hâle gelir.
-- 1) Her kayıt bir haftaya (Pazartesi tarihi) bağlanır; mevcut kayıtlar
--    içinde bulunulan haftaya taşınır. Geçmiş haftalar arşiv olarak kalır.
-- 2) Öğrenci yazma yetkisini kaybeder: programı öğretmen ve veli düzenler,
--    öğrenci yalnızca görüntüler (select politikası değişmez).
-- 3) Öğrenci başına "her hafta otomatik devam" ayarı (varsayılan: kapalı =
--    yeni hafta boş başlar; açıksa Pazartesi cron'u önceki haftayı kopyalar).

alter table public.study_schedule_entries
  add column week_start date not null
  default (date_trunc('week', (now() at time zone 'Europe/Istanbul'))::date);
alter table public.study_schedule_entries alter column week_start drop default;
alter table public.study_schedule_entries
  add constraint week_start_is_monday check (extract(isodow from week_start) = 1);
create index study_schedule_student_week_idx
  on public.study_schedule_entries (student_id, week_start);

drop policy "study_schedule_write" on public.study_schedule_entries;
create policy "study_schedule_write_teacher_parent" on public.study_schedule_entries
  for all
  using (
    public.can_access_student(student_id)
    and public.current_role() in ('teacher', 'parent')
  )
  with check (
    public.can_access_student(student_id)
    and public.current_role() in ('teacher', 'parent')
  );

alter table public.student_profiles
  add column schedule_auto_repeat boolean not null default false;
