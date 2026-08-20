/**
 * seed-demo-data.mjs — realistic approved specialists for local development.
 *
 *   npm run db:seed:local
 *
 * DEVELOPMENT ONLY. It refuses to touch a remote database, because approved
 * profiles are public and seeding production with invented people would put
 * fake professionals in front of real clients.
 *
 * Idempotent: every seeded account uses the @seed.local domain, and they are all
 * removed and rebuilt on each run.
 *
 * Every seeded person signs in with the password below, so you can look at the
 * site from a freelancer's side too.
 */
import { execFileSync } from 'node:child_process';
import { webcrypto as crypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const REMOTE = process.argv.includes('--remote');
if (REMOTE) console.log('[seed] targeting the LIVE database');

const PASSWORD = 'seed-password-2026';
const DOMAIN = '@seed.local';

/* ---------- the taxonomy, so every id we write is a real one ---------- */
const js = (await transform(readFileSync(join(root, 'src/data/taxonomy.ts'), 'utf8'), { loader: 'ts', format: 'esm' })).code;
const tax = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const { specialtyId, skillId, toolId, getService } = tax;

/* ---------- helpers matching the app's own id / hash schemes ---------- */
const A = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
let counter = 0;
function newId() {
  let time = '';
  let ms = Date.now() + counter++;
  for (let i = 9; i >= 0; i--) { time = A[ms % 32] + time; ms = Math.floor(ms / 32); }
  const rand = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => A[b % 32]).join('');
  return time + rand;
}
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 210_000, hash: 'SHA-256' }, key, 256);
  return `pbkdf2$210000$${hex(salt)}$${hex(bits)}`;
}
const esc = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const json = (v) => esc(JSON.stringify(v));

function d1(sql) {
  execFileSync('npx', ['wrangler', 'd1', 'execute', 'fashion_os', REMOTE ? '--remote' : '--local', '--command', sql],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/* ---------- the people ----------
   Written to exercise the filters: different services, availabilities, rates,
   languages and locations, plus one Website Development specialist so the
   role/stack path has real data behind it. */
const PEOPLE = [
  {
    name: 'Elena Rossi', handle: 'elena-rossi', service: 'tech-pack',
    headline: 'Technical designer for premium womenswear',
    bio: 'I turn a clear design direction into factory-ready packs that cut sampling rounds and protect the details that make a garment feel considered.\n\nEleven years between Milan studios and Portuguese factories, so I write specs the people cutting them can actually follow.',
    years: 11, languages: ['English', 'Italian'], location: 'Milan, Italy', timezone: 'CET (UTC+1)',
    availability: 'available_now', rateMin: 480, rateMax: 1200, currency: 'EUR',
    rateModel: ['fixed', 'day'], size: 'medium', workLocation: 'remote',
    specialties: ['Womenswear', 'Knitwear'],
    skills: ['Flats', 'BOM', 'Measurements', 'Construction', 'Grading notes'],
    tools: ['Adobe Illustrator', 'CLO3D'],
    portfolio: [
      ['Resort capsule tech packs', 'Full spec set for twelve styles — flats, BOM, grading notes and trim sourcing.'],
      ['Silk dress construction', 'Construction detailing and fit corrections across three sampling rounds.'],
    ],
  },
  {
    name: 'Aisha Khan', handle: 'aisha-khan', service: 'pattern-cad',
    headline: 'Pattern CAD and grading specialist for contemporary apparel',
    bio: 'My pattern work balances fit, makeability and production efficiency across contemporary women’s and menswear.\n\nI work from your block or draft a new one, and hand over graded nests and markers the factory can load without a conversation.',
    years: 9, languages: ['English', 'Urdu'], location: 'Dubai, UAE', timezone: 'GST (UTC+4)',
    availability: 'available_now', rateMin: 42, rateMax: 65, currency: 'USD',
    rateModel: ['hourly', 'fixed'], size: 'any', workLocation: 'remote',
    specialties: ['Grading', 'Marker making', 'Base patterns'],
    skills: ['Grading', 'Marker planning', 'Pattern drafting', 'Fit correction'],
    tools: ['Gerber', 'Lectra', 'Optitex'],
    portfolio: [
      ['Denim grading system', 'Built the full graded nest and production marker plan across six sizes.'],
      ['Tailored trouser block', 'Drafted a reusable block and corrected fit across two rounds of samples.'],
    ],
  },
  {
    name: 'Maya Sen', handle: 'maya-sen', service: 'website', role: 'fullstack',
    headline: 'Full-stack e-commerce developer for fashion brands',
    bio: 'I build fast, thoughtful commerce experiences from storefront through to the operations behind them.\n\nMost of my work is replatforming brands that outgrew a template, without losing the traffic or the team’s sanity.',
    years: 7, languages: ['English', 'Hindi'], location: 'Bengaluru, India', timezone: 'IST (UTC+5:30)',
    availability: 'this_month', rateMin: 55, rateMax: 90, currency: 'USD',
    rateModel: ['hourly', 'retainer'], size: 'large', workLocation: 'remote',
    specialties: ['Full-stack Developer'],
    stack: ['lang-typescript', 'fw-react', 'fw-nextjs', 'sty-tailwind', 'lang-python', 'fw-fastapi', 'db-postgresql', 'fw-shopify', 'cap-payments', 'cap-performance'],
    tools: ['Git', 'Figma', 'Vercel'],
    portfolio: [
      ['D2C storefront rebuild', 'Rebuilt a Shopify storefront as a headless Next.js app; checkout conversion up, load time down by half.'],
      ['Wholesale ordering portal', 'Designed and built the linesheet-to-order flow used by 40 stockists.'],
    ],
  },
  {
    name: 'Sofia Mendes', handle: 'sofia-mendes', service: 'ai-photography',
    headline: 'AI product imagery with fashion-first quality control',
    bio: 'I create channel-ready fashion visuals while keeping garment detail, fabric and fit honest to the real product.\n\nEvery set is reviewed against the physical sample before it ships — a generated image that misrepresents the product costs more in returns than it saves in studio time.',
    years: 6, languages: ['English', 'Portuguese'], location: 'Lisbon, Portugal', timezone: 'WET (UTC+0)',
    availability: 'in_2_weeks', rateMin: 650, rateMax: 2400, currency: 'EUR',
    rateModel: ['fixed'], size: 'medium', workLocation: 'hybrid',
    specialties: ['Product imagery', 'Campaigns'],
    skills: ['Art direction', 'Retouching', 'Product consistency'],
    tools: ['Adobe Photoshop', 'Runway'],
    portfolio: [
      ['On-model knitwear range', 'Generated and retouched a 60-SKU on-model set matched to physical samples.'],
      ['Campaign image system', 'Built a reusable prompt and retouch pipeline so seasonal drops stay visually consistent.'],
    ],
  },
  {
    name: 'Nora Berg', handle: 'nora-berg', service: 'graphic-design',
    headline: 'Identity and packaging designer for independent labels',
    bio: 'I build visual systems that make an emerging label recognisable at every touchpoint, from a product card to a printed box.\n\nI hand over production files and a short guide, so the system survives after I leave.',
    years: 10, languages: ['English', 'Swedish'], location: 'Stockholm, Sweden', timezone: 'CET (UTC+1)',
    availability: 'this_month', rateMin: 900, rateMax: 4500, currency: 'EUR',
    rateModel: ['fixed', 'retainer'], size: 'medium', workLocation: 'remote',
    specialties: ['Brand identity', 'Packaging'],
    skills: ['Typography', 'Art direction', 'Production files'],
    tools: ['Figma', 'Adobe Illustrator', 'Adobe InDesign'],
    portfolio: [
      ['Accessories identity', 'Wordmark, type system and packaging artwork for a leather goods launch.'],
      ['Beauty packaging range', 'Structural and surface design across nine SKUs, print-ready.'],
    ],
  },
  {
    name: 'Ravi Iyer', handle: 'ravi-iyer', service: '3d-virtual-sampling',
    headline: '3D virtual sampling that replaces the first two physical rounds',
    bio: 'I build accurate 3D garments from your patterns and fabric data, so fit and colourway decisions happen before anything is cut.\n\nClients typically drop from four sampling rounds to two.',
    years: 8, languages: ['English', 'Tamil'], location: 'Chennai, India', timezone: 'IST (UTC+5:30)',
    availability: 'booked', rateMin: 220, rateMax: 800, currency: 'USD',
    rateModel: ['fixed', 'day'], size: 'small', workLocation: 'remote',
    specialties: ['Garment simulation', 'Fit review', 'Colourways'],
    skills: ['Fabric simulation', 'Rendering', 'Fit analysis'],
    tools: ['CLO3D', 'Browzwear', 'Blender'],
    portfolio: [
      ['Outerwear fit programme', 'Simulated a 14-style outerwear range; two physical rounds removed from the calendar.'],
      ['Colourway render library', 'Produced a render set covering 6 colourways per style for the sales deck.'],
    ],
  },
];

/* ---------- wipe any previous seed ---------- */
console.log('[seed] clearing previous demo data…');
d1(`DELETE FROM users WHERE email LIKE '%${DOMAIN}'`);

/* ---------- insert ---------- */
const now = new Date().toISOString();
const hash = await hashPassword(PASSWORD);

for (const person of PEOPLE) {
  const service = getService(person.service);
  if (!service) throw new Error(`Unknown service: ${person.service}`);

  const userId = newId();
  const profileId = newId();
  const email = person.handle + DOMAIN;

  d1(`INSERT INTO users (id, email, password_hash, name, country, timezone, email_verified_at, terms_accepted_at, created_at, updated_at)
      VALUES (${esc(userId)}, ${esc(email)}, ${esc(hash)}, ${esc(person.name)},
              ${esc(person.location.split(',').pop().trim())}, ${esc(person.timezone)},
              ${esc(now)}, ${esc(now)}, ${esc(now)}, ${esc(now)})`);

  d1(`INSERT INTO specialist_profiles
        (id, user_id, handle, headline, bio, years_experience, languages, location, timezone,
         work_preference, availability, turnaround, rate_min, rate_max, rate_currency, rate_model,
         preferred_size, work_location, regions, status, wizard_step, submitted_at, approved_at, created_at, updated_at)
      VALUES (${esc(profileId)}, ${esc(userId)}, ${esc(person.handle)}, ${esc(person.headline)}, ${esc(person.bio)},
              ${person.years}, ${json(person.languages)}, ${esc(person.location)}, ${esc(person.timezone)},
              ${json(person.rateModel)}, ${esc(person.availability)}, ${esc('5–7 working days')},
              ${person.rateMin}, ${person.rateMax}, ${esc(person.currency)}, ${json(person.rateModel)},
              ${esc(person.size)}, ${esc(person.workLocation)}, ${json([])},
              'approved', 7, ${esc(now)}, ${esc(now)}, ${esc(now)}, ${esc(now)})`);

  const specialties = (person.specialties ?? []).map((n) => specialtyId(service.id, n));
  const skills = (person.skills ?? []).map((n) => skillId(service.id, n));
  const tools = (person.tools ?? []).map((n) => toolId(service.id, n));
  const stack = person.stack ?? [];

  d1(`INSERT INTO specialist_service_offerings
        (id, profile_id, service_id, is_primary, role_key, specialties, skill_ids, tool_ids, stack_ids, created_at)
      VALUES (${esc(newId())}, ${esc(profileId)}, ${esc(service.id)}, 1, ${esc(person.role ?? null)},
              ${json(specialties)}, ${json(skills)}, ${json(tools)}, ${json(stack)}, ${esc(now)})`);

  person.portfolio.forEach(([title, contribution], index) => {
    d1(`INSERT INTO portfolio_items
          (id, profile_id, title, service_id, contribution, external_url, has_permission, moderation, position, created_at)
        VALUES (${esc(newId())}, ${esc(profileId)}, ${esc(title)}, ${esc(service.id)}, ${esc(contribution)},
                ${esc('https://example.com/' + person.handle + '/' + (index + 1))}, 1, 'approved', ${index}, ${esc(now)})`);
  });

  /* The directory searches this blob, so it must contain everything a company
     might reasonably type — the same fields rebuildSearch() uses. */
  const names = [
    person.headline, person.bio, person.location, ...person.languages, service.name,
    service.roles?.find((r) => r.id === person.role)?.name,
    ...(person.specialties ?? []), ...(person.skills ?? []), ...(person.tools ?? []),
    ...stack.map((id) => service.stack?.find((o) => o.id === id)?.name),
  ].filter(Boolean).join(' ').toLowerCase();

  d1(`INSERT INTO specialist_search (profile_id, haystack, services, updated_at)
      VALUES (${esc(profileId)}, ${esc(names)}, ${esc(service.name.toLowerCase())}, ${esc(now)})`);

  console.log(`  ${person.name.padEnd(14)} ${service.name}`);
}

console.log(`\n[seed] ${PEOPLE.length} approved specialists created.`);
console.log(`[seed] sign in as any of them with:  <handle>${DOMAIN} / ${PASSWORD}`);
console.log('[seed] e.g. maya-sen@seed.local\n');
