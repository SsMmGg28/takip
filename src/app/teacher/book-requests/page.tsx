import { Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { approveBookRequest, rejectBookRequest } from "@/lib/actions/resources";
import type { BookRequest, Profile } from "@/lib/types";

export default async function BookRequestsPage() {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("book_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const requesterIds = Array.from(
    new Set((requests ?? []).map((r) => r.requested_by)),
  );

  const { data: requesters } = requesterIds.length
    ? await supabase.from("profiles").select("id, full_name, role").in("id", requesterIds)
    : { data: [] };

  const nameById = new Map(
    (requesters as Pick<Profile, "id" | "full_name" | "role">[] | null)?.map((p) => [
      p.id,
      p.full_name,
    ]) ?? [],
  );

  const pending = (requests as BookRequest[] | null)?.filter((r) => r.status === "pending") ?? [];
  const reviewed = (requests as BookRequest[] | null)?.filter((r) => r.status !== "pending") ?? [];

  return (
    <>
      <PageHeader
        title="Kitap İstekleri"
        description="Öğrencilerin kataloga eklenmesini istediği kitaplar burada onayını bekler."
      />

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Bekleyenler ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <EmptyState icon={Inbox} title="Bekleyen istek yok" />
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{r.name}</p>
                    {r.subject && (
                      <p className="text-xs text-muted-foreground">{r.subject}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      İsteyen: {nameById.get(r.requested_by) ?? "?"} ·{" "}
                      {new Date(r.created_at).toLocaleDateString("tr-TR")}
                    </p>
                    {r.note && (
                      <p className="text-sm text-muted-foreground">“{r.note}”</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <form action={rejectBookRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Reddet
                      </Button>
                    </form>
                    <form action={approveBookRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" size="sm">
                        Onayla ve Kataloga Ekle
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {reviewed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Geçmiş
          </h2>
          <div className="space-y-2">
            {reviewed.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {nameById.get(r.requested_by) ?? "?"} ·{" "}
                      {new Date(r.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <Badge variant={r.status === "approved" ? "default" : "outline"}>
                    {r.status === "approved" ? "Onaylandı" : "Reddedildi"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
