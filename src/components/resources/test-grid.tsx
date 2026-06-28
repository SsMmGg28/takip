"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { toggleTestProgress } from "@/lib/actions/resources";

export function TestGrid({
  studentId,
  sectionId,
  testCount,
  completed,
  redirectPath,
  readOnly,
}: {
  studentId: string;
  sectionId: string;
  testCount: number;
  completed: Set<number>;
  redirectPath: string;
  readOnly?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [popped, setPopped] = useState<number | null>(null);

  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: testCount }, (_, i) => i + 1).map((n) => {
        const done = completed.has(n);
        const isPopping = popped === n;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly || pending}
            onClick={() => {
              if (readOnly) return;
              setPopped(n);
              setTimeout(() => setPopped(null), 250);
              const fd = new FormData();
              fd.set("student_id", studentId);
              fd.set("section_id", sectionId);
              fd.set("test_number", String(n));
              fd.set("is_done", done ? "true" : "false");
              fd.set("redirect_path", redirectPath);
              startTransition(() => {
                toggleTestProgress(fd);
              });
            }}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0",
              done
                ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              isPopping && "animate-pop",
              (readOnly || pending) && "cursor-default opacity-90",
            )}
            aria-pressed={done}
            aria-label={`Test ${n}${done ? " (tamamlandı)" : ""}`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
