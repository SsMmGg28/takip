// Kazanım kataloğu: sınıf düzeyi + ders bazında sisteme gömülü kazanım listesi.
// Deneme sonucu girilirken her ders için bu listeden kazanım işaretlenir;
// bir kazanım için satır girilmemesi "bu denemede bu kazanımdan soru gelmedi"
// anlamına gelir (boş sayılmaz).

export const EXAM_GRADES = [7, 8] as const;
export type ExamGrade = (typeof EXAM_GRADES)[number];

/** LGS deneme derslerinin sabit listesi ve soru sayıları. */
export const LGS_SUBJECTS = [
  { name: "Türkçe", questionCount: 20 },
  { name: "Matematik", questionCount: 20 },
  { name: "Fen Bilimleri", questionCount: 20 },
  { name: "T.C. İnkılap Tarihi", questionCount: 10 },
  { name: "Din Kültürü", questionCount: 10 },
  { name: "İngilizce", questionCount: 10 },
] as const;

export type SubjectName = (typeof LGS_SUBJECTS)[number]["name"];

export interface Kazanim {
  code: string;
  name: string;
}

export function examsEnabledForGrade(grade: number | null | undefined): grade is ExamGrade {
  return grade === 7 || grade === 8;
}

/**
 * Sınıf bazında kazanım (ünite/konu) listeleri.
 * 7. sınıf listesi MEB müfredatındaki ünite/konu başlıklarından derlendi;
 * ders adları LGS ders yuvalarına sabitlendiği için 7. sınıfta
 * "T.C. İnkılap Tarihi" yuvası Sosyal Bilgiler üniteleriyle doldurulur
 * (7. sınıf denemelerinde bu derste Sosyal Bilgiler soruları çıkar).
 */
export const KAZANIM_KATALOG: Record<ExamGrade, Record<SubjectName, Kazanim[]>> = {
  7: {
    "Türkçe": [
      { code: "T7-01", name: "Sözcükte ve Söz Gruplarında Anlam" },
      { code: "T7-02", name: "Deyimler ve Atasözleri" },
      { code: "T7-03", name: "Cümlede Anlam" },
      { code: "T7-04", name: "Paragrafta Anlam ve Ana Düşünce" },
      { code: "T7-05", name: "Paragrafta Yardımcı Düşünce" },
      { code: "T7-06", name: "Paragrafta Yapı ve Anlatım Teknikleri" },
      { code: "T7-07", name: "Sözel Mantık ve Muhakeme" },
      { code: "T7-08", name: "Görsel, Grafik ve Tablo Yorumlama" },
      { code: "T7-09", name: "Metin Türleri" },
      { code: "T7-10", name: "Söz Sanatları" },
      { code: "T7-11", name: "Fiiller (Anlam ve Kip)" },
      { code: "T7-12", name: "Ek Fiil" },
      { code: "T7-13", name: "Zarflar" },
      { code: "T7-14", name: "Fiilde Yapı" },
      { code: "T7-15", name: "Yazım Kuralları" },
      { code: "T7-16", name: "Noktalama İşaretleri" },
    ],
    "Matematik": [
      { code: "M7-01", name: "Tam Sayılarla İşlemler" },
      { code: "M7-02", name: "Rasyonel Sayılar" },
      { code: "M7-03", name: "Rasyonel Sayılarla İşlemler" },
      { code: "M7-04", name: "Cebirsel İfadeler" },
      { code: "M7-05", name: "Eşitlik ve Denklem" },
      { code: "M7-06", name: "Oran ve Orantı" },
      { code: "M7-07", name: "Yüzdeler" },
      { code: "M7-08", name: "Doğrular ve Açılar" },
      { code: "M7-09", name: "Çokgenler" },
      { code: "M7-10", name: "Çember ve Daire" },
      { code: "M7-11", name: "Veri Analizi" },
      { code: "M7-12", name: "Cisimlerin Farklı Yönlerden Görünümleri" },
    ],
    "Fen Bilimleri": [
      { code: "F7-01", name: "Güneş Sistemi ve Ötesi" },
      { code: "F7-02", name: "Hücre ve Bölünmeler" },
      { code: "F7-03", name: "Kuvvet ve Enerji" },
      { code: "F7-04", name: "Saf Madde ve Karışımlar" },
      { code: "F7-05", name: "Işığın Madde ile Etkileşimi" },
      { code: "F7-06", name: "Canlılarda Üreme, Büyüme ve Gelişme" },
      { code: "F7-07", name: "Elektrik Devreleri" },
    ],
    // 7. sınıfta bu ders yuvasında Sosyal Bilgiler soruları çıkar.
    "T.C. İnkılap Tarihi": [
      { code: "S7-01", name: "Birey ve Toplum (İletişim ve İnsan İlişkileri)" },
      { code: "S7-02", name: "Kültür ve Miras (Türk Tarihinde Yolculuk)" },
      { code: "S7-03", name: "İnsanlar, Yerler ve Çevreler (Ülkemizde Nüfus)" },
      { code: "S7-04", name: "Bilim, Teknoloji ve Toplum (Zaman İçinde Bilim)" },
      { code: "S7-05", name: "Üretim, Dağıtım ve Tüketim (Ekonomi ve Sosyal Hayat)" },
      { code: "S7-06", name: "Etkin Vatandaşlık (Yaşayan Demokrasi)" },
      { code: "S7-07", name: "Küresel Bağlantılar (Ülkeler Arası Köprüler)" },
    ],
    "Din Kültürü": [
      { code: "D7-01", name: "Melek ve Ahiret İnancı" },
      { code: "D7-02", name: "Hac ve Kurban İbadeti" },
      { code: "D7-03", name: "Ahlaki Davranışlar" },
      { code: "D7-04", name: "Allah'ın Kulu ve Elçisi: Hz. Muhammed" },
      { code: "D7-05", name: "İslam Düşüncesinde Yorumlar" },
    ],
    "İngilizce": [
      { code: "E7-01", name: "Appearance and Personality" },
      { code: "E7-02", name: "Sports" },
      { code: "E7-03", name: "Biographies" },
      { code: "E7-04", name: "Wild Animals" },
      { code: "E7-05", name: "Television" },
      { code: "E7-06", name: "Celebrations" },
      { code: "E7-07", name: "Dreams" },
      { code: "E7-08", name: "Public Buildings" },
      { code: "E7-09", name: "Environment" },
      { code: "E7-10", name: "Planets" },
    ],
  },
  8: {
    "Türkçe": [
      { code: "T8-01", name: "Sözcükte ve Söz Gruplarında Anlam" },
      { code: "T8-02", name: "Deyimler ve Atasözleri" },
      { code: "T8-03", name: "Cümlede Anlam" },
      { code: "T8-04", name: "Paragrafta Anlam ve Ana Düşünce" },
      { code: "T8-05", name: "Paragrafta Yardımcı Düşünce" },
      { code: "T8-06", name: "Paragrafta Yapı ve Anlatım Teknikleri" },
      { code: "T8-07", name: "Sözel Mantık ve Muhakeme" },
      { code: "T8-08", name: "Görsel, Grafik ve Tablo Yorumlama" },
      { code: "T8-09", name: "Metin Türleri" },
      { code: "T8-10", name: "Söz Sanatları" },
      { code: "T8-11", name: "Fiilimsiler" },
      { code: "T8-12", name: "Cümlenin Ögeleri" },
      { code: "T8-13", name: "Fiilde Çatı" },
      { code: "T8-14", name: "Cümle Türleri" },
      { code: "T8-15", name: "Yazım Kuralları" },
      { code: "T8-16", name: "Noktalama İşaretleri" },
      { code: "T8-17", name: "Anlatım Bozuklukları" },
    ],
    "Matematik": [
      { code: "M8-01", name: "Çarpanlar ve Katlar" },
      { code: "M8-02", name: "Üslü İfadeler" },
      { code: "M8-03", name: "Kareköklü İfadeler" },
      { code: "M8-04", name: "Veri Analizi" },
      { code: "M8-05", name: "Basit Olayların Olma Olasılığı" },
      { code: "M8-06", name: "Cebirsel İfadeler ve Özdeşlikler" },
      { code: "M8-07", name: "Doğrusal Denklemler" },
      { code: "M8-08", name: "Eşitsizlikler" },
      { code: "M8-09", name: "Üçgenler" },
      { code: "M8-10", name: "Eşlik ve Benzerlik" },
      { code: "M8-11", name: "Dönüşüm Geometrisi" },
      { code: "M8-12", name: "Geometrik Cisimler" },
    ],
    "Fen Bilimleri": [
      { code: "F8-01", name: "Mevsimler ve İklim" },
      { code: "F8-02", name: "DNA ve Genetik Kod" },
      { code: "F8-03", name: "Kalıtım" },
      { code: "F8-04", name: "Mutasyon, Modifikasyon ve Adaptasyon" },
      { code: "F8-05", name: "Basınç" },
      { code: "F8-06", name: "Periyodik Sistem" },
      { code: "F8-07", name: "Fiziksel ve Kimyasal Değişimler" },
      { code: "F8-08", name: "Kimyasal Tepkimeler" },
      { code: "F8-09", name: "Asitler ve Bazlar" },
      { code: "F8-10", name: "Isı ve Sıcaklık" },
      { code: "F8-11", name: "Basit Makineler" },
      { code: "F8-12", name: "Besin Zinciri ve Enerji Akışı" },
      { code: "F8-13", name: "Fotosentez ve Solunum" },
      { code: "F8-14", name: "Madde Döngüleri ve Çevre Sorunları" },
      { code: "F8-15", name: "Elektrik Yükleri ve Elektriklenme" },
      { code: "F8-16", name: "Elektrik Enerjisinin Dönüşümü" },
    ],
    "T.C. İnkılap Tarihi": [
      { code: "I8-01", name: "Bir Kahraman Doğuyor" },
      { code: "I8-02", name: "Milli Uyanış: Bağımsızlık Yolunda Atılan Adımlar" },
      { code: "I8-03", name: "Milli Bir Destan: Ya İstiklal Ya Ölüm" },
      { code: "I8-04", name: "Atatürkçülük ve Çağdaşlaşan Türkiye" },
      { code: "I8-05", name: "Demokratikleşme Çabaları" },
      { code: "I8-06", name: "Atatürk Dönemi Türk Dış Politikası" },
      { code: "I8-07", name: "Atatürk'ün Ölümü ve Sonrası" },
    ],
    "Din Kültürü": [
      { code: "D8-01", name: "Kader İnancı" },
      { code: "D8-02", name: "Zekât ve Sadaka" },
      { code: "D8-03", name: "Din ve Hayat" },
      { code: "D8-04", name: "Hz. Muhammed'in Örnekliği" },
      { code: "D8-05", name: "Kur'an-ı Kerim ve Özellikleri" },
    ],
    "İngilizce": [
      { code: "E8-01", name: "Friendship" },
      { code: "E8-02", name: "Teen Life" },
      { code: "E8-03", name: "In the Kitchen" },
      { code: "E8-04", name: "On the Phone" },
      { code: "E8-05", name: "The Internet" },
      { code: "E8-06", name: "Adventures" },
      { code: "E8-07", name: "Tourism" },
      { code: "E8-08", name: "Chores" },
      { code: "E8-09", name: "Science" },
      { code: "E8-10", name: "Natural Forces" },
    ],
  },
};

/** Bir sınıf + ders için kazanım listesini döner (tanımsızsa boş dizi). */
export function getKazanimlar(grade: number, subject: string): Kazanim[] {
  if (!examsEnabledForGrade(grade)) return [];
  const bySubject = KAZANIM_KATALOG[grade];
  return bySubject[subject as SubjectName] ?? [];
}

/** Kod -> ad araması; katalogda yoksa kodu döner (eski/veri kaynaklı kayıtlar için). */
export function kazanimName(grade: number, subject: string, code: string): string {
  const found = getKazanimlar(grade, subject).find((k) => k.code === code);
  return found?.name ?? code;
}
