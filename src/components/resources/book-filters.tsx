"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/resources/star-rating";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
 *
 * Masaüstünde (≥sm) filtre satırları her zaman görünür kalır. Mobilde (<sm) dikey yer
 * kaplamaması için satırlar varsayılan gizlidir; bunun yerine bir "Filtrele" butonu açılır
 * panelde (Dialog) aynı chip'leri gösterir — state ortak olduğundan iki chrome birbirinden
 * bağımsız değildir, yalnızca görünürlükleri CSS breakpoint'ine göre değişir.
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
  const [mobileOpen, setMobileOpen] = useState(false);

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
    new Set(
      difficultyPool.map((b) => b.difficulty).filter((d): d is number => d != null),
    ),
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

  const activeCount = [grade, subject, difficulty].filter((v) => v !== "all").length;
  const activeSummary = [
    grade !== "all" ? `${grade}. sınıf` : null,
    subject !== "all" ? subject : null,
    difficulty !== "all"
      ? difficulty === "none"
        ? "Derecesiz"
        : `${difficulty}★`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  function resetAll() {
    setGrade("all");
    setSubject("all");
    setDifficulty("all");
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-95",
      active
        ? "gradient-surface border-transparent text-white shadow-sm shadow-primary/25"
        : "border-input bg-background text-muted-foreground hover:bg-accent",
    );

  const gradeRow = showGradeRow && (
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
  );

  const subjectRow = showSubjectRow && (
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
  );

  const difficultyRow = showDifficultyRow && (
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
  );

  return (
    <div className="space-y-3">
      {showBar && (
        <>
          {/* Masaüstü/tablet: satırlar her zaman görünür (mevcut davranış). */}
          <div className="hidden flex-col gap-2 sm:flex">
            {gradeRow}
            {subjectRow}
            {difficultyRow}
          </div>

          {/* Mobil: dikey yer kaplamasın diye filtreler varsayılan gizli, "Filtrele" panelinde. */}
          <div className="sm:hidden">
            <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-1.5"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                  <span className="shrink-0">Filtrele</span>
                  {activeCount > 0 && (
                    <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {activeCount}
                    </span>
                  )}
                  {activeSummary && (
                    <span className="min-w-0 flex-1 truncate text-left text-xs font-normal text-muted-foreground">
                      {activeSummary}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Kitapları Filtrele</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  {gradeRow}
                  {subjectRow}
                  {difficultyRow}
                </div>
                <div className="flex items-center justify-between gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={resetAll}
                    disabled={activeCount === 0}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-40"
                  >
                    Temizle
                  </button>
                  <Button size="sm" onClick={() => setMobileOpen(false)}>
                    Sonuçları Gör ({filtered.length})
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </>
      )}

      {filtered.length ? (
        <div className={gridClassName}>
          {filtered.map((b) => (
            // min-w-0: grid hücresi varsayılan min-width:auto (içeriğin sıkışmayan
            // genişliği) kullanır; bu, kart içindeki truncate/flex-wrap'ı etkisiz
            // kılıp tüm satırı taşırıyordu ("grid blowout"). min-w-0 bunu düzeltir.
            <div key={b.id} className="h-full min-w-0">
              {b.node}
            </div>
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
