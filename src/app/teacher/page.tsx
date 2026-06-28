import { Users, UserCheck, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";

export default async function TeacherHomePage() {
  const supabase = await createClient();

  const [{ count: studentCount }, { count: parentCount }, { count: homeworkCount }] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "parent"),
      supabase
        .from("homework")
        .select("id", { count: "exact", head: true })
        .eq("status", "assigned"),
    ]);

  return (
    <>
      <PageHeader
        title="Panel"
        description="Sistemdeki güncel duruma hızlı bir bakış."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Öğrenci" value={studentCount ?? 0} icon={Users} />
        <StatCard label="Veli" value={parentCount ?? 0} icon={UserCheck} />
        <StatCard
          label="Bekleyen Ödev"
          value={homeworkCount ?? 0}
          icon={ClipboardList}
          hint="Tüm öğrenciler genelinde"
        />
      </div>
    </>
  );
}
