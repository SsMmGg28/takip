"use client";

import { useMemo, useState } from "react";
import { Check, Paperclip, Send, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createHomework } from "@/app/teacher/homework/actions";

const NO_BOOK = "__none__";

export interface HomeworkStudentOption {
  id: string;
  fullName: string;
  grade?: number | null;
}

export interface HomeworkBookOption {
  id: string;
  name: string;
  subject: string | null;
  grade?: number | null;
  sections: { id: string; name: string; testCount: number }[];
}

/** Prefill (öneriden "ödev olarak ata") için seçili test listesini state'e çevirir. */
function buildTestState(
  tests?: { sectionId: string; testNumber: number }[],
): Record<string, Set<number>> {
  const init: Record<string, Set<number>> = {};
  for (const t of tests ?? []) {
    (init[t.sectionId] ??= new Set<number>()).add(t.testNumber);
  }
  return init;
}

/**
 * Toplu ödev gönderimi: öğretmen öğrencileri seçer, aynı ödev hepsine tek
 * seferde gider; kontrol öğrenci bazında ayrı yapılır.
 */
export function CreateHomeworkDialog({
  students,
  books,
  defaultStudentIds = [],
  defaultBookId,
  defaultTests,
  triggerLabel = "Yeni Ödev Gönder",
}: {
  students: HomeworkStudentOption[];
  books: HomeworkBookOption[];
  defaultStudentIds?: string[];
  /** Öneriden ön-doldurma: seçili kitap. */
  defaultBookId?: string;
  /** Öneriden ön-doldurma: seçili testler. */
  defaultTests?: { sectionId: string; testNumber: number }[];
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    () => new Set(defaultStudentIds),
  );
  const [bookId, setBookId] = useState<string>(defaultBookId ?? NO_BOOK);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [selectedTests, setSelectedTests] = useState<Record<string, Set<number>>>(
    () => buildTestState(defaultTests),
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Seçili öğrencilerin (bilinen) sınıfları — kitap listesini bunlara göre daraltırız.
  const selectedGrades = useMemo(() => {
    const set = new Set<number>();
    for (const s of students) {
      if (selectedStudents.has(s.id) && s.grade != null) set.add(s.grade);
    }
    return set;
  }, [students, selectedStudents]);

  // Sınıfı seçili öğrencilerin sınıfları dışında kalan kitapları gizle
  // (sınıfsız/legacy kitaplar görünür kalır; hiç öğrenci seçilmediyse hepsi görünür).
  const gradeFilteredBooks = useMemo(() => {
    if (selectedGrades.size === 0) return books;
    return books.filter((b) => b.grade == null || selectedGrades.has(b.grade));
  }, [books, selectedGrades]);

  const subjectOptions = useMemo(
    () =>
      Array.from(
        new Set(gradeFilteredBooks.map((b) => b.subject).filter((s): s is string => Boolean(s))),
      ).sort((a, b) => a.localeCompare(b, "tr")),
    [gradeFilteredBooks],
  );

  const visibleBooks = useMemo(
    () =>
      gradeFilteredBooks.filter(
        (b) => subjectFilter === "all" || b.subject === subjectFilter,
      ),
    [gradeFilteredBooks, subjectFilter],
  );

  // Aktif kitap yalnızca görünür listeden türetilir: seçili kitap filtre dışında
  // kalırsa (öğrenci/ders değişince) otomatik "seçili değil" sayılır — böylece
  // efekt içinde setState yapmadan tutarlı kalırız.
  const activeBook = useMemo(
    () => visibleBooks.find((b) => b.id === bookId) ?? null,
    [visibleBooks, bookId],
  );

  const testCount = Object.values(selectedTests).reduce((acc, s) => acc + s.size, 0);
  const allSelected = selectedStudents.size === students.length && students.length > 0;

  function toggleStudent(id: string) {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTest(sectionId: string, n: number) {
    setSelectedTests((prev) => {
      const next = { ...prev };
      const set = new Set(next[sectionId] ?? []);
      if (set.has(n)) set.delete(n);
      else set.add(n);
      next[sectionId] = set;
      return next;
    });
  }

  function reset() {
    setSelectedStudents(new Set(defaultStudentIds));
    setBookId(defaultBookId ?? NO_BOOK);
    setSubjectFilter("all");
    setSelectedTests(buildTestState(defaultTests));
    setFileName(null);
    setPending(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Send className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Ödev Gönder</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            if (selectedStudents.size === 0) {
              toast.error("En az bir öğrenci seç.");
              return;
            }
            for (const id of selectedStudents) formData.append("student_ids", id);
            // Kitap ve testleri yalnızca seçili kitap hâlâ görünürse gönder.
            if (activeBook) {
              formData.set("book_id", activeBook.id);
              for (const [sid, nums] of Object.entries(selectedTests)) {
                for (const n of nums) formData.append("tests", `${sid}:${n}`);
              }
            } else {
              formData.delete("book_id");
            }

            setPending(true);
            try {
              await createHomework(formData);
              toast.success(
                selectedStudents.size === 1
                  ? "Ödev gönderildi, öğrenci ve velisine bildirim düştü."
                  : `Ödev ${selectedStudents.size} öğrenciye gönderildi, bildirimler düştü.`,
              );
              setOpen(false);
              reset();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
              setPending(false);
            }
          }}
          className="flex flex-col gap-4"
        >
          {/* Öğrenci seçimi */}
          <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <Label className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Kimlere gidecek?
              </Label>
              <button
                type="button"
                onClick={() =>
                  setSelectedStudents(
                    allSelected ? new Set() : new Set(students.map((s) => s.id)),
                  )
                }
                className="text-xs font-medium text-primary hover:underline"
              >
                {allSelected ? "Hiçbiri" : "Hepsini seç"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {students.map((s) => {
                const on = selectedStudents.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStudent(s.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
                      on
                        ? "gradient-surface border-transparent text-white shadow-md shadow-primary/25"
                        : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    aria-pressed={on}
                  >
                    {on && <Check className="animate-scale-in h-3.5 w-3.5" />}
                    {s.fullName}
                  </button>
                );
              })}
            </div>
            {selectedStudents.size > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedStudents.size} öğrenci seçildi — her biri için ayrı takip ve
                kontrol yapılır.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Başlık</Label>
            <Input id="title" name="title" required placeholder="Örn: Hafta sonu çalışması" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="due_date">Teslim tarihi (opsiyonel)</Label>
              <Input id="due_date" name="due_date" type="date" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Kaynak kitap (opsiyonel)</Label>
              {subjectOptions.length > 1 && (
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Ders filtresi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm dersler</SelectItem>
                    {subjectOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select
                value={activeBook ? bookId : NO_BOOK}
                onValueChange={(v) => {
                  setBookId(v);
                  setSelectedTests({});
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_BOOK}>Kitap yok (serbest ödev)</SelectItem>
                  {visibleBooks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                      {b.subject ? ` — ${b.subject}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGrades.size > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Seçili öğrencilerin sınıfına uygun kitaplar gösteriliyor.
                </p>
              )}
            </div>
          </div>

          {activeBook && (
            <div className="animate-scale-in flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Hangi testler ödev?</p>
                {testCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {testCount} test
                  </span>
                )}
              </div>
              {activeBook.sections.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Bu kitabın henüz bölümü yok. Önce kitap detayından bölüm ekle.
                </p>
              )}
              {activeBook.sections.map((s) => {
                const set = selectedTests[s.id] ?? new Set<number>();
                return (
                  <div key={s.id} className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">{s.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: s.testCount }, (_, i) => i + 1).map((n) => {
                        const on = set.has(n);
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => toggleTest(s.id, n)}
                            className={cn(
                              "inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium transition-all hover:-translate-y-0.5 active:translate-y-0",
                              on
                                ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                                : "border-input bg-background text-muted-foreground hover:bg-accent",
                            )}
                            aria-pressed={on}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Açıklama (opsiyonel)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Eklemek istediğin not, yönergeler vb."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="attachment" className="inline-flex items-center gap-2">
              <Paperclip className="h-4 w-4" /> Dosya eki (opsiyonel)
            </Label>
            <Input
              id="attachment"
              name="attachment"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
            {fileName && (
              <div className="animate-scale-in flex items-center justify-between rounded-md border bg-muted/30 px-2 py-1.5 text-xs">
                <span className="truncate">{fileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFileName(null);
                    const input = document.getElementById("attachment") as HTMLInputElement;
                    if (input) input.value = "";
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Dosyayı kaldır"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Tek kopya yüklenir, seçilen tüm öğrenciler görebilir. Dosyalar 3 ay sonra
              otomatik silinir.
            </p>
          </div>

          <Button type="submit" disabled={pending} className="gap-1.5">
            <Send className="h-4 w-4" />
            {pending
              ? "Gönderiliyor..."
              : selectedStudents.size > 1
                ? `${selectedStudents.size} Öğrenciye Gönder`
                : "Ödevi Gönder"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
