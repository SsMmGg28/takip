import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParentIdsByStudent, notifyUsers } from "@/lib/notifications";
import { addWeeks, currentWeekStart } from "@/lib/week";
import type { StudyScheduleEntry } from "@/lib/types";

/**
 * Pazartesi günleri: "her hafta otomatik devam" açık öğrencilerde, güncel
 * hafta boşsa önceki haftanın programını kopyalar. Yalnızca boş haftayı
 * doldurduğu için aynı gün tekrar çalıştırılması güvenlidir (idempotent).
 */
async function runScheduleAutoRepeat(admin: ReturnType<typeof createAdminClient>) {
  const current = currentWeekStart();
  const previous = addWeeks(current, -1);

  const { data: students } = await admin
    .from("student_profiles")
    .select("id")
    .eq("schedule_auto_repeat", true);

  let copied = 0;
  for (const s of students ?? []) {
    const { count: currentCount } = await admin
      .from("study_schedule_entries")
      .select("id", { count: "exact", head: true })
      .eq("student_id", s.id)
      .eq("week_start", current);
    if ((currentCount ?? 0) > 0) continue;

    const { data: prevEntries } = await admin
      .from("study_schedule_entries")
      .select("*")
      .eq("student_id", s.id)
      .eq("week_start", previous);
    const list = (prevEntries as StudyScheduleEntry[] | null) ?? [];
    if (!list.length) continue;

    const { error } = await admin.from("study_schedule_entries").insert(
      list.map((e) => ({
        student_id: s.id,
        day_of_week: e.day_of_week,
        start_time: e.start_time,
        end_time: e.end_time,
        activity_label: e.activity_label,
        week_start: current,
        updated_by: e.updated_by,
      })),
    );
    if (!error) copied += 1;
  }
  return copied;
}

/**
 * Günlük cron (Vercel, vercel.json'da tanımlı):
 * 1) Yarın teslim olup henüz kontrol edilmemiş ödevler için öğrenci ve veliye
 *    hatırlatma gönderir (mükerrer koruması: type + link eşleşmesi).
 * 2) Pazartesi günleri otomatik devam eden çalışma programlarını yeni
 *    haftaya kopyalar.
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
  const trToday = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  const isMonday = trToday.getDay() === 1;
  const tr = new Date(trToday);
  tr.setDate(tr.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  const tomorrow = `${tr.getFullYear()}-${pad(tr.getMonth() + 1)}-${pad(tr.getDate())}`;

  const autoRepeatCopied = isMonday ? await runScheduleAutoRepeat(admin) : 0;

  const { data: homework, error } = await admin
    .from("homework")
    .select("id, title, student_id")
    .eq("due_date", tomorrow)
    .eq("status", "assigned");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = homework ?? [];
  if (!list.length)
    return NextResponse.json({ ok: true, notified: 0, autoRepeatCopied });

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

  return NextResponse.json({ ok: true, notified, autoRepeatCopied });
}
