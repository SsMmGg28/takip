import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/lib/types";

export default async function TeacherScheduleOverviewPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Çalışma Programları</h1>
      <p className="text-sm text-muted-foreground">
        Bir öğrencinin haftalık çalışma programını görmek veya düzenlemek için seç.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(students as Profile[] | null)?.map((s) => (
          <Link key={s.id} href={`/teacher/schedule/${s.id}`}>
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle className="text-base">{s.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Programı görüntüle
              </CardContent>
            </Card>
          </Link>
        ))}
        {!students?.length && (
          <p className="text-muted-foreground">Henüz öğrenci eklenmedi.</p>
        )}
      </div>
    </div>
  );
}
