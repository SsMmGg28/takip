import { describe, expect, it } from "vitest";
import { isPreviewLoginEnvironment } from "@/lib/preview-login";

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
