/**
 * Time-sortable ids. A 48-bit millisecond timestamp in Crockford base32
 * followed by 80 bits of randomness — the ULID layout, without a dependency.
 * Sorting by id therefore sorts by creation time, which keeps "newest first"
 * listings index-free.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(ms: number, length: number): string {
  let out = '';
  let value = ms;
  for (let i = length - 1; i >= 0; i--) {
    out = ALPHABET[value % 32] + out;
    value = Math.floor(value / 32);
  }
  return out;
}

function encodeRandom(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (const byte of bytes) out += ALPHABET[byte % 32];
  return out;
}

export function newId(): string {
  return encodeTime(Date.now(), 10) + encodeRandom(16);
}

/** Opaque high-entropy token for sessions, verification links and resets. */
export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 hex. Tokens are stored hashed so a database leak cannot be replayed. */
export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const nowIso = (): string => new Date().toISOString();

export const isoIn = (ms: number): string => new Date(Date.now() + ms).toISOString();

/**
 * URL-safe handle for a public profile, e.g. "Maya Sen" -> "maya-sen".
 * Uniqueness is enforced by the caller against specialist_profiles.handle.
 */
export function handleFromName(name: string): string {
  return (
    name
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'specialist'
  );
}
