import { Download, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Özel bucket'taki bir dosya için belirgin "İndir" düğmesi. İmzalı URL
 * kullanıcı istemcisiyle üretilir (RLS yetkisiz kullanıcıya link vermez) ve
 * download seçeneğiyle tarayıcı dosyayı açmak yerine cihaza kaydeder.
 */
export async function AttachmentDownloadButton({
  bucket,
  path,
  name,
}: {
  bucket: string;
  path: string;
  name: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60, { download: name });

  if (!data?.signedUrl) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5" /> {name} (link oluşturulamadı)
      </span>
    );
  }

  return (
    <span className="inline-flex max-w-full items-center gap-2">
      <a
        href={data.signedUrl}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0"
        download={name}
      >
        <Download className="h-3.5 w-3.5" />
        İndir
      </a>
      <span className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{name}</span>
      </span>
    </span>
  );
}
