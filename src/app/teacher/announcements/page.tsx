import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AnnouncementCard } from "@/components/announcements/announcement-card";
import { CreateAnnouncementDialog } from "@/components/announcements/create-announcement-dialog";
import { DeleteAnnouncementButton } from "@/components/announcements/delete-announcement-button";
import { withGrades } from "@/lib/students";
import type { Announcement, Profile } from "@/lib/types";

export default async function TeacherAnnouncementsPage() {
  await requireRole(["teacher"]);
  const supabase = await createClient();

  const [{ data: announcements }, { data: students }] = await Promise.all([
    supabase.from("announcements").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("role", "student").order("full_name"),
  ]);

  const studentOptions = (await withGrades((students as Profile[]) ?? [])).map((s) => ({
    id: s.id,
    fullName: s.full_name,
    gradeLevel: s.grade_level,
  }));
  const list = (announcements as Announcement[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Duyurular"
        description="Tüm okula, sınıf düzeyine veya seçili öğrencilere mesaj ve belge paylaş."
        action={<CreateAnnouncementDialog students={studentOptions} />}
      />

      {list.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Henüz duyuru yok"
          description="&ldquo;Yeni Duyuru&rdquo; ile ilk duyurunu paylaş; hedef kitleye anında bildirilir."
        />
      ) : (
        <div className="stagger space-y-3">
          {list.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              actions={<DeleteAnnouncementButton announcementId={a.id} title={a.title} />}
            />
          ))}
        </div>
      )}
    </>
  );
}
