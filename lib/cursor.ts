/**
 * Keyset pagination imleci (research D9): (created_at, id) çifti
 * base64url kodlu JSON olarak taşınır. OFFSET kullanılmaz (FR-010).
 */
export interface KeysetCursor {
  /** created_at — ISO 8601 zaman damgası */
  c: string;
  /** id — uuid */
  i: string;
}

/** İmleci URL'de taşınabilir base64url dizesine çevirir. */
export function encodeCursor(cursor: KeysetCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

/** Base64url imleci çözer; bozuk/eksik girdide null döner (güvenli). */
export function decodeCursor(raw: string | null | undefined): KeysetCursor | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    );
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as KeysetCursor).c === "string" &&
      typeof (parsed as KeysetCursor).i === "string" &&
      !Number.isNaN(Date.parse((parsed as KeysetCursor).c))
    ) {
      return { c: (parsed as KeysetCursor).c, i: (parsed as KeysetCursor).i };
    }
    return null;
  } catch {
    return null;
  }
}
