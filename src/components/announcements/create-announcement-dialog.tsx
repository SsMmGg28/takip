"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAnnouncement } from "@/lib/actions/announcements";

export interface AnnouncementStudentOption {
  id: string;
  fullName: string;
  gradeLevel: number | null;
}

/** Öğretmenin duyuru oluşturma diyaloğu: hedef kitle + rol filtresi + belge. */
export function CreateAnnouncementDialog({
  students,
}: {
  students: AnnouncementStudentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState("all");
  const [scope, setScope] = useState("all");
  const [grade, setGrade] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  function toggleStudent(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(formData: FormData) {
    if (scope === "students" && selected.size === 0) {
      toast.error("En az bir öğrenci seç.");
      return;
    }
    if (scope === "grade" && !grade) {
      toast.error("Sınıf düzeyi seç.");
      return;
    }
    setSending(true);
    try {
      for (const id of selected) formData.append("student_ids", id);
      await createAnnouncement(formData);
      toast.success("Duyuru paylaşıldı ve hedef kitleye bildirildi.");
      setOpen(false);
      setSelected(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Duyuru paylaşılamadı.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Megaphone className="h-4 w-4" />
          Yeni Duyuru
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni Duyuru</DialogTitle>
        </DialogHeader>
        <form action={submit} className="flex flex-col gap-4">
          <input type="hidden" name="audience_role" value={audience} />
          <input type="hidden" name="target_scope" value={scope} />
          <input type="hidden" name="grade_level" value={grade} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="ann-title">Başlık</Label>
            <Input id="ann-title" name="title" required maxLength={150} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ann-body">İçerik</Label>
            <Textarea id="ann-body" name="body" rows={4} required maxLength={4000} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Kime görünsün</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Öğrenci + veli</SelectItem>
                  <SelectItem value="students">Sadece öğrenciler</SelectItem>
                  <SelectItem value="parents">Sadece veliler</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Hedef</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm okul</SelectItem>
                  <SelectItem value="grade">Sınıf düzeyi</SelectItem>
                  <SelectItem value="students">Seçili öğrenciler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {scope === "grade" && (
            <div className="flex flex-col gap-2">
              <Label>Sınıf düzeyi</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Sınıf seç" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 6, 7, 8].map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      {g}. sınıflar
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {scope === "students" && (
            <div className="flex flex-col gap-2">
              <Label>Öğrenciler ({selected.size} seçili)</Label>
              <div className="flex max-h-44 flex-col gap-1 overflow-y-auto rounded-xl border p-2">
                {students.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={selected.has(s.id)}
                      onCheckedChange={() => toggleStudent(s.id)}
                    />
                    <span className="min-w-0 flex-1 truncate">{s.fullName}</span>
                    {s.gradeLevel && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {s.gradeLevel}. sınıf
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="ann-file">Belge (isteğe bağlı)</Label>
            <Input
              id="ann-file"
              name="attachment"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx"
            />
          </div>

          <Button type="submit" disabled={sending}>
            {sending ? "Paylaşılıyor..." : "Paylaş ve Bildir"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
