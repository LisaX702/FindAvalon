function requireEnv(key: string, help: string) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing ${key}. ${help}`);
  }

  return value;
}

function parseUrl(key: string, value: string) {
  try {
    return new URL(value);
  } catch {
    throw new Error(`Invalid ${key}. Use a valid absolute URL.`);
  }
}

function parseOptionalBoolean(key: string) {
  const value = process.env[key];

  if (!value) {
    return null;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`Invalid ${key}. Use true or false when provided.`);
}

function parseOptionalSameSite() {
  const value = process.env.SESSION_COOKIE_SAME_SITE;

  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();

  if (normalized === "lax" || normalized === "none" || normalized === "strict") {
    return normalized;
  }

  throw new Error("Invalid SESSION_COOKIE_SAME_SITE. Use lax, none, or strict.");
}

export function readApiEnv() {
  const databaseUrl = requireEnv(
    "DATABASE_URL",
    "Set DATABASE_URL in .env before starting the API."
  );
  const appUrl = requireEnv(
    "APP_URL",
    "Set APP_URL in .env so CORS can allow the web app origin."
  );
  const appOrigin = parseUrl("APP_URL", appUrl).origin;
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  const secureOverride = parseOptionalBoolean("SESSION_COOKIE_SECURE");
  const sameSiteOverride = parseOptionalSameSite();

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("Invalid PORT. Use a whole number between 1 and 65535.");
  }

  const defaultSecure = appOrigin.startsWith("https://");
  const sessionCookieSecure = secureOverride ?? defaultSecure;
  const sessionCookieSameSite: "lax" | "none" | "strict" =
    sameSiteOverride ?? (sessionCookieSecure ? "none" : "lax");

  if (sessionCookieSameSite === "none" && !sessionCookieSecure) {
    throw new Error("SESSION_COOKIE_SAME_SITE=none requires SESSION_COOKIE_SECURE=true.");
  }

  return {
    appUrl: appOrigin,
    databaseUrl,
    port,
    sessionCookieSameSite,
    sessionCookieSecure
  };
}
