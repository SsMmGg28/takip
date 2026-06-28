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
        <div className="grid gap-4 sm:grid-cols-2">
          {students.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Ödev, kaynak, takvim ve deneme analizi üst menüde.
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
