import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentIdsByStudent, notifyUsers } from "@/lib/notifications";

/**
 * Günlük teslim hatırlatması (Vercel cron, vercel.json'da tanımlı):
 * yarın teslim olup henüz kontrol edilmemiş ödevler için öğrenci ve veliye
 * bildirim gönderir. Aynı gün tekrar çalıştırılırsa daha önce atılmış
 * bildirimler (type + link eşleşmesi) atlanır.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const admin = createAdminClient();

  // "Yarın" Türkiye saatine göre hesaplanır (due_date salt tarih tutar).
  const now = new Date();
  const tr = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  tr.setDate(tr.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  const tomorrow = `${tr.getFullYear()}-${pad(tr.getMonth() + 1)}-${pad(tr.getDate())}`;

  const { data: homework, error } = await admin
    .from("homework")
    .select("id, title, student_id")
    .eq("due_date", tomorrow)
    .eq("status", "assigned");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = homework ?? [];
  if (!list.length) return NextResponse.json({ ok: true, notified: 0 });

  const parentsByStudent = await getParentIdsByStudent(list.map((h) => h.student_id));

  let notified = 0;
  for (const hw of list) {
    const studentLink = `/student/homework?due=${hw.id}`;
    const parentLink = `/parent/homework?due=${hw.id}`;

    // Mükerrer önleme: bu ödev için bugün zaten hatırlatma atıldıysa geç.
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("type", "homework_due_soon")
      .eq("link", studentLink)
      .limit(1);
    if (existing?.length) continue;

    const body = `"${hw.title}" ödevinin teslim tarihi yarın.`;
    await Promise.all([
      notifyUsers([hw.student_id], {
        type: "homework_due_soon",
        title: "Teslim tarihi yaklaşıyor",
        body,
        link: studentLink,
      }),
      notifyUsers(parentsByStudent.get(hw.student_id) ?? [], {
        type: "homework_due_soon",
        title: "Teslim tarihi yaklaşıyor",
        body,
        link: parentLink,
      }),
    ]);
    notified += 1;
  }

  return NextResponse.json({ ok: true, notified });
}
