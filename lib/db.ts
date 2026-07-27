import "server-only";

import { PrismaClient } from "@prisma/client";
import { isDatabaseConfigured } from "@/lib/env";

/**
 * Lazy Prisma client — YALNIZCA sunucu tarafında.
 * DATABASE_URL yoksa null döner (research D11) — çağıran taraf
 * "Veritabanı yapılandırması bekleniyor" durumunu göstermelidir.
 * Dev hot-reload'da tek örnek için globalThis üzerinde saklanır.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb(): PrismaClient | null {
  if (!isDatabaseConfigured()) return null;
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
