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
  | "bug_report";

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
  updated_by: string;
  updated_at: string;
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
