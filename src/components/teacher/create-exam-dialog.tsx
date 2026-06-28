"use client";

import { useState } from "react";
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
import { createExam } from "@/app/teacher/exams/actions";

export function CreateExamDialog({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Yeni Deneme Ekle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Deneme Ekle</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createExam(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="student_id" value={studentId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="exam_name">Deneme adı</Label>
            <Input id="exam_name" name="exam_name" required placeholder="Örn: Mart Ayı Genel Deneme" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="exam_date">Tarih</Label>
            <Input id="exam_date" name="exam_date" type="date" required />
          </div>
          <Button type="submit">Kaydet</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
