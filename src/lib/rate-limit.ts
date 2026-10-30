interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

/**
 * Clean up expired rate limit entries periodically.
 */
function cleanupStore() {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetAt) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Sliding window in-memory rate limiter.
 *
 * @param key Unique identifier (e.g. `login:${ip}:${email}` or `register:${ip}`)
 * @param maxAttempts Maximum allowed attempts within the window
 * @param windowSeconds Window length in seconds
 * @returns `{ allowed: boolean, remaining: number, resetAt: number }`
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; resetAt: number } {
  // Periodically clean up memory
  if (Math.random() < 0.05) {
    cleanupStore();
  }

  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || now > existing.resetAt) {
    const record: RateLimitRecord = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
    memoryStore.set(key, record);
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetAt: record.resetAt,
    };
  }

  if (existing.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Reset rate limit counter on successful action.
 */
export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}
