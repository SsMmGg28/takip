import { Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function AttachmentDownloadLink({
  path,
  name,
}: {
  path: string;
  name: string;
}) {
  const supabase = await createClient();
  // 1 saatlik kısa ömürlü imzalı link (RLS sayesinde sadece yetkili kullanıcı görürken oluşturulur)
  const { data } = await supabase.storage
    .from("homework-attachments")
    .createSignedUrl(path, 60 * 60);

  if (!data?.signedUrl) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5" /> {name} (link oluşturulamadı)
      </span>
    );
  }

  return (
    <a
      href={data.signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1.5 text-xs text-foreground hover:bg-accent"
    >
      <Paperclip className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{name}</span>
    </a>
  );
}
