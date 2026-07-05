-- 0008: Öğrenci başına hedef puan takibi.
-- Öğretmen belirler (student_profiles_write_teacher RLS politikası kapsar);
-- puan gelişim grafiğinde hedef çizgisi olarak gösterilir.

alter table public.student_profiles
  add column target_score numeric(6,2) check (target_score >= 0 and target_score <= 500);
