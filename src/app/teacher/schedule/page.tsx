import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StudentPickerGrid } from "@/components/student-picker-grid";
import type { Profile } from "@/lib/types";

export default async function TeacherScheduleOverviewPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name");

  return (
    <>
      <PageHeader
        title="Çalışma Programları"
        description="Bir öğrencinin haftalık çalışma programını görmek veya düzenlemek için seç."
      />
      {students?.length ? (
        <StudentPickerGrid
          students={students as Profile[]}
          hrefPrefix="/teacher/schedule"
          ctaLabel="Programı görüntüle"
        />
      ) : (
        <EmptyState icon={Users} title="Henüz öğrenci yok" />
      )}
    </>
  );
}
