/**
 * Form parsing and validation. Handlers collect errors into one object and
 * re-render the form with them, so a mistake never costs the user their input.
 */
export type Errors = Record<string, string>;

export class Field {
  constructor(
    private readonly form: FormData,
    private readonly errors: Errors,
  ) {}

  private raw(name: string): string {
    const value = this.form.get(name);
    return typeof value === 'string' ? value.trim() : '';
  }

  text(name: string, label: string, opts: { required?: boolean; min?: number; max?: number } = {}): string {
    const value = this.raw(name);
    const { required = false, min = 0, max = 4000 } = opts;
    if (!value) {
      if (required) this.errors[name] = `${label} is required.`;
      return '';
    }
    if (value.length < min) this.errors[name] = `${label} needs at least ${min} characters.`;
    else if (value.length > max) this.errors[name] = `${label} must be under ${max} characters.`;
    return value;
  }

  email(name: string, label = 'Email'): string {
    const value = this.raw(name).toLowerCase();
    if (!value) {
      this.errors[name] = `${label} is required.`;
      return '';
    }
    // Deliberately permissive: the verification email is the real check.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) || value.length > 254) {
      this.errors[name] = `That ${label.toLowerCase()} does not look right.`;
    }
    return value;
  }

  url(name: string, label: string, opts: { required?: boolean } = {}): string | null {
    const value = this.raw(name);
    if (!value) {
      if (opts.required) this.errors[name] = `${label} is required.`;
      return null;
    }
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const parsed = new URL(normalized);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('scheme');
      return parsed.toString();
    } catch {
      this.errors[name] = `${label} must be a valid web address.`;
      return null;
    }
  }

  int(name: string, label: string, opts: { required?: boolean; min?: number; max?: number } = {}): number | null {
    const value = this.raw(name);
    if (!value) {
      if (opts.required) this.errors[name] = `${label} is required.`;
      return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      this.errors[name] = `${label} must be a whole number.`;
      return null;
    }
    if (opts.min !== undefined && parsed < opts.min) this.errors[name] = `${label} must be at least ${opts.min}.`;
    if (opts.max !== undefined && parsed > opts.max) this.errors[name] = `${label} must be at most ${opts.max}.`;
    return parsed;
  }

  date(name: string, label: string, opts: { required?: boolean } = {}): string | null {
    const value = this.raw(name);
    if (!value) {
      if (opts.required) this.errors[name] = `${label} is required.`;
      return null;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      this.errors[name] = `${label} must be a valid date.`;
      return null;
    }
    return value;
  }

  /** A value that must come from a known option list — never trust the client. */
  choice<T extends string>(
    name: string,
    label: string,
    allowed: readonly T[],
    opts: { required?: boolean } = {},
  ): T | null {
    const value = this.raw(name);
    if (!value) {
      if (opts.required) this.errors[name] = `${label} is required.`;
      return null;
    }
    if (!(allowed as readonly string[]).includes(value)) {
      this.errors[name] = `Choose a valid ${label.toLowerCase()}.`;
      return null;
    }
    return value as T;
  }

  /** Multi-select, filtered against the allowed set. Unknown values are dropped. */
  choices(name: string, allowed: readonly string[], max = 50): string[] {
    const set = new Set(allowed);
    return this.form
      .getAll(name)
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter((v) => set.has(v))
      .slice(0, max);
  }

  /** Free text list from a comma-separated field, for proposed custom tags. */
  customTags(name: string, max: number): string[] {
    return this.raw(name)
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 1 && v.length <= 40)
      .slice(0, max);
  }

  bool(name: string): boolean {
    const value = this.form.get(name);
    return value === 'on' || value === 'true' || value === '1';
  }

  /** A checkbox that must be ticked, e.g. accepting terms. */
  consent(name: string, message: string): boolean {
    const value = this.bool(name);
    if (!value) this.errors[name] = message;
    return value;
  }
}

export function parse(form: FormData): { f: Field; errors: Errors } {
  const errors: Errors = {};
  return { f: new Field(form, errors), errors };
}

export const hasErrors = (errors: Errors): boolean => Object.keys(errors).length > 0;

/**
 * Spam trap: a field hidden from people but filled in by naive bots.
 * Paired with the rate limiter on sign-up and inquiry routes (§13).
 */
export const HONEYPOT = 'company_fax';
export const trapped = (form: FormData): boolean => Boolean(form.get(HONEYPOT));

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
