export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

type Bucket = { count: number; resetAt: number };

export class RateLimitStore {
  private static readonly DEFAULT_MAX_BUCKETS = 10_000;
  private readonly buckets = new Map<string, Bucket>();
  private readonly maxBuckets: number;

  constructor(maxBuckets = RateLimitStore.DEFAULT_MAX_BUCKETS) {
    this.maxBuckets = Math.max(1, Math.floor(maxBuckets));
  }

  check(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitDecision {
    this.pruneExpired(now);

    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.ensureCapacity();
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true };
    }
    if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
    current.count += 1;
    return { allowed: true };
  }

  private pruneExpired(now: number): void {
    this.buckets.forEach((bucket, key) => {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    });
  }

  private ensureCapacity(): void {
    while (this.buckets.size >= this.maxBuckets) {
      let oldestKey: string | undefined;
      let oldestResetAt = Number.POSITIVE_INFINITY;

      this.buckets.forEach((bucket, key) => {
        if (bucket.resetAt < oldestResetAt) {
          oldestKey = key;
          oldestResetAt = bucket.resetAt;
        }
      });

      if (oldestKey === undefined) break;
      this.buckets.delete(oldestKey);
    }
  }
}
