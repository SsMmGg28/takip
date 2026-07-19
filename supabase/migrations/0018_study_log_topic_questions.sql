-- Çalışma günlüğüne opsiyonel konu (kitap kataloğu ünitesi) ve soru sayısı ekler.
-- Var olan RLS politikaları (study_log_select/study_log_write_own) aynen kalır;
-- yeni kolonlar aynı satırın parçası.

alter table public.study_log
  add column topic text,
  add column question_count integer
    check (question_count is null or (question_count >= 0 and question_count <= 2000));
