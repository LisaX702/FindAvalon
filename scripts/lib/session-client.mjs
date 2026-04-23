function normalizeCookiePath(pathname) {
  if (!pathname || !pathname.startsWith("/")) {
    return "/";
  }

  return pathname;
}

function domainMatches(cookieDomain, requestHost, hostOnly) {
  if (hostOnly) {
    return requestHost === cookieDomain;
  }

  return requestHost === cookieDomain || requestHost.endsWith(`.${cookieDomain}`);
}

function pathMatches(cookiePath, requestPath) {
  if (cookiePath === "/") {
    return true;
  }

  return requestPath === cookiePath || requestPath.startsWith(`${cookiePath}/`);
}

export class SessionClient {
  constructor() {
    this.cookies = [];
  }

  buildCookieHeader(url) {
    const target = new URL(url);
    const requestPath = target.pathname || "/";

    return this.cookies
      .filter((cookie) => {
        if (!domainMatches(cookie.domain, target.hostname, cookie.hostOnly)) {
          return false;
        }

        if (!pathMatches(cookie.path, requestPath)) {
          return false;
        }

        if (cookie.secure && target.protocol !== "https:") {
          return false;
        }

        return true;
      })
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
  }

  absorbCookies(response, url) {
    const sourceUrl = new URL(url);
    const setCookies = response.headers.getSetCookie?.() ?? [];

    for (const cookie of setCookies) {
      const [pair, ...attributes] = cookie.split(";");
      const [name, ...rest] = pair.split("=");
      const value = rest.join("=");

      if (!name || !value) {
        continue;
      }

      const parsed = {
        name: name.trim(),
        value: value.trim(),
        domain: sourceUrl.hostname,
        hostOnly: true,
        path: "/",
        secure: false
      };

      for (const attribute of attributes) {
        const [rawKey, ...rawValue] = attribute.trim().split("=");
        const key = rawKey.toLowerCase();
        const attributeValue = rawValue.join("=").trim();

        if (key === "domain" && attributeValue) {
          parsed.domain = attributeValue.replace(/^\./, "").toLowerCase();
          parsed.hostOnly = false;
        }

        if (key === "path" && attributeValue) {
          parsed.path = normalizeCookiePath(attributeValue);
        }

        if (key === "secure") {
          parsed.secure = true;
        }
      }

      this.cookies = this.cookies.filter(
        (existing) =>
          !(
            existing.name === parsed.name &&
            existing.domain === parsed.domain &&
            existing.path === parsed.path
          )
      );

      this.cookies.push(parsed);
    }
  }

  async request(url, init = {}) {
    const headers = new Headers(init.headers ?? {});
    const cookieHeader = this.buildCookieHeader(url);

    if (cookieHeader) {
      headers.set("cookie", cookieHeader);
    }

    const response = await fetch(url, {
      ...init,
      headers,
      redirect: "manual"
    });

    this.absorbCookies(response, url);
    return response;
  }
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function expectJson(response, label, expectedStatus) {
  const allowedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  assert(
    allowedStatuses.includes(response.status),
    `${label} failed with status ${response.status}`
  );
  return response.json();
}

export async function expectOk(response, label) {
  const body = await response.text();
  assert(response.ok, `${label} failed with status ${response.status}: ${body}`);
  return body;
}
