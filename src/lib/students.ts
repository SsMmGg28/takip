import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Öğrencinin sınıf düzeyini döner (bulunamazsa null). */
export async function getStudentGrade(studentId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_profiles")
    .select("grade_level")
    .eq("id", studentId)
    .single();
  return data?.grade_level ?? null;
}

/** Sınıf düzeyi + hedef puan (deneme sayfaları için tek sorgu). */
export async function getStudentExamInfo(
  studentId: string,
): Promise<{ grade: number | null; targetScore: number | null }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_profiles")
    .select("grade_level, target_score")
    .eq("id", studentId)
    .single();
  return {
    grade: data?.grade_level ?? null,
    targetScore: data?.target_score ?? null,
  };
}

export interface StudentWithGrade extends Profile {
  grade_level: number | null;
}

/** Profillere sınıf düzeyini ekler. */
export async function withGrades(students: Profile[]): Promise<StudentWithGrade[]> {
  if (students.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_profiles")
    .select("id, grade_level")
    .in("id", students.map((s) => s.id));
  const gradeById = new Map((data ?? []).map((row) => [row.id, row.grade_level]));
  return students.map((s) => ({ ...s, grade_level: gradeById.get(s.id) ?? null }));
}

/** Mevcut kullanıcının görebileceği öğrenci profillerini döner (öğretmen: hepsi, öğrenci: kendisi, veli: çocukları). */
export async function getAccessibleStudents(profile: Profile): Promise<Profile[]> {
  const supabase = await createClient();

  if (profile.role === "teacher") {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("full_name");
    return (data as Profile[]) ?? [];
  }

  if (profile.role === "student") {
    return [profile];
  }

  const { data: links } = await supabase
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_id", profile.id);

  const studentIds = (links ?? []).map((l) => l.student_id);
  if (studentIds.length === 0) return [];

  const { data } = await supabase.from("profiles").select("*").in("id", studentIds);
  return (data as Profile[]) ?? [];
}
