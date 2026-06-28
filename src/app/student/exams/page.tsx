import { requireRole } from "@/lib/auth";
import { getExamAnalysis } from "@/lib/exam-analysis";
import { SubjectNetChart } from "@/components/exams/subject-net-chart";
import { WeakTopicsTable } from "@/components/exams/weak-topics-table";

export default async function StudentExamsPage() {
  const profile = await requireRole(["student"]);
  const { chartRows, subjects, weakTopics } = await getExamAnalysis(profile.id);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Deneme Analizim</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-muted-foreground">Ders Bazlı Net Gelişimi</h2>
        <SubjectNetChart rows={chartRows} subjects={subjects} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-muted-foreground">En Zayıf Konular</h2>
        <WeakTopicsTable topics={weakTopics} />
      </section>
    </div>
  );
}
