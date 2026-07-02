"use client";

import { useState } from "react";
import { Flame, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchKazanimAnalysis } from "@/lib/actions/exams";
import type { KazanimAnalysis } from "@/lib/exam-shared";
import { LGS_SUBJECTS } from "@/lib/kazanim";

const MIN_THINKING_MS = 2800;

type SortKey = "wrongRate" | "incorrect" | "accuracy" | "correct" | "asked";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "wrongRate", label: "Yanlış oranı (en yüksek)" },
  { value: "incorrect", label: "Yanlış sayısı (en çok)" },
  { value: "accuracy", label: "Başarı oranı (en yüksek)" },
  { value: "correct", label: "Doğru sayısı (en çok)" },
  { value: "asked", label: "Soru sayısı (en çok)" },
];

/** Yapay zeka düşünüyormuş hissi veren, yazısız bekleme animasyonu. */
function ThinkingAnimation() {
  return (
    <div className="flex h-64 items-center justify-center" role="status" aria-label="Analiz hazırlanıyor">
      <div className="relative flex h-40 w-40 items-center justify-center">
        {/* Genişleyen halkalar */}
        <span className="animate-ring-expand absolute inset-0 rounded-full border-2 border-primary/40" />
        <span
          className="animate-ring-expand absolute inset-0 rounded-full border-2 border-primary/30"
          style={{ animationDelay: "-0.7s" }}
        />
        <span
          className="animate-ring-expand absolute inset-0 rounded-full border-2 border-primary/20"
          style={{ animationDelay: "-1.4s" }}
        />
        {/* Yörüngedeki parçacıklar */}
        <span className="animate-orbit absolute inset-2">
          <span className="gradient-surface absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full shadow-md shadow-primary/40" />
        </span>
        <span className="animate-orbit absolute inset-6" style={{ animationDuration: "2.2s", animationDirection: "reverse" }}>
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-brand-to shadow" />
        </span>
        <span className="animate-orbit absolute inset-10" style={{ animationDuration: "4s" }}>
          <span className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-brand-via" />
        </span>
        {/* Merkez küre */}
        <span className="animate-pulse-core gradient-surface relative flex h-16 w-16 items-center justify-center rounded-full shadow-xl shadow-primary/40">
          <Sparkles className="h-6 w-6 text-white" />
        </span>
      </div>
    </div>
  );
}

export function KazanimAnalysisPanel({ studentId }: { studentId: string }) {
  const [status, setStatus] = useState<"idle" | "thinking" | "ready">("idle");
  const [data, setData] = useState<KazanimAnalysis | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("wrongRate");

  async function generate() {
    setStatus("thinking");
    const startedAt = Date.now();
    try {
      const result = await fetchKazanimAnalysis(studentId);
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_THINKING_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_THINKING_MS - elapsed));
      }
      setData(result);
      setStatus("ready");
    } catch {
      toast.error("Analiz oluşturulamadı, tekrar dene.");
      setStatus(data ? "ready" : "idle");
    }
  }

  if (status === "idle") {
    return (
      <div className="animate-scale-in flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-muted/30 p-10 text-center">
        <div className="gradient-surface animate-float flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/25">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Kazanım analizi hazır değil</p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Girilen kazanım verilerinden doğru/yanlış dökümü ve çalışma önceliği
            listesi oluşturulur.
          </p>
        </div>
        <Button onClick={generate}>
          <Sparkles className="h-4 w-4" />
          Kazanım Analizini Oluştur
        </Button>
      </div>
    );
  }

  if (status === "thinking") {
    return (
      <div className="rounded-2xl border bg-card/70">
        <ThinkingAnimation />
      </div>
    );
  }

  const analysis = data!;
  const filteredStats = analysis.stats
    .filter((s) => subjectFilter === "all" || s.subject === subjectFilter)
    .sort((a, b) => {
      switch (sortKey) {
        case "wrongRate":
          return b.wrongRate - a.wrongRate || b.incorrect - a.incorrect;
        case "incorrect":
          return b.incorrect - a.incorrect;
        case "accuracy":
          return b.accuracy - a.accuracy;
        case "correct":
          return b.correct - a.correct;
        case "asked":
          return b.asked - a.asked;
      }
    });

  const topPriorities = analysis.priorities.slice(0, 10);

  return (
    <div className="animate-fade-up flex flex-col gap-5">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={generate}>
          <RefreshCw className="h-4 w-4" />
          Analizi Yenile
        </Button>
      </div>

      {/* Çalışma önceliği */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
              <Flame className="h-4 w-4" />
            </span>
            Çalışma Önceliği
            <span className="text-xs font-normal text-muted-foreground">
              (son 10 deneme + soru sıklığına göre)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPriorities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Önceliklendirme için yeterli kazanım verisi yok. Deneme girerken
              kazanım işaretlersen bu liste dolar.
            </p>
          ) : (
            <ol className="stagger flex flex-col gap-2">
              {topPriorities.map((p, index) => (
                <li
                  key={`${p.subject}-${p.code}`}
                  className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5"
                >
                  <span
                    className={
                      index < 3
                        ? "gradient-surface flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md shadow-primary/25"
                        : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground"
                    }
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.subject}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    <p>
                      {p.asked} soru · {p.incorrect} yanlış
                    </p>
                    <p>%{p.wrongRate} yanlış oranı</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Kazanım tablosu + filtreler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kazanım Dökümü (tüm denemeler)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Ders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm dersler</SelectItem>
                {LGS_SUBJECTS.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Sıralama" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredStats.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Bu filtreyle eşleşen kazanım verisi yok.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ders</TableHead>
                    <TableHead>Kazanım</TableHead>
                    <TableHead className="text-center">Doğru</TableHead>
                    <TableHead className="text-center">Yanlış</TableHead>
                    <TableHead className="text-center">Boş</TableHead>
                    <TableHead className="text-center">Soru</TableHead>
                    <TableHead className="text-center">Yanlış %</TableHead>
                    <TableHead className="text-center">Başarı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStats.map((s) => (
                    <TableRow key={`${s.subject}-${s.code}`}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {s.subject}
                      </TableCell>
                      <TableCell className="min-w-48 font-medium">{s.name}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.correct}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.incorrect}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.blank}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.asked}</TableCell>
                      <TableCell className="text-center tabular-nums">%{s.wrongRate}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={s.accuracy < 50 ? "destructive" : "secondary"}>
                          %{s.accuracy}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
