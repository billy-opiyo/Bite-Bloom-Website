import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

import { exceedsMaxBodySize } from "./lib/shared/request-limits";

const authMiddleware = withAuth({
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ token }) => token?.roles?.some((role) => role === "admin" || role === "owner") ?? false,
  },
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (exceedsMaxBodySize(request.headers.get("content-length"))) {
      return NextResponse.json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large." } }, { status: 413, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.next();
  }
  return authMiddleware(request as Parameters<typeof authMiddleware>[0], event);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
