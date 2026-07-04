import type { AppNotification, HomeworkStatus, Role } from "@/lib/types";

// Anasayfa widget'larının sunucudan aldığı veri sözleşmesi. Her rol aynı
// şekli doldurur; rolüne uymayan alanlar boş dizi kalır.

export interface DashboardStat {
  label: string;
  value: number | string;
  hint?: string;
}

export interface HomeworkItem {
  id: string;
  title: string;
  dueDate: string | null;
  status: HomeworkStatus;
  studentName?: string;
}

export interface ScheduleItem {
  id: string;
  day: number; // 0 = Pazartesi … 6 = Pazar
  start: string; // "HH:MM"
  end: string;
  label: string;
  studentName?: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  type: "lesson" | "reminder" | "homework_deadline";
}

export interface ExamItem {
  id: string;
  name: string;
  date: string;
  totalNet: number;
  score: number | null;
  studentName?: string;
}

export interface BookItem {
  id: string;
  name: string;
  done: number;
  total: number;
  studentName?: string;
}

export interface PendingBookItem {
  id: string;
  name: string;
  subject: string | null;
}

export interface PersonItem {
  id: string;
  name: string;
  grade: number | null;
}

// ── Yerleşim ────────────────────────────────────────────────────────────────

/** Kullanıcının kaydedilen yerleşimindeki tek widget. */
export interface LayoutItem {
  id: string;
  w: number;
  h: number;
}

export interface StoredLayout {
  version: number;
  items: LayoutItem[];
  /** Kullanıcının bilinçli olarak çıkardığı widget'lar (yeni eklenenlerden ayırt etmek için). */
  removed: string[];
}

export interface DashboardData {
  role: Role;
  firstName: string;
  stats: DashboardStat[];
  homework: HomeworkItem[];
  schedule: ScheduleItem[];
  events: EventItem[];
  exams: ExamItem[];
  books: BookItem[];
  pendingBooks: PendingBookItem[];
  people: PersonItem[];
  notifications: AppNotification[];
}
