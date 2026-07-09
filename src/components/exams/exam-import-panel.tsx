"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExamEntryForm, type ExamFormInitial } from "@/components/exams/exam-entry-form";
import { parseExamDocument } from "@/lib/actions/exam-import";
import type { ExamGrade } from "@/lib/kazanim";

/**
 * Yeni deneme sayfasının sarmalayıcısı: üstte "belge yükleyerek otomatik doldur"
 * alanı, altında mevcut ExamEntryForm. Belge Gemini ile okunup form önden
 * doldurulur; kullanıcı kontrol edip kaydeder (otomatik kayıt yok). AI
 * yapılandırılmadıysa yalnızca form gösterilir.
 */
export function ExamImportPanel({
  studentId,
  grade,
  backHref,
  aiEnabled,
}: {
  studentId: string;
  grade: ExamGrade;
  backHref: string;
  aiEnabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState<ExamFormInitial | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setWarnings([]);
    try {
      const fd = new FormData();
      fd.set("studentId", studentId);
      fd.set("file", file);
      const res = await parseExamDocument(fd);
      if (!res.ok || !res.initial) {
        toast.error(res.error ?? "Belge okunamadı.");
        return;
      }
      setInitial(res.initial);
      setFormKey((k) => k + 1); // formu yeni değerlerle yeniden monte et
      setWarnings(res.warnings ?? []);
      toast.success("Belge okundu. Lütfen aşağıdaki değerleri kontrol edip kaydedin.");
    } finally {
      setLoading(false);
    }
  }

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-5">
      {aiEnabled && (
        <Card className="animate-fade-up border-dashed">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Belge yükleyerek otomatik doldur
            </div>
            <p className="text-xs text-muted-foreground">
              Deneme sonuç belgesini (PDF veya fotoğraf) yükle; puan ve ders bazında
              doğru/yanlış/boş sayıları otomatik doldurulsun. Sonucu kaydetmeden önce
              kontrol edebilirsin. Belge saklanmaz.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
              >
                <FileUp className="h-4 w-4" />
                Dosya seç
              </Button>

              {file && (
                <span className="inline-flex max-w-[240px] items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
                  <span className="truncate">{file.name}</span>
                  <button type="button" onClick={clearFile} aria-label="Kaldır">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              <Button type="button" size="sm" onClick={handleAnalyze} disabled={!file || loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Okunuyor…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analiz et
                  </>
                )}
              </Button>
            </div>

            {warnings.length > 0 && (
              <ul className="flex flex-col gap-1 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
                {warnings.map((w, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-warning" aria-hidden>
                      •
                    </span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <ExamEntryForm
        key={formKey}
        studentId={studentId}
        grade={grade}
        backHref={backHref}
        initial={initial}
      />
    </div>
  );
}
