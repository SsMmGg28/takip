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

  const studentIds = (students ?? []).map((s) => s.id);
  if (!studentIds.length) return 0;

  // Öğrenci başına ayrı sorgu yerine: bu hafta dolu olanlar + önceki haftanın
  // girdileri iki toplu sorguda çekilir, eksik haftalar tek insert ile yazılır.
  const [{ data: currentRows }, { data: prevRows }] = await Promise.all([
    admin
      .from("study_schedule_entries")
      .select("student_id")
      .in("student_id", studentIds)
      .eq("week_start", current),
    admin
      .from("study_schedule_entries")
      .select("*")
      .in("student_id", studentIds)
      .eq("week_start", previous),
  ]);

  const alreadyFilled = new Set((currentRows ?? []).map((r) => r.student_id));
  const prevByStudent = new Map<string, StudyScheduleEntry[]>();
  for (const e of ((prevRows as StudyScheduleEntry[] | null) ?? [])) {
    if (alreadyFilled.has(e.student_id)) continue;
    if (!prevByStudent.has(e.student_id)) prevByStudent.set(e.student_id, []);
    prevByStudent.get(e.student_id)!.push(e);
  }
  if (!prevByStudent.size) return 0;

  const rows = Array.from(prevByStudent.values()).flatMap((list) =>
    list.map((e) => ({
      student_id: e.student_id,
      day_of_week: e.day_of_week,
      start_time: e.start_time,
      end_time: e.end_time,
      activity_label: e.activity_label,
      week_start: current,
      updated_by: e.updated_by,
    })),
  );
  const { error } = await admin.from("study_schedule_entries").insert(rows);
  return error ? 0 : prevByStudent.size;
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

  // Mükerrer önleme kontrolü ödev başına ayrı sorgu yerine tek sorguda yapılır.
  const [parentsByStudent, { data: existingRows }] = await Promise.all([
    getParentIdsByStudent(list.map((h) => h.student_id)),
    admin
      .from("notifications")
      .select("link")
      .eq("type", "homework_due_soon")
      .in("link", list.map((h) => `/student/homework?due=${h.id}`)),
  ]);
  const alreadyNotified = new Set((existingRows ?? []).map((r) => r.link));

  let notified = 0;
  for (const hw of list) {
    const studentLink = `/student/homework?due=${hw.id}`;
    const parentLink = `/parent/homework?due=${hw.id}`;

    if (alreadyNotified.has(studentLink)) continue;

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
