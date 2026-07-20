import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import type { Profile } from "@/lib/types";

type RequireTeacherResult =
  { ok: true; profile: Profile } | { ok: false; response: NextResponse };

/**
 * Admin API route'larının ortak koruması: oturum yoksa 401, öğretmen değilse
 * 403 döner. Başarıda çağıranın profili (id/is_admin dahil) verilir.
 */
export async function requireTeacherApi(
  forbiddenMessage = "Bu işlemi yalnızca öğretmen yapabilir.",
): Promise<RequireTeacherResult> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Yetkisiz." }, { status: 401 }),
    };
  }
  if (profile.role !== "teacher") {
    return {
      ok: false,
      response: NextResponse.json({ error: forbiddenMessage }, { status: 403 }),
    };
  }
  return { ok: true, profile };
}
