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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { CreateAccountDialog } from "@/components/teacher/create-account-dialog";
import { DeleteUserButton } from "@/components/teacher/delete-user-button";
import { EditUserDialog } from "@/components/teacher/edit-user-dialog";
import { ManageLinksDialog } from "@/components/teacher/manage-links-dialog";
import { ResetPasswordButton } from "@/components/teacher/reset-password-button";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Öğrenciler" };

const PAGE_SIZE = 25;

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const q = (params.q ?? "")
    .trim()
    .replace(/[,%()]/g, "")
    .slice(0, 80);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let studentQuery = supabase
    .from("profiles")
    .select("*, student_profiles(grade_level)", { count: "exact" })
    .eq("role", "student")
    .order("full_name")
    .range(from, to);
  let parentQuery = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "parent")
    .order("full_name")
    .range(from, to);
  if (q) {
    const filter = `full_name.ilike.%${q}%,username.ilike.%${q}%`;
    studentQuery = studentQuery.or(filter);
    parentQuery = parentQuery.or(filter);
  }

  const [
    { data: students, count: studentCount },
    { data: parents, count: parentCount },
    { data: allStudentOptions },
  ] = await Promise.all([
    studentQuery,
    parentQuery,
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "student")
      .order("full_name"),
  ]);

  const parentIds = ((parents as Profile[] | null) ?? []).map((parent) => parent.id);
  const { data: links } = parentIds.length
    ? await supabase.from("parent_student_links").select("*").in("parent_id", parentIds)
    : { data: [] };

  const studentList = (
    (students as
      (Profile & { student_profiles: { grade_level: number | null } | null })[] | null) ??
    []
  ).map(({ student_profiles, ...s }) => ({
    ...(s as Profile),
    grade_level: student_profiles?.grade_level ?? null,
  }));
  const accountStudentOptions =
    (allStudentOptions as Pick<Profile, "id" | "full_name">[] | null) ?? [];
  const studentNameById = new Map(
    accountStudentOptions.map((student) => [student.id, student.full_name]),
  );
  const studentOptions = accountStudentOptions.map((student) => ({
    id: student.id,
    fullName: student.full_name,
  }));
  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(studentCount ?? 0, parentCount ?? 0) / PAGE_SIZE),
  );

  return (
    <>
      <PageHeader
        title="Öğrenciler ve Veliler"
        description="Hesap oluştur, düzenle, şifre sıfırla; veli-çocuk bağlantılarını yönet."
        action={<CreateAccountDialog students={accountStudentOptions} />}
      />

      <form className="flex flex-col gap-2 rounded-2xl border bg-card p-3 sm:flex-row">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Ad veya kullanıcı adı ara"
          aria-label="Öğrenci veya veli ara"
          className="min-h-11 flex-1"
        />
        <Button type="submit" variant="outline">
          Ara
        </Button>
        {q && (
          <Button variant="ghost" asChild>
            <Link href="/teacher/students">Temizle</Link>
          </Button>
        )}
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Öğrenciler
        </h2>
        {studentList.length ? (
          <Card className="overflow-hidden p-0">
            <div className="sm:overflow-x-auto">
              <Table>
                <TableHeader className="hidden sm:table-header-group">
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
                    <TableRow key={s.id} className="grid gap-2 p-4 sm:table-row sm:p-0">
                      <TableCell className="block p-0 font-medium sm:table-cell sm:p-2">
                        <Link
                          href={`/teacher/students/${s.id}`}
                          className="hover:underline"
                        >
                          {s.full_name}
                        </Link>
                      </TableCell>
                      <TableCell className="block p-0 text-sm text-muted-foreground sm:table-cell sm:p-2">
                        <span className="mr-1 font-medium text-foreground sm:hidden">
                          Kullanıcı:
                        </span>
                        {s.username}
                      </TableCell>
                      <TableCell className="block p-0 text-sm text-muted-foreground sm:table-cell sm:p-2">
                        <span className="mr-1 font-medium text-foreground sm:hidden">
                          Sınıf:
                        </span>
                        {s.grade_level ? `${s.grade_level}. sınıf` : "—"}
                      </TableCell>
                      <TableCell className="block p-0 sm:table-cell sm:p-2">
                        {s.must_change_password ? (
                          <Badge variant="outline">Şifre değiştirilmedi</Badge>
                        ) : (
                          <Badge>Aktif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="block p-0 sm:table-cell sm:p-2 sm:text-right">
                        <div className="flex flex-wrap gap-1.5 sm:justify-end">
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
            <div className="sm:overflow-x-auto">
              <Table>
                <TableHeader className="hidden sm:table-header-group">
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
                      <TableRow key={p.id} className="grid gap-2 p-4 sm:table-row sm:p-0">
                        <TableCell className="block p-0 font-medium sm:table-cell sm:p-2">
                          {p.full_name}
                        </TableCell>
                        <TableCell className="block p-0 text-sm text-muted-foreground sm:table-cell sm:p-2">
                          <span className="mr-1 font-medium text-foreground sm:hidden">
                            Kullanıcı:
                          </span>
                          {p.username}
                        </TableCell>
                        <TableCell className="block p-0 text-sm sm:table-cell sm:p-2">
                          <span className="mr-1 font-medium text-foreground sm:hidden">
                            Çocuğu:
                          </span>
                          {linkedStudents.map((s) => s.fullName).join(", ") || "—"}
                        </TableCell>
                        <TableCell className="block p-0 sm:table-cell sm:p-2">
                          {p.must_change_password ? (
                            <Badge variant="outline">Şifre değiştirilmedi</Badge>
                          ) : (
                            <Badge>Aktif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="block p-0 sm:table-cell sm:p-2 sm:text-right">
                          <div className="flex flex-wrap gap-1.5 sm:justify-end">
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

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Sayfalar">
          {page > 1 ? (
            <Button variant="outline" asChild>
              <Link
                href={`/teacher/students?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`}
              >
                Önceki
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Önceki
            </Button>
          )}
          <span className="px-2 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Button variant="outline" asChild>
              <Link
                href={`/teacher/students?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`}
              >
                Sonraki
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Sonraki
            </Button>
          )}
        </nav>
      )}
    </>
  );
}
