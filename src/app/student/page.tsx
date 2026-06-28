import { ClipboardList, CalendarClock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";

export default async function StudentHomePage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const [{ count: pendingHomework }, { count: scheduleCount }] = await Promise.all([
    supabase
      .from("homework")
      .select("id", { count: "exact", head: true })
      .eq("student_id", profile.id)
      .eq("status", "assigned"),
    supabase
      .from("study_schedule_entries")
      .select("id", { count: "exact", head: true })
      .eq("student_id", profile.id),
  ]);

  return (
    <>
      <PageHeader
        title={`Merhaba ${profile.full_name.split(" ")[0]} 👋`}
        description="Bugünkü işlerin ve programına genel bakış."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Bekleyen Ödev"
          value={pendingHomework ?? 0}
          icon={ClipboardList}
        />
        <StatCard
          label="Çalışma Programı Saatleri"
          value={scheduleCount ?? 0}
          icon={CalendarClock}
          hint="Haftalık toplam etkinlik"
        />
      </div>
    </>
  );
}
