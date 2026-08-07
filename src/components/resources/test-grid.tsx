"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleTestProgress } from "@/lib/actions/resources";

export function TestGrid({
  studentId,
  sectionId,
  testCount,
  completed,
  readOnly,
}: {
  studentId: string;
  sectionId: string;
  testCount: number;
  completed: Set<number>;
  readOnly?: boolean;
}) {
  // Optimistic yerel durum: kutucuk anında değişir, aksiyon hata verirse geri
  // alınır. Yalnız tıklanan kutucuk kilitlenir; paylaşılan bir pending bayrağı
  // tüm grid'i bloklayıp art arda işaretlemeyi engelliyordu.
  const [done, setDone] = useState<Set<number>>(() => new Set(completed));
  const [inflight, setInflight] = useState<Set<number>>(new Set());
  const [popped, setPopped] = useState<number | null>(null);

  async function toggle(n: number, wasDone: boolean) {
    setPopped(n);
    setTimeout(() => setPopped(null), 250);
    setDone((prev) => {
      const copy = new Set(prev);
      if (wasDone) copy.delete(n);
      else copy.add(n);
      return copy;
    });
    setInflight((prev) => new Set(prev).add(n));
    const fd = new FormData();
    fd.set("student_id", studentId);
    fd.set("section_id", sectionId);
    fd.set("test_number", String(n));
    fd.set("is_done", wasDone ? "true" : "false");
    try {
      await toggleTestProgress(fd);
    } catch (e) {
      setDone((prev) => {
        const copy = new Set(prev);
        if (wasDone) copy.add(n);
        else copy.delete(n);
        return copy;
      });
      toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setInflight((prev) => {
        const copy = new Set(prev);
        copy.delete(n);
        return copy;
      });
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: testCount }, (_, i) => i + 1).map((n) => {
        const isDone = done.has(n);
        const isPopping = popped === n;
        const isInflight = inflight.has(n);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly || isInflight}
            onClick={() => {
              if (readOnly || isInflight) return;
              toggle(n, isDone);
            }}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0",
              isDone
                ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isPopping && "animate-pop",
              (readOnly || isInflight) && "cursor-default opacity-90",
            )}
            aria-pressed={isDone}
            aria-label={`Test ${n}${isDone ? " (tamamlandı)" : ""}`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
