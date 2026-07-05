import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Öğretmenin veli-öğrenci bağlantısı eklemesi/kaldırması. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (callerProfile?.role !== "teacher") {
    return NextResponse.json(
      { error: "Bağlantıları sadece öğretmen yönetebilir." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { parent_id, student_id, action } = body as {
    parent_id: string;
    student_id: string;
    action: "add" | "remove";
  };
  if (!parent_id || !student_id || !["add", "remove"].includes(action)) {
    return NextResponse.json({ error: "Geçersiz bilgi." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: pair } = await admin
    .from("profiles")
    .select("id, role")
    .in("id", [parent_id, student_id]);
  const parent = pair?.find((p) => p.id === parent_id);
  const student = pair?.find((p) => p.id === student_id);
  if (parent?.role !== "parent" || student?.role !== "student") {
    return NextResponse.json({ error: "Veli veya öğrenci bulunamadı." }, { status: 404 });
  }

  if (action === "add") {
    const { error } = await admin
      .from("parent_student_links")
      .upsert(
        { parent_id, student_id },
        { onConflict: "parent_id,student_id", ignoreDuplicates: true },
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await admin
      .from("parent_student_links")
      .delete()
      .eq("parent_id", parent_id)
      .eq("student_id", student_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
