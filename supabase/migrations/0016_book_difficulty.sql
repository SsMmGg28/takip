-- Kitaplara zorluk derecesi (1-5 yıldız).
-- Öğretmen atar; kazanım→kitap önerisinde öğrencinin o kazanımdaki başarısına göre
-- uygun zorlukta kitap seçmek için kullanılır (yüksek başarı → daha zor kitap).
-- Nullable: derecesi henüz atanmamış / veli tarafından eklenmiş kitaplarda null.

alter table public.resource_books
  add column difficulty smallint
  check (difficulty is null or (difficulty between 1 and 5));
