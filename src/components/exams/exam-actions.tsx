"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteExam, requestExamEdit, reviewExamEditRequest } from "@/lib/actions/exams";
import type { ExamEditRequestStatus } from "@/lib/types";

/** Silme butonu (öğretmen her zaman; veli yalnızca onaylı taleple). */
export function DeleteExamButton({ examId }: { examId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteExam(examId);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error ?? "Silinemedi.");
      return;
    }
    toast.success("Deneme silindi.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Denemeyi sil">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Deneme silinsin mi?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Ders sonuçları ve kazanım verileri dahil tüm kayıt kalıcı olarak silinir.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Vazgeç
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Veli: öğretmene düzenleme talebi gönderme. */
export function RequestEditButton({ examId }: { examId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await requestExamEdit(examId, reason);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error ?? "Talep gönderilemedi.");
      return;
    }
    toast.success("Düzenleme talebi öğretmene iletildi.");
    setOpen(false);
    setReason("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquarePlus className="h-4 w-4" />
          Düzenleme Talebi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Düzenleme talebi gönder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Öğretmen onayladıktan sonra bu denemeyi düzenleyebilir veya
            silebilirsin.
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Neden düzenlemek istiyorsun? (isteğe bağlı)"
            rows={3}
          />
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Talebi Gönder
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Veli tarafında talep durum rozeti. */
export function EditRequestStatusBadge({ status }: { status: ExamEditRequestStatus }) {
  if (status === "pending") return <Badge variant="secondary">Talep beklemede</Badge>;
  if (status === "approved") return <Badge>Düzenleme onaylandı</Badge>;
  if (status === "rejected") return <Badge variant="outline">Talep reddedildi</Badge>;
  return null;
}

/** Öğretmen: bekleyen talebi onayla/reddet. */
export function ReviewRequestButtons({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function review(approve: boolean) {
    setLoading(approve ? "approve" : "reject");
    const result = await reviewExamEditRequest(requestId, approve);
    setLoading(null);
    if (!result.ok) {
      toast.error(result.error ?? "İşlem başarısız.");
      return;
    }
    toast.success(approve ? "Talep onaylandı." : "Talep reddedildi.");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => review(true)} disabled={loading !== null}>
        {loading === "approve" && <Loader2 className="h-4 w-4 animate-spin" />}
        Onayla
      </Button>
      <Button size="sm" variant="outline" onClick={() => review(false)} disabled={loading !== null}>
        {loading === "reject" && <Loader2 className="h-4 w-4 animate-spin" />}
        Reddet
      </Button>
    </div>
  );
}
