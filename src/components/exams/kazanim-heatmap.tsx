import { successRate } from "@/lib/exams/recommendations";
import { LGS_SUBJECTS } from "@/lib/kazanim";
import type { KazanimStat } from "@/lib/exam-shared";

/**
 * Kazanım ısı haritası: ders bazında, her kazanım için ağırlıklı başarı
 * (s = 1 − (yanlış + 0.5·boş)/soru) renkle gösterilir. Renk tek başına anlam
 * taşımasın diye her hücrede yüzde + açıklama (legend) var. Durum renkleri
 * (dataviz status paleti) tema-sabittir.
 */

// dataviz status paleti — tema-sabit. En iyiden en zayıfa.
const BANDS = [
  { min: 0.8, label: "Güçlü", hex: "#0ca30c", light: false },
  { min: 0.6, label: "İyi", hex: "#fab219", light: true },
  { min: 0.4, label: "Orta", hex: "#ec835a", light: true },
  { min: 0, label: "Zayıf", hex: "#d03b3b", light: false },
] as const;

function bandFor(s: number) {
  return BANDS.find((b) => s >= b.min) ?? BANDS[BANDS.length - 1];
}

export function KazanimHeatmap({ stats }: { stats: KazanimStat[] }) {
  if (stats.length === 0) return null;

  const bySubject = new Map<string, KazanimStat[]>();
  for (const s of stats) {
    if (!bySubject.has(s.subject)) bySubject.set(s.subject, []);
    bySubject.get(s.subject)!.push(s);
  }

  // Ders sırası: katalog sırası, sonra kalanlar.
  const orderedSubjects = [
    ...LGS_SUBJECTS.map((s) => s.name).filter((n) => bySubject.has(n)),
    ...Array.from(bySubject.keys()).filter(
      (n) => !LGS_SUBJECTS.some((s) => s.name === n),
    ),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Ağırlıklı başarı (boş yarım sayılır):</span>
        {BANDS.map((b) => (
          <span key={b.label} className="inline-flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: b.hex }}
              aria-hidden
            />
            {b.label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {orderedSubjects.map((subject) => {
          const items = [...bySubject.get(subject)!].sort(
            (a, b) => successRate(a) - successRate(b),
          );
          return (
            <div key={subject} className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">{subject}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((k) => {
                  const s = successRate(k);
                  const pct = Math.round(s * 100);
                  const band = bandFor(s);
                  return (
                    <div
                      key={`${k.subject}-${k.code}`}
                      className="w-[112px] rounded-md border-l-4 px-2 py-1.5"
                      style={{
                        backgroundColor: `${band.hex}22`,
                        borderColor: band.hex,
                      }}
                      title={`${k.name} — %${pct} başarı · ${k.correct}D ${k.incorrect}Y ${k.blank}B / ${k.asked} soru`}
                    >
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        %{pct}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-muted-foreground">
                        {k.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
