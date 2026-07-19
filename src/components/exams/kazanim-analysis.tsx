"use client";

import { useState } from "react";
import { BarChart3, Flame, LineChart, Loader2, RefreshCw } from "lucide-react";
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
import dynamic from "next/dynamic";

// recharts sayfanın ana bundle'ına girmesin diye grafik ayrı chunk olarak,
// yalnızca istemcide yüklenir.
const KazanimTrendChart = dynamic(
  () => import("@/components/exams/subject-net-chart").then((m) => m.KazanimTrendChart),
  {
    ssr: false,
    loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-muted/50" />,
  },
);
import { KazanimHeatmap } from "@/components/exams/kazanim-heatmap";
import { estimateScoreGain, simulateKazanimGain } from "@/lib/exams/projection";
import type { KazanimAnalysis } from "@/lib/exam-shared";
import { LGS_SUBJECTS } from "@/lib/kazanim";

type SortKey = "wrongRate" | "incorrect" | "accuracy" | "correct" | "asked";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "wrongRate", label: "Yanlış oranı (en yüksek)" },
  { value: "incorrect", label: "Yanlış sayısı (en çok)" },
  { value: "accuracy", label: "Başarı oranı (en yüksek)" },
  { value: "correct", label: "Doğru sayısı (en çok)" },
  { value: "asked", label: "Soru sayısı (en çok)" },
];

/**
 * Kazanım analizi: girilen kazanım verilerinden deterministik olarak hesaplanan
 * döküm tablosu, çalışma önceliği listesi ve doğruluk gelişim grafiği.
 * Veri istek üzerine çekilir ve sonuç beklemeden gösterilir.
 */
export function KazanimAnalysisPanel({
  studentId,
  puanPerNet,
}: {
  studentId: string;
  /** Net başına tahmini puan; verilirse öncelik listesinde "~+X puan" gösterilir. */
  puanPerNet?: number | null;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [data, setData] = useState<KazanimAnalysis | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("wrongRate");

  async function generate() {
    setStatus("loading");
    try {
      const result = await fetchKazanimAnalysis(studentId);
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
        <div className="gradient-surface flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/25">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Kazanım analizi</p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Girilen kazanım verilerinden doğru/yanlış dökümü, gelişim grafiği ve
            çalışma önceliği listesi hesaplanır.
          </p>
        </div>
        <Button onClick={generate}>
          <BarChart3 className="h-4 w-4" />
          Kazanım Analizini Göster
        </Button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div
        className="flex h-40 items-center justify-center gap-2 rounded-2xl border bg-card/70 text-sm text-muted-foreground"
        role="status"
        aria-label="Analiz hazırlanıyor"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Analiz hazırlanıyor...
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
  const trendSubjects =
    subjectFilter === "all"
      ? analysis.trendSubjects
      : analysis.trendSubjects.filter((s) => s === subjectFilter);

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
                    {(() => {
                      const gain =
                        puanPerNet != null
                          ? estimateScoreGain(simulateKazanimGain(p), puanPerNet)
                          : null;
                      return gain != null && gain >= 0.5 ? (
                        <p className="font-medium text-primary">
                          ~+{Math.round(gain)} puan
                        </p>
                      ) : null;
                    })()}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Kazanım doğruluk gelişimi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
              <LineChart className="h-4 w-4" />
            </span>
            Kazanım Başarı Gelişimi
            <span className="text-xs font-normal text-muted-foreground">
              (deneme sırasına göre doğruluk %)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KazanimTrendChart rows={analysis.trend} subjects={trendSubjects} />
        </CardContent>
      </Card>

      {/* Kazanım ısı haritası */}
      {analysis.stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
                <BarChart3 className="h-4 w-4" />
              </span>
              Kazanım Isı Haritası
              <span className="text-xs font-normal text-muted-foreground">
                (renk = ağırlıklı başarı)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KazanimHeatmap stats={analysis.stats} />
          </CardContent>
        </Card>
      )}

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
