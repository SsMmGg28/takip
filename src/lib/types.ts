export type Role = "teacher" | "student" | "parent";

export interface Profile {
  id: string;
  role: Role;
  username: string;
  full_name: string;
  phone: string | null;
  must_change_password: boolean;
  /** Yönetici bayrağı: role='teacher' hesaba ek yetkiler verir; yalnızca service-role değiştirebilir. */
  is_admin?: boolean;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  grade_level: number;
  notes: string | null;
  /** Öğretmenin belirlediği hedef deneme puanı (grafikte hedef çizgisi). */
  target_score: number | null;
  /** true ise çalışma programı her hafta önceki haftadan otomatik kopyalanır. */
  schedule_auto_repeat: boolean;
  /** Öğrencinin her gün otomatik tekrarlanan hedefi; iki alan birlikte doludur. */
  daily_goal_minutes: number | null;
  daily_goal_questions: number | null;
}

export interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  created_at: string;
}

// Kaynak kitap kataloğu --------------------------------------------------

export interface ResourceBook {
  id: string;
  name: string;
  subject: string | null;
  /** Kitabın hedef sınıf düzeyi (5-8). Eski kayıtlarda null olabilir. */
  grade_level: number | null;
  /** Öğretmenin atadığı zorluk derecesi (1-5). Atanmadıysa null. */
  difficulty: number | null;
  created_by: string;
  created_at: string;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
}

export interface ResourceBookSection {
  id: string;
  book_id: string;
  name: string;
  order_index: number;
  test_count: number;
  /** Kazanım tabanlı bölümde ait olduğu ünite kodu (book-catalog); serbest bölümde null. */
  kazanim_code: string | null;
}

export interface StudentTestProgress {
  id: string;
  student_id: string;
  section_id: string;
  test_number: number;
  completed_at: string;
  marked_by: string;
}

/** Velinin çocuğunun kitaplığına eklediği kitap. */
export interface StudentBook {
  id: string;
  student_id: string;
  book_id: string;
  added_by: string;
  created_at: string;
}

// Ödev sistemi -----------------------------------------------------------

export type HomeworkStatus = "assigned" | "completed" | "incomplete" | "overdue";

export interface Homework {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  book_id: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_uploaded_at: string | null;
  status: HomeworkStatus;
  assignment_group_id: string;
  checked_at: string | null;
  /** Öğretmenin kontrol sırasında yazdığı kısa geri bildirim notu. */
  feedback: string | null;
  /** Testsiz ödevde öğrencinin "tamamladım" beyanının zamanı. */
  student_marked_done_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HomeworkTest {
  id: string;
  homework_id: string;
  section_id: string;
  test_number: number;
  completed: boolean;
  completed_at: string | null;
  /** Öğrencinin "bu testi yaptım" beyanı; öğretmen kontrolü son sözü söyler. */
  student_marked: boolean;
}

// Bildirimler --------------------------------------------------------------

export type NotificationType =
  | "homework_assigned"
  | "homework_updated"
  | "homework_incomplete"
  | "book_pending"
  | "book_approved"
  | "book_rejected"
  | "exam_created"
  | "exam_edit_requested"
  | "exam_edit_resolved"
  | "homework_due_soon"
  | "event_created"
  | "bug_report"
  | "announcement_created"
  | "schedule_assigned";

// Duyurular ---------------------------------------------------------------

export type AnnouncementAudience = "all" | "students" | "parents";
export type AnnouncementScope = "all" | "grade" | "students";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience_role: AnnouncementAudience;
  target_scope: AnnouncementScope;
  grade_level: number | null;
  attachment_path: string | null;
  attachment_name: string | null;
  created_by: string;
  created_at: string;
}

export interface BugReport {
  id: string;
  reporter_id: string;
  page: string | null;
  description: string;
  status: "open" | "resolved";
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

// Diğer (değişmeyen) ------------------------------------------------------

export type CalendarEventType = "lesson" | "homework_deadline" | "reminder";

export interface CalendarEvent {
  id: string;
  student_id: string | null;
  type: CalendarEventType;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  /** "weekly" ise etkinlik her hafta aynı gün/saatte tekrarlanır. */
  recurrence: "weekly" | null;
  created_by: string;
  created_at: string;
}

export interface StudyScheduleEntry {
  id: string;
  student_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  activity_label: string;
  /** Öğrencinin seçtiği ders; eski serbest metinli kayıtlarda null olabilir. */
  subject: string | null;
  /** Sistem kazanımı seçilmişse kodu ve görünen adı. */
  kazanim_code: string | null;
  kazanim_name: string | null;
  /** Kaydın ait olduğu haftanın Pazartesi tarihi (YYYY-MM-DD). */
  week_start: string;
  /** Çalışma günlük kaydı oluşturulduğunda dolu olur. */
  completed_at: string | null;
  completion_log_id: string | null;
  updated_by: string;
  updated_at: string;
}

/** Öğrencinin günlük çalışma kaydı (çalışma günlüğü + seri/streak). */
export interface StudyLog {
  id: string;
  student_id: string;
  /** Çalışmanın yapıldığı gün (Europe/Istanbul, YYYY-MM-DD). */
  log_date: string;
  subject: string;
  /** Kitap kataloğu ünitesi/konu adı (opsiyonel). */
  topic: string | null;
  minutes: number;
  /** Çözülen soru sayısı (opsiyonel). */
  question_count: number | null;
  note: string | null;
  created_at: string;
  marked_by: string;
}

export interface Exam {
  id: string;
  student_id: string;
  exam_name: string;
  exam_date: string;
  score: number | null;
  created_by: string;
  created_at: string;
}

export interface ExamSubject {
  id: string;
  exam_id: string;
  subject_name: string;
  correct_count: number;
  incorrect_count: number;
  blank_count: number;
}

export interface ExamKazanimResult {
  id: string;
  exam_subject_id: string;
  kazanim_code: string;
  kazanim_name: string;
  correct_count: number;
  incorrect_count: number;
  blank_count: number;
}

export type ExamEditRequestStatus = "pending" | "approved" | "rejected" | "used";

export interface ExamEditRequest {
  id: string;
  exam_id: string;
  requested_by: string;
  reason: string | null;
  status: ExamEditRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}
