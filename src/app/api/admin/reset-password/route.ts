import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTempPassword } from "@/lib/username";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", userData.user.id)
    .single();

  if (callerProfile?.role !== "teacher") {
    return NextResponse.json({ error: "Sadece öğretmen şifre sıfırlayabilir." }, { status: 403 });
  }

  const { profile_id } = (await request.json()) as { profile_id: string };
  if (!profile_id) {
    return NextResponse.json({ error: "Geçersiz bilgi." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Öğretmen hesaplarının şifresini yalnızca yönetici sıfırlayabilir.
  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", profile_id)
    .single();
  if (target?.role === "teacher" && !callerProfile.is_admin) {
    return NextResponse.json(
      { error: "Öğretmen şifrelerini yalnızca yönetici sıfırlayabilir." },
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
