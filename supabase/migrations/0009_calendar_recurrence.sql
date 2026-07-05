-- 0009: Takvim etkinliklerinde haftalık tekrar.
-- Tekrarlı etkinlik tek satır olarak saklanır; görüntülenirken haftalık
-- oluşumlara açılır (uygulama tarafında, src/lib/calendar.ts).

alter table public.calendar_events
  add column recurrence text check (recurrence in ('weekly'));
