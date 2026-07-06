"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  createFullExam,
  updateFullExam,
  type ExamPayload,
  type ExamSubjectInput,
} from "@/lib/actions/exams";
import { LGS_SUBJECTS, getKazanimlar, type ExamGrade } from "@/lib/kazanim";
import { calculateNet } from "@/lib/exam-shared";

interface KazanimCounts {
  correct: string;
  incorrect: string;
  blank: string;
}

interface SubjectFormState {
  correct: string;
  incorrect: string;
  blank: string;
  open: boolean;
  kazanim: Record<string, KazanimCounts>;
}

export interface ExamFormInitial {
  examName: string;
  examDate: string;
  score: number | null;
  subjects: {
    name: string;
    correct: number;
    incorrect: number;
    blank: number;
    kazanimlar: { code: string; correct: number; incorrect: number; blank: number }[];
  }[];
}

/** Sekme başlıklarında kullanılan kısa ders adları. */
const SHORT_NAME: Record<string, string> = {
  "Türkçe": "Türkçe",
  "Matematik": "Mat",
  "Fen Bilimleri": "Fen",
  "T.C. İnkılap Tarihi": "İnkılap",
  "Din Kültürü": "Din",
  "İngilizce": "İng",
};

function emptyCounts(): KazanimCounts {
  return { correct: "", incorrect: "", blank: "" };
}

function buildInitialState(initial?: ExamFormInitial): Record<string, SubjectFormState> {
  const state: Record<string, SubjectFormState> = {};
  for (const def of LGS_SUBJECTS) {
    const existing = initial?.subjects.find((s) => s.name === def.name);
    const kazanim: Record<string, KazanimCounts> = {};
    for (const k of existing?.kazanimlar ?? []) {
      kazanim[k.code] = {
        correct: k.correct ? String(k.correct) : "",
        incorrect: k.incorrect ? String(k.incorrect) : "",
        blank: k.blank ? String(k.blank) : "",
      };
    }
    state[def.name] = {
      correct: existing && existing.correct ? String(existing.correct) : "",
      incorrect: existing && existing.incorrect ? String(existing.incorrect) : "",
      blank: existing && existing.blank ? String(existing.blank) : "",
      open: false,
      kazanim,
    };
  }
  return state;
}

const toInt = (value: string) => (value.trim() === "" ? 0 : Number(value));

/**
 * Deneme giriş formu: dersler sekmelere ayrılmıştır ve hiçbir sayı alanı
 * zorunlu değildir — boş bırakılan alan 0 sayılır, hiç verisi olmayan ders
 * denemeye dahil edilmez. En az bir derste veri olması yeterlidir.
 */
export function ExamEntryForm({
  studentId,
  grade,
  backHref,
  examId,
  initial,
}: {
  studentId: string;
  grade: ExamGrade;
  backHref: string;
  /** Verilirse düzenleme modu. */
  examId?: string;
  initial?: ExamFormInitial;
}) {
  const router = useRouter();
  const [examName, setExamName] = useState(initial?.examName ?? "");
  const [examDate, setExamDate] = useState(initial?.examDate ?? "");
  const [score, setScore] = useState(initial?.score != null ? String(initial.score) : "");
  const [subjects, setSubjects] = useState(() => buildInitialState(initial));
  const [saving, setSaving] = useState(false);

  function patchSubject(name: string, patch: Partial<SubjectFormState>) {
    setSubjects((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }));
  }

  function patchKazanim(subject: string, code: string, patch: Partial<KazanimCounts>) {
    setSubjects((prev) => {
      const current = prev[subject];
      const counts = current.kazanim[code] ?? emptyCounts();
      return {
        ...prev,
        [subject]: {
          ...current,
          kazanim: { ...current.kazanim, [code]: { ...counts, ...patch } },
        },
      };
    });
  }

  const subjectTotal = (s: SubjectFormState) =>
    toInt(s.correct) + toInt(s.incorrect) + toInt(s.blank);
  const filledSubjects = LGS_SUBJECTS.filter((def) => subjectTotal(subjects[def.name]) > 0);
  const totalNet =
    Math.round(
      filledSubjects.reduce(
        (sum, def) =>
          sum +
          calculateNet(toInt(subjects[def.name].correct), toInt(subjects[def.name].incorrect)),
        0,
      ) * 100,
    ) / 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payloadSubjects: ExamSubjectInput[] = LGS_SUBJECTS.map((def) => {
      const s = subjects[def.name];
      const kazanimlar = getKazanimlar(grade, def.name)
        .map((k) => {
          const counts = s.kazanim[k.code];
          if (!counts) return null;
          const correct = toInt(counts.correct);
          const incorrect = toInt(counts.incorrect);
          const blank = toInt(counts.blank);
          // Hiç veri girilmediyse bu kazanımdan soru gelmemiş sayılır.
          if (correct + incorrect + blank === 0) return null;
          return { code: k.code, name: k.name, correct, incorrect, blank };
        })
        .filter((k): k is NonNullable<typeof k> => k !== null);

      return {
        name: def.name,
        correct: toInt(s.correct),
        incorrect: toInt(s.incorrect),
        blank: toInt(s.blank),
        kazanimlar,
      };
    });

    const payload: ExamPayload = {
      studentId,
      examName,
      examDate,
      score: Number(score),
      subjects: payloadSubjects,
    };

    const result = examId
      ? await updateFullExam(examId, payload)
      : await createFullExam(payload);

    setSaving(false);
    if (!result.ok) {
      toast.error(result.error ?? "Kaydedilemedi.");
      return;
    }
    toast.success(examId ? "Deneme güncellendi." : "Deneme kaydedildi.");
    router.push(backHref);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Genel bilgiler + canlı özet */}
      <Card className="animate-fade-up">
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="exam_name">Deneme adı *</Label>
              <Input
                id="exam_name"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Örn: Mart Genel Deneme"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="exam_date">Tarih *</Label>
              <Input
                id="exam_date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="score">Puan *</Label>
              <Input
                id="score"
                type="number"
                min={0}
                max={500}
                step="0.01"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Örn: 412.5"
                required
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-accent px-3 py-1 font-medium text-accent-foreground tabular-nums">
              Toplam Net: {totalNet}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 tabular-nums">
              {filledSubjects.length}/{LGS_SUBJECTS.length} ders girildi
            </span>
            <span>
              Yalnızca sonucu olan dersleri doldurman yeterli; boş bırakılan alan 0
              sayılır.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Ders sekmeleri */}
      <Tabs defaultValue={LGS_SUBJECTS[0].name} className="animate-fade-up">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          {LGS_SUBJECTS.map((def) => {
            const filled = subjectTotal(subjects[def.name]) > 0;
            return (
              <TabsTrigger key={def.name} value={def.name} className="gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    filled ? "bg-primary" : "bg-muted-foreground/40",
                  )}
                />
                {SHORT_NAME[def.name] ?? def.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {LGS_SUBJECTS.map((def) => {
          const s = subjects[def.name];
          const kazanimlar = getKazanimlar(grade, def.name);
          const net = calculateNet(toInt(s.correct), toInt(s.incorrect));
          const total = subjectTotal(s);
          const markedCount = Object.values(s.kazanim).filter(
            (c) => toInt(c.correct) + toInt(c.incorrect) + toInt(c.blank) > 0,
          ).length;

          return (
            <TabsContent key={def.name} value={def.name}>
              <Card>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">
                      {def.name}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({def.questionCount} soru)
                      </span>
                    </h3>
                    <div className="flex items-center gap-2">
                      {total > def.questionCount && (
                        <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive tabular-nums">
                          Toplam {total} — {def.questionCount} soruyu aşıyor
                        </span>
                      )}
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground tabular-nums">
                        Net: {net}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">Doğru</Label>
                      <Input
                        type="number"
                        min={0}
                        max={def.questionCount}
                        value={s.correct}
                        onChange={(e) => patchSubject(def.name, { correct: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">Yanlış</Label>
                      <Input
                        type="number"
                        min={0}
                        max={def.questionCount}
                        value={s.incorrect}
                        onChange={(e) => patchSubject(def.name, { incorrect: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">Boş</Label>
                      <Input
                        type="number"
                        min={0}
                        max={def.questionCount}
                        value={s.blank}
                        onChange={(e) => patchSubject(def.name, { blank: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Kazanım işaretleme (opsiyonel) */}
                  <button
                    type="button"
                    onClick={() => patchSubject(def.name, { open: !s.open })}
                    className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <span>
                      Kazanım işaretle{" "}
                      <span className="font-normal text-muted-foreground">(isteğe bağlı)</span>
                      {markedCount > 0 && (
                        <span className="gradient-surface ml-2 rounded-full px-2 py-0.5 text-xs text-white">
                          {markedCount} kazanım
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-300",
                        s.open && "rotate-180",
                      )}
                    />
                  </button>

                  {s.open && (
                    <div className="animate-fade-up flex flex-col gap-1 rounded-xl border p-2">
                      {kazanimlar.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">
                          {grade}. sınıf için kazanım listesi henüz tanımlanmadı.
                        </p>
                      ) : (
                        <>
                          <p className="px-2 pt-1 text-xs text-muted-foreground">
                            Yalnızca bu denemede soru gelen kazanımlara sayı gir; boş
                            bıraktıkların &quot;soru gelmedi&quot; sayılır.
                          </p>
                          <div className="hidden grid-cols-[1fr_repeat(3,4rem)] gap-2 px-2 pt-2 text-[11px] font-medium text-muted-foreground sm:grid">
                            <span>Kazanım</span>
                            <span className="text-center">D</span>
                            <span className="text-center">Y</span>
                            <span className="text-center">B</span>
                          </div>
                          {kazanimlar.map((k) => {
                            const counts = s.kazanim[k.code] ?? emptyCounts();
                            const hasValue =
                              toInt(counts.correct) +
                                toInt(counts.incorrect) +
                                toInt(counts.blank) >
                              0;
                            return (
                              <div
                                key={k.code}
                                className={cn(
                                  "grid grid-cols-[repeat(3,1fr)] items-center gap-2 rounded-lg px-2 py-1.5 transition-colors sm:grid-cols-[1fr_repeat(3,4rem)]",
                                  hasValue && "bg-accent/50",
                                )}
                              >
                                <span className="col-span-3 text-sm sm:col-span-1">
                                  {k.name}
                                </span>
                                {(["correct", "incorrect", "blank"] as const).map((field) => (
                                  <Input
                                    key={field}
                                    type="number"
                                    min={0}
                                    max={def.questionCount}
                                    value={counts[field]}
                                    onChange={(e) =>
                                      patchKazanim(def.name, k.code, {
                                        [field]: e.target.value,
                                      })
                                    }
                                    placeholder="-"
                                    className="h-8 px-2 text-center text-sm"
                                    aria-label={`${k.name} ${
                                      field === "correct"
                                        ? "doğru"
                                        : field === "incorrect"
                                          ? "yanlış"
                                          : "boş"
                                    }`}
                                  />
                                ))}
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="flex items-center justify-end gap-3 pb-4">
        <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Kaydediliyor..." : examId ? "Değişiklikleri Kaydet" : "Denemeyi Kaydet"}
        </Button>
      </div>
    </form>
  );
}
