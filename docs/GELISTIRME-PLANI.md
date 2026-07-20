# Sistem Geliştirme Planı — Önceliklendirilmiş Yol Haritası

> Tarih: 2026-07-20. Üç paralel inceleme turunun (mimari/özellikler, kod kalitesi/güvenlik,
> altyapı/eksikler) sonuçlarından derlenmiştir. Her madde bağımsız olarak ele alınabilir;
> sıra, etki × aciliyet dengesine göre belirlenmiştir.

## Mevcut Durum Özeti

Kod tabanı genel olarak çok sağlıklı durumda:

- TypeScript `strict` açık; hiç `any`, `@ts-ignore`, `eslint-disable`, `TODO/FIXME` veya
  unutulmuş `console.log` yok.
- Tüm tablolarda RLS aktif; `profiles` üzerinden yetki yükseltme DB trigger'ıyla kilitli
  (`0010_admin_flag.sql`). Secrets doğru yönetiliyor (`server-only` korumalı admin client,
  gitignore'lu env dosyaları).
- Performans turu yakın zamanda tamamlandı (PR #16–18): paralel sorgular, bileşik indeksler
  (`0019_perf_indexes.sql`), PPR/`use cache`, recharts lazy-load, cron N+1 giderimi.
- `loading.tsx` kapsamı iyi (~24 dosya), CI'da lint + typecheck + test çalışıyor.

Bu yüzden plan performans konularını tekrarlamaz; kalan gerçek açıklara odaklanır.

---

## P1 — Kritik: Dayanıklılık ve Güvenlik ✅ (2026-07-20 tamamlandı)

> Dört madde de uygulandı: `src/lib/uploads.ts` ortak doğrulama yardımcısı (+testler),
> ödev/duyuru eklerinde doğrulama + rollback'li hata bildirimi, `assertTeacherAction`
> guard'ları ve kök + rol segmentlerinde Türkçe `error.tsx`/`not-found.tsx`/`global-error.tsx`.

### 1. Hata sınırları ve 404 sayfaları ekle

Uygulamada **hiç** `error.tsx`, `global-error.tsx` veya `not-found.tsx` yok. Supabase
kesintisi ya da server action'lardaki `throw new Error(...)` çağrıları kullanıcıya Next.js'in
varsayılan İngilizce hata ekranını gösteriyor.

- Kök seviye + rol segmentlerine (`src/app/teacher`, `src/app/student`, `src/app/parent`)
  Türkçe, tasarımla uyumlu `error.tsx` ve `not-found.tsx` ekle.
- Dinamik segmentlerde (`[studentId]`, `[examId]`, `[bookId]`) kayıt bulunamayınca
  `notFound()` çağır.

### 2. Dosya yükleme doğrulaması

`src/app/teacher/homework/actions.ts:50-51` ve `src/lib/actions/announcements.ts` yalnızca
`file.size > 0` kontrolü yapıyor — boyut sınırı ve MIME allowlist'i yok; depolama yolu ham
`file.name` ile kuruluyor (`actions.ts:84`).

- `src/lib/actions/exam-import.ts`'teki mevcut `MAX_BYTES` (10MB) + `ACCEPTED_TYPES` desenini
  ortak bir yardımcıya çıkar, her iki yükleme noktasında da kullan.
- Dosya adını sanitize et (veya UUID tabanlı ad kullanıp orijinal adı kolonda sakla —
  `attachment_name` kolonu zaten mevcut).

### 3. Sessiz yükleme hatalarını düzelt

`src/app/teacher/homework/actions.ts:88-90` ve `src/lib/actions/announcements.ts`: storage
yüklemesi başarısız olursa yalnızca `console.error` yapılıp işlem başarılı dönüyor — kullanıcı
ekin kaydedildiğini sanıyor. Hata kullanıcıya bildirilmeli (uyarı döndür veya işlemi geri al).

### 4. RLS'e tek başına güvenen aksiyonlara kod içi yetki kontrolü

Derinlemesine savunma: bir RLS politikası ileride gevşetilirse bu aksiyonlar açık kalır.

- `src/lib/actions/study-log.ts:65-73` — `deleteStudyLog` hiç `getUser`/sahiplik kontrolü
  yapmadan id ile siliyor.
- `src/lib/actions/resources.ts` — `deleteBook`, `withdrawPendingBook`,
  `updateBookWithSections`, `rejectBook` aynı şekilde yalnızca RLS'e güveniyor.
- `src/lib/actions/exams.ts`'teki açık kontrol deseni örnek alınmalı.

---

## P2 — Yüksek: Şema Güvenilirliği ve Kalite Kapıları (5 ve 6 ✅, 7 açık)

> 5: `0007_profiles_privilege_guard` → `0007b` olarak yeniden adlandırıldı, README
> tüm migration'ların sırayla uygulanmasını anlatıyor, `supabase/config.toml` eklendi
> (tam `db push` geçişi zaman damgalı ad + baseline gerektirir, not düşüldü).
> 6: CI'ya sahte env ile build adımı eklendi. 7 (test genişletme) hâlâ açık.

### 5. Migration hijyeni

- **Çakışan prefix:** `supabase/migrations/0007_homework_tracking.sql` ve
  `0007_profiles_privilege_guard.sql` aynı numarayı taşıyor; elle uygulanan şemada sıra
  belirsiz. Birini yeniden numaralandır, README'deki kurulum talimatını güncelle.
- **Supabase CLI'ya geçiş:** README şu an SQL'i dashboard'a elle yapıştırmayı anlatıyor;
  `supabase/config.toml` + `supabase db push` ile şema tekrarlanabilir hâle gelir ve prod'un
  dosyalarla eşleştiği garanti edilir.

### 6. CI'ya `next build` ekle

`.github/workflows/ci.yml` build'i bilinçli atlıyor (server bileşenleri Supabase env ister).
Dummy env değişkenleriyle bir build adımı eklenerek kırık build'lerin main'e girmesi
engellenebilir.

### 7. Test kapsamını genişlet

Mevcut 9 test dosyası yalnızca saf yardımcı fonksiyonları kapsıyor (`src/lib/__tests__/`,
`src/lib/exams/__tests__/`); ~170 bileşen, server action'lar, API route'ları ve RLS
politikaları testsiz. Önerilen sıra:

1. Server action'lar için birim/entegrasyon testleri (Supabase client mock'lanarak).
2. Kritik akışlar için Playwright e2e: giriş, ödev atama, deneme girişi, veli onay akışı.
3. RLS politika testleri (rol başına erişim matrisi).

---

## P3 — Orta: Bakım Kolaylığı (DRY Refaktörleri) ✅

> 8: `src/lib/api-auth.ts` `requireTeacherApi` beş admin route'una uygulandı.
> 9: `src/lib/admin-api.ts` `postAdmin` beş bileşene uygulandı.
> 10: duplicate tespiti `23505` koduna geçirildi; `insertSubjects` toplu insert'e,
> `syncSections` paralel güncelleme + tek IN silmeye çevrildi (hatalar artık
> yutulmuyor). Revalidate yardımcıları bilinçli olarak ayrı bırakıldı: her biri
> farklı path kümesi tazeliyor, birleştirme gerçek tekrar kaldırmadan dolaylılık
> eklerdi.

### 8. `requireTeacher()` API yardımcısı

"getUser → 401 → profil rolü → teacher değilse 403" bloğu 5 admin route'unda kopya
(`src/app/api/admin/{create-user,delete-user,update-user,reset-password,manage-links}/route.ts`).
`src/lib/auth.ts`'teki `requireRole` benzeri, API route'lara uygun tek yardımcıya çek
(~15 satır × 5 dosya kazanç).

### 9. `postAdmin()` istemci yardımcısı

Beş bileşen aynı `fetch(POST json)` + hata ayrıştırma + loading kalıbını tekrarlıyor:
`create-account-dialog.tsx`, `delete-user-button.tsx`, `manage-links-dialog.tsx`,
`reset-password-button.tsx`, `edit-user-dialog.tsx` (`src/components/teacher/`). Tipli tek
yardımcı yaz.

### 10. Küçük düzeltmeler

- `src/lib/actions/resources.ts` — duplicate tespiti `error.message.includes("duplicate")`
  yerine Postgres hata kodu `23505` ile yapılmalı (`manage-links/route.ts`'teki
  `onConflict` yaklaşımı gibi).
- `src/lib/actions/exams.ts` (`insertSubjects`) ve `resources.ts` (`syncSections`) —
  döngü içi seri insert/update'ler toplu sorguya çevrilebilir (sınırlı sayıda satır olduğundan
  düşük etkili).
- Aksiyon dosyalarında tekrarlanan `revalidate*Paths()` yardımcıları ortaklaştırılabilir.

---

## P4 — Düşük: Cila ve Gelecek

11. **Prettier + pre-commit hook** (husky/lint-staged) — CI'daki kalite kapısının yerelde de
    çalışması, biçim tartışmalarının bitmesi.
12. **Sayfa bazlı `metadata`** — şu an tüm sayfalar "Ders Takip" başlığını paylaşıyor; bölüm
    başına `generateMetadata` ile sekme başlıkları anlamlı olur.
13. **Büyük client bileşenlerini bölme** — `src/components/dashboard/widgets-data.tsx`
    (686 satır), `exam-entry-form.tsx` (490), `create-homework-dialog.tsx` (417) gerektiğinde
    parçalanabilir.
14. **`CLAUDE.md` zenginleştirme** — şu an fiilen boş; mimari özet, konvansiyonlar ve sık
    kullanılan komutlar eklenirse gelecekteki yapay zekâ oturumları hızlanır.

---

## Önerilen Uygulama Sırası

| Sıra | Madde                                           | Tahmini Boyut | Not                                             |
| ---- | ----------------------------------------------- | ------------- | ----------------------------------------------- |
| 1    | Hata sınırları (P1.1)                           | Küçük         | Hızlı kazanım, kullanıcıya görünür etki         |
| 2    | Yükleme doğrulaması + sessiz hata (P1.2 + P1.3) | Küçük         | Aynı dosyalarda, birlikte yapılmalı             |
| 3    | RLS derinlemesine savunma (P1.4)                | Küçük         | Davranış değişmez, güvence artar                |
| 4    | Migration hijyeni (P2.5)                        | Orta          | Prod şema doğrulaması gerektirir                |
| 5    | CI build adımı (P2.6)                           | Küçük         |                                                 |
| 6    | `requireTeacher` + `postAdmin` (P3.8 + P3.9)    | Orta          | Test eklemeden önce yapılırsa testler sade olur |
| 7    | Test genişletme (P2.7)                          | Büyük         | Kademeli ilerletilebilir                        |
| 8    | P3.10 küçük düzeltmeler                         | Küçük         | Fırsat buldukça                                 |
| 9    | P4 maddeleri                                    | Küçük         | İsteğe bağlı                                    |
