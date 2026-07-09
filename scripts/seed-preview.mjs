// SADECE GELİŞTİRME/ÖN İZLEME içindir. Bir yapay zeka ajanının (veya
// geliştiricinin) tüm rolleri oturum açma zahmeti olmadan gezebilmesi için
// sabit "preview.*" demo hesapları ve örnek deneme verisi oluşturur.
//
// Çalıştırma (AYRI bir dev/staging Supabase projesine bağlı .env.local ile):
//   node --env-file=.env.local scripts/seed-preview.mjs
//
// Gerekli env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//              DEV_PREVIEW_PASSWORD (preview hesaplarının şifresi).
//
// GÜVENLİK: Bu script service-role ile yazar ve RLS'i baypas eder. Prod
// veritabanına ASLA çalıştırma. Hesaplar must_change_password=false açılır ki
// önizleme girişinde şifre değiştirme ekranına takılmasın.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEV_PREVIEW_PASSWORD;
const emailDomain = process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN ?? "takip.internal";

if (process.env.NODE_ENV === "production") {
  console.error("Reddedildi: NODE_ENV=production. Önizleme seed'i yalnız dev/staging içindir.");
  process.exit(1);
}
if (!url || !serviceKey || !password) {
  console.error(
    "Gerekli env yok. NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ve DEV_PREVIEW_PASSWORD tanımlı olmalı.\n" +
      "Çalıştırma: node --env-file=.env.local scripts/seed-preview.mjs",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Verilen kullanıcıyı yoksa oluşturur, varsa id'sini döner (idempotent). */
async function ensureUser({ username, fullName, role, gradeLevel }) {
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) {
    console.log(`• ${username} zaten var.`);
    return existing.id;
  }

  const email = `${username}@${emailDomain}`;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created?.user) {
    throw new Error(`${username} auth oluşturulamadı: ${createError?.message}`);
  }
  const id = created.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id,
    role,
    username,
    full_name: fullName,
    must_change_password: false,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(id);
    throw new Error(`${username} profili oluşturulamadı: ${profileError.message}`);
  }

  if (role === "student") {
    const { error } = await admin
      .from("student_profiles")
      .insert({ id, grade_level: gradeLevel });
    if (error) throw new Error(`${username} student_profiles: ${error.message}`);
  }

  console.log(`✓ ${username} oluşturuldu.`);
  return id;
}

// Örnek denemeler (8. sınıf) — MVP örnek belgelerinin değerleri.
const DEMO_EXAMS = [
  {
    exam_name: "AYDIN GELİŞİM LGS-5",
    exam_date: "2026-06-11",
    score: 494.51,
    subjects: {
      "Türkçe": [20, 0, 0],
      "Matematik": [20, 0, 0],
      "Fen Bilimleri": [19, 1, 0],
      "T.C. İnkılap Tarihi": [10, 0, 0],
      "Din Kültürü": [10, 0, 0],
      "İngilizce": [10, 0, 0],
    },
  },
  {
    exam_name: "SİNAN KUZUCU TG LGS-7",
    exam_date: "2026-06-08",
    score: 476.76,
    subjects: {
      "Türkçe": [19, 1, 0],
      "Matematik": [19, 1, 0],
      "Fen Bilimleri": [18, 2, 0],
      "T.C. İnkılap Tarihi": [10, 0, 0],
      "Din Kültürü": [10, 0, 0],
      "İngilizce": [10, 0, 0],
    },
  },
  {
    exam_name: "ÜÇDÖRTBEŞ HAZİRAN LGS-6 SON PROVA",
    exam_date: "2026-06-03",
    score: 467.62,
    subjects: {
      "Türkçe": [17, 3, 0],
      "Matematik": [19, 1, 0],
      "Fen Bilimleri": [19, 1, 0],
      "T.C. İnkılap Tarihi": [9, 1, 0],
      "Din Kültürü": [10, 0, 0],
      "İngilizce": [10, 0, 0],
    },
  },
  {
    exam_name: "OKYANUS CLASSMATE",
    exam_date: "2025-12-07",
    score: 462.7,
    subjects: {
      "Türkçe": [19, 1, 0],
      "Matematik": [18, 2, 0],
      "Fen Bilimleri": [18, 2, 0],
      "T.C. İnkılap Tarihi": [9, 1, 0],
      "Din Kültürü": [8, 2, 0],
      "İngilizce": [10, 0, 0],
    },
  },
];

async function seedExams(studentId, teacherId) {
  const { data: current } = await admin
    .from("exams")
    .select("id")
    .eq("student_id", studentId)
    .limit(1);
  if (current && current.length > 0) {
    console.log("• Öğrencide zaten deneme var, örnek denemeler atlandı.");
    return;
  }

  for (const exam of DEMO_EXAMS) {
    const { data: examRow, error: examError } = await admin
      .from("exams")
      .insert({
        student_id: studentId,
        exam_name: exam.exam_name,
        exam_date: exam.exam_date,
        score: exam.score,
        created_by: teacherId,
      })
      .select("id")
      .single();
    if (examError || !examRow) throw new Error(`Deneme eklenemedi: ${examError?.message}`);

    const rows = Object.entries(exam.subjects).map(([subject_name, [c, i, b]]) => ({
      exam_id: examRow.id,
      subject_name,
      correct_count: c,
      incorrect_count: i,
      blank_count: b,
    }));
    const { error: subError } = await admin.from("exam_subjects").insert(rows);
    if (subError) throw new Error(`Ders sonuçları eklenemedi: ${subError.message}`);
  }
  console.log(`✓ ${DEMO_EXAMS.length} örnek deneme eklendi.`);
}

const teacherId = await ensureUser({
  username: "preview.teacher",
  fullName: "Önizleme Öğretmen",
  role: "teacher",
});
const studentId = await ensureUser({
  username: "preview.student",
  fullName: "Önizleme Öğrenci",
  role: "student",
  gradeLevel: 8,
});
const parentId = await ensureUser({
  username: "preview.parent",
  fullName: "Önizleme Veli",
  role: "parent",
});

// Veli-öğrenci bağını garanti et (idempotent).
const { data: link } = await admin
  .from("parent_student_links")
  .select("parent_id")
  .eq("parent_id", parentId)
  .eq("student_id", studentId)
  .maybeSingle();
if (!link) {
  const { error } = await admin
    .from("parent_student_links")
    .insert({ parent_id: parentId, student_id: studentId });
  if (error) throw new Error(`Veli-öğrenci bağı: ${error.message}`);
  console.log("✓ Veli öğrenciye bağlandı.");
}

await seedExams(studentId, teacherId);

console.log("\nTamam. Önizleme hesapları hazır:");
console.log("  preview.teacher / preview.student / preview.parent");
console.log("  Şifre: DEV_PREVIEW_PASSWORD env değeri");
console.log("Giriş (dev): /api/dev/preview-login?role=teacher&secret=DEV_PREVIEW_SECRET");
