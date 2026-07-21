# Performans Bütçesi

Üretime çıkmadan önce preview verisiyle öğretmen, öğrenci ve veli hesaplarında aynı
ölçüm seti çalıştırılır. Sonuçlar önceki sürümle karşılaştırılmadan yalnız tek bir
Lighthouse puanına bakılarak değişiklik kabul edilmez.

## Hedefler

- Mobil p75 LCP: 2,5 saniyenin altında
- Mobil p75 INP: 200 ms altında
- CLS: 0,1 altında
- Anasayfa ilk yük JavaScript'i: bu yenileme öncesi baseline'a göre en az %30 düşük
- Diğer rotalar: ilk yük JavaScript'i ve LCP'de %5'ten fazla gerileme yok

## Ölçüm

1. `npm run analyze` ile rota bazlı istemci/server import zincirlerini `.next/diagnostics/analyze`
   altına kaydet.
2. Seed edilmiş üç rolle 390 px mobil (Slow 4G, 4× CPU) ve 1440 px masaüstünde
   üçer Lighthouse koşusu çalıştır; medyanı raporla.
3. Preview deployment'taki Vercel Speed Insights p75 değerlerini en az 7 günlük
   pencereyle doğrula.
4. CI'ın `next-bundle-analysis` artifact'ını önceki başarılı koşuyla karşılaştır.

Özellikle `/student`, `/teacher`, `/parent`, ödev listeleri ve deneme analizleri
ölçülür. Kimlik doğrulama nedeniyle otomatik Lighthouse koşusu gerçek preview
hesapları olmadan CI'a eklenmez; ölçüm hesabı sağlandığında bu belge aynı eşikleri
Lighthouse CI yapılandırmasına taşımak için kaynak sözleşmedir.
