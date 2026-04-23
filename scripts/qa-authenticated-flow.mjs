import { SessionClient, assert, expectJson, expectOk } from "./lib/session-client.mjs";

const WEB_URL = process.env.WEB_URL ?? process.env.APP_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function main() {
  const session = new SessionClient();
  const stamp = `qa-${Date.now().toString(36)}`;
  const email = `${stamp}@example.com`;
  const password = "RelocateIt123!";
  const summary = [];

  const record = (label, detail) => {
    summary.push({ label, detail });
    console.log(`- ${label}: ${detail}`);
  };

  const signUpResponse = await session.request(`${API_URL}/api/auth/sign-up`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
  const signUpPayload = await expectJson(signUpResponse, "sign-up", 201);
  record("Sign up", signUpPayload.user.email);

  const meResponse = await session.request(`${API_URL}/api/auth/me`);
  const mePayload = await expectJson(meResponse, "auth me after sign-up", 200);
  record("Auth session", mePayload.email);

  const createProfileResponse = await session.request(`${API_URL}/api/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      label: "QA baseline profile",
      weights: {
        affordability: 0.14,
        jobs: 0.19,
        climate: 0.08,
        safety: 0.12,
        schools: 0.08,
        healthcare: 0.08,
        mobility: 0.17,
        lifestyle: 0.14
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

  const updateProfileResponse = await session.request(`${API_URL}/api/preferences/${profile.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      label: "QA updated profile",
      weights: {
        affordability: 0.12,
        jobs: 0.2,
        climate: 0.08,
        safety: 0.12,
        schools: 0.08,
        healthcare: 0.08,
        mobility: 0.18,
        lifestyle: 0.14
      },
      dealBreakers: {
        maxHousingCostIndex: 0.8,
        minSafetyScore: 0.54,
        minWalkabilityScore: 0.4
      }
    })
  });
  const updatedProfile = await expectJson(updateProfileResponse, "update preferences", 200);
  record("Edit preferences", updatedProfile.label);

  const recommendationsResponse = await session.request(`${API_URL}/api/recommendations?limit=5`);
  const recommendations = await expectJson(recommendationsResponse, "load recommendations", 200);
  assert(recommendations.results.length >= 2, "Expected at least two recommendations for QA flow");
  record("Load results", `${recommendations.results.length} results returned`);

  const leader = recommendations.results[0];
  const runnerUp = recommendations.results[1];

  const saveFavoriteResponse = await session.request(`${API_URL}/api/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ locationId: leader.location.id })
  });
  await expectJson(saveFavoriteResponse, "save favorite", 201);
  record("Save a place", leader.location.slug);

  const addCompareOneResponse = await session.request(`${API_URL}/api/comparisons/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ locationId: leader.location.id })
  });
  await expectJson(addCompareOneResponse, "add first compare item", 201);

  const addCompareTwoResponse = await session.request(`${API_URL}/api/comparisons/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ locationId: runnerUp.location.id })
  });
  const compareSet = await expectJson(addCompareTwoResponse, "add second compare item", 201);
  record("Add compare", `${compareSet.count} places selected`);

  const removeCompareResponse = await session.request(
    `${API_URL}/api/comparisons/items?locationId=${encodeURIComponent(runnerUp.location.id)}`,
    {
      method: "DELETE"
    }
  );
  const removeComparePayload = await expectJson(removeCompareResponse, "remove compare item", 200);
  record("Remove compare", `${removeComparePayload.selection.count} place remains`);

  await expectOk(await session.request(`${WEB_URL}/`), "load dashboard");
  record("Load dashboard", "ok");

  await expectOk(await session.request(`${WEB_URL}/results`), "load results page");
  record("Load results page", "ok");

  await expectOk(await session.request(`${WEB_URL}/saved`), "load saved page");
  record("Load saved places", "ok");

  await expectOk(await session.request(`${WEB_URL}/compare`), "load compare page");
  record("Load compare page", "ok");

  await expectOk(await session.request(`${WEB_URL}/locations/${leader.location.slug}`), "load detail page");
  record("Load detail page", leader.location.slug);

  const signOutResponse = await session.request(`${API_URL}/api/auth/sign-out`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });
  await expectJson(signOutResponse, "sign-out", [200, 201]);
  record("Sign out", "ok");

  const afterSignOutResponse = await session.request(`${API_URL}/api/auth/me`);
  assert(afterSignOutResponse.status === 401, `Expected 401 after sign-out, got ${afterSignOutResponse.status}`);

  const signInResponse = await session.request(`${API_URL}/api/auth/sign-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
  const signInPayload = await expectJson(signInResponse, "sign-in", 201);
  record("Sign in", signInPayload.user.email);

  console.log("");
  console.log("QA flow completed successfully.");
  console.log(JSON.stringify({ email, leader: leader.location.slug, summary }, null, 2));
}

main().catch((error) => {
  console.error("");
  console.error("QA flow failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
