import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttachmentDownloadLink } from "@/components/homework/attachment-download-link";
import type { Homework, HomeworkTest, ResourceBook, ResourceBookSection } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  assigned: "Bekliyor",
  completed: "Tamamlandı",
  overdue: "Gecikti",
};

export function HomeworkCard({
  homework,
  book,
  tests,
  sectionById,
}: {
  homework: Homework;
  book: ResourceBook | null;
  tests: HomeworkTest[];
  sectionById: Map<string, ResourceBookSection>;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{homework.title}</p>
            <Badge variant={homework.status === "completed" ? "default" : "outline"}>
              {STATUS_LABEL[homework.status]}
            </Badge>
          </div>
          {homework.due_date && (
            <p className="text-xs text-muted-foreground">
              Teslim: {new Date(homework.due_date).toLocaleDateString("tr-TR")}
            </p>
          )}
          {book && (
            <p className="text-xs text-muted-foreground">
              📕 {book.name}
              {book.subject ? ` — ${book.subject}` : ""}
            </p>
          )}
        </div>

        {homework.description && (
          <p className="text-sm text-muted-foreground">{homework.description}</p>
        )}

        {tests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tests
              .sort((a, b) => a.test_number - b.test_number)
              .map((t) => {
                const s = sectionById.get(t.section_id);
                return (
                  <Badge key={t.id} variant="secondary">
                    {s ? `${s.name} · Test ${t.test_number}` : `Test ${t.test_number}`}
                  </Badge>
                );
              })}
          </div>
        )}

        {homework.attachment_path && homework.attachment_name && (
          <AttachmentDownloadLink
            path={homework.attachment_path}
            name={homework.attachment_name}
          />
        )}
      </CardContent>
    </Card>
  );
}
