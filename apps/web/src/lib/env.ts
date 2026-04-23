function requireEnv(key: string, help: string) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing ${key}. ${help}`);
  }

  return value;
}

export function getApiBaseUrl() {
  return requireEnv(
    "NEXT_PUBLIC_API_URL",
    "Set NEXT_PUBLIC_API_URL in .env so the web app knows how to reach the API."
  );
}
