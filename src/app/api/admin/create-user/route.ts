import { NextResponse } from "next/server";
import { requireTeacherApi } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTempPassword, normalizeUsername, usernameToEmail } from "@/lib/username";

export async function POST(request: Request) {
  const gate = await requireTeacherApi("Sadece öğretmen hesap oluşturabilir.");
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const { full_name, role, grade_level, parent_of } = body as {
    full_name: string;
    role: "student" | "parent";
    grade_level?: number;
    parent_of?: string;
  };

  if (!full_name?.trim() || !["student", "parent"].includes(role)) {
    return NextResponse.json({ error: "Geçersiz bilgi." }, { status: 400 });
  }

  // Öğrenci için sınıf düzeyi zorunlu: 5, 6, 7 veya 8.
  if (role === "student" && ![5, 6, 7, 8].includes(Number(grade_level))) {
    return NextResponse.json(
      { error: "Öğrenci için sınıf düzeyi (5-8) seçilmeli." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  let username = normalizeUsername(full_name);
  let suffix = 1;
  while (true) {
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (!existing) break;
    suffix += 1;
    username = normalizeUsername(full_name, suffix);
  }

  const tempPassword = generateTempPassword();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password: tempPassword,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Kullanıcı oluşturulamadı." },
      { status: 500 },
    );
  }

  const newUserId = created.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: newUserId,
    role,
    username,
    full_name: full_name.trim(),
    must_change_password: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(newUserId);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (role === "student") {
    await admin.from("student_profiles").insert({
      id: newUserId,
      grade_level: Number(grade_level),
    });
  }

  if (role === "parent" && parent_of) {
    // parent_of gerçek bir öğrenci profiline işaret etmeli; aksi halde veliyi
    // rastgele bir profile (ör. öğretmen) bağlama ihtimali doğar.
    const { data: linkedStudent } = await admin
      .from("profiles")
      .select("role")
      .eq("id", parent_of)
      .single();

    if (linkedStudent?.role === "student") {
      await admin.from("parent_student_links").insert({
        parent_id: newUserId,
        student_id: parent_of,
      });
    }
  }

  return NextResponse.json({ username, tempPassword });
}
