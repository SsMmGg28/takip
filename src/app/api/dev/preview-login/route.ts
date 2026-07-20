import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { usernameToEmail } from "@/lib/username";

// SADECE GELİŞTİRME/ÖN İZLEME. Sabit "preview.<role>" demo hesabına gizli
// anahtarla, kimlik bilgisi girmeden GERÇEK bir Supabase oturumu açar; böylece
// bir AI ajanı tek linkle o rolün sayfalarını (RLS korunarak) gezebilir.
//
// Fail-closed üç katman:
//   1) NODE_ENV === "production" ise 404 (prod'da rota yok gibi davranır).
//   2) DEV_PREVIEW_SECRET / DEV_PREVIEW_PASSWORD tanımlı değilse 403.
//   3) ?secret= parametresi DEV_PREVIEW_SECRET ile birebir eşleşmezse 403.
// Yalnızca sabit preview hesaplarına izin verir; keyfi kullanıcı seçilemez.
// Service-role KULLANMAZ — normal signInWithPassword ile oturum açar.

const ROLES = new Set(["teacher", "student", "parent"]);

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
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
  if (!ROLES.has(role)) {
    return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(`preview.${role}`),
    password,
  });
  if (error) {
    return NextResponse.json(
      {
        error:
          "Önizleme girişi başarısız. 'node --env-file=.env.local scripts/seed-preview.mjs' çalıştırıldı mı?",
      },
      { status: 500 },
    );
  }

  // signInWithPassword oturum çerezlerini cookies() üzerinden set eder; redirect
  // yanıtı bu çerezleri taşır → RLS ile demo veri görünür.
  return NextResponse.redirect(new URL(`/${role}`, request.url));
}
