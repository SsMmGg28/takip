"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getParentIdsByStudent, notifyUsers } from "@/lib/notifications";

function revalidateCalendarPaths() {
  refresh();
}

/** Etkinlik ilgililerine bildirim: öğrenciye özelse öğrenci+velisi, genelse tüm öğrenci+veliler. */
async function notifyEventAudience(
  studentId: string | null,
  title: string,
  dateLabel: string,
) {
  const supabase = await createClient();

  let studentIds: string[];
  let parentIds: string[];
  if (studentId) {
    studentIds = [studentId];
    const parentsByStudent = await getParentIdsByStudent([studentId]);
    parentIds = parentsByStudent.get(studentId) ?? [];
  } else {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, role")
      .in("role", ["student", "parent"]);
    studentIds = (profiles ?? []).filter((p) => p.role === "student").map((p) => p.id);
    parentIds = (profiles ?? []).filter((p) => p.role === "parent").map((p) => p.id);
  }

  const payload = {
    type: "event_created" as const,
    title: "Takvime etkinlik eklendi",
    body: `"${title}" — ${dateLabel}`,
  };
  await Promise.all([
    notifyUsers(studentIds, { ...payload, link: "/student/calendar" }),
    notifyUsers(parentIds, { ...payload, link: "/parent/calendar" }),
  ]);
}

export async function createCalendarEvent(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const studentId = String(formData.get("student_id") ?? "");
  const type = String(formData.get("type"));
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startAt = String(formData.get("start_at"));
  const recurrence =
    String(formData.get("recurrence") ?? "") === "weekly" ? "weekly" : null;

  if (!title || !startAt) throw new Error("Başlık ve tarih gerekli.");

  const { error } = await supabase.from("calendar_events").insert({
    student_id: studentId || null,
    type,
    title,
    description,
    start_at: new Date(startAt).toISOString(),
    recurrence,
    created_by: userData.user.id,
  });
  if (error) throw new Error(error.message);

  const dateLabel =
    new Date(startAt).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }) + (recurrence === "weekly" ? " (her hafta)" : "");
  await notifyEventAudience(studentId || null, title, dateLabel);

  revalidateCalendarPaths();
}

export async function updateCalendarEvent(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const id = String(formData.get("id"));
  const studentId = String(formData.get("student_id") ?? "");
  const type = String(formData.get("type"));
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startAt = String(formData.get("start_at"));
  const recurrence =
    String(formData.get("recurrence") ?? "") === "weekly" ? "weekly" : null;

  if (!title || !startAt) throw new Error("Başlık ve tarih gerekli.");

  const { error } = await supabase
    .from("calendar_events")
    .update({
      student_id: studentId || null,
      type,
      title,
      description,
      start_at: new Date(startAt).toISOString(),
      recurrence,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateCalendarPaths();
}

export async function deleteCalendarEvent(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("calendar_events").delete().eq("id", id);
  revalidateCalendarPaths();
}
