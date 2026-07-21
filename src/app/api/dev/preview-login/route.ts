import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { usernameToEmail } from "@/lib/username";
import {
  isMatchingPreviewProfile,
  isPreviewLoginEnvironment,
  isPreviewRole,
} from "@/lib/preview-login";

// SADECE GELİŞTİRME/ÖN İZLEME. Sabit "preview.<role>" demo hesabına gizli
// anahtarla, kimlik bilgisi girmeden GERÇEK bir Supabase oturumu açar; böylece
// bir AI ajanı tek linkle o rolün sayfalarını (RLS korunarak) gezebilir.
//
// Fail-closed üç katman:
//   1) Yalnız yerel development veya Vercel Preview; production'da 404.
//   2) DEV_PREVIEW_SECRET / DEV_PREVIEW_PASSWORD tanımlı değilse 403.
//   3) ?secret= parametresi DEV_PREVIEW_SECRET ile birebir eşleşmezse 403.
// Yalnızca sabit preview hesaplarına izin verir; keyfi kullanıcı seçilemez.
// Normalde signInWithPassword kullanır. Tanımlı Preview şifresi mevcut demo
// hesabıyla uyuşmuyorsa yalnız sabit is_demo hesabını service-role ile bir kez
// senkronize eder; keyfi kullanıcı veya production hesabı güncellenemez.

export async function GET(request: Request) {
  if (!isPreviewLoginEnvironment(process.env)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const secret = process.env.DEV_PREVIEW_SECRET;
  const password = process.env.DEV_PREVIEW_PASSWORD;
  if (!secret || !password) {
    return NextResponse.json(
      { error: "Önizleme devre dışı (DEV_PREVIEW_SECRET/PASSWORD yok)." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const role = url.searchParams.get("role") ?? "teacher";
  if (!isPreviewRole(role)) {
    return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
  }

  const username = `preview.${role}`;
  const email = usernameToEmail(username);
  const supabase = await createClient();
  let { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error?.code === "invalid_credentials") {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Önizleme hesabı senkronize edilemedi." },
        { status: 500 },
      );
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, username, role, is_demo")
      .eq("username", username)
      .maybeSingle();

    if (profileError || !profile || !isMatchingPreviewProfile(profile, role)) {
      return NextResponse.json(
        { error: "Önizleme hesabı senkronize edilemedi." },
        { status: 500 },
      );
    }

    const { error: passwordError } = await admin.auth.admin.updateUserById(profile.id, {
      password,
    });
    if (passwordError) {
      return NextResponse.json(
        { error: "Önizleme hesabı senkronize edilemedi." },
        { status: 500 },
      );
    }

    const { error: profileUpdateError } = await admin
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", profile.id)
      .eq("is_demo", true);
    if (profileUpdateError) {
      return NextResponse.json(
        { error: "Önizleme hesabı senkronize edilemedi." },
        { status: 500 },
      );
    }

    ({ error } = await supabase.auth.signInWithPassword({ email, password }));
  }

  if (error) {
    return NextResponse.json(
      {
        error: "Önizleme girişi başarısız.",
      },
      { status: 500 },
    );
  }

  // signInWithPassword oturum çerezlerini cookies() üzerinden set eder; redirect
  // yanıtı bu çerezleri taşır → RLS ile demo veri görünür.
  return NextResponse.redirect(new URL(`/${role}`, request.url));
}
