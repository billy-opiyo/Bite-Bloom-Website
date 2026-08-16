import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

import { exceedsMaxBodySize, isJsonContentType } from "./lib/shared/request-limits";
import { isAllowedRequestOrigin, MUTATING_METHODS } from "./lib/shared/request-origin";

const authMiddleware = withAuth({
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ token }) => token?.roles?.some((role) => role === "admin" || role === "owner") ?? false,
  },
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth/");
    const contentLength = request.headers.get("content-length")?.trim();
    const hasDeclaredBody = contentLength !== "0" && Boolean(contentLength);
    if (MUTATING_METHODS.has(request.method) && !isAllowedRequestOrigin(request.headers.get("origin"), request.headers.get("host") ?? request.nextUrl.host)) {
      return NextResponse.json({ error: { code: "CSRF_ORIGIN_MISMATCH", message: "Request origin is not allowed." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    if (MUTATING_METHODS.has(request.method) && !isAuthRoute && hasDeclaredBody && !isJsonContentType(request.headers.get("content-type"))) {
      return NextResponse.json({ error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "JSON request bodies are required." } }, { status: 415, headers: { "Cache-Control": "no-store" } });
    }
    if (exceedsMaxBodySize(contentLength ?? null)) {
      return NextResponse.json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large." } }, { status: 413, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.next();
  }
  return authMiddleware(request as Parameters<typeof authMiddleware>[0], event);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
