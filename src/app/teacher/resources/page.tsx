import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StudentPickerGrid } from "@/components/student-picker-grid";
import type { Profile } from "@/lib/types";

export default async function TeacherResourcesOverviewPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name");

  return (
    <>
      <PageHeader
        title="Kaynak Kitap Takibi"
        description="Kaynakları görmek veya yeni kaynak eklemek için bir öğrenci seç."
      />
      {students?.length ? (
        <StudentPickerGrid
          students={students as Profile[]}
          hrefPrefix="/teacher/resources"
          ctaLabel="Kaynakları görüntüle"
        />
      ) : (
        <EmptyState icon={Users} title="Henüz öğrenci yok" />
      )}
    </>
  );
}
