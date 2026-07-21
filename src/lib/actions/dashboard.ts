"use server";

import { revalidatePath } from "next/cache";
import { assertStudentAction } from "@/lib/auth";
import { assertDashboardLayout } from "@/lib/dashboard-layout";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { StoredLayoutV2 } from "@/lib/dashboard-types";
import type { Role } from "@/lib/types";

export async function saveDashboardLayout(layout: StoredLayoutV2) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Yetkisiz.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (!profile) throw new Error("Profil bulunamadı.");
  const role = profile.role as Role;
  assertDashboardLayout(role, layout);

  if (layout.selectedStudentId) {
    if (role !== "parent") throw new Error("Çocuk seçimi yalnız veliye açıktır.");
    const { data: link } = await supabase
      .from("parent_student_links")
      .select("id")
      .eq("parent_id", userData.user.id)
      .eq("student_id", layout.selectedStudentId)
      .maybeSingle();
    if (!link) throw new Error("Bu öğrenciye erişiminiz yok.");
  }

  const { error } = await supabase.from("dashboard_layouts").upsert({
    user_id: userData.user.id,
    layout,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error("Yerleşim kaydedilemedi.");
  revalidatePath(`/${role}`);
}

export async function setDailyGoal(formData: FormData) {
  const student = await assertStudentAction();
  const minutes = Number(formData.get("minutes"));
  const questions = Number(formData.get("questions"));
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
    throw new Error("Dakika hedefi 1-1440 arasında olmalı.");
  }
  if (!Number.isInteger(questions) || questions < 1 || questions > 2000) {
    throw new Error("Soru hedefi 1-2000 arasında olmalı.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("student_profiles")
    .update({ daily_goal_minutes: minutes, daily_goal_questions: questions })
    .eq("id", student.id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Günlük hedef güncellenemedi.");
  revalidatePath("/student");
  revalidatePath("/student/profile");
  revalidatePath("/teacher");
  revalidatePath("/parent");
}
