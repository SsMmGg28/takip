// Ödev formunun SAF ayrıştırma yardımcıları (supabase importsuz → test edilebilir).

export interface ParsedTestEntry {
  section_id: string;
  test_number: number;
}

/**
 * `tests` alanındaki "sectionId:testNumber" girdilerini ayrıştırır; geçersiz
 * (bölüm kimliği boş veya test numarası ≤ 0) satırları eler.
 */
export function parseTestEntries(formData: FormData): ParsedTestEntry[] {
  return formData
    .getAll("tests")
    .map((v) => String(v))
    .map((entry) => {
      const [sectionId, num] = entry.split(":");
      return { section_id: sectionId, test_number: Number(num) };
    })
    .filter((r) => r.section_id && r.test_number > 0);
}
