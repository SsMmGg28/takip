import Link from "next/link";
import { BellRing, Bug, CalendarClock, KeyRound, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { BugReportDialog } from "@/components/bug-report-dialog";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { PushNotificationToggle } from "@/components/push-manager";
import { AutoRepeatToggle } from "@/components/schedule/schedule-toolbar-buttons";
import type { Profile, Role } from "@/lib/types";

const ROLE_LABELS: Record<Role, string> = {
  teacher: "Öğretmen",
  student: "Öğrenci",
  parent: "Veli",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
}

/**
 * Üç rolün ortak profil sayfası: hesap bilgileri, kişisel bilgi düzenleme ve
 * şifre değiştirme. `extra` ile role özel bölümler eklenebilir (örn. hata
 * bildirme).
 */
export async function ProfileView({
  profile,
  extra,
}: {
  profile: Profile;
  extra?: React.ReactNode;
}) {
  let gradeLevel: number | null = null;
  let scheduleAutoRepeat = false;
  if (profile.role === "student") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("student_profiles")
      .select("grade_level, schedule_auto_repeat")
      .eq("id", profile.id)
      .single();
    gradeLevel = data?.grade_level ?? null;
    scheduleAutoRepeat = Boolean(data?.schedule_auto_repeat);
  }

  return (
    <>
      <PageHeader
        title="Profilim"
        description="Hesap bilgilerin, kişisel bilgilerin ve güvenlik ayarların."
      />

      {/* Hesap kartı */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <span className="gradient-surface flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg shadow-primary/25">
            {initials(profile.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{profile.full_name}</p>
            <p className="text-sm text-muted-foreground">
              Kullanıcı adı: <span className="font-medium">{profile.username}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{ROLE_LABELS[profile.role]}</Badge>
            {gradeLevel !== null && <Badge variant="outline">{gradeLevel}. sınıf</Badge>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
                <UserRound className="h-4 w-4" />
              </span>
              Kişisel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditProfileForm
              initialFullName={profile.full_name}
              initialPhone={profile.phone}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
                <KeyRound className="h-4 w-4" />
              </span>
              Şifre Değiştir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>

      {profile.role === "student" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
                <CalendarClock className="h-4 w-4" />
              </span>
              Çalışma Programım
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Açık olduğunda önceki haftanın çalışma programı yeni haftaya otomatik
              aktarılır. Kapalıysa yeni hafta boş başlar.
            </p>
            <AutoRepeatToggle initialEnabled={scheduleAutoRepeat} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
              <BellRing className="h-4 w-4" />
            </span>
            Telefon Bildirimleri
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <p className="px-6 pb-3 text-sm text-muted-foreground">
            Bu cihazda yeni ödev, program ve duyuru güncellemeleri için bildirim izni
            verebilirsin.
          </p>
          <PushNotificationToggle />
        </CardContent>
      </Card>

      {/* Destek: sorun bildirimi öğretmen + yöneticiye anında düşer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
              <Bug className="h-4 w-4" />
            </span>
            Destek
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <BugReportDialog />
          <p className="text-sm text-muted-foreground">
            Bir sorunla mı karşılaştın? Bildirimin öğretmene ve sistem yöneticisine anında
            iletilir.
          </p>
          {profile.role === "teacher" && (
            <Link
              href="/teacher/reports"
              className="text-sm font-medium text-primary hover:underline"
            >
              Gelen hata bildirimlerini görüntüle →
            </Link>
          )}
        </CardContent>
      </Card>

      {extra}
    </>
  );
}
