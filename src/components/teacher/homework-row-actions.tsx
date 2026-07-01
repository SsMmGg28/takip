"use client";

import { Button } from "@/components/ui/button";
import { updateHomeworkStatus, deleteHomework } from "@/app/teacher/homework/actions";
import type { HomeworkStatus } from "@/lib/types";

export function HomeworkRowActions({
  id,
  studentId,
  status,
}: {
  id: string;
  studentId: string;
  status: HomeworkStatus;
}) {
  return (
    <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
      <form action={updateHomeworkStatus} className="flex-1 sm:flex-none">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="student_id" value={studentId} />
        <input
          type="hidden"
          name="status"
          value={status === "completed" ? "assigned" : "completed"}
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          {status === "completed" ? "Tamamlanmadı" : "Tamamlandı"}
        </Button>
      </form>
      <form action={deleteHomework} className="shrink-0">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="student_id" value={studentId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-destructive"
        >
          Sil
        </Button>
      </form>
    </div>
  );
}
