import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, type SupabaseMockHandle } from "@/test/supabase-mock";

const mocks = vi.hoisted(() => ({
  admin: null as unknown as SupabaseMockHandle,
  assertStudentAction: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ assertStudentAction: mocks.assertStudentAction }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => mocks.admin.client }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ refresh: mocks.refresh }));

import { setDailyGoal } from "@/lib/actions/dashboard";

beforeEach(() => {
  mocks.assertStudentAction.mockReset();
  mocks.assertStudentAction.mockResolvedValue({ id: "student-1", role: "student" });
  mocks.refresh.mockClear();
});

describe("setDailyGoal", () => {
  it("iki hedefi yalnız doğrulanmış öğrencinin profiline birlikte yazar", async () => {
    mocks.admin = createSupabaseMock({
      results: { student_profiles: [{ data: [{ id: "student-1" }] }] },
    });
    const form = new FormData();
    form.set("minutes", "60");
    form.set("questions", "80");
    await setDailyGoal(form);
    expect(mocks.admin.queries[0]?.values).toEqual({
      daily_goal_minutes: 60,
      daily_goal_questions: 80,
    });
    expect(mocks.admin.queries[0]?.filters).toContainEqual(["eq", "id", "student-1"]);
  });

  it.each([
    [0, 80],
    [1441, 80],
    [60, 0],
    [60, 2001],
  ])(
    "sınır dışındaki %s dakika / %s soru hedefini reddeder",
    async (minutes, questions) => {
      mocks.admin = createSupabaseMock();
      const form = new FormData();
      form.set("minutes", String(minutes));
      form.set("questions", String(questions));
      await expect(setDailyGoal(form)).rejects.toThrow();
      expect(mocks.admin.queries).toHaveLength(0);
    },
  );

  it("öğrenci yetkisi yoksa service-role sorgusu çalıştırmaz", async () => {
    mocks.assertStudentAction.mockRejectedValue(new Error("Yetkisiz."));
    mocks.admin = createSupabaseMock();
    await expect(setDailyGoal(new FormData())).rejects.toThrow("Yetkisiz.");
    expect(mocks.admin.queries).toHaveLength(0);
  });
});
