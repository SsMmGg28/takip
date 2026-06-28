export type Role = "teacher" | "student" | "parent";

export interface Profile {
  id: string;
  role: Role;
  username: string;
  full_name: string;
  phone: string | null;
  must_change_password: boolean;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  grade_level: number | null;
  notes: string | null;
}

export interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  created_at: string;
}

export type HomeworkStatus = "assigned" | "completed" | "overdue";

export interface Homework {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  assigned_date: string;
  due_date: string | null;
  status: HomeworkStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ResourceProgressStatus = "not_started" | "in_progress" | "completed";

export interface StudentResourceProgress {
  id: string;
  student_id: string;
  subject: string;
  book_title: string;
  progress_note: string | null;
  status: ResourceProgressStatus;
  updated_by: string;
  updated_at: string;
}

export type CalendarEventType = "lesson" | "homework_deadline" | "reminder";

export interface CalendarEvent {
  id: string;
  student_id: string | null;
  type: CalendarEventType;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  created_by: string;
  created_at: string;
}

export interface StudySchedureEntry {
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

export interface ExamTopic {
  id: string;
  exam_subject_id: string;
  topic_name: string;
  correct_count: number;
  incorrect_count: number;
  blank_count: number;
}
