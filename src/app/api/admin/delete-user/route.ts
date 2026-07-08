import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Öğretmenin bir öğrenci/veli hesabını kalıcı olarak silmesi.
 * auth.users satırı silinince profil ve öğrenciye bağlı veriler (ödev, sınav,
 * ilerleme...) FK cascade ile temizlenir. "Oluşturan/işaretleyen" gibi cascade
 * olmayan referanslar önce silen öğretmene devredilir ki kayıtlar (örn. velinin
 * girdiği denemeler) kaybolmasın.
 */
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
    return NextResponse.json({ error: "Sadece öğretmen hesap silebilir." }, { status: 403 });
  }

  const body = await request.json();
  const { user_id } = body as { user_id: string };
  if (!user_id) {
    return NextResponse.json({ error: "Geçersiz bilgi." }, { status: 400 });
  }
  if (user_id === userData.user.id) {
    return NextResponse.json({ error: "Kendi hesabını silemezsin." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", user_id)
    .single();
  if (!target) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }
  if (target.role === "teacher") {
    return NextResponse.json({ error: "Öğretmen hesabı buradan silinemez." }, { status: 400 });
  }

  const teacherId = userData.user.id;

  // Cascade olmayan NOT NULL referansları öğretmene devret; nullable
  // inceleme/onay alanlarını boşalt. (Sıra önemli değil, hepsi bağımsız.)
  const reassignments = [
    admin.from("exams").update({ created_by: teacherId }).eq("created_by", user_id),
    admin.from("homework").update({ created_by: teacherId }).eq("created_by", user_id),
    admin.from("calendar_events").update({ created_by: teacherId }).eq("created_by", user_id),
    admin
      .from("study_schedule_entries")
      .update({ updated_by: teacherId })
      .eq("updated_by", user_id),
    admin.from("resource_books").update({ created_by: teacherId }).eq("created_by", user_id),
    admin.from("resource_books").update({ approved_by: null }).eq("approved_by", user_id),
    admin
      .from("student_test_progress")
      .update({ marked_by: teacherId })
      .eq("marked_by", user_id),
    admin.from("student_books").update({ added_by: teacherId }).eq("added_by", user_id),
    admin.from("exam_edit_requests").update({ reviewed_by: null }).eq("reviewed_by", user_id),
  ];
  for (const op of reassignments) {
    const { error } = await op;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // auth.users silinince profiles (ve ondan cascade eden her şey) silinir.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user_id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
