import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../../../supabase/migrations/20260721221500_dashboard_daily_goals.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("dashboard günlük hedef migration'ı", () => {
  it("hedef alanlarını birlikte nullable ve sınır kontrollü tutar", () => {
    expect(migration).toContain("daily_goal_minutes between 1 and 1440");
    expect(migration).toContain("daily_goal_questions between 1 and 2000");
    expect(migration).toContain(
      "daily_goal_minutes is null and daily_goal_questions is null",
    );
  });

  it("geri alma RPC'sini security invoker ve dar execute yetkisiyle tanımlar", () => {
    expect(migration).toContain("security invoker");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain(
      "create or replace function private.undo_own_schedule_completion",
    );
    expect(migration).toContain("revoke all on schema private from public");
    expect(migration).toContain(
      "revoke execute on function public.undo_own_schedule_completion(uuid) from public",
    );
    expect(migration).toContain(
      "grant execute on function public.undo_own_schedule_completion(uuid) to authenticated",
    );
  });

  it("sahiplik ve İstanbul günü kontrolüyle iki kaydı aynı fonksiyonda geri çevirir", () => {
    expect(migration).toContain("v_student_id <> (select auth.uid())");
    expect(migration).toContain("at time zone 'Europe/Istanbul'");
    expect(migration).toContain("update public.study_schedule_entries");
    expect(migration).toContain("delete from public.study_log");
  });
});
