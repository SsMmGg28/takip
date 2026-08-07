import { describe, expect, it } from "vitest";
import {
  isMatchingPreviewProfile,
  isPreviewLoginEnvironment,
  isPreviewRole,
} from "@/lib/preview-login";

describe("preview login ortam kapısı", () => {
  it("yerel development ve Vercel Preview ortamında açılır", () => {
    expect(isPreviewLoginEnvironment({ NODE_ENV: "development" })).toBe(true);
    expect(
      isPreviewLoginEnvironment({ NODE_ENV: "production", VERCEL_ENV: "preview" }),
    ).toBe(true);
  });

  it("Vercel production ve diğer production ortamlarında kapalıdır", () => {
    expect(
      isPreviewLoginEnvironment({ NODE_ENV: "production", VERCEL_ENV: "production" }),
    ).toBe(false);
    expect(isPreviewLoginEnvironment({ NODE_ENV: "production" })).toBe(false);
  });
});

describe("preview login rol ve demo hesap kapısı", () => {
  it("yalnız sabit preview rollerini kabul eder", () => {
    expect(isPreviewRole("teacher")).toBe(true);
    expect(isPreviewRole("student")).toBe(true);
    expect(isPreviewRole("parent")).toBe(true);
    expect(isPreviewRole("admin")).toBe(false);
  });

  it("yalnız rolü, kullanıcı adı ve demo işareti eşleşen profili senkronize eder", () => {
    expect(
      isMatchingPreviewProfile(
        { username: "preview.student", role: "student", is_demo: true },
        "student",
      ),
    ).toBe(true);
    expect(
      isMatchingPreviewProfile(
        { username: "preview.student", role: "student", is_demo: false },
        "student",
      ),
    ).toBe(false);
    expect(
      isMatchingPreviewProfile(
        { username: "preview.teacher", role: "teacher", is_demo: true },
        "student",
      ),
    ).toBe(false);
    expect(isMatchingPreviewProfile(null, "parent")).toBe(false);
  });
});
