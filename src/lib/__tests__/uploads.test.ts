import { describe, it, expect } from "vitest";
import {
  ATTACHMENT_TYPES,
  MAX_UPLOAD_BYTES,
  PDF_IMAGE_TYPES,
  resolveMimeType,
  sanitizeFileName,
  validateUpload,
} from "@/lib/uploads";

describe("sanitizeFileName", () => {
  it("Türkçe karakterleri ASCII'ye çevirir, boşlukları alt çizgi yapar", () => {
    expect(sanitizeFileName("Ödev Föyü (1).PDF")).toBe("Odev_Foyu_1.pdf");
  });
  it("path traversal girişimini etkisizleştirir", () => {
    const out = sanitizeFileName("../../etc/passwd.pdf");
    expect(out).not.toContain("/");
    expect(out).not.toContain("..");
    expect(out.endsWith(".pdf")).toBe(true);
  });
  it("tamamen sembolden oluşan adda 'dosya' tabanına düşer", () => {
    expect(sanitizeFileName("###!!!.pdf")).toBe("dosya.pdf");
  });
  it("uzun tabanı 80 karakterde keser, uzantıyı korur", () => {
    const out = sanitizeFileName(`${"a".repeat(200)}.docx`);
    expect(out.length).toBeLessThanOrEqual(85);
    expect(out.endsWith(".docx")).toBe(true);
  });
  it("uzantısız adı olduğu gibi temizler", () => {
    expect(sanitizeFileName("rapor belgesi")).toBe("rapor_belgesi");
  });
});

describe("resolveMimeType", () => {
  it("file.type doluysa onu döner", () => {
    expect(resolveMimeType({ name: "x.bin", type: "application/pdf" })).toBe(
      "application/pdf",
    );
  });
  it("boş type'ta uzantıdan çözer", () => {
    expect(resolveMimeType({ name: "x.docx", type: "" })).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(resolveMimeType({ name: "x.HEIC", type: "" })).toBe("image/heic");
  });
  it("bilinmeyen uzantıda null döner", () => {
    expect(resolveMimeType({ name: "x.exe", type: "" })).toBeNull();
  });
});

describe("validateUpload", () => {
  const pdf = { name: "a.pdf", size: 1000, type: "application/pdf" };

  it("geçerli dosyada null döner", () => {
    expect(validateUpload(pdf, { accepted: PDF_IMAGE_TYPES })).toBeNull();
  });
  it("boyut aşımında Türkçe mesaj döner", () => {
    const err = validateUpload(
      { ...pdf, size: MAX_UPLOAD_BYTES + 1 },
      { accepted: PDF_IMAGE_TYPES },
    );
    expect(err).toContain("10 MB");
  });
  it("kabul edilmeyen türü reddeder", () => {
    const err = validateUpload(
      { name: "a.txt", size: 10, type: "text/plain" },
      { accepted: ATTACHMENT_TYPES },
    );
    expect(err).toContain("Desteklenmeyen dosya türü");
  });
  it("boş type + docx uzantısı ATTACHMENT_TYPES ile geçer", () => {
    expect(
      validateUpload(
        { name: "a.docx", size: 10, type: "" },
        { accepted: ATTACHMENT_TYPES },
      ),
    ).toBeNull();
  });
  it("boş type + bilinmeyen uzantı reddedilir", () => {
    expect(
      validateUpload(
        { name: "a.xyz", size: 10, type: "" },
        { accepted: ATTACHMENT_TYPES },
      ),
    ).toContain("Desteklenmeyen dosya türü");
  });
  it("Word türü yalnızca görsel kabul eden kümede reddedilir", () => {
    const err = validateUpload(
      {
        name: "a.docx",
        size: 10,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      { accepted: PDF_IMAGE_TYPES, typesLabel: "PDF veya görsel" },
    );
    expect(err).toContain("PDF veya görsel");
  });
});
