"use client";

import { useState } from "react";
import { NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateStudentNotes } from "@/app/teacher/students/actions";

/** Öğretmenin öğrenci hakkında tuttuğu özel not (yalnızca öğretmen görür). */
export function StudentNotesCard({
  studentId,
  initialNotes,
}: {
  studentId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(initialNotes ?? "");
  const [pending, setPending] = useState(false);

  const dirty = notes.trim() !== saved.trim();

  async function save() {
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("student_id", studentId);
      fd.set("notes", notes);
      await updateStudentNotes(fd);
      setSaved(notes);
      toast.success("Not kaydedildi.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Not kaydedilemedi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
            <NotebookPen className="h-4 w-4" />
          </span>
          Öğretmen Notları
          <span className="text-xs font-normal text-muted-foreground">
            (yalnızca sen görürsün)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Örn: Matematikte köklü sayılara ağırlık verilecek; veli toplantısında konuşulanlar..."
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={pending || !dirty}>
            {pending ? "Kaydediliyor..." : "Notu Kaydet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
