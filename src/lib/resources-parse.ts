// Kaynak kitap formlarının SAF ayrıştırma/senkron mantığı. supabase importsuz —
// böylece birim testlerde doğrudan çağrılabilir. (Server action dosyaları yalnız
// async action export edebildiği için bu yardımcılar ayrı bir modülde tutulur.)

export interface SectionInput {
  name: string;
  testCount: number;
  kazanimCode: string | null;
}

export interface ExistingSection {
  id: string;
  name: string;
  kazanim_code: string | null;
}

/**
 * Bölüm satırlarını formdan okur. `section_name`, `section_test_count` ve
 * `section_kazanim_code` alanları aynı sırada gönderilir (KazanimTestGrid). Test
 * sayısı 0/boş veya 200'ü aşan satırlar atlanır.
 */
export function parseSections(formData: FormData): SectionInput[] {
  const names = formData.getAll("section_name").map((v) => String(v).trim());
  const counts = formData.getAll("section_test_count").map((v) => Number(v));
  const codes = formData.getAll("section_kazanim_code").map((v) => {
    const s = String(v).trim();
    return s ? s : null;
  });
  const sections: SectionInput[] = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const testCount = counts[i];
    if (name && Number.isFinite(testCount) && testCount > 0 && testCount <= 200) {
      sections.push({ name, testCount, kazanimCode: codes[i] ?? null });
    }
  }
  return sections;
}

/** Sınıf düzeyi (5-8). Geçersizse null. */
export function parseGrade(formData: FormData): number | null {
  const g = Number(formData.get("grade_level"));
  return g === 5 || g === 6 || g === 7 || g === 8 ? g : null;
}

/** Zorluk derecesi (1-5). Boş/geçersizse null. Yalnızca öğretmen atar. */
export function parseDifficulty(formData: FormData): number | null {
  const d = Number(formData.get("difficulty"));
  return Number.isFinite(d) && d >= 1 && d <= 5 ? Math.round(d) : null;
}

/** Bölüm eşleştirme anahtarı: kazanım kodu varsa ona, yoksa ada göre (tr-küçük). */
export function sectionKey(name: string, code: string | null): string {
  return code ? `c:${code}` : `n:${name.trim().toLocaleLowerCase("tr")}`;
}

export interface SectionSyncPlan {
  toUpdate: {
    id: string;
    name: string;
    testCount: number;
    kazanimCode: string | null;
    orderIndex: number;
  }[];
  toInsert: {
    name: string;
    testCount: number;
    kazanimCode: string | null;
    orderIndex: number;
  }[];
  toDeleteIds: string[];
}

/**
 * Mevcut bölümlerle istenen listeyi karşılaştırıp senkron planı üretir (SAF):
 * anahtarı eşleşen bölüm GÜNCELLENİR (id korunur → test ilerlemesi kalır), yeni
 * anahtar EKLENİR, listede kalmayan SİLİNİR. İstenen listedeki tekrar eden
 * anahtarlar (aynı kod/ad) atlanır; sıralama istenen listedeki indekse göre.
 */
export function planSectionSync(
  existing: ExistingSection[],
  desired: SectionInput[],
): SectionSyncPlan {
  const existingByKey = new Map(
    existing.map((s) => [sectionKey(s.name, s.kazanim_code), s]),
  );
  const seen = new Set<string>();
  const toUpdate: SectionSyncPlan["toUpdate"] = [];
  const toInsert: SectionSyncPlan["toInsert"] = [];

  for (let i = 0; i < desired.length; i++) {
    const d = desired[i];
    const key = sectionKey(d.name, d.kazanimCode);
    if (seen.has(key)) continue;
    seen.add(key);
    const ex = existingByKey.get(key);
    if (ex) {
      toUpdate.push({
        id: ex.id,
        name: d.name,
        testCount: d.testCount,
        kazanimCode: d.kazanimCode,
        orderIndex: i,
      });
    } else {
      toInsert.push({
        name: d.name,
        testCount: d.testCount,
        kazanimCode: d.kazanimCode,
        orderIndex: i,
      });
    }
  }

  const toDeleteIds: string[] = [];
  for (const [key, ex] of existingByKey) {
    if (!seen.has(key)) toDeleteIds.push(ex.id);
  }

  return { toUpdate, toInsert, toDeleteIds };
}
