"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setBugReportStatus } from "@/lib/actions/bug-reports";

/** Rapor durumunu çözüldü/açık arasında değiştiren düğme. */
export function BugReportStatusButton({
  reportId,
  status,
}: {
  reportId: string;
  status: "open" | "resolved";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const next = status === "open" ? "resolved" : "open";

  async function toggle() {
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("id", reportId);
      fd.set("status", next);
      const result = await setBugReportStatus(fd);
      if (!result.ok) {
        toast.error(result.error ?? "Güncellenemedi.");
        return;
      }
      toast.success(next === "resolved" ? "Çözüldü olarak işaretlendi." : "Yeniden açıldı.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant={status === "open" ? "default" : "outline"}
      size="sm"
      disabled={pending}
      onClick={toggle}
      className="gap-1.5"
    >
      {status === "open" ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Çözüldü
        </>
      ) : (
        <>
          <RotateCcw className="h-3.5 w-3.5" />
          Yeniden Aç
        </>
      )}
    </Button>
  );
}
