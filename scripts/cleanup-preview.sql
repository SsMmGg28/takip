-- ============================================================================
-- ÖNİZLEME (DEMO) HESAPLARINI VE TÜM DEMO VERİSİNİ SİLER
-- ----------------------------------------------------------------------------
-- SADECE gerektiğinde ELLE çalıştır. Demo dünyayı (preview.teacher/student/parent
-- ve bunlara bağlı kitap/ödev/deneme/ilerleme/bağlantı kayıtlarını) tamamen kaldırır.
-- Gerçek kullanıcı verisine DOKUNMAZ (yalnız profiles.is_demo = true kapsamı).
-- İdempotenttir: demo hesap yoksa hiçbir şey yapmaz.
--
-- Çalıştırma:
--   - Supabase SQL Editor'e yapıştır ve çalıştır, veya
--   - psql "$DATABASE_URL" -f scripts/cleanup-preview.sql
-- ============================================================================

do $$
declare
  demo_ids uuid[];
begin
  select array_agg(id) into demo_ids from public.profiles where is_demo = true;

  if demo_ids is null then
    raise notice 'Silinecek demo hesap yok (is_demo = true bulunamadı).';
    return;
  end if;

  -- 1) profiles/auth.users cascade'i ile GİTMEYEN (created_by/approved_by/reporter_id
  --    gibi cascade'siz) referansları önce temizle; aksi halde auth.users silinemez.
  delete from public.resource_books
    where created_by = any(demo_ids) or approved_by = any(demo_ids);
  delete from public.calendar_events where created_by = any(demo_ids);
  delete from public.announcements where created_by = any(demo_ids);
  delete from public.bug_reports where reporter_id = any(demo_ids);

  -- 2) auth.users silinince profiles (on delete cascade) ve ona bağlı her şey gider:
  --    student_profiles, parent_student_links, homework(+homework_tests),
  --    exams(+exam_subjects), student_books, student_test_progress,
  --    study_schedule_entries, notifications, push_subscriptions ...
  delete from auth.users where id = any(demo_ids);

  raise notice 'Demo hesaplar ve tüm demo verileri silindi (% hesap).',
    array_length(demo_ids, 1);
end $$;
