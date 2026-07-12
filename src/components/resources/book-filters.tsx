"use client";

import { Fragment, useState } from "react";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/resources/star-rating";

export interface FilterableBook {
  id: string;
  grade: number | null;
  subject: string | null;
  difficulty: number | null;
  node: React.ReactNode;
}

/**
 * Kütüphane listesini sınıf, ders ve (opsiyonel) zorluk derecesine göre istemci
 * tarafında filtreler. Kartlar sunucuda hazırlanıp `node` olarak geçilir.
 *
 * - `showDifficulty`: 1-5 yıldız zorluk filtresi satırını gösterir.
 * - `alwaysShow`: tek çeşit olsa bile filtre satırlarını her zaman gösterir
 *   (öğretmen kütüphanesi için; az kitapken de süzgeç görünür kalsın diye).
 * Her satır bağımsız olarak, birden fazla seçenek varsa ya da `alwaysShow` ise görünür.
 */
export function BookFilters({
  books,
  gridClassName = "stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
  emptyLabel = "Bu filtreye uygun kitap yok.",
  showDifficulty = false,
  alwaysShow = false,
}: {
  books: FilterableBook[];
  gridClassName?: string;
  emptyLabel?: string;
  showDifficulty?: boolean;
  alwaysShow?: boolean;
}) {
  const [grade, setGrade] = useState<string>("all");
  const [subject, setSubject] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");

  const grades = Array.from(
    new Set(books.map((b) => b.grade).filter((g): g is number => g != null)),
  ).sort((a, b) => a - b);

  // Ders seçenekleri seçili sınıfa göre daralır.
  const subjectPool = books.filter((b) => grade === "all" || String(b.grade) === grade);
  const subjects = Array.from(
    new Set(subjectPool.map((b) => b.subject).filter((s): s is string => Boolean(s))),
  ).sort((a, b) => a.localeCompare(b, "tr"));

  // Zorluk seçenekleri sınıf+ders daralmasından türetilir.
  const difficultyPool = subjectPool.filter(
    (b) => subject === "all" || b.subject === subject,
  );
  const difficultyValues = Array.from(
    new Set(difficultyPool.map((b) => b.difficulty).filter((d): d is number => d != null)),
  ).sort((a, b) => a - b);
  const hasUnrated = difficultyPool.some((b) => b.difficulty == null);
  const difficultyOptionCount = difficultyValues.length + (hasUnrated ? 1 : 0);

  const showGradeRow = grades.length > 1 || alwaysShow;
  const showSubjectRow = subjects.length > 1 || alwaysShow;
  const showDifficultyRow = showDifficulty && (difficultyOptionCount > 1 || alwaysShow);
  const showBar = showGradeRow || showSubjectRow || showDifficultyRow;

  const filtered = books.filter(
    (b) =>
      (grade === "all" || String(b.grade) === grade) &&
      (subject === "all" || b.subject === subject) &&
      (difficulty === "all" ||
        (difficulty === "none"
          ? b.difficulty == null
          : b.difficulty === Number(difficulty))),
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
      {showBar && (
        <div className="flex flex-col gap-2">
          {showGradeRow && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-muted-foreground">Sınıf:</span>
              <button
                type="button"
                className={chip(grade === "all")}
                onClick={() => {
                  setGrade("all");
                  setSubject("all");
                  setDifficulty("all");
                }}
              >
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
                    setDifficulty("all");
                  }}
                >
                  {g}. sınıf
                </button>
              ))}
            </div>
          )}
          {showSubjectRow && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-muted-foreground">Ders:</span>
              <button
                type="button"
                className={chip(subject === "all")}
                onClick={() => {
                  setSubject("all");
                  setDifficulty("all");
                }}
              >
                Tümü
              </button>
              {subjects.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={chip(subject === s)}
                  onClick={() => {
                    setSubject(s);
                    setDifficulty("all");
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {showDifficultyRow && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-muted-foreground">Zorluk:</span>
              <button
                type="button"
                className={chip(difficulty === "all")}
                onClick={() => setDifficulty("all")}
              >
                Tümü
              </button>
              {difficultyValues.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={chip(difficulty === String(d))}
                  onClick={() => setDifficulty(String(d))}
                  aria-label={`${d} yıldız`}
                >
                  <StarRating value={d} size={12} />
                </button>
              ))}
              {hasUnrated && (
                <button
                  type="button"
                  className={chip(difficulty === "none")}
                  onClick={() => setDifficulty("none")}
                >
                  Derecesiz
                </button>
              )}
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
