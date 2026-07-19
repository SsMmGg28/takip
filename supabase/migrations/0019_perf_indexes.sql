-- Sorgu kalıplarına uygun bileşik indeksler. Mevcut tek kolonlu indeksler
-- (homework.student_id, exams.student_id vb.) filtre + sıralama birlikte
-- kullanıldığında yetersiz kalıyordu.

-- Öğrenci bekleyen/tamamlanan ödev sorguları: student_id + status filtresi
-- (dashboard sayaçları, ödev listeleri).
create index homework_student_status_idx
  on public.homework (student_id, status);

-- Öğretmen ödev listesi: status IN (...) filtresi + due_date sıralaması.
create index homework_status_due_date_idx
  on public.homework (status, due_date);

-- Cron hatırlatmaları: due_date = yarın AND status = 'assigned'.
create index homework_due_date_status_idx
  on public.homework (due_date, status);

-- Deneme listeleri: student_id filtresi + exam_date'e göre (çoğunlukla desc) sıralama.
create index exams_student_exam_date_idx
  on public.exams (student_id, exam_date desc);
