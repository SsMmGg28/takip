"use client";

import { Button } from "@/components/ui/button";
import { deleteResourceProgress, updateResourceStatus } from "@/app/teacher/resources/actions";
import type { ResourceProgressStatus } from "@/lib/types";

const NEXT_STATUS: Record<ResourceProgressStatus, ResourceProgressStatus> = {
  not_started: "in_progress",
  in_progress: "completed",
  completed: "not_started",
};

const NEXT_LABEL: Record<ResourceProgressStatus, string> = {
  not_started: "Başladı olarak işaretle",
  in_progress: "Tamamlandı olarak işaretle",
  completed: "Başlanmadı olarak işaretle",
};

export function ResourceRowActions({
  id,
  studentId,
  status,
}: {
  id: string;
  studentId: string;
  status: ResourceProgressStatus;
}) {
  return (
    <div className="flex justify-end gap-2">
      <form action={updateResourceStatus}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="student_id" value={studentId} />
        <input type="hidden" name="status" value={NEXT_STATUS[status]} />
        <Button type="submit" variant="outline" size="sm">
          {NEXT_LABEL[status]}
        </Button>
      </form>
      <form action={deleteResourceProgress}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="student_id" value={studentId} />
        <Button type="submit" variant="ghost" size="sm" className="text-destructive">
          Sil
        </Button>
      </form>
    </div>
  );
}
