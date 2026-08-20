/**
 * Directory and profile queries.
 *
 * Only approved, active profiles and approved portfolio items are ever
 * returned to a public caller (plan §11). The visibility rule lives in these
 * functions rather than in the pages, so a new page cannot leak a draft.
 */
import { all, inClause, one, readList } from '../db';
import { getService, SERVICES } from '../../data/taxonomy';

export const PAGE_SIZE = 12;

export interface DirectoryFilters {
  q: string;
  serviceId: string | null;
  specialtyId: string | null;
  availability: string | null;
  skillIds: string[];
  toolIds: string[];
  stackIds: string[];
  minExperience: number | null;
  location: string | null;
  language: string | null;
  budgetMax: number | null;
  workLocation: string | null;
  verifiedOnly: boolean;
  page: number;
}

export interface DirectoryCard {
  id: string;
  handle: string | null;
  name: string;
  headline: string;
  serviceName: string;
  specialtyName: string | null;
  topTags: string[];
  yearsExperience: number | null;
  availability: string | null;
  rateMin: number | null;
  rateCurrency: string | null;
  location: string | null;
  portfolioCount: number;
}

interface CardRow {
  id: string;
  handle: string | null;
  name: string;
  headline: string | null;
  years_experience: number | null;
  availability: string | null;
  rate_min: number | null;
  rate_currency: string | null;
  location: string | null;
  featured: number;
  primary_service: string | null;
  primary_specialties: string | null;
  primary_skills: string | null;
  primary_tools: string | null;
  portfolio_count: number;
}

/** Read a directory query string into a validated filter object. */
export function readFilters(url: URL): DirectoryFilters {
  const num = (key: string): number | null => {
    const value = Number(url.searchParams.get(key));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
  };
  const serviceId = url.searchParams.get('service');
  return {
    q: (url.searchParams.get('q') ?? '').trim().slice(0, 120),
    serviceId: serviceId && getService(serviceId) ? serviceId : null,
    specialtyId: url.searchParams.get('specialty') || null,
    availability: url.searchParams.get('availability') || null,
    skillIds: url.searchParams.getAll('skill').slice(0, 12),
    toolIds: url.searchParams.getAll('tool').slice(0, 12),
    stackIds: url.searchParams.getAll('stack').slice(0, 12),
    minExperience: num('experience'),
    location: (url.searchParams.get('location') ?? '').trim().slice(0, 60) || null,
    language: (url.searchParams.get('language') ?? '').trim().slice(0, 40) || null,
    budgetMax: num('budget'),
    workLocation: url.searchParams.get('work') || null,
    verifiedOnly: url.searchParams.get('verified') === '1',
    page: Math.max(1, num('page') ?? 1),
  };
}

/** Rebuild a query string, dropping empty values. Used by pagination links. */
export function filtersToQuery(filters: DirectoryFilters, overrides: Partial<DirectoryFilters> = {}): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (merged.q) params.set('q', merged.q);
  if (merged.serviceId) params.set('service', merged.serviceId);
  if (merged.specialtyId) params.set('specialty', merged.specialtyId);
  if (merged.availability) params.set('availability', merged.availability);
  merged.skillIds.forEach((id) => params.append('skill', id));
  merged.toolIds.forEach((id) => params.append('tool', id));
  merged.stackIds.forEach((id) => params.append('stack', id));
  if (merged.minExperience) params.set('experience', String(merged.minExperience));
  if (merged.location) params.set('location', merged.location);
  if (merged.language) params.set('language', merged.language);
  if (merged.budgetMax) params.set('budget', String(merged.budgetMax));
  if (merged.workLocation) params.set('work', merged.workLocation);
  if (merged.verifiedOnly) params.set('verified', '1');
  if (merged.page > 1) params.set('page', String(merged.page));
  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * Search matches structured fields, not only the biography (§5.3):
 * `specialist_search.haystack` is rebuilt on every profile save from the
 * headline, bio, service names, specialties, skills, tools and stack.
 */
export async function searchDirectory(
  database: D1Database,
  filters: DirectoryFilters,
): Promise<{ cards: DirectoryCard[]; total: number }> {
  const where: string[] = ["p.status = 'approved'", "u.status = 'active'"];
  const params: unknown[] = [];

  if (filters.serviceId) {
    where.push('EXISTS (SELECT 1 FROM specialist_service_offerings o WHERE o.profile_id = p.id AND o.service_id = ?)');
    params.push(filters.serviceId);
  }
  if (filters.specialtyId) {
    where.push(
      "EXISTS (SELECT 1 FROM specialist_service_offerings o, json_each(o.specialties) j" +
        ' WHERE o.profile_id = p.id AND j.value = ?)',
    );
    params.push(filters.specialtyId);
  }
  if (filters.availability) {
    where.push('p.availability = ?');
    params.push(filters.availability);
  }
  if (filters.minExperience !== null) {
    where.push('p.years_experience >= ?');
    params.push(filters.minExperience);
  }
  if (filters.workLocation) {
    where.push('p.work_location = ?');
    params.push(filters.workLocation);
  }
  if (filters.budgetMax !== null) {
    where.push('(p.rate_min IS NULL OR p.rate_min <= ?)');
    params.push(filters.budgetMax);
  }
  if (filters.location) {
    where.push('(p.location LIKE ? OR p.timezone LIKE ?)');
    params.push(`%${filters.location}%`, `%${filters.location}%`);
  }
  if (filters.language) {
    where.push("EXISTS (SELECT 1 FROM json_each(p.languages) j WHERE j.value LIKE ?)");
    params.push(`%${filters.language}%`);
  }
  if (filters.verifiedOnly) {
    where.push('p.approved_at IS NOT NULL');
  }
  if (filters.q) {
    where.push('EXISTS (SELECT 1 FROM specialist_search s WHERE s.profile_id = p.id AND s.haystack LIKE ?)');
    params.push(`%${filters.q.toLowerCase()}%`);
  }

  // Tag filters are AND-ed: every selected skill/tool/stack must be present on
  // at least one of the specialist's offerings.
  for (const [column, values] of [
    ['skill_ids', filters.skillIds],
    ['tool_ids', filters.toolIds],
    ['stack_ids', filters.stackIds],
  ] as const) {
    const list = inClause(values);
    if (!list) continue;
    where.push(
      `(SELECT COUNT(DISTINCT j.value) FROM specialist_service_offerings o, json_each(o.${column}) j` +
        ` WHERE o.profile_id = p.id AND j.value IN (${list.sql})) = ?`,
    );
    params.push(...list.params, values.length);
  }

  const clause = where.join(' AND ');

  const totalRow = await one<{ n: number }>(
    database,
    `SELECT COUNT(*) AS n FROM specialist_profiles p JOIN users u ON u.id = p.user_id WHERE ${clause}`,
    ...params,
  );

  const offset = (filters.page - 1) * PAGE_SIZE;
  const rows = await all<CardRow>(
    database,
    `SELECT p.id, p.handle, u.name, p.headline, p.years_experience, p.availability,
            p.rate_min, p.rate_currency, p.location, p.featured,
            o.service_id AS primary_service, o.specialties AS primary_specialties,
            o.skill_ids AS primary_skills, o.tool_ids AS primary_tools,
            (SELECT COUNT(*) FROM portfolio_items pi
              WHERE pi.profile_id = p.id AND pi.moderation = 'approved') AS portfolio_count
       FROM specialist_profiles p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN specialist_service_offerings o ON o.profile_id = p.id AND o.is_primary = 1
      WHERE ${clause}
      ORDER BY p.featured DESC, p.approved_at DESC
      LIMIT ? OFFSET ?`,
    ...params,
    PAGE_SIZE,
    offset,
  );

  const names = await tagNames(database);
  const specialtyNames = await specialtyLookup(database);

  const cards = rows.map((row): DirectoryCard => {
    const service = getService(row.primary_service ?? '');
    const specialties = readList(row.primary_specialties);
    const tags = [...readList(row.primary_skills), ...readList(row.primary_tools)]
      .map((id) => names.get(id))
      .filter((name): name is string => Boolean(name));
    return {
      id: row.id,
      handle: row.handle,
      name: row.name,
      headline: row.headline ?? '',
      serviceName: service?.name ?? 'Specialist',
      specialtyName: specialties[0] ? (specialtyNames.get(specialties[0]) ?? null) : null,
      topTags: tags,
      yearsExperience: row.years_experience,
      availability: row.availability,
      rateMin: row.rate_min,
      rateCurrency: row.rate_currency,
      location: row.location,
      portfolioCount: row.portfolio_count,
    };
  });

  return { cards, total: totalRow?.n ?? 0 };
}

// --- profile ----------------------------------------------------------------

export interface PublicOffering {
  serviceId: string;
  serviceName: string;
  isPrimary: boolean;
  roleName: string | null;
  specialties: string[];
  skills: string[];
  tools: string[];
  stack: string[];
}

export interface PublicProfile {
  id: string;
  handle: string;
  name: string;
  headline: string;
  bio: string;
  /** Pre-split for rendering — a regex quantifier in JSX is parsed as a brace. */
  bioLines: string[];
  yearsExperience: number | null;
  languages: string[];
  location: string | null;
  timezone: string | null;
  availability: string | null;
  workLocation: string | null;
  rateMin: number | null;
  rateMax: number | null;
  rateCurrency: string;
  rateModel: string[];
  workPreference: string[];
  turnaround: string | null;
  offerings: PublicOffering[];
  portfolio: {
    id: string;
    title: string;
    contribution: string;
    serviceName: string | null;
    mediaKey: string | null;
    externalUrl: string | null;
    clientName: string | null;
  }[];
}

/** Public profile by handle. Returns null unless the profile is approved. */
export async function loadPublicProfile(
  database: D1Database,
  handle: string,
): Promise<PublicProfile | null> {
  const row = await one<{
    id: string; handle: string; name: string; headline: string | null; bio: string | null;
    years_experience: number | null; languages: string | null; location: string | null;
    timezone: string | null; availability: string | null; work_location: string | null;
    rate_min: number | null; rate_max: number | null; rate_currency: string | null;
    rate_model: string | null; work_preference: string | null; turnaround: string | null;
  }>(
    database,
    `SELECT p.id, p.handle, u.name, p.headline, p.bio, p.years_experience, p.languages,
            p.location, p.timezone, p.availability, p.work_location, p.rate_min, p.rate_max,
            p.rate_currency, p.rate_model, p.work_preference, p.turnaround
       FROM specialist_profiles p JOIN users u ON u.id = p.user_id
      WHERE p.handle = ? AND p.status = 'approved' AND u.status = 'active'`,
    handle,
  );
  if (!row) return null;

  const offeringRows = await all<{
    service_id: string; is_primary: number; role_key: string | null;
    specialties: string; skill_ids: string; tool_ids: string; stack_ids: string;
  }>(
    database,
    `SELECT service_id, is_primary, role_key, specialties, skill_ids, tool_ids, stack_ids
       FROM specialist_service_offerings WHERE profile_id = ? ORDER BY is_primary DESC`,
    row.id,
  );

  const names = await tagNames(database);
  const specialtyNames = await specialtyLookup(database);
  const stackNames = await stackLookup(database);
  const nameOf = (map: Map<string, string>) => (id: string) => map.get(id) ?? id;

  const offerings = offeringRows.map((offering): PublicOffering => {
    const service = getService(offering.service_id);
    return {
      serviceId: offering.service_id,
      serviceName: service?.name ?? offering.service_id,
      isPrimary: offering.is_primary === 1,
      roleName: service?.roles?.find((r) => r.id === offering.role_key)?.name ?? null,
      specialties: readList(offering.specialties).map(nameOf(specialtyNames)),
      skills: readList(offering.skill_ids).map(nameOf(names)),
      tools: readList(offering.tool_ids).map(nameOf(names)),
      stack: readList(offering.stack_ids).map(nameOf(stackNames)),
    };
  });

  // Only approved portfolio items are public, and a client name appears only
  // where the specialist confirmed they have permission to show it (§8, §11).
  const portfolio = await all<{
    id: string; title: string; contribution: string; service_id: string | null;
    media_key: string | null; external_url: string | null;
    client_name: string | null; has_permission: number;
  }>(
    database,
    `SELECT id, title, contribution, service_id, media_key, external_url, client_name, has_permission
       FROM portfolio_items
      WHERE profile_id = ? AND moderation = 'approved'
      ORDER BY position, created_at`,
    row.id,
  );

  return {
    id: row.id,
    handle: row.handle,
    name: row.name,
    headline: row.headline ?? '',
    bio: row.bio ?? '',
    bioLines: (row.bio ?? '').split(/\n+/).map((l) => l.trim()).filter(Boolean),
    yearsExperience: row.years_experience,
    languages: readList(row.languages),
    location: row.location,
    timezone: row.timezone,
    availability: row.availability,
    workLocation: row.work_location,
    rateMin: row.rate_min,
    rateMax: row.rate_max,
    rateCurrency: row.rate_currency ?? 'USD',
    rateModel: readList(row.rate_model),
    workPreference: readList(row.work_preference),
    turnaround: row.turnaround,
    offerings,
    portfolio: portfolio.map((item) => ({
      id: item.id,
      title: item.title,
      contribution: item.contribution,
      serviceName: getService(item.service_id ?? '')?.name ?? null,
      mediaKey: item.media_key,
      externalUrl: item.external_url,
      clientName: item.has_permission === 1 ? item.client_name : null,
    })),
  };
}

// --- lookups ----------------------------------------------------------------

/**
 * Skill and tool display names in one map. Both tables use globally unique
 * ids, so a single lookup serves either — and merged tags resolve to the
 * name they were merged into, so `TS` renders as `TypeScript` (§5).
 */
export async function tagNames(database: D1Database): Promise<Map<string, string>> {
  const rows = await all<{ id: string; name: string; merged_name: string | null }>(
    database,
    `SELECT s.id, s.name, m.name AS merged_name FROM skills s LEFT JOIN skills m ON m.id = s.merged_into
     UNION ALL
     SELECT t.id, t.name, m.name AS merged_name FROM tools t LEFT JOIN tools m ON m.id = t.merged_into`,
  );
  return new Map(rows.map((row) => [row.id, row.merged_name ?? row.name]));
}

export async function specialtyLookup(database: D1Database): Promise<Map<string, string>> {
  const rows = await all<{ id: string; name: string }>(database, 'SELECT id, name FROM service_specialties');
  return new Map(rows.map((row) => [row.id, row.name]));
}

export async function stackLookup(database: D1Database): Promise<Map<string, string>> {
  const rows = await all<{ id: string; name: string; merged_name: string | null }>(
    database,
    'SELECT s.id, s.name, m.name AS merged_name FROM technology_stacks s LEFT JOIN technology_stacks m ON m.id = s.merged_into',
  );
  return new Map(rows.map((row) => [row.id, row.merged_name ?? row.name]));
}

/** Approved skills or tools for a service, for the filter rail and the wizard. */
export function optionsFor(
  database: D1Database,
  table: 'skills' | 'tools',
  serviceId: string | null,
): Promise<{ id: string; name: string }[]> {
  if (!serviceId) return Promise.resolve([]);
  return all<{ id: string; name: string }>(
    database,
    `SELECT id, name FROM ${table} WHERE service_id = ? AND status = 'approved' ORDER BY name`,
    serviceId,
  );
}

/** Per-service counts, used to show which services actually have people (§14). */
export async function serviceCounts(database: D1Database): Promise<Map<string, number>> {
  const rows = await all<{ service_id: string; n: number }>(
    database,
    `SELECT o.service_id, COUNT(DISTINCT o.profile_id) AS n
       FROM specialist_service_offerings o
       JOIN specialist_profiles p ON p.id = o.profile_id
      WHERE p.status = 'approved'
      GROUP BY o.service_id`,
  );
  const counts = new Map(SERVICES.map((service) => [service.id, 0]));
  for (const row of rows) counts.set(row.service_id, row.n);
  return counts;
}

// --- admin review -----------------------------------------------------------

export interface ReviewOffering {
  serviceName: string;
  isPrimary: boolean;
  roleName: string | null;
  specialties: string[];
  skills: string[];
  tools: string[];
  stack: string[];
}

export interface ReviewApplication {
  id: string;
  name: string;
  email: string;
  status: string;
  submittedAt: string | null;
  headline: string;
  bio: string;
  /** Pre-split for rendering — a regex quantifier in JSX is parsed as a brace. */
  bioLines: string[];
  yearsExperience: number | null;
  languages: string[];
  location: string | null;
  timezone: string | null;
  availability: string | null;
  workLocation: string | null;
  rateMin: number | null;
  rateMax: number | null;
  rateCurrency: string;
  rateModel: string[];
  preferredSize: string | null;
  turnaround: string | null;
  offerings: ReviewOffering[];
  portfolio: {
    id: string;
    title: string;
    contribution: string;
    mediaKey: string | null;
    externalUrl: string | null;
    clientName: string | null;
    moderation: string;
  }[];
  lastNote: string | null;
}

/**
 * Everything a reviewer needs to judge an application, in one place.
 *
 * The review card used to show a name, an email and a count. That asked an
 * admin to approve a professional's public profile without reading a word of
 * what they wrote or seeing a single thing they made. This returns the whole
 * submission — bio, capability per service, and the portfolio itself.
 */
export async function loadApplicationsForReview(database: D1Database): Promise<ReviewApplication[]> {
  const profiles = await all<{
    id: string; name: string; email: string; status: string; submitted_at: string | null;
    headline: string | null; bio: string | null; years_experience: number | null;
    languages: string | null; location: string | null; timezone: string | null;
    availability: string | null; work_location: string | null;
    rate_min: number | null; rate_max: number | null; rate_currency: string | null;
    rate_model: string | null; preferred_size: string | null; turnaround: string | null;
  }>(
    database,
    `SELECT p.id, u.name, u.email, p.status, p.submitted_at, p.headline, p.bio,
            p.years_experience, p.languages, p.location, p.timezone, p.availability,
            p.work_location, p.rate_min, p.rate_max, p.rate_currency, p.rate_model,
            p.preferred_size, p.turnaround
       FROM specialist_profiles p JOIN users u ON u.id = p.user_id
      WHERE p.status IN ('submitted','needs_changes')
      ORDER BY p.submitted_at`,
  );
  if (!profiles.length) return [];

  const ids = profiles.map((p) => p.id);
  const marks = ids.map(() => '?').join(',');

  const [offerings, portfolio, notes, tagMap, specialtyMap, stackMap] = await Promise.all([
    all<{
      profile_id: string; service_id: string; is_primary: number; role_key: string | null;
      specialties: string; skill_ids: string; tool_ids: string; stack_ids: string;
    }>(
      database,
      `SELECT profile_id, service_id, is_primary, role_key, specialties, skill_ids, tool_ids, stack_ids
         FROM specialist_service_offerings WHERE profile_id IN (${marks}) ORDER BY is_primary DESC`,
      ...ids,
    ),
    all<{
      id: string; profile_id: string; title: string; contribution: string;
      media_key: string | null; external_url: string | null; client_name: string | null;
      has_permission: number; moderation: string;
    }>(
      database,
      `SELECT id, profile_id, title, contribution, media_key, external_url, client_name,
              has_permission, moderation
         FROM portfolio_items WHERE profile_id IN (${marks}) ORDER BY position`,
      ...ids,
    ),
    all<{ profile_id: string; notes: string | null }>(
      database,
      `SELECT profile_id, notes FROM verification_reviews
        WHERE profile_id IN (${marks}) ORDER BY created_at DESC`,
      ...ids,
    ),
    tagNames(database),
    specialtyLookup(database),
    stackLookup(database),
  ]);

  const name = (map: Map<string, string>) => (id: string) => map.get(id) ?? id;

  return profiles.map((row): ReviewApplication => ({
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    submittedAt: row.submitted_at,
    headline: row.headline ?? '',
    bio: row.bio ?? '',
    bioLines: (row.bio ?? '').split(/\n+/).map((l) => l.trim()).filter(Boolean),
    yearsExperience: row.years_experience,
    languages: readList(row.languages),
    location: row.location,
    timezone: row.timezone,
    availability: row.availability,
    workLocation: row.work_location,
    rateMin: row.rate_min,
    rateMax: row.rate_max,
    rateCurrency: row.rate_currency ?? 'USD',
    rateModel: readList(row.rate_model),
    preferredSize: row.preferred_size,
    turnaround: row.turnaround,
    offerings: offerings
      .filter((o) => o.profile_id === row.id)
      .map((o) => {
        const service = getService(o.service_id);
        return {
          serviceName: service?.name ?? o.service_id,
          isPrimary: o.is_primary === 1,
          roleName: service?.roles?.find((r) => r.id === o.role_key)?.name ?? null,
          specialties: readList(o.specialties).map(name(specialtyMap)),
          skills: readList(o.skill_ids).map(name(tagMap)),
          tools: readList(o.tool_ids).map(name(tagMap)),
          stack: readList(o.stack_ids).map(name(stackMap)),
        };
      }),
    portfolio: portfolio
      .filter((item) => item.profile_id === row.id)
      .map((item) => ({
        id: item.id,
        title: item.title,
        contribution: item.contribution,
        mediaKey: item.media_key,
        externalUrl: item.external_url,
        clientName: item.has_permission === 1 ? item.client_name : null,
        moderation: item.moderation,
      })),
    lastNote: notes.find((n) => n.profile_id === row.id)?.notes ?? null,
  }));
}
