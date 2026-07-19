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
import { DeleteUserButton } from "@/components/teacher/delete-user-button";
import { EditUserDialog } from "@/components/teacher/edit-user-dialog";
import { ManageLinksDialog } from "@/components/teacher/manage-links-dialog";
import { ResetPasswordButton } from "@/components/teacher/reset-password-button";
import type { Profile } from "@/lib/types";

export default async function TeacherStudentsPage() {
  const supabase = await createClient();

  // Üç bağımsız sorgu tek dalgada; öğrenci sınıfı embedded select ile gelir.
  const [{ data: students }, { data: parents }, { data: links }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, student_profiles(grade_level)")
      .eq("role", "student")
      .order("full_name"),
    supabase.from("profiles").select("*").eq("role", "parent").order("full_name"),
    supabase.from("parent_student_links").select("*"),
  ]);

  const studentList = (
    (students as (Profile & { student_profiles: { grade_level: number | null } | null })[] | null) ??
    []
  ).map(({ student_profiles, ...s }) => ({
    ...(s as Profile),
    grade_level: student_profiles?.grade_level ?? null,
  }));
  const studentNameById = new Map(studentList.map((s) => [s.id, s.full_name]));
  const studentOptions = studentList.map((s) => ({ id: s.id, fullName: s.full_name }));

  return (
    <>
      <PageHeader
        title="Öğrenciler ve Veliler"
        description="Hesap oluştur, düzenle, şifre sıfırla; veli-çocuk bağlantılarını yönet."
        action={<CreateAccountDialog students={studentList} />}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Öğrenciler
        </h2>
        {studentList.length ? (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Kullanıcı adı</TableHead>
                    <TableHead>Sınıf</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentList.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <Link href={`/teacher/students/${s.id}`} className="hover:underline">
                          {s.full_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.username}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.grade_level ? `${s.grade_level}. sınıf` : "—"}
                      </TableCell>
                      <TableCell>
                        {s.must_change_password ? (
                          <Badge variant="outline">Şifre değiştirilmedi</Badge>
                        ) : (
                          <Badge>Aktif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <EditUserDialog
                            userId={s.id}
                            role="student"
                            initialFullName={s.full_name}
                            initialPhone={s.phone}
                            initialGrade={s.grade_level}
                          />
                          <ResetPasswordButton profileId={s.id} />
                          <DeleteUserButton
                            userId={s.id}
                            fullName={s.full_name}
                            role="student"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
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
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
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
                    const linkedStudents = (links ?? [])
                      .filter((l) => l.parent_id === p.id)
                      .map((l) => ({
                        id: l.student_id as string,
                        fullName: studentNameById.get(l.student_id) ?? "?",
                      }));
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.username}</TableCell>
                        <TableCell>
                          {linkedStudents.map((s) => s.fullName).join(", ") || "—"}
                        </TableCell>
                        <TableCell>
                          {p.must_change_password ? (
                            <Badge variant="outline">Şifre değiştirilmedi</Badge>
                          ) : (
                            <Badge>Aktif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <EditUserDialog
                              userId={p.id}
                              role="parent"
                              initialFullName={p.full_name}
                              initialPhone={p.phone}
                            />
                            <ManageLinksDialog
                              parentId={p.id}
                              parentName={p.full_name}
                              linkedStudents={linkedStudents}
                              allStudents={studentOptions}
                            />
                            <ResetPasswordButton profileId={p.id} />
                            <DeleteUserButton
                              userId={p.id}
                              fullName={p.full_name}
                              role="parent"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <EmptyState title="Henüz veli eklenmedi" />
        )}
      </section>
    </>
  );
}
