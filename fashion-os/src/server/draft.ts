/**
 * Draft preservation across sign-in (plan §6.1).
 *
 * A visitor can fill in a hire request or a project post before they have an
 * account. Rather than throwing that work away at the sign-in wall, the form
 * body is parked in a short-lived HttpOnly cookie, and the page rehydrates
 * from it when they come back.
 *
 * Only form input lives here — never credentials, never a session. The cookie
 * is cleared the moment the draft is either restored and submitted, or the
 * flow is abandoned past its 30-minute life.
 */
import type { APIContext, AstroGlobal } from 'astro';

const MAX_AGE_SECONDS = 30 * 60;
/** Cookies are capped around 4 KB; stay well under with room for encoding. */
const MAX_BYTES = 3500;

type Ctx = APIContext | AstroGlobal;

export type Draft = Record<string, string | string[]>;

const cookieName = (kind: string): string => `ff_draft_${kind}`;

/** Serialise a submitted form into the draft cookie. Files are skipped. */
export function saveDraft(ctx: Ctx, kind: string, form: FormData): void {
  const draft: Draft = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== 'string' || key === 'password') continue;
    const existing = draft[key];
    if (existing === undefined) draft[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else draft[key] = [existing, value];
  }

  const encoded = encodeURIComponent(JSON.stringify(draft));
  // An oversized brief is dropped rather than silently truncated — a partial
  // restore would be worse than an honest empty form.
  if (encoded.length > MAX_BYTES) return;

  ctx.cookies.set(cookieName(kind), encoded, {
    httpOnly: true,
    secure: ctx.url.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Read a parked draft. Returns an empty object when there is nothing to restore. */
export function readDraft(ctx: Ctx, kind: string): Draft {
  const raw = ctx.cookies.get(cookieName(kind))?.value;
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Draft) : {};
  } catch {
    return {};
  }
}

export function clearDraft(ctx: Ctx, kind: string): void {
  ctx.cookies.delete(cookieName(kind), { path: '/' });
}

/** Single value from a draft, for prefilling an input. */
export const draftValue = (draft: Draft, key: string): string => {
  const value = draft[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
};

/** Multi-value from a draft, for prefilling checkbox groups. */
export const draftValues = (draft: Draft, key: string): string[] => {
  const value = draft[key];
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
};
