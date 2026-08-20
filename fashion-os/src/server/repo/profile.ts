/**
 * Specialist profile writes — the application wizard's storage layer (plan §8).
 *
 * Each step saves independently, so the wizard autosaves and a freelancer can
 * leave and come back without losing anything. `rebuildSearch` runs after every
 * save that changes what the directory should match on (§5.3).
 */
import { all, one, readList, run, writeList } from '../db';
import { newId, nowIso } from '../ids';
import { getService, slug } from '../../data/taxonomy';

export interface ProfileRow {
  id: string;
  user_id: string;
  handle: string | null;
  headline: string | null;
  bio: string | null;
  years_experience: number | null;
  languages: string | null;
  location: string | null;
  timezone: string | null;
  work_preference: string | null;
  availability: string | null;
  capacity: string | null;
  turnaround: string | null;
  rate_min: number | null;
  rate_max: number | null;
  rate_currency: string | null;
  rate_model: string | null;
  preferred_size: string | null;
  work_location: string | null;
  regions: string | null;
  status: string;
  wizard_step: number;
}

export interface OfferingRow {
  id: string;
  service_id: string;
  is_primary: number;
  role_key: string | null;
  specialties: string;
  skill_ids: string;
  tool_ids: string;
  stack_ids: string;
}

export async function loadProfile(database: D1Database, userId: string): Promise<ProfileRow | null> {
  return one<ProfileRow>(database, 'SELECT * FROM specialist_profiles WHERE user_id = ?', userId);
}

/** Create the draft profile the first time someone starts the wizard. */
export async function createDraftProfile(database: D1Database, userId: string): Promise<string> {
  const id = newId();
  const now = nowIso();
  await run(
    database,
    `INSERT INTO specialist_profiles (id, user_id, status, wizard_step, created_at, updated_at)
     VALUES (?, ?, 'draft', 2, ?, ?)`,
    id, userId, now, now,
  );
  return id;
}

export const loadOfferings = (database: D1Database, profileId: string): Promise<OfferingRow[]> =>
  all<OfferingRow>(
    database,
    `SELECT id, service_id, is_primary, role_key, specialties, skill_ids, tool_ids, stack_ids
       FROM specialist_service_offerings WHERE profile_id = ? ORDER BY is_primary DESC, created_at`,
    profileId,
  );

/**
 * Replace the profile's service selection (wizard step 2a).
 * Offerings the freelancer removed are deleted; ones they kept retain their
 * specialties, skills, tools and stack, so going back a step costs nothing.
 * Specialties are set separately, by `saveSpecialties`.
 */
export async function saveServices(
  database: D1Database,
  profileId: string,
  primaryServiceId: string,
  secondaryServiceIds: string[],
): Promise<void> {
  const wanted = [primaryServiceId, ...secondaryServiceIds];
  const existing = await loadOfferings(database, profileId);
  const now = nowIso();

  const statements: D1PreparedStatement[] = [];

  for (const offering of existing) {
    if (!wanted.includes(offering.service_id)) {
      statements.push(database.prepare('DELETE FROM specialist_service_offerings WHERE id = ?').bind(offering.id));
    }
  }

  for (const serviceId of wanted) {
    const isPrimary = serviceId === primaryServiceId ? 1 : 0;
    const current = existing.find((o) => o.service_id === serviceId);
    if (current) {
      // Keep the specialties, skills and tools already chosen for a service the
      // freelancer is holding on to — only its primary/secondary role changes.
      statements.push(
        database
          .prepare('UPDATE specialist_service_offerings SET is_primary = ? WHERE id = ?')
          .bind(isPrimary, current.id),
      );
    } else {
      const specialties = writeList([]);
      statements.push(
        database
          .prepare(
            `INSERT INTO specialist_service_offerings
               (id, profile_id, service_id, is_primary, specialties, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .bind(newId(), profileId, serviceId, isPrimary, specialties, now),
      );
    }
  }

  if (statements.length) await database.batch(statements);
}

/** Save the skills, tools and stack chosen for one service (wizard step 3). */
export async function saveCapability(
  database: D1Database,
  profileId: string,
  serviceId: string,
  values: { roleKey: string | null; skillIds: string[]; toolIds: string[]; stackIds: string[] },
): Promise<void> {
  await run(
    database,
    `UPDATE specialist_service_offerings
        SET role_key = ?, skill_ids = ?, tool_ids = ?, stack_ids = ?
      WHERE profile_id = ? AND service_id = ?`,
    values.roleKey,
    writeList(values.skillIds),
    writeList(values.toolIds),
    writeList(values.stackIds),
    profileId,
    serviceId,
  );
}

/**
 * Record a skill or tool the freelancer typed themselves. It is stored as
 * `pending` so it never becomes a public filter before an admin normalizes it
 * (§5) — but it IS attached to the profile immediately, so the wizard does not
 * make them wait on a review to finish their application.
 */
export async function proposeCustomTag(
  database: D1Database,
  table: 'skills' | 'tools',
  serviceId: string,
  name: string,
  userId: string,
): Promise<string> {
  const normalized = name.trim();
  const id = `${serviceId}--${table === 'skills' ? 'skill' : 'tool'}--${slug(normalized)}`;

  // The unique index is on (service_id, name), so a value that already exists —
  // approved or pending — is reused rather than duplicated.
  const existing = await one<{ id: string }>(
    database,
    `SELECT id FROM ${table} WHERE service_id = ? AND name = ? COLLATE NOCASE`,
    serviceId, normalized,
  );
  if (existing) return existing.id;

  await run(
    database,
    `INSERT INTO ${table} (id, name, service_id, status, created_by, created_at)
     VALUES (?, ?, ?, 'pending', ?, ?)`,
    id, normalized, serviceId, userId, nowIso(),
  );
  return id;
}

export async function setStep(database: D1Database, profileId: string, step: number): Promise<void> {
  await run(
    database,
    'UPDATE specialist_profiles SET wizard_step = MAX(wizard_step, ?), updated_at = ? WHERE id = ?',
    step, nowIso(), profileId,
  );
}

export async function updateProfile(
  database: D1Database,
  profileId: string,
  fields: Record<string, string | number | null>,
): Promise<void> {
  const keys = Object.keys(fields);
  if (!keys.length) return;
  const assignments = keys.map((key) => `${key} = ?`).join(', ');
  await run(
    database,
    `UPDATE specialist_profiles SET ${assignments}, updated_at = ? WHERE id = ?`,
    ...keys.map((key) => fields[key] ?? null),
    nowIso(),
    profileId,
  );
}

export const countPortfolio = async (database: D1Database, profileId: string): Promise<number> => {
  const row = await one<{ n: number }>(
    database, 'SELECT COUNT(*) AS n FROM portfolio_items WHERE profile_id = ?', profileId,
  );
  return row?.n ?? 0;
};

/**
 * Rebuild the denormalised search text. Everything a company might type into
 * the directory search box lives in one lowercase blob, so §5.3's example
 * queries ("Pattern CAD Gerber", "frontend TypeScript") all hit.
 */
export async function rebuildSearch(database: D1Database, profileId: string): Promise<void> {
  const profile = await one<{ headline: string | null; bio: string | null; location: string | null; languages: string | null }>(
    database,
    'SELECT headline, bio, location, languages FROM specialist_profiles WHERE id = ?',
    profileId,
  );
  if (!profile) return;

  const offerings = await loadOfferings(database, profileId);
  const tagIds = offerings.flatMap((o) => [...readList(o.skill_ids), ...readList(o.tool_ids)]);
  const stackIds = offerings.flatMap((o) => readList(o.stack_ids));
  const specialtyIds = offerings.flatMap((o) => readList(o.specialties));

  const names = async (table: string, ids: string[]): Promise<string[]> => {
    if (!ids.length) return [];
    const rows = await all<{ name: string }>(
      database,
      `SELECT name FROM ${table} WHERE id IN (${ids.map(() => '?').join(',')})`,
      ...ids,
    );
    return rows.map((row) => row.name);
  };

  const [tagNames, stackNames, specialtyNames] = await Promise.all([
    Promise.all([names('skills', tagIds), names('tools', tagIds)]).then(([a, b]) => [...a, ...b]),
    names('technology_stacks', stackIds),
    names('service_specialties', specialtyIds),
  ]);

  const serviceNames = offerings.map((o) => getService(o.service_id)?.name ?? o.service_id);
  const roleNames = offerings
    .map((o) => getService(o.service_id)?.roles?.find((r) => r.id === o.role_key)?.name)
    .filter(Boolean) as string[];

  const haystack = [
    profile.headline, profile.bio, profile.location,
    ...readList(profile.languages),
    ...serviceNames, ...roleNames, ...specialtyNames, ...tagNames, ...stackNames,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  await run(
    database,
    `INSERT INTO specialist_search (profile_id, haystack, services, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (profile_id) DO UPDATE SET haystack = excluded.haystack,
                                            services = excluded.services,
                                            updated_at = excluded.updated_at`,
    profileId, haystack, serviceNames.join(' ').toLowerCase(), nowIso(),
  );
}

/**
 * Save just the specialties for services already chosen (wizard step 2b).
 * Kept separate from `saveServices` so picking a service and picking its
 * specialties are two independent saves — the freelancer can change one
 * without the other being wiped.
 */
export async function saveSpecialties(
  database: D1Database,
  profileId: string,
  specialtiesByService: Record<string, string[]>,
): Promise<void> {
  const statements = Object.entries(specialtiesByService).map(([serviceId, specialties]) =>
    database
      .prepare('UPDATE specialist_service_offerings SET specialties = ? WHERE profile_id = ? AND service_id = ?')
      .bind(writeList(specialties), profileId, serviceId),
  );
  if (statements.length) await database.batch(statements);
}

/**
 * Set the role for a service that declares them (Website Development, §5.2).
 * The role decides which technology-stack groups the next screen asks about,
 * so it is chosen on its own before any stack question is shown.
 */
export async function saveRole(
  database: D1Database,
  profileId: string,
  serviceId: string,
  roleKey: string,
): Promise<void> {
  await run(
    database,
    'UPDATE specialist_service_offerings SET role_key = ? WHERE profile_id = ? AND service_id = ?',
    roleKey, profileId, serviceId,
  );
}

/**
 * Attach extra skill ids to a service the specialist already offers.
 *
 * Used for the custom specialties someone types in step 2b. Creating the tag
 * is not enough — until it is attached to the offering it belongs to nobody,
 * so it never reaches the search text and the person can never be found by it.
 */
export async function appendSkills(
  database: D1Database,
  profileId: string,
  serviceId: string,
  skillIds: string[],
): Promise<void> {
  if (!skillIds.length) return;
  const current = await one<{ skill_ids: string }>(
    database,
    'SELECT skill_ids FROM specialist_service_offerings WHERE profile_id = ? AND service_id = ?',
    profileId, serviceId,
  );
  if (!current) return;
  await run(
    database,
    'UPDATE specialist_service_offerings SET skill_ids = ? WHERE profile_id = ? AND service_id = ?',
    writeList([...readList(current.skill_ids), ...skillIds]),
    profileId, serviceId,
  );
}
