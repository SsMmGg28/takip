import { GuideProvider } from "@/components/guides/guide-provider";
import { requireRole } from "@/lib/auth";
import { examsEnabledForGrade } from "@/lib/kazanim";
import { getAccessibleStudentsWithGrades } from "@/lib/students";
import { createClient } from "@/lib/supabase/server";
import type { GuideProgressSnapshot } from "@/lib/guides";
import type { Role } from "@/lib/types";

export async function GuideRuntime({ role }: { role: Role }) {
  if (role === "teacher") return null;
  const profile = await requireRole([role]);
  const supabase = await createClient();

  const [progressResult, students] = await Promise.all([
    supabase
      .from("user_guide_progress")
      .select("guide_id, version, outcome")
      .eq("user_id", profile.id),
    getAccessibleStudentsWithGrades(profile),
  ]);

  const progress: GuideProgressSnapshot[] = (progressResult.data ?? []).map((row) => ({
    guideId: row.guide_id as string,
    version: row.version as number,
    outcome: row.outcome as GuideProgressSnapshot["outcome"],
  }));

  return (
    <GuideProvider
      role={role}
      examsEnabled={students.some((student) => examsEnabledForGrade(student.grade_level))}
      initialProgress={progress}
    />
  );
}
