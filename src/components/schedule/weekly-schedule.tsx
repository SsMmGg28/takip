import { Button } from "@/components/ui/button";
import { deleteScheduleEntry } from "@/lib/actions/schedule";
import { DAY_LABELS } from "@/lib/schedule";
import type { StudySchedureEntry } from "@/lib/types";

export function WeeklySchedule({
  entries,
  redirectPath,
}: {
  entries: StudySchedureEntry[];
  redirectPath: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {DAY_LABELS.map((label, dayIndex) => {
        const dayEntries = entries
          .filter((e) => e.day_of_week === dayIndex)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));

        return (
          <div key={label} className="flex flex-col gap-2 rounded-md border p-3">
            <h3 className="text-sm font-medium sm:text-base">{label}</h3>
            {dayEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">Boş</p>
            )}
            {dayEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded-md bg-muted p-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)}
                  </p>
                  <p className="truncate text-muted-foreground">
                    {entry.activity_label}
                  </p>
                </div>
                <form action={deleteScheduleEntry} className="shrink-0">
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
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
