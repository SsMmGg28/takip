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
//   3) GET query veya POST form secret değeri DEV_PREVIEW_SECRET ile birebir
//      eşleşmezse 403.
// Yalnızca sabit preview hesaplarına izin verir; keyfi kullanıcı seçilemez.
// Normalde signInWithPassword kullanır. Tanımlı Preview şifresi mevcut demo
// hesabıyla uyuşmuyorsa yalnız sabit is_demo hesabını service-role ile bir kez
// senkronize eder; keyfi kullanıcı veya production hesabı güncellenemez.

function getPreviewConfig() {
  const secret = process.env.DEV_PREVIEW_SECRET;
  const password = process.env.DEV_PREVIEW_PASSWORD;
  return secret && password ? { secret, password } : null;
}

function previewFormResponse() {
  return new NextResponse(
    `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Preview rol girişi</title>
    <style>
      :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #0b1220; color: #f8fafc; }
      main { width: min(100% - 32px, 420px); padding: 28px; border: 1px solid #334155; border-radius: 22px; background: #111827; box-sizing: border-box; }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { margin: 0 0 22px; color: #cbd5e1; line-height: 1.5; }
      label { display: grid; gap: 8px; margin-top: 16px; font-weight: 650; }
      input, select, button { width: 100%; min-height: 48px; border-radius: 12px; box-sizing: border-box; font: inherit; }
      input, select { border: 1px solid #475569; padding: 0 14px; background: #0f172a; color: #f8fafc; }
      button { margin-top: 22px; border: 0; background: #38bdf8; color: #082f49; font-weight: 800; cursor: pointer; }
      small { display: block; margin-top: 16px; color: #94a3b8; line-height: 1.45; }
    </style>
  </head>
  <body>
    <main>
      <h1>Preview rol girişi</h1>
      <p>Rolü seç, Vercel'de tanımladığın gizli anahtarı yapıştır ve devam et.</p>
      <form method="post">
        <label>Rol
          <select name="role">
            <option value="student">Öğrenci</option>
            <option value="teacher">Öğretmen</option>
            <option value="parent">Veli</option>
          </select>
        </label>
        <label>DEV_PREVIEW_SECRET
          <input name="secret" type="password" required autocomplete="off" />
        </label>
        <button type="submit">Bu rolle giriş yap</button>
      </form>
      <small>Gizli anahtar POST gövdesinde gönderilir; adres çubuğuna veya yönlendirme URL'sine eklenmez.</small>
    </main>
  </body>
</html>`,
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "DENY",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}

async function completePreviewLogin(
  request: Request,
  providedSecret: string | null,
  roleValue: string,
  config: { secret: string; password: string },
) {
  if (providedSecret !== config.secret) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  if (!isPreviewRole(roleValue)) {
    return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
  }

  const username = `preview.${roleValue}`;
  const email = usernameToEmail(username);
  const supabase = await createClient();
  let { error } = await supabase.auth.signInWithPassword({
    email,
    password: config.password,
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

    if (profileError || !profile || !isMatchingPreviewProfile(profile, roleValue)) {
      return NextResponse.json(
        { error: "Önizleme hesabı senkronize edilemedi." },
        { status: 500 },
      );
    }

    const { error: passwordError } = await admin.auth.admin.updateUserById(profile.id, {
      password: config.password,
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

    ({ error } = await supabase.auth.signInWithPassword({
      email,
      password: config.password,
    }));
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
  // Form POST'undan sonra 303, tarayıcının hedef dashboard'u GET ile açmasını
  // sağlar. Varsayılan 307 POST'u korur ve /student gibi sayfalarda 405 üretir.
  return NextResponse.redirect(new URL(`/${roleValue}`, request.url), 303);
}

function previewRouteGate() {
  if (!isPreviewLoginEnvironment(process.env)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const config = getPreviewConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Önizleme devre dışı (DEV_PREVIEW_SECRET/PASSWORD yok)." },
      { status: 403 },
    );
  }

  return config;
}

export async function GET(request: Request) {
  const gate = previewRouteGate();
  if (gate instanceof NextResponse) return gate;

  const url = new URL(request.url);
  const providedSecret = url.searchParams.get("secret");
  if (providedSecret === null) return previewFormResponse();

  return completePreviewLogin(
    request,
    providedSecret,
    url.searchParams.get("role") ?? "teacher",
    gate,
  );
}

export async function POST(request: Request) {
  const gate = previewRouteGate();
  if (gate instanceof NextResponse) return gate;

  const formData = await request.formData();
  const providedSecret = formData.get("secret");
  const role = formData.get("role");

  return completePreviewLogin(
    request,
    typeof providedSecret === "string" ? providedSecret : null,
    typeof role === "string" ? role : "teacher",
    gate,
  );
}
