import { requireRole } from "@/lib/auth";
import { getAccessibleStudents } from "@/lib/students";
import { getExamAnalysis } from "@/lib/exam-analysis";
import { SubjectNetChart } from "@/components/exams/subject-net-chart";
import { WeakTopicsTable } from "@/components/exams/weak-topics-table";

export default async function ParentExamsPage() {
  const profile = await requireRole(["parent"]);
  const students = await getAccessibleStudents(profile);

  return (
    <div className="flex flex-col gap-8 sm:gap-12">
      <h1 className="text-lg font-semibold sm:text-xl">Deneme Analizi</h1>
      {students.length === 0 && (
        <p className="text-muted-foreground">Eşleştirilmiş öğrenci bulunamadı.</p>
      )}
      {await Promise.all(
        students.map(async (student) => {
          const { chartRows, subjects, weakTopics } = await getExamAnalysis(student.id);
          return (
            <section key={student.id} className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold">{student.full_name}</h2>
              <div className="flex flex-col gap-2">
                <h3 className="font-medium text-muted-foreground">Ders Bazlı Net Gelişimi</h3>
                <SubjectNetChart rows={chartRows} subjects={subjects} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-medium text-muted-foreground">En Zayıf Konular</h3>
                <WeakTopicsTable topics={weakTopics} />
              </div>
            </section>
          );
        }),
      )}
    </div>
  );
}
