@AGENTS.md

# Ders Takip Sistemi — Proje Rehberi

Özel ders/LGS hazırlık takibi: **öğretmen** (admin), **öğrenci**, **veli** rolleri.
Ödev, kaynak kitap ilerlemesi, takvim, haftalık çalışma programı, deneme analizi,
çalışma günlüğü ve duyurular. **Tüm arayüz metinleri, yorumlar ve kullanıcıya
fırlatılan hata mesajları Türkçedir.**

## Komutlar

- `npm run dev` / `npm run build` / `npm start`
- `npm run lint` · `npm run typecheck` · `npm run test` (vitest) · `npm run format[:check]`
- Build gerçek Supabase istemez; CI'daki gibi sahte env ile çalışır:
  `NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy SUPABASE_SERVICE_ROLE_KEY=dummy NEXT_PUBLIC_AUTH_EMAIL_DOMAIN=takip.internal npm run build`
- Pre-commit: simple-git-hooks → lint-staged (eslint + prettier, staged dosyalar).

## Mimari

- Next.js App Router, **Cache Components/PPR açık** (`next.config.ts`). Sayfalar async
  Server Component; ilk satırda `requireRole([...])`.
- Rol segmentleri: `src/app/teacher|student|parent/**`. Yazdırılabilir rapor:
  `src/app/(print)/rapor/[studentId]`.
- Mutasyonlar **Server Action**'larda: `src/lib/actions/*` ve route yanı `actions.ts`.
  API route yalnız hesap yönetimi için: `src/app/api/admin/*` (+ cron, dev preview).
- Hata sınırları: kök + rol segmentlerinde `error.tsx`/`not-found.tsx`
  (ortak gövde: `src/components/error-pages.tsx`). Bu Next sürümünde error boundary
  prop'u `unstable_retry`'dır (`reset` sunucu hatalarından kurtaramaz).
- Sekme başlıkları: kök layout'ta `%s | Ders Takip` şablonu; her sayfada tek satır
  `export const metadata = { title: "..." }`.

## Supabase istemcileri (`src/lib/supabase/`)

- `server.ts` — kullanıcı oturumlu, **RLS'e tabi** (varsayılan tercih).
- `admin.ts` — service-role, `import "server-only"` korumalı; yalnız hesap yönetimi,
  bildirim fan-out gibi RLS aşan meşru işlerde.
- `client.ts` — tarayıcı; `middleware.ts` (giriş: `src/proxy.ts`) oturum tazeler.

## Yetkilendirme desenleri

- **RLS birincil güvenlik katmanıdır** (politikalar `supabase/migrations/`),
  kod içi kontroller derinlemesine savunmadır — ikisi birlikte kullanılır.
- Sayfada: `requireRole([...])` (`src/lib/auth.ts`, redirect eder).
- Server action'da: `assertTeacherAction()` (throw eder) veya `getUser` + sahiplik
  filtresi + `.select()` ile no-op tespiti (örnek: `deleteStudyLog`).
- API route'ta: `requireTeacherApi()` (`src/lib/api-auth.ts`, 401/403 response döner).
- İstemciden admin uçlarına: `postAdmin()` (`src/lib/admin-api.ts`).

## Hata/sonuç sözleşmeleri

- FormData aksiyonları **Türkçe mesajla `throw`** eder; istemci `toast.error(e.message)`.
- Tipli payload aksiyonları (`exams.ts`, `exam-import.ts`) `{ ok, error? }` döner.
- Dosya yüklemeleri `src/lib/uploads.ts`'ten geçer (boyut/MIME + `sanitizeFileName`);
  yükleme hatasında oluşturulan satırlar geri alınır.

## Test felsefesi

- Sınanabilir mantık Supabase'siz saf modüllerde tutulur (`src/lib/*`); testleri
  bitişik `__tests__/` klasörlerinde.
- Server action testleri `src/test/supabase-mock.ts` ile: mock filtre simüle etmez,
  tablo başına sonuç kuyruğu verilir ve **kaydedilen sorgu şekli** assert edilir.
  `@/lib/notifications`, `@/lib/books`, `@/lib/auth` sınırda mock'lanır
  (`server-only`/`use cache` zincirini keser).
- e2e (Playwright) ve RLS politika testleri bilinçli ertelendi: CI'da Docker/yerel
  Supabase yok.

## Veritabanı

- Şema + RLS: `supabase/migrations/` — **dosya adı sırasıyla, elle** uygulanır
  (README'deki kurulum bölümü). `supabase/config.toml` yerel stack içindir;
  `db push` geçişi zaman damgalı ad + baseline ister.
- Yeni tablo eklerken RLS politikasını aynı migration'da yaz; `public.current_role()`
  ve `can_access_student()` yardımcı fonksiyonları mevcut.

## Yol haritası

Önceliklendirilmiş geliştirme listesi: `docs/GELISTIRME-PLANI.md`.
