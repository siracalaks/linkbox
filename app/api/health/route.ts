import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Sağlık kontrolü: DB bağlıysa gerçek `SELECT 1` atılır.
 * Hata ayrıntısı/sır SIZDIRMAZ — yalnızca "connected" | "waiting".
 */
export async function GET() {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, db: "waiting" });
  }
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "connected" });
  } catch {
    return NextResponse.json({ ok: true, db: "waiting" });
  }
}
