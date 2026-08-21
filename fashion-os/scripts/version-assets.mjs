/**
 * Stamp every shared asset reference with a hash of that file's contents.
 *
 * Assets are served with `cache-control: max-age=3600`, and the pages referred
 * to them by a bare path. A returning visitor therefore kept running whatever
 * copy their browser had for up to an hour after a deploy — which is how a
 * header ended up missing a nav link that was present in the deployed file.
 *
 * Adding `?v=<hash>` makes the URL change whenever the file does, so a stale
 * copy can never be matched, while unchanged files stay cached as before.
 * Runs over the synced output, so the sources in public-html stay clean.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const assetsDir = join(publicDir, 'assets');

/** Short content hash — long enough to never collide in a set this size. */
const hashOf = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10);

const versions = {};
for (const name of readdirSync(assetsDir)) {
  if (!/\.(css|js)$/.test(name)) continue;
  versions[name] = hashOf(join(assetsDir, name));
}

/** Every html file under public/, at any depth. */
function* htmlFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* htmlFiles(full);
    else if (entry.endsWith('.html')) yield full;
  }
}

let rewritten = 0, refs = 0;
for (const file of htmlFiles(publicDir)) {
  const before = readFileSync(file, 'utf8');
  let after = before;
  for (const [name, hash] of Object.entries(versions)) {
    // match the reference however the page spells the path, and replace any
    // version already there so re-running is idempotent
    const re = new RegExp(`((?:\\.\\./|\\./|/)?assets/${name.replace('.', '\\.')})(\\?v=[a-f0-9]+)?`, 'g');
    after = after.replace(re, (_m, path) => { refs++; return `${path}?v=${hash}`; });
  }
  if (after !== before) { writeFileSync(file, after); rewritten++; }
}

writeFileSync(join(publicDir, 'asset-versions.json'), JSON.stringify(versions, null, 2));
console.log(`[version-assets] ${refs} references stamped across ${rewritten} pages`);
