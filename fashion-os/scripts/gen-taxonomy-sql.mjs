/**
 * gen-taxonomy-sql.mjs
 * Regenerates migrations/0002_seed_taxonomy.sql from src/data/taxonomy.ts.
 *
 * The taxonomy is defined once, in code. The database copy exists only so the
 * directory can filter and search on indexed columns. Run this whenever the
 * taxonomy changes, then apply the migration:
 *
 *   node scripts/gen-taxonomy-sql.mjs
 *   npm run db:migrate:local
 *
 * EDIT taxonomy.ts, NOT the generated migration.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const source = join(root, 'src', 'data', 'taxonomy.ts');
const outFile = join(root, 'migrations', '0002_seed_taxonomy.sql');

// taxonomy.ts is plain data + pure functions, so stripping the types is enough
// to import it directly — no bundler config, no duplicate copy of the list.
const js = (await transform(readFileSync(source, 'utf8'), { loader: 'ts', format: 'esm' })).code;
const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const { SERVICES, specialtyId, skillId, toolId } = mod;

const q = (value) => (value === null || value === undefined ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`);
const NOW = "'2026-01-01T00:00:00.000Z'";

const lines = [
  '-- ============================================================',
  '-- GENERATED FILE — do not edit.',
  '-- Source: src/data/taxonomy.ts',
  '-- Regenerate: node scripts/gen-taxonomy-sql.mjs',
  '--',
  '-- Seeds the controlled taxonomy (plan §5). Custom values proposed by',
  '-- freelancers are inserted at runtime with status=\'pending\' and only become',
  '-- public filters once an admin approves or merges them.',
  '-- ============================================================',
  '',
];

SERVICES.forEach((service, index) => {
  lines.push(`-- ---------- ${service.name} ----------`);
  lines.push(
    `INSERT INTO service_categories (id, name, position) VALUES (${q(service.id)}, ${q(service.name)}, ${index});`,
  );

  service.specialties.forEach((name, position) => {
    lines.push(
      `INSERT INTO service_specialties (id, service_id, name, position) VALUES (` +
        `${q(specialtyId(service.id, name))}, ${q(service.id)}, ${q(name)}, ${position});`,
    );
  });

  service.skills.forEach((name) => {
    lines.push(
      `INSERT INTO skills (id, name, service_id, status, created_at) VALUES (` +
        `${q(skillId(service.id, name))}, ${q(name)}, ${q(service.id)}, 'approved', ${NOW});`,
    );
  });

  service.tools.forEach((name) => {
    lines.push(
      `INSERT INTO tools (id, name, service_id, status, created_at) VALUES (` +
        `${q(toolId(service.id, name))}, ${q(name)}, ${q(service.id)}, 'approved', ${NOW});`,
    );
  });

  for (const option of service.stack ?? []) {
    lines.push(
      `INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES (` +
        `${q(option.id)}, ${q(service.id)}, ${q(option.group)}, ${q(option.name)}, ` +
        `${option.appliesTo ? q(option.appliesTo.join(',')) : 'NULL'}, 'approved', ${NOW});`,
    );
  }

  lines.push('');
});

writeFileSync(outFile, lines.join('\n'));
console.log(
  `[gen-taxonomy-sql] wrote ${outFile} — ${SERVICES.length} services, ` +
    `${SERVICES.reduce((n, s) => n + s.specialties.length, 0)} specialties, ` +
    `${SERVICES.reduce((n, s) => n + s.skills.length, 0)} skills, ` +
    `${SERVICES.reduce((n, s) => n + s.tools.length, 0)} tools, ` +
    `${SERVICES.reduce((n, s) => n + (s.stack?.length ?? 0), 0)} stack options.`,
);
