import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AnnouncementCard } from "@/components/announcements/announcement-card";
import type { Announcement } from "@/lib/types";

export default async function AnnouncementsPage() {
  await requireRole(["student"]);
  const supabase = await createClient();

  // Süzme RLS'te: yalnızca hedefinde olduğun duyurular döner.
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  const list = (data as Announcement[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Duyurular"
        description="Öğretmenin paylaştığı duyurular ve belgeler."
      />

      {list.length === 0 ? (
        <EmptyState icon={Megaphone} title="Henüz duyuru yok" />
      ) : (
        <div className="stagger space-y-3">
          {list.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      )}
    </>
  );
}
