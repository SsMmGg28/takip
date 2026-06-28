import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/lib/types";

export default async function TeacherHomeworkOverviewPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Ödev Takibi</h1>
      <p className="text-sm text-muted-foreground">
        Ödevleri görmek veya yeni ödev eklemek için bir öğrenci seç.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(students as Profile[] | null)?.map((s) => (
          <Link key={s.id} href={`/teacher/homework/${s.id}`}>
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle className="text-base">{s.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Ödevleri görüntüle
              </CardContent>
            </Card>
          </Link>
        ))}
        {!students?.length && (
          <p className="text-muted-foreground">
            Henüz öğrenci eklenmedi. Önce{" "}
            <Link href="/teacher/students" className="underline">
              Öğrenciler
            </Link>{" "}
            sayfasından öğrenci ekle.
          </p>
        )}
      </div>
    </div>
  );
}
