import { describe, expect, it } from "vitest";
import {
  INVALID_TAG_MESSAGE,
  INVALID_URL_MESSAGE,
  NOTE_TOO_LONG_MESSAGE,
  normalizeTags,
  parseTagsInput,
  validateNote,
  validateTagName,
  validateUrl,
} from "@/lib/validation";

describe("validateUrl", () => {
  it("geçerli https URL'yi kabul eder", () => {
    const result = validateUrl("https://example.com/yol?a=1");
    expect(result.ok).toBe(true);
  });

  it("geçerli http URL'yi kabul eder", () => {
    expect(validateUrl("http://example.com").ok).toBe(true);
  });

  it("protokolsüz bozuk girdiyi reddeder (Edge Case: http//example)", () => {
    const result = validateUrl("http//example");
    expect(result).toEqual({ ok: false, error: INVALID_URL_MESSAGE });
  });

  it("http dışı protokolleri reddeder", () => {
    expect(validateUrl("ftp://example.com").ok).toBe(false);
    expect(validateUrl("javascript:alert(1)").ok).toBe(false);
  });

  it("boş girdiyi reddeder", () => {
    expect(validateUrl("   ").ok).toBe(false);
  });
});

describe("validateTagName", () => {
  it("1-50 karakter arasını kabul eder", () => {
    expect(validateTagName("yazılım").ok).toBe(true);
    expect(validateTagName("a".repeat(50)).ok).toBe(true);
  });

  it("boş etiketi reddeder (Edge Case: 0 karakter)", () => {
    expect(validateTagName("  ")).toEqual({ ok: false, error: INVALID_TAG_MESSAGE });
  });

  it("50 karakterden uzun etiketi reddeder", () => {
    expect(validateTagName("a".repeat(51))).toEqual({
      ok: false,
      error: INVALID_TAG_MESSAGE,
    });
  });
});

describe("normalizeTags", () => {
  it("küçük harfe çevirir, tekrarları ve boşları atar", () => {
    const result = normalizeTags(["Yazılım", " yazılım ", "", "Eğitim"]);
    expect(result).toEqual({ ok: true, value: ["yazılım", "eğitim"] });
  });

  it("geçersiz uzunlukta etiket varsa hata döner", () => {
    expect(normalizeTags(["ok", "a".repeat(51)]).ok).toBe(false);
  });
});

describe("validateNote", () => {
  it("boş/whitespace girdiyi null olarak kabul eder (Edge Case: not silme)", () => {
    expect(validateNote("")).toEqual({ ok: true, value: null });
    expect(validateNote("   ")).toEqual({ ok: true, value: null });
  });

  it("200 karaktere kadar kabul eder", () => {
    const note = "a".repeat(200);
    expect(validateNote(note)).toEqual({ ok: true, value: note });
  });

  it("200 karakterden uzun notu reddeder", () => {
    expect(validateNote("a".repeat(201))).toEqual({
      ok: false,
      error: NOTE_TOO_LONG_MESSAGE,
    });
  });

  it("baş/son boşlukları kırpar", () => {
    expect(validateNote("  merhaba  ")).toEqual({ ok: true, value: "merhaba" });
  });
});

describe("parseTagsInput", () => {
  it("virgülle ayrılmış girişi listeye çevirir", () => {
    expect(parseTagsInput("a, b ,, c")).toEqual(["a", "b", "c"]);
  });
});
