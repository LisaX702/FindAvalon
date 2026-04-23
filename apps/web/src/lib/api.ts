import type {
  AuthCredentialsInput,
  ComparisonPayload,
  ComparisonSet,
  LocationDetail,
  PreferenceProfile,
  PreferenceProfileInput,
  RecommendationFeed,
  SavedLocation,
  SavedLocationRecord,
  User
} from "@relocateit/types";
import { getApiBaseUrl } from "./env";

const API_BASE_URL = getApiBaseUrl();

async function createRequestInit(init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    if (cookieHeader) {
      headers.set("cookie", cookieHeader);
    }

    return {
      ...init,
      headers,
      cache: init.cache ?? "no-store"
    } satisfies RequestInit;
  }

  return {
    ...init,
    headers,
    credentials: "include",
    cache: init.cache ?? "no-store"
  } satisfies RequestInit;
}

async function request(path: string, init: RequestInit = {}) {
  return fetch(`${API_BASE_URL}${path}`, await createRequestInit(init));
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function readNullableJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  const body = await response.text();

  if (!body) {
    return null;
  }

  return JSON.parse(body) as T;
}

export async function fetchCurrentUser() {
  const response = await request("/api/auth/me");

  if (response.status === 401) {
    return null;
  }

  return readJson<User>(response);
}

export async function signUp(payload: AuthCredentialsInput) {
  const response = await request("/api/auth/sign-up", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return readJson<{ user: User }>(response);
}

export async function signIn(payload: AuthCredentialsInput) {
  const response = await request("/api/auth/sign-in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return readJson<{ user: User }>(response);
}

export async function signOut() {
  const response = await request("/api/auth/sign-out", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  return readJson<{ signedOut: boolean }>(response);
}

export async function fetchCurrentProfile() {
  const response = await request("/api/preferences/current");

  return readNullableJson<PreferenceProfile>(response);
}

export async function savePreferenceProfile(payload: PreferenceProfileInput, profileId?: string) {
  const response = await request(
    profileId ? `/api/preferences/${profileId}` : "/api/preferences",
    {
      method: profileId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  return readJson<PreferenceProfile>(response);
}

export async function fetchRecommendations() {
  const response = await request("/api/recommendations?limit=10");

  return readJson<RecommendationFeed>(response);
}

export async function fetchLocationBySlug(slug: string) {
  const response = await request(`/api/locations/slug/${encodeURIComponent(slug)}`);

  return readJson<LocationDetail>(response);
}

export async function fetchSavedFavorites() {
  const response = await request("/api/favorites");

  return readJson<SavedLocationRecord[]>(response);
}

export async function fetchCurrentComparison() {
  const response = await request("/api/comparisons/current");

  return readJson<ComparisonSet>(response);
}

export async function fetchComparisonPayload() {
  const response = await request("/api/comparisons/payload");

  return readJson<ComparisonPayload>(response);
}

export async function saveFavorite(payload: { locationId: string; note?: string }) {
  const response = await request("/api/favorites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return readJson<SavedLocation>(response);
}

export async function removeFavorite(payload: { locationId: string }) {
  const query = new URLSearchParams(payload);
  const response = await request(`/api/favorites?${query.toString()}`, {
    method: "DELETE"
  });

  return readJson<{ removed: boolean }>(response);
}

export async function addToComparison(payload: { locationId: string }) {
  const response = await request("/api/comparisons/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return readJson<ComparisonSet>(response);
}

export async function removeFromComparison(payload: { locationId: string }) {
  const query = new URLSearchParams(payload);
  const response = await request(`/api/comparisons/items?${query.toString()}`, {
    method: "DELETE"
  });

  return readJson<{ removed: boolean; selection: ComparisonSet }>(response);
}
