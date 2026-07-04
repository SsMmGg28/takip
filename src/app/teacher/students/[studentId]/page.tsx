import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { BookCard } from "@/components/resources/book-card";
import { getStudentShelf } from "@/lib/books";

export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await requireRole(["teacher"]);
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();
  if (!student) notFound();

  const shelf = await getStudentShelf(studentId);

  return (
    <>
      <PageHeader
        title={student.full_name}
        description="Öğrencinin kitaplığındaki kaynaklar ve test ilerlemesi. Kitaplığa kitabı veli ekler."
        action={
          <Link
            href="/teacher/students"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Öğrenciler
          </Link>
        }
      />

      {shelf.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Kitaplığı henüz boş"
          description="Velisi kütüphaneden kitap eklediğinde burada ilerlemesiyle görünecek."
        />
      ) : (
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shelf.map((b) => (
            <BookCard
              key={b.id}
              href={`/teacher/students/${studentId}/${b.id}`}
              name={b.name}
              subject={b.subject}
              sectionCount={b.sections.length}
              testCount={b.totalTests}
              completedCount={b.completedCount}
            />
          ))}
        </div>
      )}
    </>
  );
}
