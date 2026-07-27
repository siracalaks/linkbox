"use client";

import { useState, useTransition } from "react";
import {
  signInWithPassword,
  signUpWithPassword,
  type ActionResult,
} from "@/app/actions/auth";

type Feedback = { kind: "error" | "info"; text: string } | null;

/** Giriş / kayıt formu (client) — e-posta + şifre (Auth.js Credentials). */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>) {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      if (!result) return; // redirect gerçekleşti
      if (result.ok) {
        setFeedback(result.message ? { kind: "info", text: result.message } : null);
      } else {
        setFeedback({ kind: "error", text: result.error });
      }
    });
  }

  return (
    <form
      className="flex flex-col gap-lg"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => signInWithPassword(email, password));
      }}
    >
      <div className="flex flex-col gap-sm">
        <label className="text-label-md text-on-surface-variant" htmlFor="email">
          E-posta
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-xl border border-white/10 bg-surface-container px-md py-md text-body-md outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ornek@eposta.com"
          required
          type="email"
          value={email}
        />
      </div>

      <div className="flex flex-col gap-sm">
        <label className="text-label-md text-on-surface-variant" htmlFor="password">
          Şifre
        </label>
        <input
          autoComplete="current-password"
          className="w-full rounded-xl border border-white/10 bg-surface-container px-md py-md text-body-md outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          id="password"
          minLength={6}
          name="password"
          required
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          type="password"
          value={password}
        />
      </div>

      {feedback ? (
        <p
          className={
            feedback.kind === "error"
              ? "rounded-lg bg-error/10 px-md py-sm text-body-sm text-error"
              : "rounded-lg bg-primary/10 px-md py-sm text-body-sm text-primary"
          }
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.text}
        </p>
      ) : null}

      <div className="flex flex-col gap-md">
        <button
          className="indigo-gradient-btn w-full rounded-xl py-md text-label-md text-white disabled:opacity-50"
          disabled={isPending}
          type="submit"
        >
          Giriş Yap
        </button>
        <button
          className="w-full rounded-xl border border-white/10 py-md text-label-md transition-all hover:bg-white/5 disabled:opacity-50"
          disabled={isPending}
          onClick={() => run(() => signUpWithPassword(email, password))}
          type="button"
        >
          Kayıt Ol
        </button>
      </div>
    </form>
  );
}
