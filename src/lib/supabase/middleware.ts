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

  // getClaims: asimetrik JWT anahtarında token yerelde doğrulanır (Auth
  // sunucusuna gidiş-dönüş yok); simetrik anahtarda getUser gibi sunucuya
  // düşer. Süresi dolmak üzereyse oturumu da tazeler.
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub ?? null;
  const pathname = request.nextUrl.pathname;
  // "/" landing sayfası herkese açık; startsWith ile eşleştirilirse tüm yollar
  // public sayılacağından ayrıca tam eşleşme olarak kontrol ediliyor.
  const isPublic =
    pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isApiRoute = pathname.startsWith("/api/");

  // API route'lar kendi auth/rol kontrolünü route handler içinde yapıyor.
  // Burada sayfa yönlendirmesi (redirect) uygulamak fetch'in JSON yerine
  // HTML/redirect cevabı almasına yol açar, bu yüzden API isteklerini
  // sadece oturum tazeleyip olduğu gibi geçiriyoruz.
  if (isApiRoute) {
    return supabaseResponse;
  }

  if (!userId && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // profiles sorgusu her istekte değil, yalnızca yönlendirme kararının role /
  // must_change_password bilgisine gerçekten ihtiyaç duyduğu yollarda çalışır.
  // Diğer tüm özel sayfalarda rol ve şifre zorunluluğu requireRole() tarafından
  // uygulanıyor (layout + sayfa); burada tekrarlamak her gezinmeye fazladan bir
  // Supabase gidiş-dönüşü ekliyordu.
  const needsProfile =
    pathname === "/" || pathname === "/login" || pathname === "/set-password";

  if (userId && needsProfile) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, must_change_password")
      .eq("id", userId)
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
  }

  return supabaseResponse;
}
