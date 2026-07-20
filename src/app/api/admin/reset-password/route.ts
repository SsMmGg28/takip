import { NextResponse } from "next/server";
import { requireTeacherApi } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTempPassword } from "@/lib/username";

export async function POST(request: Request) {
  const gate = await requireTeacherApi("Sadece öğretmen şifre sıfırlayabilir.");
  if (!gate.ok) return gate.response;

  const { profile_id } = (await request.json()) as { profile_id: string };
  if (!profile_id) {
    return NextResponse.json({ error: "Geçersiz bilgi." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Hedef yalnızca öğrenci veya veli olabilir; öğretmenler (admin rolü)
  // birbirinin şifresini sıfırlayıp hesabını ele geçiremesin.
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", profile_id)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }
  if (!["student", "parent"].includes(targetProfile.role)) {
    return NextResponse.json(
      { error: "Yalnızca öğrenci veya veli şifresi sıfırlanabilir." },
      { status: 403 },
    );
  }

  const tempPassword = generateTempPassword();

  const { error: updateError } = await admin.auth.admin.updateUserById(profile_id, {
    password: tempPassword,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await admin.from("profiles").update({ must_change_password: true }).eq("id", profile_id);

  return NextResponse.json({ tempPassword });
}
