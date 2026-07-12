import { describe, it, expect } from "vitest";
import {
  estimateScoreGain,
  fitScorePerNet,
  simulateKazanimGain,
} from "@/lib/exams/projection";

describe("fitScorePerNet", () => {
  it("2'den az puanlı deneme → null", () => {
    expect(fitScorePerNet([])).toBeNull();
    expect(fitScorePerNet([{ totalNet: 80, score: 400 }])).toBeNull();
    expect(
      fitScorePerNet([
        { totalNet: 80, score: 400 },
        { totalNet: 90, score: null },
      ]),
    ).toBeNull();
  });

  it("doğrusal veriyi tam uydurur (eğim = net başına puan)", () => {
    const fit = fitScorePerNet([
      { totalNet: 100, score: 300 },
      { totalNet: 110, score: 350 },
    ]);
    expect(fit).not.toBeNull();
    expect(fit!.a).toBeCloseTo(5);
    expect(fit!.b).toBeCloseTo(-200);
  });

  it("tüm netler aynıysa (belirsiz eğim) → null", () => {
    expect(
      fitScorePerNet([
        { totalNet: 100, score: 300 },
        { totalNet: 100, score: 350 },
      ]),
    ).toBeNull();
  });

  it("üç nokta üzerinden makul eğim", () => {
    const fit = fitScorePerNet([
      { totalNet: 60, score: 320 },
      { totalNet: 70, score: 360 },
      { totalNet: 80, score: 400 },
    ]);
    expect(fit!.a).toBeCloseTo(4);
  });
});

describe("simulateKazanimGain", () => {
  it("yanlış→doğru +1.25 net, boş→doğru +1 net", () => {
    expect(simulateKazanimGain({ incorrect: 4, blank: 2 })).toBeCloseTo(7);
  });
  it("hata yoksa 0", () => {
    expect(simulateKazanimGain({ incorrect: 0, blank: 0 })).toBe(0);
  });
});

describe("estimateScoreGain", () => {
  it("Δnet × net-başına-puan", () => {
    expect(estimateScoreGain(7, 5)).toBeCloseTo(35);
  });
  it("net-başına-puan yoksa/geçersizse null", () => {
    expect(estimateScoreGain(7, null)).toBeNull();
    expect(estimateScoreGain(7, 0)).toBeNull();
    expect(estimateScoreGain(7, -2)).toBeNull();
  });
});
