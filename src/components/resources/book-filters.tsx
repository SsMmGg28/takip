"use client";

import { Fragment, useState } from "react";
import { cn } from "@/lib/utils";

export interface FilterableBook {
  id: string;
  grade: number | null;
  subject: string | null;
  node: React.ReactNode;
}

/**
 * Kütüphane listesini sınıf ve derse göre istemci tarafında filtreler. Kartlar
 * sunucuda hazırlanıp `node` olarak geçilir (footer aksiyonları vb. korunur).
 * Filtrelenecek çeşitlilik yoksa (tek sınıf ve tek ders) filtre çubuğu gizlenir.
 */
export function BookFilters({
  books,
  gridClassName = "stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
  emptyLabel = "Bu filtreye uygun kitap yok.",
}: {
  books: FilterableBook[];
  gridClassName?: string;
  emptyLabel?: string;
}) {
  const [grade, setGrade] = useState<string>("all");
  const [subject, setSubject] = useState<string>("all");

  const grades = Array.from(
    new Set(books.map((b) => b.grade).filter((g): g is number => g != null)),
  ).sort((a, b) => a - b);

  // Ders seçenekleri seçili sınıfa göre daralır.
  const subjectPool = books.filter((b) => grade === "all" || String(b.grade) === grade);
  const subjects = Array.from(
    new Set(subjectPool.map((b) => b.subject).filter((s): s is string => Boolean(s))),
  ).sort((a, b) => a.localeCompare(b, "tr"));

  const showFilters = grades.length > 1 || subjects.length > 1;

  const filtered = books.filter(
    (b) =>
      (grade === "all" || String(b.grade) === grade) &&
      (subject === "all" || b.subject === subject),
  );

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-95",
      active
        ? "gradient-surface border-transparent text-white shadow-sm shadow-primary/25"
        : "border-input bg-background text-muted-foreground hover:bg-accent",
    );

  return (
    <div className="space-y-3">
      {showFilters && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">Sınıf:</span>
            <button type="button" className={chip(grade === "all")} onClick={() => setGrade("all")}>
              Tümü
            </button>
            {grades.map((g) => (
              <button
                key={g}
                type="button"
                className={chip(grade === String(g))}
                onClick={() => {
                  setGrade(String(g));
                  setSubject("all");
                }}
              >
                {g}. sınıf
              </button>
            ))}
          </div>
          {subjects.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-muted-foreground">Ders:</span>
              <button
                type="button"
                className={chip(subject === "all")}
                onClick={() => setSubject("all")}
              >
                Tümü
              </button>
              {subjects.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={chip(subject === s)}
                  onClick={() => setSubject(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length ? (
        <div className={gridClassName}>
          {filtered.map((b) => (
            <Fragment key={b.id}>{b.node}</Fragment>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      )}
    </div>
  );
}
