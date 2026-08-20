/**
 * Fixed-window rate limiting on sign-up, sign-in, inquiry and messaging
 * routes (plan §13). One D1 row per (route, identifier, window) — cheap,
 * and it survives a worker restart, unlike an in-memory counter.
 */
import { nowIso, isoIn } from './ids';
import { one, run } from './db';

export interface Limit {
  /** Requests allowed inside one window. */
  max: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export const LIMITS = {
  signUp:   { max: 5,  windowSeconds: 3600 },
  signIn:   { max: 10, windowSeconds: 900 },
  apply:    { max: 30, windowSeconds: 3600 },
  hire:     { max: 10, windowSeconds: 3600 },
  message:  { max: 60, windowSeconds: 3600 },
  upload:   { max: 40, windowSeconds: 3600 },
} as const satisfies Record<string, Limit>;

/**
 * Client address, or null when there is none.
 *
 * In production every request arrives through Cloudflare, which always sets
 * `cf-connecting-ip`. Locally there is no such header, so every caller used to
 * collapse onto the single key 'unknown' — one shared bucket for the whole
 * machine, which made five sign-ups exhaust the hour for every browser, tab and
 * test on the box.
 */
export function clientKey(request: Request): string | null {
  // ONLY cf-connecting-ip. It is set by Cloudflare and cannot be forged by the
  // caller. `x-forwarded-for` can be, so keying limits on it would let anyone
  // dodge them — and locally the dev server sets it to 127.0.0.1, which put
  // every browser and test on the machine into one shared bucket.
  return request.headers.get('cf-connecting-ip');
}

/**
 * Returns true when the caller is over the limit. The window start is folded
 * into the key so an expired window simply misses and starts a fresh row.
 */
export async function limited(
  database: D1Database,
  route: keyof typeof LIMITS,
  identifier: string | null,
): Promise<boolean> {
  // No client address, or a loopback one, means this is local development —
  // the dev runner reports 127.0.0.1 for every request, so the whole machine
  // shared a single bucket and five sign-ups exhausted the hour for every
  // browser and test on it. Cloudflare never reports a loopback client.
  if (identifier === null || identifier === '127.0.0.1' || identifier === '::1') return false;

  const { max, windowSeconds } = LIMITS[route];
  const windowStart = Math.floor(Date.now() / (windowSeconds * 1000));
  const bucket = `${route}:${identifier}:${windowStart}`;

  await run(
    database,
    `INSERT INTO rate_limits (bucket, hits, expires_at) VALUES (?, 1, ?)
       ON CONFLICT(bucket) DO UPDATE SET hits = hits + 1`,
    bucket,
    isoIn(windowSeconds * 1000),
  );

  const row = await one<{ hits: number }>(database, 'SELECT hits FROM rate_limits WHERE bucket = ?', bucket);
  return (row?.hits ?? 0) > max;
}

export const tooManyRequests = (): Response =>
  new Response('Too many requests. Please wait a few minutes and try again.', {
    status: 429,
    headers: { 'retry-after': '900', 'content-type': 'text/plain; charset=utf-8' },
  });

export { nowIso };
