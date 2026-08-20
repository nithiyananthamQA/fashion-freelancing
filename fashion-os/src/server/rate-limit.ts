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

/** Client address, falling back to a constant so the limit still applies. */
export function clientKey(request: Request): string {
  return request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
}

/**
 * Returns true when the caller is over the limit. The window start is folded
 * into the key so an expired window simply misses and starts a fresh row.
 */
export async function limited(
  database: D1Database,
  route: keyof typeof LIMITS,
  identifier: string,
): Promise<boolean> {
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
