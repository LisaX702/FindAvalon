"use client";

import type { User } from "@relocateit/types";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signOut } from "../lib/api";

const AUTHENTICATED_NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    match: (pathname: string) => pathname === "/"
  },
  {
    href: "/results",
    label: "Results",
    match: (pathname: string) => pathname.startsWith("/results")
  },
  {
    href: "/saved",
    label: "Saved",
    match: (pathname: string) => pathname.startsWith("/saved")
  },
  {
    href: "/compare",
    label: "Compare",
    match: (pathname: string) => pathname.startsWith("/compare")
  },
  {
    href: "/preferences",
    label: "Preferences",
    match: (pathname: string) => pathname.startsWith("/preferences")
  }
] as const;

const PUBLIC_NAV_ITEMS = [
  {
    href: "/sign-in",
    label: "Sign in",
    match: (pathname: string) => pathname.startsWith("/sign-in")
  },
  {
    href: "/sign-up",
    label: "Sign up",
    match: (pathname: string) => pathname.startsWith("/sign-up")
  }
] as const;

type AppNavProps = {
  currentUser: User | null;
};

export function AppNav({ currentUser }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const navItems = currentUser ? AUTHENTICATED_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  function handleSignOut() {
    setError(null);

    startTransition(() => {
      void signOut()
        .then(() => {
          router.push("/sign-in");
          router.refresh();
        })
        .catch((requestError) => {
          setError(requestError instanceof Error ? requestError.message : "Sign out failed.");
        });
    });
  }

  return (
    <header className="app-header">
      <div className="app-shell">
        <div className="app-brand">
          <Link href="/">
            <span className="eyebrow">RelocateIt</span>
            <strong>{currentUser ? "Relocation decision workspace" : "Find your relocation fit"}</strong>
          </Link>
        </div>

        <div className="app-nav-area">
          <nav className="app-nav" aria-label="Primary">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href as Route}
                className={item.match(pathname) ? "nav-link is-active" : "nav-link"}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {currentUser ? (
            <div className="nav-user">
              <div className="nav-account">
                <small className="eyebrow">Signed in</small>
                <strong>{currentUser.email}</strong>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSignOut}
                disabled={isPending}
              >
                {isPending ? "Signing out..." : "Sign out"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {error ? (
        <div className="app-shell">
          <small className="error-text">{error}</small>
        </div>
      ) : null}
    </header>
  );
}
