import type { NextRequest } from "next/server";
import { requireApiBaseUrl } from "../../../lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function buildProxyHeaders(request: NextRequest) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  const cookie = request.headers.get("cookie");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (accept) {
    headers.set("accept", accept);
  }

  if (cookie) {
    headers.set("cookie", cookie);
  }

  return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const apiBaseUrl = requireApiBaseUrl();
  const { path } = await context.params;
  const upstreamUrl = new URL(`/api/${path.join("/")}${request.nextUrl.search}`, apiBaseUrl);
  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers: buildProxyHeaders(request),
    body,
    cache: "no-store",
    redirect: "manual"
  });

  const responseHeaders = new Headers();
  const setCookieValues =
    "getSetCookie" in upstreamResponse.headers
      ? upstreamResponse.headers.getSetCookie()
      : [];

  for (const [key, value] of upstreamResponse.headers.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      continue;
    }

    responseHeaders.set(key, value);
  }

  for (const value of setCookieValues) {
    responseHeaders.append("set-cookie", value);
  }

  return new Response(await upstreamResponse.arrayBuffer(), {
    status: upstreamResponse.status,
    headers: responseHeaders
  });
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

