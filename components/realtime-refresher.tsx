"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Realtime aboneliği (FR-004, US4): kullanıcının kendi linklerindeki
 * INSERT/UPDATE/DELETE olaylarında server verisini tazeler.
 * Kanal `user_id=eq.<uid>` ile sınırlıdır (anayasa II — realtime izolasyonu).
 * Env yoksa hiçbir şey yapmaz (research D11).
 */
export function RealtimeRefresher({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel = supabase
      .channel(`links-changes-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "links",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}
