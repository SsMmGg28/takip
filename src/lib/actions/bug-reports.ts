"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTeacherIds, notifyUsers } from "@/lib/notifications";
import type { ActionResult } from "@/lib/actions/exams";

/** Hata bildirimi oluşturur ve öğretmen + yöneticiye anında iletir. */
export async function createBugReport(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Yetkisiz." };

  const description = String(formData.get("description") ?? "").trim();
  const page = String(formData.get("page") ?? "").trim() || null;
  if (!description) return { ok: false, error: "Sorunu kısaca anlatmalısın." };
  if (description.length > 2000) return { ok: false, error: "Açıklama çok uzun." };

  const { error } = await supabase.from("bug_reports").insert({
    reporter_id: userData.user.id,
    page,
    description,
  });
  if (error) return { ok: false, error: error.message };

  const { data: reporter } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userData.user.id)
    .single();

  // Admin de teacher rolünde olduğundan getTeacherIds kapsar.
  await notifyUsers(await getTeacherIds(), {
    type: "bug_report",
    title: "Yeni hata bildirimi",
    body: `${reporter?.full_name ?? "Bir kullanıcı"}: ${description.slice(0, 100)}${
      description.length > 100 ? "..." : ""
    }`,
    link: "/teacher/reports",
  });

  refresh();
  return { ok: true };
}

/** Raporu çözüldü/açık olarak işaretler (RLS: yalnızca öğretmen). */
export async function setBugReportStatus(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["open", "resolved"].includes(status)) {
    return { ok: false, error: "Geçersiz durum." };
  }

  const { data: updated, error } = await supabase
    .from("bug_reports")
    .update({ status })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!updated?.length) return { ok: false, error: "Rapor bulunamadı veya yetkin yok." };

  refresh();
  return { ok: true };
}
