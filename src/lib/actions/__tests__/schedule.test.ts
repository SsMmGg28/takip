import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, type SupabaseMockHandle } from "@/test/supabase-mock";

const mocks = vi.hoisted(() => ({
  adminHandle: null as unknown as SupabaseMockHandle,
  assertStudentAction: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ assertStudentAction: mocks.assertStudentAction }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mocks.adminHandle.client,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/notifications", () => ({
  getParentIdsByStudent: vi.fn(),
  notifyUsers: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { setOwnScheduleAutoRepeat } from "@/lib/actions/schedule";

beforeEach(() => {
  mocks.assertStudentAction.mockReset();
  mocks.assertStudentAction.mockResolvedValue({ id: "student-1", role: "student" });
  mocks.revalidatePath.mockClear();
});

describe("setOwnScheduleAutoRepeat", () => {
  it("yalnız doğrulanmış öğrencinin kendi ayarını günceller", async () => {
    mocks.adminHandle = createSupabaseMock({
      results: { student_profiles: [{ data: [{ id: "student-1" }] }] },
    });

    await setOwnScheduleAutoRepeat(true);

    const update = mocks.adminHandle.queries.find(
      (query) => query.table === "student_profiles",
    );
    expect(update?.op).toBe("update");
    expect(update?.values).toEqual({ schedule_auto_repeat: true });
    expect(update?.filters).toContainEqual(["eq", "id", "student-1"]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/student/profile");
  });

  it("öğrenci yetkisi yoksa service-role sorgusu çalıştırmaz", async () => {
    mocks.assertStudentAction.mockRejectedValue(new Error("Yetkisiz."));
    mocks.adminHandle = createSupabaseMock();

    await expect(setOwnScheduleAutoRepeat(false)).rejects.toThrow("Yetkisiz.");
    expect(mocks.adminHandle.queries).toHaveLength(0);
  });
});
