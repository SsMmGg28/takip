import Link from "next/link";
import { Users } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
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
    <>
      <PageHeader
        title="Öğrenciler ve Veliler"
        description="Hesap oluştur, şifre sıfırla, kim kimin velisi takip et."
        action={<CreateAccountDialog students={(students as Profile[]) ?? []} />}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Öğrenciler
        </h2>
        {students?.length ? (
          <>
            {/* Desktop table */}
            <Card className="hidden overflow-hidden p-0 sm:block">
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
                  {students.map((s: Profile) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <Link href={`/teacher/students/${s.id}`} className="hover:underline">
                          {s.full_name}
                        </Link>
                      </TableCell>
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
                </TableBody>
              </Table>
            </Card>

            {/* Mobile cards */}
            <div className="flex flex-col gap-2 sm:hidden">
              {students.map((s: Profile) => (
                <Card key={s.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/teacher/students/${s.id}`}
                        className="font-medium hover:underline"
                      >
                        {s.full_name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        @{s.username}
                      </p>
                      <div className="mt-2">
                        {s.must_change_password ? (
                          <Badge variant="outline">Şifre değiştirilmedi</Badge>
                        ) : (
                          <Badge>Aktif</Badge>
                        )}
                      </div>
                    </div>
                    <ResetPasswordButton profileId={s.id} />
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={Users}
            title="Henüz öğrenci yok"
            description="Yukarıdaki “Yeni Hesap Oluştur” ile başla."
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Veliler
        </h2>
        {parents?.length ? (
          <>
            {/* Desktop table */}
            <Card className="hidden overflow-hidden p-0 sm:block">
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
                  {parents.map((p: Profile) => {
                    const childIds = (links ?? [])
                      .filter((l) => l.parent_id === p.id)
                      .map((l) => l.student_id);
                    const childNames = childIds
                      .map((id) => studentNameById.get(id))
                      .filter(Boolean);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.full_name}</TableCell>
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
                </TableBody>
              </Table>
            </Card>

            {/* Mobile cards */}
            <div className="flex flex-col gap-2 sm:hidden">
              {parents.map((p: Profile) => {
                const childIds = (links ?? [])
                  .filter((l) => l.parent_id === p.id)
                  .map((l) => l.student_id);
                const childNames = childIds
                  .map((id) => studentNameById.get(id))
                  .filter(Boolean);
                return (
                  <Card key={p.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{p.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{p.username}
                        </p>
                        <p className="mt-1 text-xs">
                          <span className="text-muted-foreground">Çocuğu: </span>
                          {childNames.join(", ") || "—"}
                        </p>
                        <div className="mt-2">
                          {p.must_change_password ? (
                            <Badge variant="outline">Şifre değiştirilmedi</Badge>
                          ) : (
                            <Badge>Aktif</Badge>
                          )}
                        </div>
                      </div>
                      <ResetPasswordButton profileId={p.id} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState title="Henüz veli eklenmedi" />
        )}
      </section>
    </>
  );
}
