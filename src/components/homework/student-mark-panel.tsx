"use client";

import { useState, useTransition } from "react";
import { Check, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  setStudentHomeworkDone,
  setStudentTestMark,
} from "@/app/student/homework/actions";

export interface StudentMarkTest {
  sectionId: string;
  testNumber: number;
  label: string;
  marked: boolean;
}

/**
 * Öğrencinin "yaptım" beyanı: kontrol edilmemiş ödevde test chip'lerine
 * dokunarak işaretler; testsiz ödevde tek "Tamamladım" düğmesi vardır.
 * Beyan yalnızca bilgi amaçlıdır — ödevin durumu öğretmen kontrolüyle değişir.
 */
export function StudentMarkPanel({
  homeworkId,
  tests,
  markedDone,
}: {
  homeworkId: string;
  tests: StudentMarkTest[];
  markedDone: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [marks, setMarks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tests.map((t) => [`${t.sectionId}:${t.testNumber}`, t.marked])),
  );
  const [done, setDone] = useState(markedDone);

  function toggleTest(t: StudentMarkTest) {
    const key = `${t.sectionId}:${t.testNumber}`;
    const next = !marks[key];
    setMarks((prev) => ({ ...prev, [key]: next }));
    startTransition(async () => {
      const fd = new FormData();
      fd.set("homework_id", homeworkId);
      fd.set("section_id", t.sectionId);
      fd.set("test_number", String(t.testNumber));
      fd.set("marked", String(next));
      try {
        await setStudentTestMark(fd);
      } catch (e) {
        setMarks((prev) => ({ ...prev, [key]: !next }));
        toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
      }
    });
  }

  function toggleDone() {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("homework_id", homeworkId);
      fd.set("done", String(next));
      try {
        await setStudentHomeworkDone(fd);
        toast.success(next ? "Tamamladın olarak işaretlendi." : "İşaret kaldırıldı.");
      } catch (e) {
        setDone(!next);
        toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
      }
    });
  }

  if (tests.length === 0) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={toggleDone}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5 active:translate-y-0",
            done
              ? "border-success/40 bg-success/10 text-success"
              : "border-input bg-background text-muted-foreground hover:bg-accent",
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {done ? "Tamamladım (işaretli)" : "Tamamladım olarak işaretle"}
        </button>
        <span className="text-[11px] text-muted-foreground">
          Öğretmen kontrolüyle kesinleşir.
        </span>
      </div>
    );
  }

  const markedCount = Object.values(marks).filter(Boolean).length;

  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {tests.map((t) => {
          const key = `${t.sectionId}:${t.testNumber}`;
          const on = marks[key];
          return (
            <button
              key={key}
              type="button"
              disabled={pending}
              onClick={() => toggleTest(t)}
              aria-pressed={on}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all hover:-translate-y-0.5 active:translate-y-0",
                on
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-input bg-muted/40 text-muted-foreground hover:bg-accent",
              )}
            >
              {on && <Check className="h-3 w-3" />}
              {t.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {markedCount}/{tests.length} testi yaptım olarak işaretledin — öğretmen
        kontrolüyle kesinleşir.
      </p>
    </div>
  );
}
