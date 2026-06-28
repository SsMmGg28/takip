import { requireRole } from "@/lib/auth";
import { getAccessibleStudents } from "@/lib/students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ParentHomePage() {
  const profile = await requireRole(["parent"]);
  const students = await getAccessibleStudents(profile);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Çocuklarım</h1>
      {students.length === 0 ? (
        <p className="text-muted-foreground">
          Henüz bir öğrenciyle eşleştirilmedin. Öğretmenle iletişime geç.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {students.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle>{s.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Ödev, kaynak, takvim ve deneme analizine üst menüden ulaşabilirsin.
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
