import "server-only";

import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "CONFIGURATION_ERROR"
  | "DATABASE_UNAVAILABLE"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export function apiSuccess<T>(data: T, init?: ResponseInit): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, init);
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
): NextResponse<{ error: { code: ApiErrorCode; message: string } }> {
  return NextResponse.json({ error: { code, message } }, { status });
}
