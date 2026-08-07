"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardCheck, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { checkHomework } from "@/app/teacher/homework/actions";

export interface CheckTestItem {
  sectionId: string;
  sectionName: string;
  testNumber: number;
  completed: boolean;
  /** Öğrencinin "yaptım" beyanı; ilk kontrolde ön-dolgu olarak kullanılır. */
  studentMarked: boolean;
}

/**
 * Ödev kontrolü: öğrencinin yaptığı testleri işaretle. İlk kontrolde
 * öğrencinin kendi işaretlediği testler ön-dolu gelir. Yapılanlar genel kitap
 * ilerlemesine de işlenir; eksik varsa ödev "Eksik" olur ve veliye bildirim
 * gider.
 */
export function CheckHomeworkDialog({
  homeworkId,
  homeworkTitle,
  studentName,
  tests,
  checkedBefore,
  studentSaysDone,
  initialFeedback,
}: {
  homeworkId: string;
  homeworkTitle: string;
  studentName: string;
  tests: CheckTestItem[];
  checkedBefore: boolean;
  /** Testsiz ödevde öğrencinin "tamamladım" beyanı. */
  studentSaysDone?: boolean;
  initialFeedback?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(initialFeedback ?? "");
  const [done, setDone] = useState<Set<string>>(
    () =>
      new Set(
        tests
          // İlk kontrolde öğrenci beyanı ön-dolgu; sonraki kontrollerde
          // öğretmenin kesinleştirdiği durum esas alınır.
          .filter((t) => (checkedBefore ? t.completed : t.completed || t.studentMarked))
          .map((t) => `${t.sectionId}:${t.testNumber}`),
      ),
  );

  const sections = useMemo(() => {
    const map = new Map<string, { name: string; items: CheckTestItem[] }>();
    for (const t of tests) {
      if (!map.has(t.sectionId)) map.set(t.sectionId, { name: t.sectionName, items: [] });
      map.get(t.sectionId)!.items.push(t);
    }
    for (const s of map.values()) s.items.sort((a, b) => a.testNumber - b.testNumber);
    return Array.from(map.entries());
  }, [tests]);

  const hasTests = tests.length > 0;
  const allDone = hasTests && done.size === tests.length;

  function toggle(key: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function submit(manualResult?: "completed" | "incomplete") {
    if (!window.confirm("Ödev kontrolünü kesinleştirmek istiyor musunuz?")) return;
    const fd = new FormData();
    fd.set("id", homeworkId);
    if (manualResult) fd.set("result", manualResult);
    fd.set("feedback", feedback);
    for (const key of done) fd.append("done", key);

    setPending(true);
    try {
      await checkHomework(fd);
      const complete = manualResult ? manualResult === "completed" : allDone;
      toast.success(
        complete
          ? "Ödev tamamlandı olarak kaydedildi."
          : "Ödev eksik olarak kaydedildi, veliye bildirim gitti.",
      );
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={checkedBefore ? "outline" : "default"}
          className="gap-1.5"
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          {checkedBefore ? "Kontrolü Güncelle" : "Kontrol Et"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ödev Kontrolü</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{studentName}</span> —{" "}
            {homeworkTitle}
          </p>
          {hasTests && (
            <p className="text-xs">
              Öğrencinin <span className="font-medium">yaptığı</span> testlere dokun;
              yapılanlar kitap ilerlemesine de işlenir.
            </p>
          )}
        </div>

        {hasTests ? (
          <div className="flex flex-col gap-4">
            {sections.map(([sectionId, s]) => {
              const sectionKeys = s.items.map((t) => `${t.sectionId}:${t.testNumber}`);
              const sectionAllDone = sectionKeys.every((k) => done.has(k));
              return (
                <div key={sectionId} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{s.name}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setDone((prev) => {
                          const next = new Set(prev);
                          for (const k of sectionKeys) {
                            if (sectionAllDone) next.delete(k);
                            else next.add(k);
                          }
                          return next;
                        })
                      }
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      {sectionAllDone ? "Temizle" : "Hepsi yapıldı"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.items.map((t) => {
                      const key = `${t.sectionId}:${t.testNumber}`;
                      const on = done.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggle(key)}
                          className={cn(
                            "relative inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-all hover:-translate-y-0.5 active:translate-y-0",
                            on
                              ? "border-success bg-success text-white shadow-sm shadow-success/30"
                              : "border-input bg-background text-muted-foreground hover:bg-accent",
                          )}
                          aria-pressed={on}
                          aria-label={`Test ${t.testNumber}${on ? " (yapıldı)" : ""}${t.studentMarked ? " — öğrenci işaretledi" : ""}`}
                          title={
                            t.studentMarked
                              ? "Öğrenci yaptım olarak işaretledi"
                              : undefined
                          }
                        >
                          {on ? <Check className="h-4 w-4" /> : t.testNumber}
                          {t.studentMarked && (
                            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors",
                allDone
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-warning/40 bg-warning/10 text-warning",
              )}
            >
              <span className="font-medium">
                {done.size} / {tests.length} test yapıldı
              </span>
              <span className="text-xs">
                {allDone
                  ? "Tamamlandı olarak kaydedilecek"
                  : "Eksik kaydedilir, veliye bildirim gider"}
              </span>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="check-feedback"
                className="text-xs font-medium text-muted-foreground"
              >
                Geri bildirim notu (isteğe bağlı — öğrenci ve veli görür)
              </label>
              <textarea
                id="check-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Örn: Yanlışlarını defterine çıkar, çarpanlara ayırmayı tekrar et."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <Button disabled={pending} onClick={() => submit()} className="gap-1.5">
              <ClipboardCheck className="h-4 w-4" />
              {pending ? "Kaydediliyor..." : "Kontrolü Kaydet"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Bu ödevde test listesi yok; sonucu doğrudan işaretle.
            </p>
            {studentSaysDone && (
              <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
                Öğrenci bu ödevi &quot;tamamladım&quot; olarak işaretledi.
              </p>
            )}
            <div className="space-y-1.5">
              <label
                htmlFor="check-feedback-manual"
                className="text-xs font-medium text-muted-foreground"
              >
                Geri bildirim notu (isteğe bağlı — öğrenci ve veli görür)
              </label>
              <textarea
                id="check-feedback-manual"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Örn: Kompozisyonun girişini yeniden yaz."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => submit("incomplete")}
                className="gap-1.5 border-warning/50 text-warning hover:bg-warning/10 hover:text-warning"
              >
                <ThumbsDown className="h-4 w-4" /> Eksik / Yapılmadı
              </Button>
              <Button
                disabled={pending}
                onClick={() => submit("completed")}
                className="gap-1.5"
              >
                <ThumbsUp className="h-4 w-4" /> Tamamlandı
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
