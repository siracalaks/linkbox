"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Tazeleme aralığı (US4 — plan.md "Altyapı Değişimi" gerekçesi). */
const REFRESH_INTERVAL_MS = 15_000;

/**
 * Periyodik tazeleme (FR-004, US4): Supabase Realtime yerine ~15 sn'de bir
 * `router.refresh()` ile server verisi yenilenir — aynı hesabın diğer
 * tarayıcılarındaki değişiklikler bir sonraki periyotta yansır.
 * Sekme görünür değilken tazeleme atlanır (gereksiz istek yok).
 */
export function RealtimeRefresher() {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [router]);

  return null;
}
