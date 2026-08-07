import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const schemaMigration = readFileSync(
  fileURLToPath(
    new URL(
      "../../../supabase/migrations/20260807183025_user_guide_progress.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const grantsMigration = readFileSync(
  fileURLToPath(
    new URL(
      "../../../supabase/migrations/20260807183239_tighten_user_guide_progress_grants.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("rehber ilerleme migration'ları", () => {
  it("hesap + rehber birleşik anahtarını ve sürüm/sonuç kontrollerini kurar", () => {
    expect(schemaMigration).toContain("primary key (user_id, guide_id)");
    expect(schemaMigration).toContain("version > 0");
    expect(schemaMigration).toContain("outcome in ('completed', 'skipped')");
  });

  it("RLS'i açar ve her işlemde auth.uid sahipliğini zorlar", () => {
    expect(schemaMigration).toContain(
      "alter table public.user_guide_progress enable row level security",
    );
    expect(schemaMigration.match(/\(select auth\.uid\(\)\) = user_id/g)).toHaveLength(4);
    expect(schemaMigration).toContain("for select\nto authenticated");
    expect(schemaMigration).toContain("for insert\nto authenticated");
    expect(schemaMigration).toContain("for update\nto authenticated");
  });

  it("anon erişimini kapatır ve authenticated rolüne DELETE vermez", () => {
    expect(grantsMigration).toContain(
      "revoke all on table public.user_guide_progress from anon",
    );
    expect(grantsMigration).toContain(
      "grant select, insert, update on table public.user_guide_progress to authenticated",
    );
    expect(grantsMigration).not.toContain("grant delete");
  });
});
