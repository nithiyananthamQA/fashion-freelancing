/**
 * Password hashing — PBKDF2-SHA256 via WebCrypto, the strongest primitive the
 * Workers runtime exposes without a native dependency.
 *
 * Stored format: `pbkdf2$<iterations>$<salt-hex>$<hash-hex>`. The iteration
 * count lives in the string so it can be raised later and old hashes still
 * verify (and get upgraded on next sign-in, see `needsRehash`).
 */
const ITERATIONS = 210_000;
const KEY_LENGTH = 32;

const hex = (buffer: ArrayBuffer | Uint8Array): string =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

const unhex = (value: string): Uint8Array =>
  new Uint8Array((value.match(/.{2}/g) ?? []).map((byte) => parseInt(byte, 16)));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    KEY_LENGTH * 8,
  );
  return hex(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${hex(salt)}$${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  const salt = parts[2];
  const expected = parts[3];
  if (!Number.isFinite(iterations) || !salt || !expected) return false;
  const actual = await derive(password, unhex(salt), iterations);
  return timingSafeEqual(actual, expected);
}

export function needsRehash(stored: string): boolean {
  return Number(stored.split('$')[1]) < ITERATIONS;
}

/** Constant-time string compare — never leak how much of a hash matched. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Minimum policy: 10+ characters. Length beats composition rules, and a short
 * clear rule is one users actually satisfy on the first try.
 */
export function passwordProblem(password: string): string | null {
  if (password.length < 10) return 'Use at least 10 characters.';
  if (password.length > 200) return 'That password is too long.';
  return null;
}
