import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * ⚠️  Process-local: it does NOT share state across PM2 cluster workers or
 *     multiple servers. For production at scale, back this with Redis. It is
 *     still useful as a first line of defence against bursts/abuse.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map doesn't grow unbounded.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  buckets.forEach((b, key) => {
    if (b.resetAt < now) buckets.delete(key);
  });
}

function clientIp(req: NextApiRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length) return fwd[0];
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Returns true if the request is allowed; if the limit is exceeded it sends a
 * 429 response and returns false. Callers should `return` when it returns false.
 */
export function rateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  opts: { name: string; max?: number; windowMs?: number } = { name: 'default' },
): boolean {
  const max = opts.max ?? Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100);
  const windowMs = opts.windowMs ?? Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
  const now = Date.now();
  sweep(now);

  const key = `${opts.name}:${clientIp(req)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  if (bucket.count > max) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
    return false;
  }
  return true;
}
