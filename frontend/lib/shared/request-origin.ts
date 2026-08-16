export const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isAllowedRequestOrigin(origin: string | null, host: string | null): boolean {
  if (!origin) return true;
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
