-- Kitaplara sınıf düzeyi + kazanım tabanlı bölümler
-- 1) Kitap ekleme artık "önce sınıf, sonra ders" seçip o dersin kazanımlarını
--    otomatik listeler; her bölüm bir üniteye (kazanim_code) bağlanır.
-- 2) Eski serbest yapıdaki kitaplar ve ödevler yeni modelle çelişmesin diye
--    tamamen sıfırlanır (denemeler/kazanım analizleri ETKİLENMEZ).

-- ── Mevcut kitap + ödevleri sıfırla ────────────────────────────────────────
-- homework silinince homework_tests cascade; resource_books silinince
-- resource_book_sections + student_books + (sections üzerinden) student_test_progress cascade.
delete from public.homework;
delete from public.resource_books;

-- ── Yeni sütunlar ──────────────────────────────────────────────────────────
alter table public.resource_books
  add column grade_level integer
  check (grade_level is null or grade_level in (5, 6, 7, 8));

alter table public.resource_book_sections
  add column kazanim_code text;

create index on public.resource_books (grade_level);
