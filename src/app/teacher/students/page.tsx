import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateAccountDialog } from "@/components/teacher/create-account-dialog";
import { ResetPasswordButton } from "@/components/teacher/reset-password-button";
import type { Profile } from "@/lib/types";

export default async function TeacherStudentsPage() {
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name");

  const { data: parents } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "parent")
    .order("full_name");

  const { data: links } = await supabase.from("parent_student_links").select("*");

  const studentNameById = new Map((students ?? []).map((s: Profile) => [s.id, s.full_name]));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Öğrenciler ve Veliler</h1>
        <CreateAccountDialog students={(students as Profile[]) ?? []} />
      </div>

      <section>
        <h2 className="mb-2 font-medium text-muted-foreground">Öğrenciler</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>Kullanıcı adı</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(students ?? []).map((s: Profile) => (
              <TableRow key={s.id}>
                <TableCell>{s.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{s.username}</TableCell>
                <TableCell>
                  {s.must_change_password ? (
                    <Badge variant="outline">Şifre değiştirilmedi</Badge>
                  ) : (
                    <Badge>Aktif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <ResetPasswordButton profileId={s.id} />
                </TableCell>
              </TableRow>
            ))}
            {(students ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Henüz öğrenci eklenmedi.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <section>
        <h2 className="mb-2 font-medium text-muted-foreground">Veliler</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>Kullanıcı adı</TableHead>
              <TableHead>Çocuğu</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(parents ?? []).map((p: Profile) => {
              const childIds = (links ?? [])
                .filter((l) => l.parent_id === p.id)
                .map((l) => l.student_id);
              const childNames = childIds.map((id) => studentNameById.get(id)).filter(Boolean);
              return (
                <TableRow key={p.id}>
                  <TableCell>{p.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.username}</TableCell>
                  <TableCell>{childNames.join(", ") || "—"}</TableCell>
                  <TableCell>
                    {p.must_change_password ? (
                      <Badge variant="outline">Şifre değiştirilmedi</Badge>
                    ) : (
                      <Badge>Aktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ResetPasswordButton profileId={p.id} />
                  </TableCell>
                </TableRow>
              );
            })}
            {(parents ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Henüz veli eklenmedi.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
