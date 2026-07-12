"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBookUnits } from "@/lib/book-catalog";

export interface InitialSection {
  name: string;
  testCount: number;
  kazanimCode: string | null;
}

/**
 * Kitap bölümlerini "her üniteden kaç test" mantığıyla girer. İki mod:
 *  - Kazanım modu: seçilen sınıf+dersin kataloğu varsa her ünite için sabit satır;
 *    kullanıcı yalnız test sayısı girer (0 = o ünite kaydedilmez). Gizli input'larla
 *    section_name / section_kazanim_code / section_test_count formla gönderilir.
 *  - Serbest mod (katalogsuz sınıf/ders): ad + sayı satırları elle eklenir/silinir.
 * Aynı bileşen hem ekleme (create) hem düzenleme (edit) formlarında kullanılır;
 * sınıf/ders değişince parent `key` ile yeniden mount ederek durumu sıfırlar.
 */
export function KazanimTestGrid({
  grade,
  subject,
  initial = [],
}: {
  grade: number | null;
  subject: string;
  initial?: InitialSection[];
}) {
  const units = grade && subject ? getBookUnits(grade, subject) : [];
  const hasCatalog = units.length > 0;

  if (hasCatalog) {
    return <CatalogGrid grade={grade!} subject={subject} units={units} initial={initial} />;
  }
  return <FreeGrid initial={initial} />;
}

function CatalogGrid({
  units,
  initial,
}: {
  grade: number;
  subject: string;
  units: { code: string; name: string }[];
  initial: InitialSection[];
}) {
  const initialByCode = new Map(
    initial.filter((s) => s.kazanimCode).map((s) => [s.kazanimCode as string, s.testCount]),
  );
  const [counts, setCounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      units.map((u) => [u.code, initialByCode.has(u.code) ? String(initialByCode.get(u.code)) : ""]),
    ),
  );

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Üniteler ve test sayıları</span>
        <span className="text-[11px] text-muted-foreground">Test yoksa 0 bırak</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {units.map((u) => (
          <div key={u.code} className="flex items-center gap-2">
            {/* Gizli alanlar count ile aynı sırada gönderilir; server test_count>0 olanları alır. */}
            <input type="hidden" name="section_name" value={u.name} />
            <input type="hidden" name="section_kazanim_code" value={u.code} />
            <label className="min-w-0 flex-1 truncate text-sm" title={u.name}>
              {u.name}
            </label>
            <Input
              name="section_test_count"
              type="number"
              min={0}
              max={200}
              inputMode="numeric"
              placeholder="0"
              value={counts[u.code] ?? ""}
              onChange={(e) => setCounts((prev) => ({ ...prev, [u.code]: e.target.value }))}
              className="w-20 bg-background"
              aria-label={`${u.name} test sayısı`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface FreeRow {
  key: number;
  name: string;
  testCount: string;
}

let freeKey = 0;

function FreeGrid({ initial }: { initial: InitialSection[] }) {
  const [rows, setRows] = useState<FreeRow[]>(() =>
    initial.length
      ? initial.map((s) => ({ key: ++freeKey, name: s.name, testCount: String(s.testCount) }))
      : [{ key: ++freeKey, name: "", testCount: "10" }],
  );

  function updateRow(key: number, patch: Partial<FreeRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Bölümler ve test sayıları</span>
        <span className="text-[11px] text-muted-foreground">Bu sınıf/ders için hazır kazanım yok</span>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={row.key} className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {i + 1}
            </span>
            {/* Serbest modda kazanım kodu yok; hizalama için boş gönderilir. */}
            <input type="hidden" name="section_kazanim_code" value="" />
            <Input
              name="section_name"
              value={row.name}
              onChange={(e) => updateRow(row.key, { name: e.target.value })}
              placeholder="Bölüm adı (örn: Kesirler)"
              className="flex-1 bg-background"
            />
            <Input
              name="section_test_count"
              type="number"
              min={0}
              max={200}
              value={row.testCount}
              onChange={(e) => updateRow(row.key, { testCount: e.target.value })}
              className="w-20 bg-background"
              aria-label="Test sayısı"
            />
            <button
              type="button"
              onClick={() =>
                setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== row.key) : prev))
              }
              className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
              disabled={rows.length <= 1}
              aria-label="Bölümü kaldır"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-1 gap-1.5 self-start"
        onClick={() => setRows((prev) => [...prev, { key: ++freeKey, name: "", testCount: "10" }])}
      >
        <Plus className="h-3.5 w-3.5" /> Bölüm ekle
      </Button>
    </div>
  );
}
