import { describe, it, expect } from "vitest";
import {
  THEME_COLORS,
  THEME_COLOR_VALUES,
  DEFAULT_THEME_COLOR,
  isThemeColor,
} from "@/lib/theme-colors";

describe("theme-colors", () => {
  it("tam 5 renk sunar ve mavi varsayılandır", () => {
    expect(THEME_COLORS).toHaveLength(5);
    expect(DEFAULT_THEME_COLOR).toBe("blue");
    expect(THEME_COLOR_VALUES).toEqual(["blue", "green", "purple", "rose", "orange"]);
  });

  it("her rengin değer/etiket/swatch alanı doludur", () => {
    for (const c of THEME_COLORS) {
      expect(c.value).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.swatch).toMatch(/^oklch\(/);
    }
  });

  it("isThemeColor yalnız izinli değerleri kabul eder", () => {
    expect(isThemeColor("blue")).toBe(true);
    expect(isThemeColor("green")).toBe(true);
    expect(isThemeColor("orange")).toBe(true);
    expect(isThemeColor("cyan")).toBe(false);
    expect(isThemeColor("")).toBe(false);
    expect(isThemeColor(null)).toBe(false);
    expect(isThemeColor(42)).toBe(false);
  });
});
