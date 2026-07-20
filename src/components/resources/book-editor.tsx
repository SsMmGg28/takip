"use client";

import { useState } from "react";
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
import { BOOK_GRADES, getBookSubjects } from "@/lib/book-catalog";
import {
  KazanimTestGrid,
  type InitialSection,
} from "@/components/resources/kazanim-test-grid";
import { StarRatingInput } from "@/components/resources/star-rating-input";
import { updateBookWithSections } from "@/lib/actions/resources";

/**
 * Öğretmen: kitabın adını/sınıfını/dersini ve bölümlerini (o dersin kazanımlarından
 * girilen test sayıları) tek formda düzenler. Sınıf/ders değişince ünite listesi
 * yenilenir; "Kaydet" bölümleri senkronlar (mevcut ilerleme korunur).
 */
export function BookEditor({
  bookId,
  initialName,
  initialGrade,
  initialSubject,
  initialDifficulty,
  initialSections,
}: {
  bookId: string;
  initialName: string;
  initialGrade: number | null;
  initialSubject: string;
  initialDifficulty: number | null;
  initialSections: InitialSection[];
}) {
  const [name, setName] = useState(initialName);
  const [grade, setGrade] = useState(initialGrade ? String(initialGrade) : "");
  const [subject, setSubject] = useState(initialSubject);
  const [difficulty, setDifficulty] = useState(initialDifficulty ?? 0);
  const [pending, setPending] = useState(false);

  const subjects = grade ? getBookSubjects(Number(grade)) : [];
  const ready = Boolean(grade && subject);
  // Sınıf+ders başlangıçtakiyle aynıysa mevcut bölümlerle doldur; değiştiyse taze başla.
  const sameAsInitial =
    subject === initialSubject && (grade ? Number(grade) : null) === initialGrade;
  const gridInitial = sameAsInitial ? initialSections : [];

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await updateBookWithSections(formData);
          toast.success("Kaydedildi.");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
        } finally {
          setPending(false);
        }
      }}
      className="flex flex-col gap-4 rounded-2xl border bg-muted/30 p-4"
    >
      <input type="hidden" name="id" value={bookId} />
      <input type="hidden" name="grade_level" value={grade} />
      <input type="hidden" name="subject" value={subject} />
      <input type="hidden" name="difficulty" value={difficulty || ""} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="book-name">Kitap adı</Label>
        <Input
          id="book-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="bg-background"
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

      <div className="flex flex-col gap-2">
        <Label>Zorluk derecesi</Label>
        <StarRatingInput value={difficulty} onChange={setDifficulty} />
        <p className="text-xs text-muted-foreground">
          Kitabın genel zorluğu. Öğrenciye kazanım önerisi yapılırken kullanılır: başarısı
          yüksek konularda daha zor, düşük konularda daha kolay kitap önerilir.
        </p>
      </div>

      {ready ? (
        <KazanimTestGrid
          key={`${grade}-${subject}`}
          grade={Number(grade)}
          subject={subject}
          initial={gridInitial}
        />
      ) : (
        <p className="rounded-lg border border-dashed bg-background px-3 py-4 text-center text-sm text-muted-foreground">
          Bölümleri görmek için sınıf ve ders seç.
        </p>
      )}

      <Button
        type="submit"
        disabled={pending || !name.trim() || !ready}
        className="self-start"
      >
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
