import "server-only";
import { createHash } from "node:crypto";

/**
 * Jednoduchý rate limit v paměti procesu.
 *
 * Účel je jediný: demo běží bez registrace, takže bez stropu by kdokoliv mohl
 * pálit náš API klíč. Pro jednu instanci za nginx to stačí. Až poběží víc
 * instancí, přesuň počítadlo do Redisu — rozhraní funkce zůstane stejné.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hodina

/** Kvůli GDPR neukládáme IP v čitelné podobě, jen její otisk. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
    pruneExpired(now);
    return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/** Uvolní paměť po vypršelých oknech; volá se při zápisu, ne časovačem. */
function pruneExpired(now: number): void {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * IP klienta. Za nginx reverse proxy chodí ve `X-Forwarded-For`;
 * bereme první hodnotu, protože zbytek si může nastavit klient sám.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
