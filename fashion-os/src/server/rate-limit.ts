/**
 * Fixed-window rate limiting on sign-up, sign-in, inquiry and messaging
 * routes (plan §13). One D1 row per (route, identifier, window) — cheap,
 * and it survives a worker restart, unlike an in-memory counter.
 */
import { nowIso, isoIn, sha256 } from './ids';
import { one, run } from './db';

export interface Limit {
  /** Requests allowed inside one window. */
  max: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

/*
 * Sign-in is limited twice. Per address (`signIn`) stops one machine trying
 * many accounts; per account (`signInAccount`, keyed by `accountKey`) stops
 * many machines trying one — a botnet spreads its guesses so no single address
 * ever trips the first. The password-reset routes have buckets of their own:
 * they used to share `signIn`, so asking for a reset link a few times locked
 * the same person out of signing in with the password it gave them.
 */
export const LIMITS = {
  signUp:        { max: 5,  windowSeconds: 3600 },
  signIn:        { max: 10, windowSeconds: 900 },
  signInAccount: { max: 10, windowSeconds: 900 },
  /** Asking for a reset link, per address. */
  resetRequest:  { max: 5,  windowSeconds: 3600 },
  /** Reset links mailed to one account — nobody's inbox becomes a target. */
  resetAccount:  { max: 3,  windowSeconds: 3600 },
  /** Submitting a new password from a reset link, per address. */
  resetSubmit:   { max: 10, windowSeconds: 900 },
  /** Fresh verification links, per account. */
  verifyResend:  { max: 3,  windowSeconds: 3600 },
  /** Password changes from /account, per account — guesses at the current one. */
  passwordChange: { max: 5, windowSeconds: 900 },
  apply:         { max: 30, windowSeconds: 3600 },
  hire:          { max: 10, windowSeconds: 3600 },
  message:       { max: 60, windowSeconds: 3600 },
  upload:        { max: 40, windowSeconds: 3600 },
} as const satisfies Record<string, Limit>;

/**
 * Client address, or null when there is none.
 *
 * In production every request arrives through Cloudflare, which always sets
 * `cf-connecting-ip`. Locally there is no such header, so every caller used to
 * collapse onto the single key 'unknown' — one shared bucket for the whole
 * machine, which made five sign-ups exhaust the hour for every browser, tab and
 * test on the box. `limited` decides what a null means; see there.
 */
export function clientKey(request: Request): string | null {
  // ONLY cf-connecting-ip. It is set by Cloudflare and cannot be forged by the
  // caller. `x-forwarded-for` can be, so keying limits on it would let anyone
  // dodge them — and locally the dev server sets it to 127.0.0.1, which put
  // every browser and test on the machine into one shared bucket.
  return request.headers.get('cf-connecting-ip');
}

/**
 * The per-account identifier for an email address: trimmed, lower-cased and
 * hashed, so "Ann@x.com " and "ann@x.com" share one bucket and the table never
 * holds a plain copy of every address somebody typed at the sign-in form.
 */
export async function accountKey(email: string): Promise<string> {
  return `acct-${(await sha256(email.trim().toLowerCase())).slice(0, 32)}`;
}

/** The bucket for requests that arrive with no client address at all. */
const NO_ADDRESS = 'no-address';

/**
 * Returns true when the caller is over the limit. The window start is folded
 * into the key so an expired window simply misses and starts a fresh row.
 */
export async function limited(
  database: D1Database,
  route: keyof typeof LIMITS,
  identifier: string | null,
): Promise<boolean> {
  // A loopback client is local development — the dev runner reports
  // 127.0.0.1 for every request, so the whole machine shared a single bucket
  // and five sign-ups exhausted the hour for every browser and test on it.
  // Cloudflare never reports a loopback client.
  if (identifier === '127.0.0.1' || identifier === '::1') return false;
  // No address at all is local development too — but only in a dev build. In
  // production it must not be a way around the limit, so those requests share
  // one bucket: strict, but it can only ever catch traffic Cloudflare did not
  // label, never a real visitor.
  if (identifier === null && import.meta.env.DEV) return false;

  const { max, windowSeconds } = LIMITS[route];
  const windowStart = Math.floor(Date.now() / (windowSeconds * 1000));
  const bucket = `${route}:${identifier ?? NO_ADDRESS}:${windowStart}`;

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

/** How long a limit lasts, in words, for a message shown inside a form. */
export function windowInWords(route: keyof typeof LIMITS): string {
  const minutes = Math.round(LIMITS[route].windowSeconds / 60);
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? 'an hour' : `${hours} hours`;
}

export { nowIso };
