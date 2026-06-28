import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

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
