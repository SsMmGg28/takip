import { GraduationCap } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAccessibleStudents } from "@/lib/students";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default async function ParentHomePage() {
  const profile = await requireRole(["parent"]);
  const students = await getAccessibleStudents(profile);

  return (
    <>
      <PageHeader
        title="Çocuklarım"
        description="Eşleştirildiğin öğrencilerin bilgilerine üst menüden ulaşabilirsin."
      />
      {students.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Henüz bir öğrenciyle eşleştirilmedin. Öğretmenle iletişime geç.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {students.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground sm:h-11 sm:w-11">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Ödev, kaynak, takvim ve deneme analizi menüde.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
