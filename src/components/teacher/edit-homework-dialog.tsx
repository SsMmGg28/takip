"use client";

import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { updateHomework } from "@/app/teacher/homework/actions";
import type { HomeworkBookOption } from "@/components/teacher/create-homework-dialog";

/**
 * Ödev düzenleme. Toplu gönderilmiş ödevlerde değişiklik istenirse gruptaki
 * herkese uygulanabilir. Her kayıtta öğrenci + veliye bildirim gider.
 */
export function EditHomeworkDialog({
  homeworkId,
  initialTitle,
  initialDescription,
  initialDueDate,
  book,
  initialTests,
  groupSize,
}: {
  homeworkId: string;
  initialTitle: string;
  initialDescription: string | null;
  initialDueDate: string | null;
  /** Ödev kitaba bağlıysa test seçimi için kitap içeriği. */
  book: HomeworkBookOption | null;
  /** "sectionId:testNumber" biçiminde mevcut seçim. */
  initialTests: string[];
  groupSize: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [applyGroup, setApplyGroup] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialTests));

  const testCount = selected.size;
  const sections = useMemo(() => book?.sections ?? [], [book]);

  function toggleTest(sectionId: string, n: number) {
    const key = `${sectionId}:${n}`;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSelected(new Set(initialTests));
          setApplyGroup(false);
          setPending(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" /> Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ödevi Düzenle</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            formData.set("id", homeworkId);
            formData.set("scope", applyGroup ? "group" : "one");
            for (const key of selected) formData.append("tests", key);

            setPending(true);
            try {
              await updateHomework(formData);
              toast.success(
                "Ödev güncellendi; öğrenci ve veliye bildirim gönderildi.",
              );
              setOpen(false);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
            } finally {
              setPending(false);
            }
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-title">Başlık</Label>
            <Input id="edit-title" name="title" defaultValue={initialTitle} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-due">Teslim tarihi</Label>
            <Input
              id="edit-due"
              name="due_date"
              type="date"
              defaultValue={initialDueDate ?? ""}
            />
          </div>

          {book && (
            <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Testler — {book.name}</p>
                {testCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {testCount} test
                  </span>
                )}
              </div>
              {sections.map((s) => (
                <div key={s.id} className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">{s.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: s.testCount }, (_, i) => i + 1).map((n) => {
                      const on = selected.has(`${s.id}:${n}`);
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
              ))}
              <p className="text-[11px] text-muted-foreground">
                Daha önce kontrolde işaretlenen testlerin durumu korunur.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-description">Açıklama</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={initialDescription ?? ""}
            />
          </div>

          {groupSize > 1 && (
            <label className="flex items-start gap-2.5 rounded-xl border bg-muted/30 p-3 text-sm">
              <Checkbox
                checked={applyGroup}
                onCheckedChange={(v) => setApplyGroup(v === true)}
                className="mt-0.5"
              />
              <span>
                Bu toplu gönderimdeki <strong>{groupSize} öğrencinin tamamında</strong>{" "}
                güncelle
                <span className="block text-xs text-muted-foreground">
                  İşaretlemezsen yalnızca bu öğrencinin ödevi değişir.
                </span>
              </span>
            </label>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
