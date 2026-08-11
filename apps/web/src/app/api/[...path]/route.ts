import { NextRequest, NextResponse } from "next/server";
import { backendBaseUrl, sessionCookieOptions, TOKEN_COOKIE } from "@/lib/server/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { path: string[] } };

async function proxy(request: NextRequest, context: RouteContext) {
  const parts = context.params.path || [];
  const targetPath = parts.join("/");

  // Same-origin helper: mint a WS query token from the HttpOnly session cookie.
  if (request.method === "GET" && targetPath === "auth/ws-token") {
    const token = request.cookies.get(TOKEN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ detail: "Not authenticated", code: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ access_token: token, token_type: "bearer" });
  }

  if (request.method === "POST" && targetPath === "auth/logout") {
    const response = NextResponse.json({ message: "Logged out" });
    response.cookies.set(TOKEN_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
    return response;
  }

  const upstreamUrl = `${backendBaseUrl()}/${targetPath}${request.nextUrl.search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const session = request.cookies.get(TOKEN_COOKIE)?.value;
  if (session) {
    headers.set("authorization", `Bearer ${session}`);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, init);
  } catch {
    return NextResponse.json(
      { detail: "Upstream API unavailable", code: "upstream_unavailable" },
      { status: 502 }
    );
  }

  const isAuthExchange =
    (targetPath === "auth/login" || targetPath === "auth/signup") &&
    (request.method === "POST" || request.method === "PUT");

  if (isAuthExchange) {
    const raw = await upstream.text();
    let data: Record<string, unknown> = {};
    try {
      data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      return new NextResponse(raw, {
        status: upstream.status,
        headers: { "content-type": upstream.headers.get("content-type") || "text/plain" },
      });
    }

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    const accessToken = typeof data.access_token === "string" ? data.access_token : null;
    const body = { ...data };
    delete body.access_token;
    const response = NextResponse.json(
      { ...body, authenticated: true },
      { status: upstream.status }
    );
    if (accessToken) {
      response.cookies.set(TOKEN_COOKIE, accessToken, sessionCookieOptions());
    }
    return response;
  }

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}
export function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}
export function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}
export function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}
export function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}
