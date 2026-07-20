"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { todayInIstanbul } from "@/lib/week";
import { addDays } from "@/lib/study-log";

/**
 * Dönem raporu kontrol çubuğu (yazdırmada gizli): tarih aralığı seçimi + presetler
 * + "Yazdır/PDF". Aralık değişince ?from&to ile sayfa yeniden yüklenir.
 */
export function ReportControls({
  studentId,
  from,
  to,
}: {
  studentId: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  function apply(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams();
    if (nextFrom) params.set("from", nextFrom);
    if (nextTo) params.set("to", nextTo);
    const qs = params.toString();
    router.push(`/rapor/${studentId}${qs ? `?${qs}` : ""}`);
  }

  const today = todayInIstanbul();
  const presets = [
    { label: "Son 1 Ay", from: addDays(today, -30) },
    { label: "Son 3 Ay", from: addDays(today, -90) },
    { label: "Son 1 Yıl", from: addDays(today, -365) },
    { label: "Tümü", from: "" },
  ];

  return (
    <div className="no-print mb-6 flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from" className="text-xs">
            Başlangıç
          </Label>
          <Input
            id="from"
            type="date"
            value={f}
            onChange={(e) => setF(e.target.value)}
            className="h-9 bg-background"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to" className="text-xs">
            Bitiş
          </Label>
          <Input
            id="to"
            type="date"
            value={t}
            onChange={(e) => setT(e.target.value)}
            className="h-9 bg-background"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => apply(f, t)}>
          Uygula
        </Button>
        <Button size="sm" onClick={() => window.print()} className="gap-1.5">
          <Printer className="h-4 w-4" />
          Yazdır / PDF
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-muted-foreground">
          Hazır aralık:
        </span>
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setF(p.from);
              setT("");
              apply(p.from, "");
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-95",
              "border-input bg-background text-muted-foreground hover:bg-accent",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
