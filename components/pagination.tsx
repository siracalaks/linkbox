"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Keyset sayfalama footer'ı (FR-010): "Önceki" tarayıcı geçmişiyle,
 * "Sonraki" ?cursor parametresiyle ilerler; toplam sayıyı gösterir.
 */
export function Pagination({
  nextCursor,
  total,
}: {
  nextCursor: string | null;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasCursor = Boolean(searchParams.get("cursor"));

  const nextParams = new URLSearchParams(searchParams.toString());
  if (nextCursor) nextParams.set("cursor", nextCursor);
  nextParams.delete("new");

  return (
    <footer className="mt-2xl flex flex-col items-center justify-between gap-md pb-xl sm:flex-row">
      <p className="text-body-sm text-on-surface-variant">
        Toplam <span className="font-bold text-primary">{total}</span> link
      </p>
      <div className="flex items-center gap-sm">
        <button
          className="glass-effect rounded-lg px-lg py-sm text-label-md transition-all hover:bg-white/5 disabled:opacity-50"
          disabled={!hasCursor}
          onClick={() => router.back()}
          type="button"
        >
          Önceki
        </button>
        {nextCursor ? (
          <Link
            className="glass-effect rounded-lg px-lg py-sm text-label-md transition-all hover:bg-white/5"
            href={`/?${nextParams.toString()}`}
            scroll={false}
          >
            Sonraki
          </Link>
        ) : (
          <span className="glass-effect rounded-lg px-lg py-sm text-label-md opacity-50">
            Sonraki
          </span>
        )}
      </div>
    </footer>
  );
}
