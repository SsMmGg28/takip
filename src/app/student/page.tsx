import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentHomePage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const { count: pendingHomework } = await supabase
    .from("homework")
    .select("id", { count: "exact", head: true })
    .eq("student_id", profile.id)
    .eq("status", "assigned");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Bekleyen Ödev
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{pendingHomework ?? 0}</CardContent>
      </Card>
    </div>
  );
}
