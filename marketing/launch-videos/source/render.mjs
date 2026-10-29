// Render a reel page to an Instagram-ready MP4 (1080x1920, 30 fps, H.264 + silent AAC).
//
//   node render.mjs services.html ../fashion-freelancing-services.mp4
//   node render.mjs services.html --stills out-dir 1,3.5,7     full-size stills
//   node render.mjs services.html --sheet sheet.png [1,2.5]     frames tiled (default: every 2 s)
//
// Needs: npm install (puppeteer-core), Google Chrome, and an ffmpeg with libx264
// (set FFMPEG=/path/to/ffmpeg if it is not on PATH).
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [page_, ...rest] = process.argv.slice(2);
const FPS = 30;
const W = 1080, H = 1920;
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--allow-file-access-from-files', '--hide-scrollbars', '--font-render-hinting=none',
    '--force-color-profile=srgb', '--disable-renderer-backgrounding', '--mute-audio', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('page error:', e.message); process.exitCode = 1; });
await page.goto(pathToFileURL(resolve(page_)).href, { waitUntil: 'load' });
await page.evaluate(() => window.__ready());
const duration = await page.evaluate(() => window.__duration);

async function frameAt(t, type = 'png') {
  await page.evaluate((t) => new Promise((r) => { window.__seek(t); requestAnimationFrame(() => requestAnimationFrame(r)); }), t);
  return page.screenshot({ type, optimizeForSpeed: true, ...(type === 'jpeg' && { quality: 70 }) });
}

if (rest[0] === '--stills') {
  const dir = resolve(rest[1]); mkdirSync(dir, { recursive: true });
  for (const t of rest[2].split(',').map(Number)) writeFileSync(`${dir}/t${t.toFixed(2)}.png`, await frameAt(t));
} else if (rest[0] === '--sheet') {
  const times = rest[2] ? rest[2].split(',').map(Number) : [];
  if (!times.length) for (let t = 1; t < duration; t += 2) times.push(t);
  const shots = [];
  // JPEG keeps the sheet under DevTools' 100 MB message cap
  for (const t of times) shots.push({ t, src: 'data:image/jpeg;base64,' + Buffer.from(await frameAt(t, 'jpeg')).toString('base64') });
  const sheet = await browser.newPage();
  await sheet.setViewport({ width: 5 * 360 + 6 * 8, height: 3 * 660 + 4 * 8 });
  await sheet.setContent(`<body style="margin:0;background:#333;display:grid;grid-template-columns:repeat(5,360px);gap:8px;padding:8px;font:20px monospace;color:#fff">${
    shots.map((s) => `<div style="position:relative"><img src="${s.src}" style="width:360px;height:640px;display:block"><b style="position:absolute;left:6px;top:4px;background:#000a;padding:2px 6px">${s.t}s</b></div>`).join('')}</body>`);
  await sheet.screenshot({ path: resolve(rest[1]) });
} else {
  const out = resolve(rest[0]);
  const ff = spawn(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-map', '0:v', '-map', '1:a', '-shortest',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-level', '4.1',
    '-g', String(FPS), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(duration * FPS);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const buf = await frameAt(i / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg exit ' + c)) : r())));
  console.log('wrote', out);
}
await browser.close();
