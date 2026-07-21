import { describe, expect, it } from "vitest";
import {
  buildStudentPriorities,
  buildTeacherRadar,
  calculateDailyGoal,
} from "@/lib/dashboard-priority";
import type { DailyGoalSummary } from "@/lib/dashboard-types";

const emptyGoal: DailyGoalSummary = {
  minutesGoal: null,
  questionsGoal: null,
  minutesDone: 0,
  questionsDone: 0,
  completed: false,
};

describe("öğrenci öncelik motoru", () => {
  it("aktif ve 60 dakika içindeki dersi gecikmiş ödevden önce gösterir", () => {
    const items = buildStudentPriorities(
      {
        schedules: [
          {
            id: "s1",
            title: "Matematik",
            date: "2026-07-21",
            start: "14:30",
            end: "16:00",
          },
        ],
        homework: [{ id: "h1", title: "Fen ödevi", dueDate: "2026-07-20" }],
        unreadAnnouncements: [],
        goal: emptyGoal,
      },
      new Date("2026-07-21T12:00:00Z"),
    );
    expect(items.map((item) => item.kind)).toEqual(["schedule", "homework"]);
  });

  it("gecikmiş ödevi bugün teslimden önce sıralar", () => {
    const items = buildStudentPriorities(
      {
        schedules: [],
        homework: [
          { id: "today", title: "Bugün", dueDate: "2026-07-21" },
          { id: "late", title: "Gecikmiş", dueDate: "2026-07-20" },
        ],
        unreadAnnouncements: [],
        goal: emptyGoal,
      },
      new Date("2026-07-21T09:00:00Z"),
    );
    expect(items.map((item) => item.id)).toEqual(["homework-late", "homework-today"]);
  });

  it("eksik hedefi yalnız İstanbul saatiyle 18:00 sonrasında ekler", () => {
    const goal = { ...emptyGoal, minutesGoal: 60, questionsGoal: 80 };
    const input = { schedules: [], homework: [], unreadAnnouncements: [], goal };
    expect(buildStudentPriorities(input, new Date("2026-07-21T14:59:00Z"))[0].kind).toBe(
      "success",
    );
    expect(buildStudentPriorities(input, new Date("2026-07-21T15:00:00Z"))[0].kind).toBe(
      "goal",
    );
  });

  it("duyuruyu düşük öncelikte ve boş günü başarı mesajıyla gösterir", () => {
    const announcement = buildStudentPriorities({
      schedules: [],
      homework: [],
      goal: emptyGoal,
      unreadAnnouncements: [{ id: "a1", title: "Duyuru" }],
    });
    expect(announcement[0]).toMatchObject({ kind: "announcement", sortRank: 50 });
    const clear = buildStudentPriorities({
      schedules: [],
      homework: [],
      unreadAnnouncements: [],
      goal: emptyGoal,
      nextItem: { title: "Yarın Matematik", startsAt: "2026-07-22T09:00:00+03:00" },
    });
    expect(clear[0]).toMatchObject({
      kind: "success",
      startsAt: "2026-07-22T09:00:00+03:00",
    });
  });
});

describe("öğretmen radarı", () => {
  it("sabit eşikleri uygular", () => {
    const signals = buildTeacherRadar([
      {
        studentId: "s1",
        studentName: "Ada",
        overdueHomework: 1,
        missingChecksLast14Days: 2,
        hasActiveResponsibility: true,
        daysSinceStudyLog: 7,
        latestNet: 65,
        previousNet: 70,
      },
    ]);
    expect(signals.map((signal) => signal.reason)).toEqual([
      "overdue_homework",
      "missing_checks",
      "inactive_study",
      "net_drop",
    ]);
  });

  it("aktif sorumluluk yoksa çalışma kaydı eksikliğini yanlış pozitif üretmez", () => {
    const signals = buildTeacherRadar([
      {
        studentId: "s1",
        studentName: "Ada",
        overdueHomework: 0,
        missingChecksLast14Days: 1,
        hasActiveResponsibility: false,
        daysSinceStudyLog: null,
        latestNet: 66,
        previousNet: 70.99,
      },
    ]);
    expect(signals).toEqual([]);
  });
});

describe("günlük hedef toplamları", () => {
  it("yalnız verilen günün dakika ve soru kayıtlarını toplar", () => {
    expect(
      calculateDailyGoal(60, 80, [
        { minutes: 25, question_count: 30 },
        { minutes: 35, question_count: null },
        { minutes: 10, question_count: 50 },
      ]),
    ).toEqual({
      minutesGoal: 60,
      questionsGoal: 80,
      minutesDone: 70,
      questionsDone: 80,
      completed: true,
    });
  });

  it("hedef belirlenmediyse ilerlemeyi toplar fakat tamamlandı saymaz", () => {
    expect(
      calculateDailyGoal(null, null, [{ minutes: 30, question_count: 40 }]),
    ).toMatchObject({ minutesDone: 30, questionsDone: 40, completed: false });
  });
});
