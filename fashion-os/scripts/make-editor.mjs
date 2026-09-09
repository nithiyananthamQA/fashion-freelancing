/**
 * Make an account a content editor — it can change what the marketing pages
 * say from /workspace/content, and nothing else in the workspace.
 *
 *   node scripts/make-editor.mjs you@example.com "Their Name"                  # local
 *   node scripts/make-editor.mjs you@example.com "Their Name" --password '…'   # also set/reset the password
 *   node scripts/make-editor.mjs you@example.com "Their Name" --remote         # production
 *
 * Creates the account if it does not exist, with the password given (or a
 * generated one, printed once). The hash uses exactly the scheme in
 * src/server/password.ts — PBKDF2-SHA256, 25k iterations — so the app can
 * verify it. Existing sessions are cleared so the role takes effect.
 */
import { execFileSync } from 'node:child_process';
import { webcrypto as crypto } from 'node:crypto';

const ITERATIONS = 25_000;
const KEY_LENGTH = 32;
const args = process.argv.slice(2);
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--password');
const email = positional[0]?.toLowerCase();
const name = positional[1] || 'Content editor';
const remote = args.includes('--remote');
const passwordFlag = args.indexOf('--password');
const givenPassword = passwordFlag !== -1 ? args[passwordFlag + 1] : null;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: node scripts/make-editor.mjs <email> ["Name"] [--password "…"] [--remote]');
  process.exit(1);
}

const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, KEY_LENGTH * 8);
  return `pbkdf2$${ITERATIONS}$${hex(salt)}$${hex(bits)}`;
}
function newId() {
  const A = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let time = ''; let ms = Date.now();
  for (let i = 9; i >= 0; i--) { time = A[ms % 32] + time; ms = Math.floor(ms / 32); }
  return time + [...crypto.getRandomValues(new Uint8Array(16))].map((b) => A[b % 32]).join('');
}
function d1(sql) {
  const flags = ['d1', 'execute', 'fashion_os', remote ? '--remote' : '--local', '--json', '--command', sql];
  const out = execFileSync('npx', ['wrangler', ...flags], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const start = out.indexOf('[');
  return start === -1 ? [] : (JSON.parse(out.slice(start))[0]?.results ?? []);
}
const esc = (v) => `'${String(v).replace(/'/g, "''")}'`;
const generated = () => {
  const words = ['amber','birch','coral','delta','ember','fjord','grove','harbor','indigo','juniper','kestrel','linen','maple','nectar','ochre','pebble','quartz','raven','saffron','tundra','umber','velvet','willow','yarrow','zephyr'];
  const pick = () => words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length];
  return `${pick()}-${pick()}-${pick()}-${crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000}`;
};

const now = new Date().toISOString();
const existing = d1(`SELECT id FROM users WHERE email = ${esc(email)}`);
if (existing.length) {
  const updates = [`role = 'editor'`, `updated_at = ${esc(now)}`];
  if (givenPassword) updates.push(`password_hash = ${esc(await hashPassword(givenPassword))}`);
  d1(`UPDATE users SET ${updates.join(', ')} WHERE id = ${esc(existing[0].id)}`);
  d1(`DELETE FROM sessions WHERE user_id = ${esc(existing[0].id)}`);
  console.log(`\n  ${email} is now a content editor.${givenPassword ? ' Password updated.' : ''}`);
  console.log('  Sign in again — the old session was cleared so the role takes effect.\n');
} else {
  const password = givenPassword || generated();
  const id = newId();
  d1(`INSERT INTO users (id, email, password_hash, name, is_admin, role, email_verified_at, terms_accepted_at, status, created_at, updated_at)
      VALUES (${esc(id)}, ${esc(email)}, ${esc(await hashPassword(password))}, ${esc(name)}, 0, 'editor', ${esc(now)}, ${esc(now)}, 'active', ${esc(now)}, ${esc(now)})`);
  console.log(`\n  Content editor created (${remote ? 'production' : 'local'}).`);
  console.log(`  Sign in at:  /sign-in`);
  console.log(`  Email:       ${email}`);
  console.log(`  Password:    ${password}`);
  console.log('  Shown once — change it after the first sign-in.\n');
}
