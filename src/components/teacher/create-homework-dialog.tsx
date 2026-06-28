"use client";

import { useMemo, useState } from "react";
import { Paperclip, X } from "lucide-react";
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
import type { BookWithSections } from "@/lib/books";

const NO_BOOK = "__none__";

export function CreateHomeworkDialog({
  studentId,
  books,
}: {
  studentId: string;
  books: BookWithSections[];
}) {
  const [open, setOpen] = useState(false);
  const [bookId, setBookId] = useState<string>(NO_BOOK);
  const [selected, setSelected] = useState<Record<string, Set<number>>>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const activeBook = useMemo(
    () => books.find((b) => b.id === bookId) ?? null,
    [books, bookId],
  );

  function toggleTest(sectionId: string, n: number) {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(next[sectionId] ?? []);
      if (set.has(n)) set.delete(n);
      else set.add(n);
      next[sectionId] = set;
      return next;
    });
  }

  function reset() {
    setBookId(NO_BOOK);
    setSelected({});
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
        <Button>Yeni Ödev Ekle</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni Ödev Ekle</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            // Seçili testleri "section_id:n" formatında ekle
            for (const [sid, nums] of Object.entries(selected)) {
              for (const n of nums) formData.append("tests", `${sid}:${n}`);
            }
            if (bookId !== NO_BOOK) formData.set("book_id", bookId);
            else formData.delete("book_id");
            setPending(true);
            try {
              await createHomework(formData);
              setOpen(false);
            } finally {
              setPending(false);
            }
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="student_id" value={studentId} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Örn: Hafta sonu çalışması"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="due_date">Teslim tarihi (opsiyonel)</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Kaynak kitap (opsiyonel)</Label>
            <Select
              value={bookId}
              onValueChange={(v) => {
                setBookId(v);
                setSelected({});
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_BOOK}>Kitap yok (serbest ödev)</SelectItem>
                {books.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                    {b.subject ? ` — ${b.subject}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeBook && (
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
              <p className="text-sm font-medium">Hangi testler ödev?</p>
              {activeBook.sections.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Bu kitabın henüz bölümü yok. Önce kitap detayından bölüm/test ekle.
                </p>
              )}
              {activeBook.sections.map((s) => {
                const set = selected[s.id] ?? new Set<number>();
                return (
                  <div key={s.id} className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">{s.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: s.test_count }, (_, i) => i + 1).map((n) => {
                        const on = set.has(n);
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => toggleTest(s.id, n)}
                            className={cn(
                              "inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium",
                              on
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background text-muted-foreground hover:bg-accent",
                            )}
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
              <div className="flex items-center justify-between rounded-md border bg-muted/30 px-2 py-1.5 text-xs">
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
              Dosyalar 3 ay sonra otomatik silinir.
            </p>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Ödevi Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
