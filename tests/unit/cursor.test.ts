import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "@/lib/cursor";

describe("keyset cursor", () => {
  it("encode/decode gidiş-dönüşü verileri korur", () => {
    const cursor = {
      c: "2026-07-26T12:00:00.000Z",
      i: "8f14e45f-ceea-4a7b-9c9d-111111111111",
    };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it("boş/eksik girdide null döner", () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor("")).toBeNull();
  });

  it("bozuk base64 girdide null döner", () => {
    expect(decodeCursor("%%%bozuk%%%")).toBeNull();
  });

  it("geçersiz tarih içeren imleçte null döner", () => {
    const raw = Buffer.from(
      JSON.stringify({ c: "tarih-değil", i: "x" }),
      "utf8"
    ).toString("base64url");
    expect(decodeCursor(raw)).toBeNull();
  });
});
