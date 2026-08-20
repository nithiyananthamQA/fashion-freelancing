/**
 * make-admin.mjs — grant admin rights, or create an admin account.
 *
 *   node scripts/make-admin.mjs you@example.com                 # local
 *   node scripts/make-admin.mjs you@example.com --password '…'  # also set/reset the password
 *   node scripts/make-admin.mjs you@example.com --remote        # production
 *
 * /workspace/admin returns 404 to everyone who is not an admin, so there is no
 * self-service bootstrap screen by design — the first admin has to be made from
 * outside the app. This is that tool.
 *
 * If the account exists it is promoted. If it does not, it is created with the
 * password given (or a generated one, printed once).
 *
 * The password hash is produced with exactly the same scheme as
 * src/server/password.ts — PBKDF2-SHA256, 210k iterations — so the app can
 * verify it. If you change the parameters there, change them here too.
 */
import { execFileSync } from 'node:child_process';
import { webcrypto as crypto } from 'node:crypto';

const ITERATIONS = 210_000;
const KEY_LENGTH = 32;

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith('--'))?.toLowerCase();
const remote = args.includes('--remote');
const passwordFlag = args.indexOf('--password');
const givenPassword = passwordFlag !== -1 ? args[passwordFlag + 1] : null;

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: node scripts/make-admin.mjs <email> [--password "…"] [--remote]');
  process.exit(1);
}

const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    KEY_LENGTH * 8,
  );
  return `pbkdf2$${ITERATIONS}$${hex(salt)}$${hex(bits)}`;
}

/** Same time-sortable id scheme as src/server/ids.ts. */
function newId() {
  const A = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let time = '';
  let ms = Date.now();
  for (let i = 9; i >= 0; i--) { time = A[ms % 32] + time; ms = Math.floor(ms / 32); }
  const rand = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => A[b % 32]).join('');
  return time + rand;
}

function d1(sql) {
  const flags = ['d1', 'execute', 'fashion_os', remote ? '--remote' : '--local', '--json', '--command', sql];
  const out = execFileSync('npx', ['wrangler', ...flags], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const start = out.indexOf('[');
  return start === -1 ? [] : (JSON.parse(out.slice(start))[0]?.results ?? []);
}

const esc = (v) => `'${String(v).replace(/'/g, "''")}'`;

const existing = d1(`SELECT id, name FROM users WHERE email = ${esc(email)}`);
const now = new Date().toISOString();

if (existing.length) {
  const updates = [`is_admin = 1`, `updated_at = ${esc(now)}`];
  if (givenPassword) updates.push(`password_hash = ${esc(await hashPassword(givenPassword))}`);
  d1(`UPDATE users SET ${updates.join(', ')} WHERE email = ${esc(email)}`);
  // Any existing session predates the role change, so force a fresh sign-in.
  d1(`DELETE FROM sessions WHERE user_id = ${esc(existing[0].id)}`);
  console.log(`\n  ${email} is now an admin.`);
  if (givenPassword) console.log('  Password updated.');
  console.log('  Sign in again — the old session was cleared so the role takes effect.\n');
} else {
  const password = givenPassword ?? Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
  const id = newId();
  d1(
    `INSERT INTO users (id, email, password_hash, name, is_admin, email_verified_at, terms_accepted_at, created_at, updated_at)
     VALUES (${esc(id)}, ${esc(email)}, ${esc(await hashPassword(password))}, 'Operations',
             1, ${esc(now)}, ${esc(now)}, ${esc(now)}, ${esc(now)})`,
  );
  console.log(`\n  Admin account created.`);
  console.log(`    email    : ${email}`);
  console.log(`    password : ${password}`);
  if (!givenPassword) console.log('  (generated — shown once, change it after signing in)');
  console.log(`\n  Sign in at /sign-in, then open /workspace/admin\n`);
}
