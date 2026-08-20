/**
 * D1 access helpers. Every query in the app goes through one of these so the
 * binding lookup and the "no rows" case are handled in exactly one place.
 */
import type { APIContext, AstroGlobal } from 'astro';
import { env as workerEnv } from 'cloudflare:workers';

export type Ctx = APIContext | AstroGlobal;

/**
 * Cloudflare bindings. As of @astrojs/cloudflare v14 these come from the
 * `cloudflare:workers` module rather than `Astro.locals.runtime.env`; the
 * context parameter is kept so call sites read the same and so a future
 * per-request source can be swapped in without touching every caller.
 */
export function env(_ctx?: Ctx): Env {
  return workerEnv as unknown as Env;
}

export function db(ctx?: Ctx): D1Database {
  const database = env(ctx).DB;
  if (!database) {
    throw new Error(
      'D1 binding "DB" is not configured. Check wrangler.toml, and run `npm run db:migrate:local` before `npm run dev`.',
    );
  }
  return database;
}

export async function one<T>(
  database: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  return (await database.prepare(sql).bind(...params).first<T>()) ?? null;
}

export async function all<T>(
  database: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const result = await database.prepare(sql).bind(...params).all<T>();
  return result.results ?? [];
}

export async function run(
  database: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<D1Result> {
  return database.prepare(sql).bind(...params).run();
}

/** Run several statements atomically. D1 batches are transactional. */
export async function batch(database: D1Database, statements: D1PreparedStatement[]): Promise<void> {
  if (statements.length) await database.batch(statements);
}

// --- JSON columns -----------------------------------------------------------
// SQLite has no array type, so list columns are stored as JSON text. These two
// helpers keep every read defensive: a malformed value degrades to an empty
// list rather than throwing inside a page render.

export function readList(value: unknown): string[] {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export const writeList = (values: readonly string[]): string => JSON.stringify([...new Set(values)]);

/**
 * Expand a string list into `?,?,?` placeholders plus its bind values.
 * Returns null for an empty list so callers can skip the clause entirely
 * instead of emitting `IN ()`, which is a syntax error in SQLite.
 */
export function inClause(values: readonly string[]): { sql: string; params: string[] } | null {
  if (!values.length) return null;
  return { sql: values.map(() => '?').join(','), params: [...values] };
}
