// Kitap kataloğu: kütüphaneye eklenen kaynak kitapların bölümlerini o sınıfın ve
// dersinin ünite/kazanımlarıyla eşleştirmek için kullanılır. Deneme sistemindeki
// `KAZANIM_KATALOG`'dan (src/lib/kazanim.ts) AYRIDIR:
//   - Deneme kataloğu yalnız 7-8. sınıf + 6 sabit LGS dersi + soru sayılarına bağlıdır
//     ve Faz 2 ile birim testleri buna dayanır → değiştirilemez.
//   - Bu katalog 5-8. sınıfı ve her sınıfın gerçek ders adlarını kapsar; kitap ekleme
//     akışında "hangi üniteden kaç test" girişini yönlendirir.
// 7 ve 8. sınıf üniteleri koda tekrar yazılmaz; deneme kataloğundaki diziler yeniden
// kullanılır (kod tekilliği korunur: T7/M7/S7…, T8/M8/I8…). 5 ve 6. sınıf listeleri
// MEB müfredatındaki ünite başlıklarından derlendi; gözden geçirilip düzeltilebilir.

import { KAZANIM_KATALOG, type Kazanim } from "@/lib/kazanim";

export const BOOK_GRADES = [5, 6, 7, 8] as const;
export type BookGrade = (typeof BOOK_GRADES)[number];

// 5. sınıf (MEB müfredatından derlendi, gözden geçirilebilir) ------------------
const CATALOG_5: Record<string, Kazanim[]> = {
  "Türkçe": [
    { code: "T5-01", name: "Sözcükte Anlam" },
    { code: "T5-02", name: "Deyimler ve Atasözleri" },
    { code: "T5-03", name: "Cümlede Anlam" },
    { code: "T5-04", name: "Paragrafta Anlam" },
    { code: "T5-05", name: "Metin Türleri" },
    { code: "T5-06", name: "Söz Sanatları" },
    { code: "T5-07", name: "Yazım Kuralları" },
    { code: "T5-08", name: "Noktalama İşaretleri" },
    { code: "T5-09", name: "Görsel Okuma, Grafik ve Tablo Yorumlama" },
  ],
  "Matematik": [
    { code: "M5-01", name: "Doğal Sayılar" },
    { code: "M5-02", name: "Doğal Sayılarla İşlemler" },
    { code: "M5-03", name: "Kesirler" },
    { code: "M5-04", name: "Kesirlerle İşlemler" },
    { code: "M5-05", name: "Ondalık Gösterim" },
    { code: "M5-06", name: "Yüzdeler" },
    { code: "M5-07", name: "Temel Geometrik Kavramlar ve Çizimler" },
    { code: "M5-08", name: "Üçgen ve Dörtgenler" },
    { code: "M5-09", name: "Uzunluk ve Zaman Ölçme" },
    { code: "M5-10", name: "Veri Toplama ve Değerlendirme" },
    { code: "M5-11", name: "Alan Ölçme" },
    { code: "M5-12", name: "Geometrik Cisimler" },
  ],
  "Fen Bilimleri": [
    { code: "F5-01", name: "Güneş, Dünya ve Ay" },
    { code: "F5-02", name: "Canlılar Dünyası" },
    { code: "F5-03", name: "Kuvvetin Ölçülmesi ve Sürtünme" },
    { code: "F5-04", name: "Madde ve Değişim" },
    { code: "F5-05", name: "Işığın Yayılması" },
    { code: "F5-06", name: "İnsan ve Çevre" },
    { code: "F5-07", name: "Elektrik Devre Elemanları" },
  ],
  "Sosyal Bilgiler": [
    { code: "S5-01", name: "Birey ve Toplum" },
    { code: "S5-02", name: "Kültür ve Miras" },
    { code: "S5-03", name: "İnsanlar, Yerler ve Çevreler" },
    { code: "S5-04", name: "Bilim, Teknoloji ve Toplum" },
    { code: "S5-05", name: "Üretim, Dağıtım ve Tüketim" },
    { code: "S5-06", name: "Etkin Vatandaşlık" },
    { code: "S5-07", name: "Küresel Bağlantılar" },
  ],
  "Din Kültürü": [
    { code: "D5-01", name: "Allah İnancı" },
    { code: "D5-02", name: "Ramazan ve Oruç" },
    { code: "D5-03", name: "Adap ve Nezaket" },
    { code: "D5-04", name: "Hz. Muhammed ve Aile Hayatı" },
    { code: "D5-05", name: "Çevremizde Dinin İzleri" },
  ],
  "İngilizce": [
    { code: "E5-01", name: "Hello" },
    { code: "E5-02", name: "My Town" },
    { code: "E5-03", name: "Games and Hobbies" },
    { code: "E5-04", name: "My Daily Routine" },
    { code: "E5-05", name: "Health" },
    { code: "E5-06", name: "Movies" },
    { code: "E5-07", name: "Party" },
    { code: "E5-08", name: "Fitness" },
    { code: "E5-09", name: "The Animal Shelter" },
    { code: "E5-10", name: "Festivals" },
  ],
};

// 6. sınıf (MEB müfredatından derlendi, gözden geçirilebilir) ------------------
const CATALOG_6: Record<string, Kazanim[]> = {
  "Türkçe": [
    { code: "T6-01", name: "Sözcükte Anlam" },
    { code: "T6-02", name: "Deyimler ve Atasözleri" },
    { code: "T6-03", name: "Cümlede Anlam" },
    { code: "T6-04", name: "Paragrafta Anlam" },
    { code: "T6-05", name: "Metin Türleri" },
    { code: "T6-06", name: "Söz Sanatları" },
    { code: "T6-07", name: "Sözcük Türleri (İsim, Sıfat, Zamir)" },
    { code: "T6-08", name: "Yazım Kuralları" },
    { code: "T6-09", name: "Noktalama İşaretleri" },
    { code: "T6-10", name: "Görsel Okuma, Grafik ve Tablo Yorumlama" },
  ],
  "Matematik": [
    { code: "M6-01", name: "Doğal Sayılarla İşlemler" },
    { code: "M6-02", name: "Çarpanlar ve Katlar" },
    { code: "M6-03", name: "Kümeler" },
    { code: "M6-04", name: "Tam Sayılar" },
    { code: "M6-05", name: "Kesirlerle İşlemler" },
    { code: "M6-06", name: "Ondalık Gösterim" },
    { code: "M6-07", name: "Oran" },
    { code: "M6-08", name: "Cebirsel İfadeler" },
    { code: "M6-09", name: "Veri Toplama ve Değerlendirme" },
    { code: "M6-10", name: "Veri Analizi" },
    { code: "M6-11", name: "Açılar" },
    { code: "M6-12", name: "Alan Ölçme (Üçgen ve Dörtgenler)" },
    { code: "M6-13", name: "Çember" },
    { code: "M6-14", name: "Geometrik Cisimler" },
  ],
  "Fen Bilimleri": [
    { code: "F6-01", name: "Güneş Sistemi ve Tutulmalar" },
    { code: "F6-02", name: "Vücudumuzdaki Sistemler" },
    { code: "F6-03", name: "Kuvvet ve Hareket" },
    { code: "F6-04", name: "Madde ve Isı" },
    { code: "F6-05", name: "Ses ve Özellikleri" },
    { code: "F6-06", name: "Vücudumuzdaki Sistemler ve Sağlığımız" },
    { code: "F6-07", name: "Elektriğin İletimi" },
  ],
  "Sosyal Bilgiler": [
    { code: "S6-01", name: "Birey ve Toplum" },
    { code: "S6-02", name: "Kültür ve Miras" },
    { code: "S6-03", name: "İnsanlar, Yerler ve Çevreler" },
    { code: "S6-04", name: "Bilim, Teknoloji ve Toplum" },
    { code: "S6-05", name: "Üretim, Dağıtım ve Tüketim" },
    { code: "S6-06", name: "Etkin Vatandaşlık" },
    { code: "S6-07", name: "Küresel Bağlantılar" },
  ],
  "Din Kültürü": [
    { code: "D6-01", name: "Peygamber ve İlahi Kitap İnancı" },
    { code: "D6-02", name: "Namaz" },
    { code: "D6-03", name: "Zararlı Alışkanlıklar" },
    { code: "D6-04", name: "Hz. Muhammed'in Hayatı" },
    { code: "D6-05", name: "Temel Değerler (Sevgi, Dostluk, Kardeşlik)" },
  ],
  "İngilizce": [
    { code: "E6-01", name: "Life" },
    { code: "E6-02", name: "Yummy Breakfast" },
    { code: "E6-03", name: "Downtown" },
    { code: "E6-04", name: "Weather and Emotions" },
    { code: "E6-05", name: "At the Fair" },
    { code: "E6-06", name: "Occupations" },
    { code: "E6-07", name: "Holidays" },
    { code: "E6-08", name: "Bookworms" },
    { code: "E6-09", name: "Saving the Planet" },
    { code: "E6-10", name: "Democracy" },
  ],
};

/**
 * Sınıf düzeyi -> ders -> ünite/kazanım listesi.
 * 7. sınıfta İnkılap yuvasındaki Sosyal Bilgiler üniteleri (S7-*) "Sosyal Bilgiler"
 * ders adı altında; 8. sınıfta I8-* üniteleri "T.C. İnkılap Tarihi" altında verilir.
 */
export const BOOK_CATALOG: Record<BookGrade, Record<string, Kazanim[]>> = {
  5: CATALOG_5,
  6: CATALOG_6,
  7: {
    "Türkçe": KAZANIM_KATALOG[7]["Türkçe"],
    "Matematik": KAZANIM_KATALOG[7]["Matematik"],
    "Fen Bilimleri": KAZANIM_KATALOG[7]["Fen Bilimleri"],
    "Sosyal Bilgiler": KAZANIM_KATALOG[7]["T.C. İnkılap Tarihi"],
    "Din Kültürü": KAZANIM_KATALOG[7]["Din Kültürü"],
    "İngilizce": KAZANIM_KATALOG[7]["İngilizce"],
  },
  8: {
    "Türkçe": KAZANIM_KATALOG[8]["Türkçe"],
    "Matematik": KAZANIM_KATALOG[8]["Matematik"],
    "Fen Bilimleri": KAZANIM_KATALOG[8]["Fen Bilimleri"],
    "T.C. İnkılap Tarihi": KAZANIM_KATALOG[8]["T.C. İnkılap Tarihi"],
    "Din Kültürü": KAZANIM_KATALOG[8]["Din Kültürü"],
    "İngilizce": KAZANIM_KATALOG[8]["İngilizce"],
  },
};

export function isBookGrade(grade: number | null | undefined): grade is BookGrade {
  return grade === 5 || grade === 6 || grade === 7 || grade === 8;
}

/** Bir sınıfın ders listesini (katalog anahtarları, sabit sırada) döner. */
export function getBookSubjects(grade: number): string[] {
  if (!isBookGrade(grade)) return [];
  return Object.keys(BOOK_CATALOG[grade]);
}

/** Bir sınıf + ders için ünite/kazanım listesini döner (katalogda yoksa boş dizi). */
export function getBookUnits(grade: number, subject: string): Kazanim[] {
  if (!isBookGrade(grade)) return [];
  return BOOK_CATALOG[grade][subject] ?? [];
}

/** Kod -> ünite adı; katalogda yoksa kodu döner. */
export function bookUnitName(grade: number, subject: string, code: string): string {
  return getBookUnits(grade, subject).find((u) => u.code === code)?.name ?? code;
}
