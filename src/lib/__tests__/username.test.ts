import { describe, it, expect } from "vitest";
import { usernameToEmail, normalizeUsername } from "@/lib/username";

describe("usernameToEmail", () => {
  it("kullanıcı adını temizleyip küçük harfe çevirir ve alan adı ekler", () => {
    const email = usernameToEmail("  Ali.Veli ");
    const [local, domain] = email.split("@");
    expect(local).toBe("ali.veli");
    expect(domain).toBeTruthy();
    expect(email.split("@")).toHaveLength(2);
  });
});

describe("normalizeUsername", () => {
  it("Türkçe karakterleri ascii'ye çevirir ve kelimeleri nokta ile birleştirir", () => {
    expect(normalizeUsername("Ahmet Yılmaz")).toBe("ahmet.yilmaz");
    expect(normalizeUsername("Şükrü Öztürk")).toBe("sukru.ozturk");
    expect(normalizeUsername("Çağrı Gökçe")).toBe("cagri.gokce");
  });

  it("harf/rakam dışı karakterleri atar", () => {
    expect(normalizeUsername("Ünal-Test")).toBe("unaltest");
  });

  it("sonek verilirse ekler", () => {
    expect(normalizeUsername("Ali Veli", 2)).toBe("ali.veli2");
  });
});
