"use client";

import { useState } from "react";
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
import { createBook } from "@/lib/actions/resources";

export function AddBookDialog({ role }: { role: "teacher" | "parent" | "student" }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isStudent = role === "student";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
          setSubmitted(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>{isStudent ? "Kitap İste" : "Yeni Kitap Ekle"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isStudent ? "Yeni Kitap İste" : "Kataloga Kitap Ekle"}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              {isStudent
                ? "İsteğin öğretmene gönderildi. Onaylanınca kitap katalogda görünecek."
                : "Kitap eklendi."}
            </p>
            <Button onClick={() => setOpen(false)}>Kapat</Button>
          </div>
        ) : (
          <form
            action={async (formData) => {
              try {
                await createBook(formData);
                setSubmitted(true);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Bir hata oluştu.");
              }
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Kitap adı</Label>
              <Input id="name" name="name" required placeholder="Örn: Yeni Nesil Matematik" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="subject">Ders (opsiyonel)</Label>
              <Input id="subject" name="subject" placeholder="Örn: Matematik" />
            </div>
            {isStudent && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="note">Öğretmene not (opsiyonel)</Label>
                <Textarea
                  id="note"
                  name="note"
                  placeholder="Bu kitabı neden eklemek istediğini kısa anlat."
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit">
              {isStudent ? "İstek Gönder" : "Ekle"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
