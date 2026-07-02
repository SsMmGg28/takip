import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAccessibleStudents, withGrades } from "@/lib/students";
import { examsEnabledForGrade } from "@/lib/kazanim";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StudentPickerGrid } from "@/components/student-picker-grid";

export default async function ParentExamsPage() {
  const profile = await requireRole(["parent"]);
  const students = await getAccessibleStudents(profile);
  const eligible = (await withGrades(students)).filter((s) =>
    examsEnabledForGrade(s.grade_level),
  );

  if (eligible.length === 1) redirect(`/parent/exams/${eligible[0].id}`);

  return (
    <>
      <PageHeader
        title="Deneme Analizi"
        description="Analiz görmek veya deneme eklemek için öğrenci seç."
      />
      {eligible.length ? (
        <StudentPickerGrid
          students={eligible}
          hrefPrefix="/parent/exams"
          ctaLabel="Denemeleri görüntüle"
        />
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="Deneme takibi aktif değil"
          description="Deneme takibi yalnızca 7. ve 8. sınıf öğrencileri için aktiftir."
        />
      )}
    </>
  );
}
