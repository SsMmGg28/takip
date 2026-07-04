"use client";

import { useState } from "react";
import { BookPlus, CheckCircle2, Clock3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createBook } from "@/lib/actions/resources";

interface SectionRow {
  key: number;
  name: string;
  testCount: string;
}

let rowKey = 0;
function newRow(): SectionRow {
  return { key: ++rowKey, name: "", testCount: "10" };
}

/**
 * Kütüphaneye kitap ekleme: ad + ders + bölümler tek akışta girilir.
 * Öğretmen eklerse anında yayınlanır; veli eklerse öğretmen onayı bekler.
 */
export function AddBookDialog({ role }: { role: "teacher" | "parent" }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<SectionRow[]>([newRow()]);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<"approved" | "pending" | null>(null);

  const isParent = role === "parent";

  function reset() {
    setRows([newRow()]);
    setPending(false);
    setDone(null);
  }

  function updateRow(key: number, patch: Partial<SectionRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
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
          <BookPlus className="h-4 w-4" />
          Kitap Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kütüphaneye Kitap Ekle</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="animate-scale-in flex flex-col items-center gap-3 py-6 text-center">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                done === "pending"
                  ? "bg-warning/15 text-warning"
                  : "bg-success/15 text-success"
              }`}
            >
              {done === "pending" ? (
                <Clock3 className="h-7 w-7" />
              ) : (
                <CheckCircle2 className="h-7 w-7" />
              )}
            </span>
            <div className="space-y-1">
              <p className="font-semibold">
                {done === "pending" ? "Onaya gönderildi" : "Kitap yayında"}
              </p>
              <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                {done === "pending"
                  ? "Öğretmen inceleyip onayladığında kütüphanede görünecek ve sana bildirim gelecek."
                  : "Kitap kütüphaneye eklendi."}
              </p>
            </div>
            <Button onClick={() => setOpen(false)}>Kapat</Button>
          </div>
        ) : (
          <form
            action={async (formData) => {
              setPending(true);
              try {
                const result = await createBook(formData);
                setDone(result.pending ? "pending" : "approved");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
              } finally {
                setPending(false);
              }
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="book-name">Kitap adı</Label>
              <Input
                id="book-name"
                name="name"
                required
                placeholder="Örn: Yeni Nesil Matematik"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="book-subject">Ders (opsiyonel)</Label>
              <Input id="book-subject" name="subject" placeholder="Örn: Matematik" />
            </div>

            <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <Label>Bölümler ve test sayıları</Label>
                <span className="text-[11px] text-muted-foreground">
                  {isParent ? "Onaydan sonra sadece öğretmen düzenler" : ""}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {rows.map((row, i) => (
                  <div key={row.key} className="animate-scale-in flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                      {i + 1}
                    </span>
                    <Input
                      name="section_name"
                      value={row.name}
                      onChange={(e) => updateRow(row.key, { name: e.target.value })}
                      placeholder="Bölüm adı (örn: Kesirler)"
                      className="flex-1 bg-background"
                    />
                    <Input
                      name="section_test_count"
                      type="number"
                      min={1}
                      max={200}
                      value={row.testCount}
                      onChange={(e) => updateRow(row.key, { testCount: e.target.value })}
                      className="w-20 bg-background"
                      aria-label="Test sayısı"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setRows((prev) =>
                          prev.length > 1 ? prev.filter((r) => r.key !== row.key) : prev,
                        )
                      }
                      className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
                      disabled={rows.length <= 1}
                      aria-label="Bölümü kaldır"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 gap-1.5 self-start"
                onClick={() => setRows((prev) => [...prev, newRow()])}
              >
                <Plus className="h-3.5 w-3.5" /> Bölüm ekle
              </Button>
            </div>

            {isParent && (
              <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                Eklediğin kitap öğretmen onayından sonra kütüphaneye girer; onaylanınca
                çocuğunun kitaplığına ekleyebilirsin.
              </p>
            )}

            <Button type="submit" disabled={pending}>
              {pending
                ? "Kaydediliyor..."
                : isParent
                  ? "Onaya Gönder"
                  : "Kitabı Yayınla"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
