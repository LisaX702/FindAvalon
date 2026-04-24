export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL?.trim() || null;
}

export function requireApiBaseUrl() {
  const value = getApiBaseUrl();

  if (!value) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_URL. Set NEXT_PUBLIC_API_URL in .env so the web app knows how to reach the API."
    );
  }

  return value;
}
