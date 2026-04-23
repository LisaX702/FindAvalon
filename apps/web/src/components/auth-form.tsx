"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn, signUp } from "../lib/api";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSignIn = mode === "sign-in";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(() => {
      const action = isSignIn ? signIn({ email, password }) : signUp({ email, password });

      void action
        .then(() => {
          router.push("/" as Route);
          router.refresh();
        })
        .catch((requestError) => {
          setError(requestError instanceof Error ? requestError.message : "Authentication failed.");
        });
    });
  }

  return (
    <section className="auth-grid">
      <article className="panel auth-panel auth-panel-form">
        <div>
          <p className="eyebrow">{isSignIn ? "Sign in" : "Sign up"}</p>
          <h2>{isSignIn ? "Welcome back." : "Create your account."}</h2>
          <p className="muted">
            {isSignIn
              ? "Use your email and password to open your saved preferences, shortlist, compare finalists, and current leader."
              : "Create a simple account so your preferences, shortlist, compare set, and current leader stay tied to you."}
          </p>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={isSignIn ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
            <small>
              {isSignIn
                ? "Use the password tied to your saved relocation workspace."
                : "Use at least 8 characters so your workspace stays protected."}
            </small>
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="button-row">
            <button type="submit" className="primary-button" disabled={isPending}>
              {isPending
                ? isSignIn
                  ? "Signing in..."
                  : "Creating account..."
                : isSignIn
                  ? "Sign in"
                  : "Create account"}
            </button>
            <a className="secondary-button" href={isSignIn ? "/sign-up" : "/sign-in"}>
              {isSignIn ? "Need an account?" : "Already have an account?"}
            </a>
          </div>
        </form>

        <div className="helper-panel">
          <p className="eyebrow">What happens next</p>
          <strong>{isSignIn ? "Pick up where you left off." : "You will be guided into the right first step."}</strong>
          <p className="muted">
            {isSignIn
              ? "After sign-in, you land back in your decision workspace with your dashboard, results, shortlist, and compare context ready."
              : "After sign-up, the app will help you save preferences first, then move you into recommendations, shortlist building, and finalist comparison."}
          </p>
        </div>
      </article>

      <aside className="panel auth-panel auth-panel-aside stack">
        <div>
          <p className="eyebrow">{isSignIn ? "Why sign in" : "Why create an account"}</p>
          <h2>{isSignIn ? "Reconnect with your decision flow." : "Start a guided relocation decision flow."}</h2>
          <p className="muted">
            {isSignIn
              ? "Your account keeps your saved profile, shortlist, compare finalists, and current leader in one place."
              : "Your account keeps every step aligned so your recommendations, shortlist, and compare flow all use the same priorities."}
          </p>
        </div>

        <div className="auth-benefits">
          <div className="auth-benefit-card">
            <strong>Preferences stay consistent</strong>
            <p className="muted">Save one profile and carry it through recommendations, shortlist, and compare.</p>
          </div>
          <div className="auth-benefit-card">
            <strong>Shortlist without losing context</strong>
            <p className="muted">Keep strong options visible and know which place is leading right now.</p>
          </div>
          <div className="auth-benefit-card">
            <strong>Choose with more confidence</strong>
            <p className="muted">See strengths, tradeoffs, and decision cues before you narrow down.</p>
          </div>
        </div>
      </aside>
    </section>
  );
}
