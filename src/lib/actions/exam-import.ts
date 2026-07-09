"use server";

import { createClient } from "@/lib/supabase/server";
import { getStudentGrade } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";
import { callGeminiJson, isGeminiConfigured } from "@/lib/ai/gemini";
import { normalizeImportedExam, type RawParsedExam } from "@/lib/exams/import-normalize";
import type { ExamFormInitial } from "@/components/exams/exam-entry-form";

export interface ParseExamResult {
  ok: boolean;
  error?: string;
  initial?: ExamFormInitial;
  warnings?: string[];
}

const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// Gemini'nin uyması gereken JSON şeması (OpenAPI alt kümesi). score STRING'dir;
// Türkçe ondalık ("494,51" / "462,700") normalize katmanında ayrıştırılır.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    examName: { type: "STRING" },
    examDate: { type: "STRING" },
    score: { type: "STRING" },
    subjects: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          correct: { type: "INTEGER" },
          incorrect: { type: "INTEGER" },
          blank: { type: "INTEGER" },
        },
        required: ["name", "correct", "incorrect", "blank"],
        propertyOrdering: ["name", "correct", "incorrect", "blank"],
      },
    },
  },
  required: ["examName", "examDate", "subjects"],
  propertyOrdering: ["examName", "examDate", "score", "subjects"],
};

const PROMPT = `Bu bir Türkiye LGS deneme sonuç belgesidir (PDF veya fotoğraf). Görevin, SADECE bu denemenin ders bazlı sonuçlarını ve genel bilgilerini çıkarmak.

ÇOK ÖNEMLİ KURALLAR:
1. Belgede "SON 15 SINAV", geçmiş denemeler listesi, sıralama/istatistik tabloları olabilir. BUNLARI TAMAMEN YOK SAY. Yalnızca bu denemenin ana ders sonuç tablosunu (ör. "DERS ANALİZİ" ya da "DERSLER" tablosu) kullan.
2. Şu 6 dersi çıkar ve "name" alanını tam olarak şu kanonik adlara eşle:
   - "Türkçe"           (belgede: Türkçe / LGS-TÜRKÇE) — 20 soru
   - "Matematik"        (Matematik / LGS-MATEMATİK) — 20 soru
   - "Fen Bilimleri"    (Fen Bilimleri / LGS-FEN BİLİMLERİ) — 20 soru
   - "T.C. İnkılap Tarihi" (T.C. İnkılap Tarihi ve Atatürkçülük / LGS-İNKILAP TARİHİ / 7. sınıfta Sosyal Bilgiler) — 10 soru
   - "Din Kültürü"      (Din Kültürü ve Ahlak Bilgisi / LGS-DİN KÜLTÜRÜ...) — 10 soru
   - "İngilizce"        (İngilizce / Yabancı Dil / LGS-İNGİLİZCE) — 10 soru
3. Her ders için correct (doğru), incorrect (yanlış), blank (boş) sayısını ver.
   - Belgede boş sütunu yoksa veya hücre boşsa: blank = soruSayısı - doğru - yanlış.
   - Her derste correct + incorrect + blank, o dersin soru sayısına (20 veya 10) TAM EŞİT olmalı.
4. score: denemenin LGS puanı (genelde "LGS" satırında, 0-500 arası, ondalıklı). Belgede yazan şekliyle METİN olarak ver (ör. "494,51"). Bulamazsan boş string.
5. examName: denemenin adı; parantez içindeki tekrarı temizle (ör. "AYDIN GELİŞİM LGS-5(AYDIN GELİŞİM LGS-5)" -> "AYDIN GELİŞİM LGS-5").
6. examDate: sınav tarihi, ISO "YYYY-MM-DD" biçiminde (ör. 11.06.2026 -> 2026-06-11). Bulamazsan boş string.

Yanıtı yalnızca verilen JSON şemasına uygun ver, açıklama ekleme.`;

/**
 * Yüklenen deneme belgesini Gemini'ye gönderip formu önden doldurmaya uygun
 * ExamFormInitial verisine çevirir. Belge KALICI SAKLANMAZ (yalnızca istek
 * süresince bellekte). Yalnızca öğrenciye erişimi olan giriş yapmış kullanıcı çağırabilir.
 */
export async function parseExamDocument(formData: FormData): Promise<ParseExamResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Yetkisiz." };

  if (!isGeminiConfigured()) {
    return { ok: false, error: "Belge okuma (AI) yapılandırılmadı; lütfen elle girin." };
  }

  const studentId = String(formData.get("studentId") ?? "");
  if (!studentId) return { ok: false, error: "Öğrenci bilgisi eksik." };

  // Erişim + sınıf kontrolü: RLS sayesinde erişilemeyen öğrenci null döner.
  const grade = await getStudentGrade(studentId);
  if (!examsEnabledForGrade(grade)) {
    return { ok: false, error: "Bu öğrenci için deneme takibi aktif değil." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Lütfen bir PDF veya görsel seçin." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Dosya çok büyük (en fazla 10 MB)." };
  }
  const mimeType = file.type || "application/pdf";
  if (!ACCEPTED_TYPES.has(mimeType)) {
    return { ok: false, error: "Desteklenmeyen dosya türü (PDF veya görsel yükleyin)." };
  }

  let base64: string;
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    base64 = bytes.toString("base64");
  } catch {
    return { ok: false, error: "Dosya okunamadı." };
  }

  let raw: RawParsedExam;
  try {
    raw = await callGeminiJson<RawParsedExam>({
      prompt: PROMPT,
      file: { base64, mimeType },
      schema: RESPONSE_SCHEMA,
    });
  } catch (err) {
    console.error("[exam-import] Gemini hatası", err);
    return { ok: false, error: "Belge okunamadı; tekrar deneyin veya elle girin." };
  }

  const { initial, warnings } = normalizeImportedExam(raw);
  return { ok: true, initial, warnings };
}
