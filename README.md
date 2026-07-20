# Ders Takip Sistemi

Ödev takibi, kaynak kitap takibi, takvim, çalışma programı ve deneme analizi için
öğretmen/öğrenci/veli rolleriyle çalışan bir takip uygulaması. Detaylar için proje
planına bakabilirsin: `.claude/plans` altındaki ilgili dosya (varsa) veya bu README.

## Kurulum (ilk defa)

### 1. Supabase projesi oluştur

1. https://supabase.com adresinde ücretsiz hesap aç, "New Project" ile yeni proje oluştur.
2. Proje hazır olunca **Project Settings → API** sayfasından şunları al:
   - `Project URL`
   - `anon` `public` key
   - `service_role` key (gizli, sadece sunucu tarafında kullanılacak)
3. **SQL Editor**'e gir ve `supabase/migrations/` altındaki **tüm** dosyaları
   dosya adı sırasıyla (0001'den başlayarak, `0007`'den sonra `0007b`) çalıştır.
   Her dosya bir kez ve sırayla uygulanmalıdır; atlanan dosya eksik tablo/politika
   demektir.

> **Not (Supabase CLI):** `supabase/config.toml` sayesinde yerelde
> `npx supabase start` ile tam bir yerel Supabase yığını çalıştırabilirsin.
> Uzak projeye `supabase db push` ile şema göndermek, migration dosyalarının
> zaman damgalı ada geçirilmesini ve mevcut şemanın baseline'lanmasını
> gerektirir; şimdilik migration'lar yukarıdaki gibi elle uygulanır.

### 2. Ortam değişkenlerini ayarla

`.env.local.example` dosyasını `.env.local` olarak kopyala ve yukarıda aldığın
bilgilerle doldur:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_AUTH_EMAIL_DOMAIN=takip.internal

# Web Push (kilit ekranı bildirimleri) — üretmek için: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:seninadresin@example.com
```

> VAPID anahtarları tanımlı değilse uygulama normal çalışır; yalnızca
> telefon/kilit ekranı push bildirimleri devre dışı kalır.

### 3. İlk öğretmen hesabını oluştur

Hesap oluşturma akışı uygulama içinden (öğretmen girişiyle) çalışıyor, ama ilk
öğretmen hesabı için henüz giriş yapmış bir öğretmen yok. Bunu Supabase
Dashboard'dan elle yapman gerekiyor:

1. **Authentication → Users → Add user** ile bir kullanıcı oluştur (e-posta:
   örn. `ogretmen@takip.internal`, şifre: kendin belirle).
2. **Table Editor → profiles** tablosuna bu kullanıcı için bir satır ekle:
   - `id`: yukarıda oluşturulan kullanıcının id'si (Authentication → Users'tan kopyala)
   - `role`: `teacher`
   - `username`: `ogretmen` (giriş ekranında kullanılacak)
   - `full_name`: öğretmenin adı
   - `must_change_password`: `false`

Bundan sonra öğretmen, uygulama içinden "Yeni Hesap Oluştur" ile öğrenci ve veli
hesaplarını kendisi açabilir.

### 4. Geliştirme sunucusunu çalıştır

```bash
npm install
npm run dev
```

http://localhost:3000 adresinden açabilirsin.

## Vercel'e Deploy

1. Bu projeyi bir GitHub reposuna push et.
2. https://vercel.com üzerinden "New Project" ile bu repoyu içe aktar.
3. Environment Variables kısmına `.env.local` içindeki tüm değerleri ekle
   (VAPID anahtarları dahil — `NEXT_PUBLIC_VAPID_PUBLIC_KEY` build sırasında
   tarayıcı koduna gömüldüğü için sonradan eklenirse yeniden deploy gerekir).
4. Deploy et — her `git push` sonrası otomatik olarak yeniden deploy edilecek.

## Proje Yapısı

- `src/app/teacher`, `src/app/student`, `src/app/parent` — role göre ayrılmış sayfalar.
- `src/app/api/admin` — sadece öğretmenin kullanabildiği hesap oluşturma/şifre sıfırlama uçları.
- `src/lib/supabase` — tarayıcı, sunucu ve admin (service-role) Supabase istemcileri.
- `supabase/migrations` — veritabanı şeması ve güvenlik (RLS) politikaları.
