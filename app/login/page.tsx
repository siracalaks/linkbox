import { isSupabaseConfigured } from "@/lib/env";
import { DbPending } from "@/components/db-pending";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Giriş | Linkbox" };

/** Giriş ekranı: email/şifre + magic link (spec Assumptions, research D10). */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-md py-xl">
      <div className="w-full max-w-md">
        <h1 className="mb-lg text-center font-display text-display-lg-mobile font-bold tracking-tight text-primary md:text-display-lg">
          Linkbox
        </h1>
        {isSupabaseConfigured() ? (
          <div className="glass-effect rounded-xl p-lg sm:p-xl">
            <LoginForm />
          </div>
        ) : (
          <DbPending />
        )}
      </div>
    </main>
  );
}
