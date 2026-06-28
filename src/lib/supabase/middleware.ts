import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: userData } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isApiRoute = pathname.startsWith("/api/");

  // API route'lar kendi auth/rol kontrolünü route handler içinde yapıyor.
  // Burada sayfa yönlendirmesi (redirect) uygulamak fetch'in JSON yerine
  // HTML/redirect cevabı almasına yol açar, bu yüzden API isteklerini
  // sadece oturum tazeleyip olduğu gibi geçiriyoruz.
  if (isApiRoute) {
    return supabaseResponse;
  }

  if (!userData.user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (userData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, must_change_password")
      .eq("id", userData.user.id)
      .single();

    if (profile?.must_change_password && pathname !== "/set-password") {
      const url = request.nextUrl.clone();
      url.pathname = "/set-password";
      return NextResponse.redirect(url);
    }

    if (!profile?.must_change_password && pathname === "/set-password") {
      const url = request.nextUrl.clone();
      url.pathname = `/${profile?.role}`;
      return NextResponse.redirect(url);
    }

    if (pathname === "/login" || pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/${profile?.role}`;
      return NextResponse.redirect(url);
    }

    if (profile && !pathname.startsWith(`/${profile.role}`) && pathname !== "/set-password") {
      const url = request.nextUrl.clone();
      url.pathname = `/${profile.role}`;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
