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
import { createHomework } from "@/app/teacher/homework/actions";

export function CreateHomeworkDialog({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Yeni Ödev Ekle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Ödev Ekle</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createHomework(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="student_id" value={studentId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Başlık</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Açıklama (opsiyonel)</Label>
            <Textarea id="description" name="description" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="due_date">Teslim tarihi (opsiyonel)</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>
          <Button type="submit">Kaydet</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
