const sections = {
  shared: [
    {
      key: "DATABASE_URL",
      help: "Set DATABASE_URL to your local PostgreSQL connection string."
    }
  ],
  api: [
    {
      key: "APP_URL",
      help: "Set APP_URL to the web origin allowed by the API, for example http://localhost:3000."
    }
  ],
  web: [
    {
      key: "NEXT_PUBLIC_API_URL",
      help: "Set NEXT_PUBLIC_API_URL to the API origin, for example http://localhost:3001."
    }
  ]
};

function validateUrlLike(value, key) {
  try {
    new URL(value);
    return null;
  } catch {
    return `${key} must be a valid absolute URL.`;
  }
}

function validateDatabaseUrl(value) {
  if (!value.startsWith("postgresql://") && !value.startsWith("postgres://")) {
    return "DATABASE_URL must start with postgresql:// or postgres://.";
  }

  return null;
}

function validateOptionalBoolean(value, key) {
  if (value !== "true" && value !== "false") {
    return `${key} must be true or false when provided.`;
  }

  return null;
}

function validateOptionalSameSite(value) {
  const normalized = value.toLowerCase();

  if (normalized !== "lax" && normalized !== "none" && normalized !== "strict") {
    return "SESSION_COOKIE_SAME_SITE must be lax, none, or strict when provided.";
  }

  return null;
}

function readChecks(mode) {
  const checks = [...sections.shared];

  if (mode === "api" || mode === "all") {
    checks.push(...sections.api);
  }

  if (mode === "web" || mode === "all") {
    checks.push(...sections.web);
  }

  return checks;
}

function main() {
  const mode = process.argv[2] ?? "all";
  const checks = readChecks(mode);
  const failures = [];

  for (const check of checks) {
    const value = process.env[check.key];

    if (!value) {
      failures.push(`${check.key} is missing. ${check.help}`);
      continue;
    }

    if (check.key === "APP_URL" || check.key === "NEXT_PUBLIC_API_URL") {
      const error = validateUrlLike(value, check.key);

      if (error) {
        failures.push(error);
      }
    }

    if (check.key === "DATABASE_URL") {
      const error = validateDatabaseUrl(value);

      if (error) {
        failures.push(error);
      }
    }
  }

  const port = process.env.PORT;

  if ((mode === "api" || mode === "all") && port) {
    const portNumber = Number(port);

    if (!Number.isInteger(portNumber) || portNumber <= 0 || portNumber > 65535) {
      failures.push("PORT must be a whole number between 1 and 65535 when provided.");
    }
  }

  const sessionCookieSecure = process.env.SESSION_COOKIE_SECURE;

  if ((mode === "api" || mode === "all") && sessionCookieSecure) {
    const error = validateOptionalBoolean(sessionCookieSecure, "SESSION_COOKIE_SECURE");

    if (error) {
      failures.push(error);
    }
  }

  const sessionCookieSameSite = process.env.SESSION_COOKIE_SAME_SITE;

  if ((mode === "api" || mode === "all") && sessionCookieSameSite) {
    const error = validateOptionalSameSite(sessionCookieSameSite);

    if (error) {
      failures.push(error);
    }

    if (sessionCookieSameSite.toLowerCase() === "none" && sessionCookieSecure !== "true") {
      failures.push("SESSION_COOKIE_SAME_SITE=none requires SESSION_COOKIE_SECURE=true.");
    }
  }

  if (failures.length > 0) {
    console.error("Environment validation failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Environment validation passed for ${mode}.`);
}

main();
