import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AttachmentDownloadButton } from "@/components/attachment-download-button";
import type { Announcement } from "@/lib/types";

const AUDIENCE_LABEL: Record<Announcement["audience_role"], string | null> = {
  all: null,
  students: "Öğrencilere",
  parents: "Velilere",
};

function scopeLabel(a: Announcement): string {
  if (a.target_scope === "grade") return `${a.grade_level}. sınıflar`;
  if (a.target_scope === "students") return "Seçili öğrenciler";
  return "Tüm okul";
}

/**
 * Salt-okunur duyuru kartı. Bilinçli olarak hiçbir etkileşim/yorum alanı
 * içermez; tek eylem varsa belge indirme düğmesidir.
 */
export function AnnouncementCard({
  announcement,
  actions,
}: {
  announcement: Announcement;
  actions?: React.ReactNode;
}) {
  const audience = AUDIENCE_LABEL[announcement.audience_role];
  return (
    <article className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="gradient-surface flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-primary/20">
            <Megaphone className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold leading-tight">{announcement.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>
                {new Date(announcement.created_at).toLocaleDateString("tr-TR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <Badge variant="outline">{scopeLabel(announcement)}</Badge>
              {audience && <Badge variant="outline">{audience}</Badge>}
            </div>
          </div>
        </div>
        {actions}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm">{announcement.body}</p>

      {announcement.attachment_path && announcement.attachment_name && (
        <div className="mt-3">
          <AttachmentDownloadButton
            bucket="announcement-files"
            path={announcement.attachment_path}
            name={announcement.attachment_name}
          />
        </div>
      )}
    </article>
  );
}
