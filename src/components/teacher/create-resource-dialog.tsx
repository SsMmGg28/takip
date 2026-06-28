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
import { createResourceProgress } from "@/app/teacher/resources/actions";

export function CreateResourceDialog({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Yeni Kaynak Ekle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Kaynak Ekle</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createResourceProgress(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="student_id" value={studentId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject">Ders</Label>
            <Input id="subject" name="subject" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="book_title">Kaynak/Kitap adı</Label>
            <Input id="book_title" name="book_title" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="progress_note">İlerleme notu (opsiyonel)</Label>
            <Textarea id="progress_note" name="progress_note" placeholder="Örn: 45. sayfada" />
          </div>
          <Button type="submit">Kaydet</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
