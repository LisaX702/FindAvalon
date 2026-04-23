import "server-only";

import { redirect } from "next/navigation";
import { fetchCurrentUser } from "./api";

export async function requireCurrentUser() {
  const user = await fetchCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

export async function redirectIfAuthenticated() {
  const user = await fetchCurrentUser();

  if (user) {
    redirect("/");
  }
}
