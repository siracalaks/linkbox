import { describe, expect, it } from "vitest";
import { intersectLinkIds } from "@/lib/tag-filter";

describe("intersectLinkIds (AND etiket filtresi)", () => {
  const rows = [
    { link_id: "l1", tag_id: "t1" },
    { link_id: "l1", tag_id: "t2" },
    { link_id: "l2", tag_id: "t1" },
    { link_id: "l3", tag_id: "t2" },
  ];

  it("tek etikette o etiketi taşıyan tüm linkleri döndürür", () => {
    expect(intersectLinkIds(rows, ["t1"]).sort()).toEqual(["l1", "l2"]);
  });

  it("çoklu etikette AND mantığı uygular (US2-2)", () => {
    expect(intersectLinkIds(rows, ["t1", "t2"])).toEqual(["l1"]);
  });

  it("hiçbir link tüm etiketleri taşımıyorsa boş döner", () => {
    expect(intersectLinkIds(rows, ["t1", "t2", "t3"])).toEqual([]);
  });

  it("boş eşleşme listesinde boş döner", () => {
    expect(intersectLinkIds([], ["t1"])).toEqual([]);
  });
});
