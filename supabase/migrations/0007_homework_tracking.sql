-- 0007: Ödev takibi geliştirmeleri
-- 1) Öğrenci "tamamladım" beyanı: öğrenci yaptığı testleri işaretler (iddia);
--    öğretmen kontrolü (homework_tests.completed) son sözü söylemeye devam eder.
--    Yazma, sunucu aksiyonunda sahiplik doğrulaması sonrası service-role ile
--    yapılır (bildirim eklerindeki desenle aynı); bu yüzden yeni RLS gerekmez.
-- 2) Öğretmen geri bildirim notu: kontrol sırasında yazılan kısa serbest metin.

alter table public.homework add column feedback text;
alter table public.homework add column student_marked_done_at timestamptz;
alter table public.homework_tests add column student_marked boolean not null default false;
