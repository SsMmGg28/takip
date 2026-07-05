import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Öğretmenin bir hesabın adını/telefonunu ve (öğrenciyse) sınıfını düzenlemesi. */
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
    return NextResponse.json({ error: "Sadece öğretmen hesap düzenleyebilir." }, { status: 403 });
  }

  const body = await request.json();
  const { user_id, full_name, phone, grade_level } = body as {
    user_id: string;
    full_name?: string;
    phone?: string | null;
    grade_level?: number;
  };

  if (!user_id) {
    return NextResponse.json({ error: "Geçersiz bilgi." }, { status: 400 });
  }
  if (full_name !== undefined && !full_name.trim()) {
    return NextResponse.json({ error: "Ad soyad boş olamaz." }, { status: 400 });
  }
  if (grade_level !== undefined && ![5, 6, 7, 8].includes(Number(grade_level))) {
    return NextResponse.json({ error: "Sınıf düzeyi 5-8 olmalı." }, { status: 400 });
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

  const profileUpdate: Record<string, unknown> = {};
  if (full_name !== undefined) profileUpdate.full_name = full_name.trim();
  if (phone !== undefined) profileUpdate.phone = phone?.trim() || null;
  if (Object.keys(profileUpdate).length) {
    const { error } = await admin.from("profiles").update(profileUpdate).eq("id", user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (grade_level !== undefined) {
    if (target.role !== "student") {
      return NextResponse.json(
        { error: "Sınıf düzeyi yalnızca öğrenci hesabında değiştirilebilir." },
        { status: 400 },
      );
    }
    const { error } = await admin
      .from("student_profiles")
      .update({ grade_level: Number(grade_level) })
      .eq("id", user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
