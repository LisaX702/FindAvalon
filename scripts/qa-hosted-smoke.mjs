import { SessionClient, assert, expectJson, expectOk } from "./lib/session-client.mjs";

const WEB_URL = process.env.HOSTED_WEB_URL ?? process.env.WEB_URL;
const API_URL = process.env.HOSTED_API_URL ?? process.env.API_URL;
const password = process.env.HOSTED_SMOKE_PASSWORD ?? "RelocateIt123!";

function parseSetCookie(header) {
  const [pair, ...attributes] = header.split(";");
  const [name, ...rest] = pair.split("=");
  const value = rest.join("=");
  const parsed = {
    name: name?.trim() ?? "",
    value: value.trim(),
    attributes: new Map()
  };

  for (const attribute of attributes) {
    const [rawKey, ...rawValue] = attribute.trim().split("=");
    parsed.attributes.set(rawKey.toLowerCase(), rawValue.join("=").trim() || true);
  }

  return parsed;
}

function requireUrl(value, name) {
  if (!value) {
    throw new Error(`${name} is required. Set it in the shell before running the hosted smoke test.`);
  }

  return value.replace(/\/$/, "");
}

async function main() {
  const hostedWebUrl = requireUrl(WEB_URL, "HOSTED_WEB_URL");
  const hostedApiUrl = requireUrl(API_URL, "HOSTED_API_URL");
  const session = new SessionClient();
  const stamp = `hosted-smoke-${Date.now().toString(36)}`;
  const email = `${stamp}@example.com`;
  const summary = [];

  const record = (label, detail) => {
    summary.push({ label, detail });
    console.log(`- ${label}: ${detail}`);
  };

  await expectOk(await session.request(`${hostedWebUrl}/`), "load public landing page");
  record("Public web", hostedWebUrl);

  const healthResponse = await session.request(`${hostedApiUrl}/api/health`);
  const healthPayload = await expectJson(healthResponse, "load api health", 200);
  assert(healthPayload.database === "ok", "Hosted API health should report database=ok.");
  record("Public API", healthPayload.service);

  const signUpResponse = await session.request(`${hostedApiUrl}/api/auth/sign-up`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
  const signUpPayload = await expectJson(signUpResponse, "sign-up", 201);
  record("Sign up", signUpPayload.user.email);

  const sessionCookieHeader = signUpResponse.headers
    .getSetCookie?.()
    ?.find((header) => header.startsWith("relocateit_session="));
  assert(sessionCookieHeader, "Expected session cookie to be set on hosted sign-up.");

  const parsedSessionCookie = parseSetCookie(sessionCookieHeader);
  assert(parsedSessionCookie.attributes.has("httponly"), "Hosted session cookie should be HttpOnly.");
  assert(parsedSessionCookie.attributes.get("path") === "/", "Hosted session cookie should use Path=/.");

  if (hostedApiUrl.startsWith("https://")) {
    assert(parsedSessionCookie.attributes.has("secure"), "Hosted HTTPS session cookie should be Secure.");
    assert(
      String(parsedSessionCookie.attributes.get("samesite")).toLowerCase() === "none",
      "Hosted HTTPS session cookie should use SameSite=None."
    );
    record("Cookie policy", "Secure + SameSite=None");
  } else {
    assert(
      String(parsedSessionCookie.attributes.get("samesite")).toLowerCase() === "lax",
      "HTTP session cookie should use SameSite=Lax."
    );
    record("Cookie policy", "SameSite=Lax");
  }

  const meResponse = await session.request(`${hostedApiUrl}/api/auth/me`);
  const mePayload = await expectJson(meResponse, "auth me after sign-up", 200);
  record("Auth session", mePayload.email);

  const createProfileResponse = await session.request(`${hostedApiUrl}/api/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      label: "Hosted smoke baseline profile",
      weights: {
        affordability: 0.13,
        jobs: 0.19,
        climate: 0.08,
        safety: 0.12,
        schools: 0.08,
        healthcare: 0.08,
        mobility: 0.17,
        lifestyle: 0.15
      },
      dealBreakers: {
        maxHousingCostIndex: 0.82,
        minSafetyScore: 0.52,
        minWalkabilityScore: 0.35
      }
    })
  });
  const profile = await expectJson(createProfileResponse, "create preferences", 201);
  record("Create preferences", profile.label);

  const recommendationsResponse = await session.request(`${hostedApiUrl}/api/recommendations?limit=5`);
  const recommendations = await expectJson(recommendationsResponse, "load recommendations", 200);
  assert(recommendations.results.length >= 2, "Expected at least two hosted recommendations.");
  record("Load results", `${recommendations.results.length} results returned`);

  const leader = recommendations.results[0];
  const runnerUp = recommendations.results[1];

  const saveFavoriteResponse = await session.request(`${hostedApiUrl}/api/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ locationId: leader.location.id })
  });
  await expectJson(saveFavoriteResponse, "save favorite", 201);
  record("Save favorite", leader.location.slug);

  await expectJson(
    await session.request(`${hostedApiUrl}/api/comparisons/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ locationId: leader.location.id })
    }),
    "add first compare item",
    201
  );

  const addCompareTwoResponse = await session.request(`${hostedApiUrl}/api/comparisons/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ locationId: runnerUp.location.id })
  });
  const compareSet = await expectJson(addCompareTwoResponse, "add second compare item", 201);
  record("Add compare", `${compareSet.count} places selected`);

  const removeCompareResponse = await session.request(
    `${hostedApiUrl}/api/comparisons/items?locationId=${encodeURIComponent(runnerUp.location.id)}`,
    {
      method: "DELETE"
    }
  );
  const removeComparePayload = await expectJson(removeCompareResponse, "remove compare item", 200);
  record("Remove compare", `${removeComparePayload.selection.count} place remains`);

  await expectOk(await session.request(`${hostedWebUrl}/`), "load hosted dashboard");
  record("Dashboard page", "ok");

  await expectOk(await session.request(`${hostedWebUrl}/results`), "load hosted results page");
  record("Results page", "ok");

  await expectOk(await session.request(`${hostedWebUrl}/saved`), "load hosted saved page");
  record("Saved page", "ok");

  await expectOk(await session.request(`${hostedWebUrl}/compare`), "load hosted compare page");
  record("Compare page", "ok");

  await expectOk(
    await session.request(`${hostedWebUrl}/locations/${leader.location.slug}`),
    "load hosted detail page"
  );
  record("Detail page", leader.location.slug);

  const signOutResponse = await session.request(`${hostedApiUrl}/api/auth/sign-out`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });
  await expectJson(signOutResponse, "sign-out", [200, 201]);
  record("Sign out", "ok");

  const afterSignOutResponse = await session.request(`${hostedApiUrl}/api/auth/me`);
  assert(afterSignOutResponse.status === 401, `Expected 401 after sign-out, got ${afterSignOutResponse.status}`);

  const signInResponse = await session.request(`${hostedApiUrl}/api/auth/sign-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
  const signInPayload = await expectJson(signInResponse, "sign-in", 201);
  record("Sign in", signInPayload.user.email);

  console.log("");
  console.log("Hosted smoke flow completed successfully.");
  console.log(
    JSON.stringify(
      {
        email,
        hostedWebUrl,
        hostedApiUrl,
        leader: leader.location.slug,
        summary
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("");
  console.error("Hosted smoke flow failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
