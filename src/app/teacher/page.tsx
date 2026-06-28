import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Öğrenci</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{studentCount ?? 0}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Veli</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{parentCount ?? 0}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Bekleyen Ödev
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">{homeworkCount ?? 0}</CardContent>
      </Card>
    </div>
  );
}
