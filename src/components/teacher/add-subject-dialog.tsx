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
import { createExamSubject } from "@/app/teacher/exams/actions";

export function AddSubjectDialog({
  examId,
  studentId,
}: {
  examId: string;
  studentId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Ders Ekle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ders Sonucu Ekle</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createExamSubject(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="exam_id" value={examId} />
          <input type="hidden" name="student_id" value={studentId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject_name">Ders</Label>
            <Input id="subject_name" name="subject_name" required placeholder="Örn: Matematik" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="correct_count">Doğru</Label>
              <Input id="correct_count" name="correct_count" type="number" min={0} defaultValue={0} />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="incorrect_count">Yanlış</Label>
              <Input id="incorrect_count" name="incorrect_count" type="number" min={0} defaultValue={0} />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="blank_count">Boş</Label>
              <Input id="blank_count" name="blank_count" type="number" min={0} defaultValue={0} />
            </div>
          </div>
          <Button type="submit">Kaydet</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
