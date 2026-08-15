import { type NextRequest } from "next/server";
import { apiError } from "./api-response";
import { RateLimitStore } from "../shared/rate-limit-core";

const store = new RateLimitStore();

function requester(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export function enforceRateLimit(request: NextRequest, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${scope}:${requester(request)}`;
  const decision = store.check(key, limit, windowMs, now);
  if (decision.allowed === false) {
    const response = apiError("RATE_LIMITED", "Too many requests. Please try again shortly.", 429);
    response.headers.set("Retry-After", String(decision.retryAfterSeconds));
    return response;
  }
  return null;
}
