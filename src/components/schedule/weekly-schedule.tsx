import { Button } from "@/components/ui/button";
import { StudentScheduleEntryActions } from "@/components/schedule/student-schedule-entry-actions";
import { deleteScheduleEntry } from "@/lib/actions/schedule";
import type { Kazanim } from "@/lib/kazanim";
import { DAY_LABELS } from "@/lib/schedule";
import type { StudyScheduleEntry } from "@/lib/types";

/**
 * Haftalık program ızgarası. Öğrenci, kendi güncel/gelecek hafta kaydını
 * düzenleyebilir, silebilir ve günlük çalışmaya dönüştürerek tamamlayabilir.
 */
export function WeeklySchedule({
  entries,
  redirectPath,
  readOnly = false,
  studentEditable = false,
  subjects = [],
  kazanimlarBySubject = {},
}: {
  entries: StudyScheduleEntry[];
  redirectPath: string;
  readOnly?: boolean;
  studentEditable?: boolean;
  subjects?: string[];
  kazanimlarBySubject?: Record<string, Kazanim[]>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {DAY_LABELS.map((label, dayIndex) => {
        const dayEntries = entries
          .filter((e) => e.day_of_week === dayIndex)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));

        return (
          <div key={label} className="flex flex-col gap-2 rounded-md border p-3">
            <h3 className="font-medium">{label}</h3>
            {dayEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">Boş</p>
            )}
            {dayEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 rounded-md bg-muted p-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)}
                  </p>
                  <p className="text-muted-foreground">{entry.activity_label}</p>
                </div>
                {studentEditable ? (
                  <StudentScheduleEntryActions
                    entry={entry}
                    redirectPath={redirectPath}
                    subjects={subjects}
                    kazanimlarBySubject={kazanimlarBySubject}
                    entries={dayEntries}
                  />
                ) : (
                  !readOnly && (
                    <form action={deleteScheduleEntry}>
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="redirect_path" value={redirectPath} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                      >
                        Sil
                      </Button>
                    </form>
                  )
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
