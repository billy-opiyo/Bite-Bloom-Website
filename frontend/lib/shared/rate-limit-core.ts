export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

type Bucket = { count: number; resetAt: number };

export class RateLimitStore {
  private readonly buckets = new Map<string, Bucket>();

  check(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitDecision {
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) { this.buckets.set(key, { count: 1, resetAt: now + windowMs }); return { allowed: true }; }
    if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
    current.count += 1;
    return { allowed: true };
  }
}
