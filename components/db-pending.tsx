import { DB_PENDING_MESSAGE } from "@/lib/env";

/**
 * DATABASE_URL tanımlı değilken gösterilen sade durum (research D11).
 * Uygulama env'siz de derlenir ve açılır.
 */
export function DbPending() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-md p-lg text-center"
      role="status"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[48px] text-primary">
        database
      </span>
      <h2 className="font-display text-headline-md text-on-surface">
        {DB_PENDING_MESSAGE}
      </h2>
      <p className="max-w-md text-body-sm text-on-surface-variant">
        DATABASE_URL ortam değişkeni eklendiğinde uygulama otomatik olarak
        çalışmaya başlayacak.
      </p>
    </div>
  );
}
