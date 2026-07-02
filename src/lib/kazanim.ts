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
 * 8. sınıf (LGS) kazanım listesi.
 * 7. sınıf listesi henüz iletilmedi; iletildiğinde aşağıdaki `7` anahtarındaki
 * boş dizilere aynı formatta ({ code, name }) eklenmesi yeterli — arayüz ve
 * analizler otomatik çalışır.
 */
export const KAZANIM_KATALOG: Record<ExamGrade, Record<SubjectName, Kazanim[]>> = {
  7: {
    "Türkçe": [],
    "Matematik": [],
    "Fen Bilimleri": [],
    "T.C. İnkılap Tarihi": [],
    "Din Kültürü": [],
    "İngilizce": [],
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
