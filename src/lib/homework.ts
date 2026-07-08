import type { Homework, HomeworkStatus } from "@/lib/types";

/**
 * Görüntülenecek ödev durumu: teslim tarihi geçmiş ama hâlâ kontrol edilmemiş
 * ödev "Gecikti" sayılır. DB'deki status alanına yazılmaz, okuma anında
 * türetilir; böylece zamanlanmış bir iş gerekmeden rozetler ve sayaçlar doğru
 * kalır.
 */
export function effectiveHomeworkStatus(
  hw: Pick<Homework, "status" | "due_date">,
): HomeworkStatus {
  if (hw.status === "assigned" && hw.due_date) {
    const due = new Date(hw.due_date + "T23:59:59");
    if (due.getTime() < Date.now()) return "overdue";
  }
  return hw.status;
}
