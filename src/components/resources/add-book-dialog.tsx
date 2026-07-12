"use client";

import { useState } from "react";
import { BookPlus, CheckCircle2, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createBook } from "@/lib/actions/resources";
import { BOOK_GRADES, getBookSubjects } from "@/lib/book-catalog";
import { KazanimTestGrid } from "@/components/resources/kazanim-test-grid";
import { StarRatingInput } from "@/components/resources/star-rating-input";

/**
 * Kütüphaneye kitap ekleme: ad + sınıf + ders seçilir, seçilen sınıf/dersin
 * kazanımları otomatik listelenir ve her ünitenin test sayısı girilir.
 * Öğretmen eklerse anında yayınlanır; veli eklerse öğretmen onayı bekler.
 */
export function AddBookDialog({ role }: { role: "teacher" | "parent" }) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState(0);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<"approved" | "pending" | null>(null);

  const isParent = role === "parent";
  const subjects = grade ? getBookSubjects(Number(grade)) : [];
  const ready = Boolean(grade && subject);

  function reset() {
    setGrade("");
    setSubject("");
    setDifficulty(0);
    setPending(false);
    setDone(null);
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
            <input type="hidden" name="grade_level" value={grade} />
            <input type="hidden" name="subject" value={subject} />
            {!isParent && (
              <input type="hidden" name="difficulty" value={difficulty || ""} />
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="book-name">Kitap adı</Label>
              <Input
                id="book-name"
                name="name"
                required
                placeholder="Örn: Yeni Nesil Matematik"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Sınıf</Label>
                <Select
                  value={grade}
                  onValueChange={(v) => {
                    setGrade(v);
                    setSubject("");
                  }}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Sınıf seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOK_GRADES.map((g) => (
                      <SelectItem key={g} value={String(g)}>
                        {g}. sınıf
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Ders</Label>
                <Select value={subject} onValueChange={setSubject} disabled={!grade}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder={grade ? "Ders seç" : "Önce sınıf"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isParent && (
              <div className="flex flex-col gap-2">
                <Label>Zorluk derecesi (opsiyonel)</Label>
                <StarRatingInput value={difficulty} onChange={setDifficulty} />
                <p className="text-xs text-muted-foreground">
                  Kazanım önerisinde kullanılır: öğrencinin başarısı yüksek konularda daha
                  zor, düşük konularda daha kolay kitap önerilir. Sonradan da atayabilirsin.
                </p>
              </div>
            )}

            {ready ? (
              <KazanimTestGrid key={`${grade}-${subject}`} grade={Number(grade)} subject={subject} />
            ) : (
              <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
                Üniteleri görmek için önce sınıf ve ders seç.
              </p>
            )}

            {isParent && (
              <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                Eklediğin kitap öğretmen onayından sonra kütüphaneye girer; onaylanınca
                çocuğunun kitaplığına ekleyebilirsin.
              </p>
            )}

            <Button type="submit" disabled={pending || !ready}>
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
