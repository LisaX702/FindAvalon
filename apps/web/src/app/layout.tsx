import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppNav } from "../components/app-nav";
import { fetchCurrentUser } from "../lib/api";

export const metadata: Metadata = {
  title: "RelocateIt",
  description: "Find cities that fit your priorities with explainable recommendations."
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const currentUser = await fetchCurrentUser();

  return (
    <html lang="en">
      <body>
        <AppNav currentUser={currentUser} />
        {children}
      </body>
    </html>
  );
}
