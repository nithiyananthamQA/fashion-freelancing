/**
 * "Continue with Google" — OpenID Connect, authorization-code flow.
 *
 * The browser only ever carries a one-time `code`; it is swapped for the ID
 * token server to server, so the token never passes through the page. Three
 * values tie the round trip to the browser that started it, all kept in one
 * short-lived HttpOnly cookie:
 *
 *   state     — the callback must return it, so nobody can complete a sign-in
 *               someone else started (login CSRF)
 *   verifier  — PKCE: the code is useless without it, even if intercepted
 *   nonce     — must come back inside the ID token, so an old token can't be
 *               replayed into a new sign-in
 *
 * The ID token arrives directly from Google's token endpoint over TLS, which
 * OpenID Connect accepts in place of checking its signature (Core §3.1.3.7);
 * its claims are still checked one by one below.
 *
 * Nothing shows until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are both set.
 */
import type { APIContext } from 'astro';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);

export const GOOGLE_COOKIE = 'ff_google';
const COOKIE_PATH = '/sign-in/google';
const COOKIE_SECONDS = 10 * 60;

export const googleConfigured = (env: Env): boolean => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

/**
 * What the round trip has to carry from the start to the callback. `connect`
 * is a signed-in person adding Google to their own account; `userId` is who
 * started it, so only that same session can finish it.
 */
interface Pending { state: string; verifier: string; nonce: string; next: string | null; mode: 'signin' | 'connect'; userId: string | null }

/** The parts of the ID token sign-in relies on, after every check has passed. */
export interface GoogleIdentity { sub: string; email: string; name: string }

const base64url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const random = (length = 32): string => base64url(crypto.getRandomValues(new Uint8Array(length)));

/** The redirect URI must match one registered in Google Cloud exactly. */
export const callbackUrl = (ctx: APIContext): string => `${ctx.url.origin}${COOKIE_PATH}/callback`;

/** Remember the round trip and return the Google URL to send the browser to. */
export async function beginGoogleSignIn(
  ctx: APIContext, env: Env, next: string | null,
  connect: { userId: string } | null = null,
): Promise<string> {
  const pending: Pending = {
    state: random(), verifier: random(48), nonce: random(), next,
    mode: connect ? 'connect' : 'signin', userId: connect?.userId ?? null,
  };
  ctx.cookies.set(GOOGLE_COOKIE, JSON.stringify(pending), {
    httpOnly: true,
    secure: ctx.url.protocol === 'https:',
    // Lax still rides the top-level GET back from accounts.google.com.
    sameSite: 'lax',
    path: COOKIE_PATH,
    maxAge: COOKIE_SECONDS,
  });
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pending.verifier))));
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: callbackUrl(ctx),
    response_type: 'code',
    scope: 'openid email profile',
    state: pending.state,
    nonce: pending.nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    // someone with two Google accounts gets to choose, rather than being
    // signed in silently as whichever one the browser used last
    prompt: 'select_account',
  });
  return `${AUTH_URL}?${params}`;
}

/** The pending round trip, read once and then forgotten — a callback can't be replayed. */
export function takePending(ctx: APIContext): Pending | null {
  const raw = ctx.cookies.get(GOOGLE_COOKIE)?.value;
  ctx.cookies.delete(GOOGLE_COOKIE, { path: COOKIE_PATH });
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Pending>;
    if (typeof parsed.state !== 'string' || typeof parsed.verifier !== 'string' || typeof parsed.nonce !== 'string') return null;
    return {
      state: parsed.state, verifier: parsed.verifier, nonce: parsed.nonce,
      next: typeof parsed.next === 'string' ? parsed.next : null,
      mode: parsed.mode === 'connect' ? 'connect' : 'signin',
      userId: typeof parsed.userId === 'string' ? parsed.userId : null,
    };
  } catch {
    return null;
  }
}

/** Constant-time compare, so the state check leaks nothing through timing. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const stateMatches = (pending: Pending, returned: string | null): boolean =>
  Boolean(returned) && same(pending.state, returned!);

/**
 * Swap the code for an ID token and check every claim sign-in depends on.
 * Returns null on any failure; the reason goes to the logs, never the page.
 */
export async function finishGoogleSignIn(ctx: APIContext, env: Env, code: string, pending: Pending): Promise<GoogleIdentity | null> {
  let idToken: string | undefined;
  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: callbackUrl(ctx),
        grant_type: 'authorization_code',
        code_verifier: pending.verifier,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error('[google] token exchange failed:', response.status, (await response.text()).slice(0, 300));
      return null;
    }
    idToken = ((await response.json()) as { id_token?: string }).id_token;
  } catch (error) {
    console.error('[google] token exchange error:', error);
    return null;
  }
  if (!idToken) return null;

  let claims: Record<string, unknown>;
  try {
    const payload = idToken.split('.')[1] ?? '';
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (payload.length % 4)) % 4);
    claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))));
  } catch {
    console.error('[google] unreadable id token');
    return null;
  }

  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const problems = [
    !ISSUERS.has(String(claims.iss)) && 'issuer',
    !audience.includes(env.GOOGLE_CLIENT_ID) && 'audience',
    !(typeof claims.exp === 'number' && claims.exp * 1000 > Date.now()) && 'expired',
    !(typeof claims.nonce === 'string' && same(claims.nonce, pending.nonce)) && 'nonce',
    // only an address Google itself has confirmed may sign in or link
    !(claims.email_verified === true || claims.email_verified === 'true') && 'email not verified',
    !(typeof claims.sub === 'string' && claims.sub) && 'sub',
    !(typeof claims.email === 'string' && claims.email.includes('@')) && 'email',
  ].filter(Boolean);
  if (problems.length) {
    console.error('[google] id token rejected:', problems.join(', '));
    return null;
  }

  const email = String(claims.email).toLowerCase();
  const name = [claims.name, claims.given_name].find((v): v is string => typeof v === 'string' && v.trim().length > 0)?.trim()
    ?? email.split('@')[0]!;
  return { sub: String(claims.sub), email, name: name.slice(0, 120) };
}
