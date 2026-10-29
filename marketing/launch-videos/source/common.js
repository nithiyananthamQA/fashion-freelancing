/* Launch reels — shared helpers.
   Each page builds ONE paused master timeline. render.mjs seeks it frame by
   frame through window.__seek, so every export is identical and never drops
   a frame. Open a page with ?play to watch it in a browser, or ?t=12.5 to
   freeze one moment. */

const DURATION = 30;
const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

window.__duration = DURATION;
window.__seek = (t) => tl.seek(t, false);

// Fonts, <img> and every CSS background image must be decoded before frame 0.
window.__ready = async () => {
  await document.fonts.ready;
  const urls = new Set();
  for (const el of document.querySelectorAll('*')) {
    const bg = getComputedStyle(el).backgroundImage;
    for (const m of bg.matchAll(/url\("?([^")]+)"?\)/g)) if (!m[1].startsWith('data:')) urls.add(m[1]);
  }
  await Promise.all([
    ...$$('img').map((img) => img.decode().catch(() => {})),
    ...[...urls].map((u) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = u; })),
  ]);
};

// Finish the build: pin the length, then honour ?play / ?t for manual review.
function finish() {
  tl.set({}, {}, DURATION);
  const q = new URLSearchParams(location.search);
  if (q.has('play')) window.__ready().then(() => tl.play(0));
  else tl.seek(Number(q.get('t')) || 0, false);
}

/* Split a line into masked words. A child element (e.g. <span class="hot">)
   stays one unit so its gradient runs across the whole phrase. */
function split(el) {
  const out = [];
  const wrap = (content, cls) => {
    const w = document.createElement('span'); w.className = 'w';
    const i = document.createElement('span'); i.className = 'wi' + (cls ? ' ' + cls : '');
    if (typeof content === 'string') i.textContent = content; else i.append(...content.childNodes);
    w.appendChild(i); out.push(i); return w;
  };
  for (const n of [...el.childNodes]) {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(part));
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'BR') {
      n.replaceWith(wrap(n, n.className));
    }
  }
  return out;
}

function rise(targets, at, o = {}) {
  tl.from(targets, { yPercent: 115, duration: 0.8, stagger: 0.055, ease: 'power4.out', ...o }, at);
}

function show(scene, at) { tl.set(scene, { autoAlpha: 1 }, at); }
function hide(scene, at) { tl.set(scene, { autoAlpha: 0 }, at); }

/* The logo, cut from logo.png into its 18 letter tiles + the DESIGN-STUDIO
   line, so each tile can animate while the assembled mark stays pixel-true. */
function buildLogo(el, width) {
  const s = width / 768, T = 768 / 11;
  const rects = [];
  for (let i = 0; i < 7; i++) rects.push([2 * T + i * T, 0, T, 72]);
  for (let i = 0; i < 11; i++) rects.push([i * T, 72, T, 68]);
  el.style.width = `${768 * s}px`; el.style.height = `${171 * s}px`;
  const place = (d, x, y, w, h) => {
    const l = Math.round(x * s), t = Math.round(y * s);
    Object.assign(d.style, {
      left: `${l}px`, top: `${t}px`,
      width: `${Math.round((x + w) * s) - l + 1}px`, height: `${Math.round((y + h) * s) - t + 1}px`,
      backgroundSize: `${768 * s}px ${171 * s}px`, backgroundPosition: `${-l}px ${-t}px`,
    });
    el.appendChild(d);
    return d;
  };
  const tiles = rects.map(([x, y, w, h]) => { const d = document.createElement('div'); d.className = 'tile'; return place(d, x, y, w, h); });
  const sub = document.createElement('div'); sub.className = 'sub'; place(sub, 226, 144, 318, 27);
  return { tiles, sub };
}

function type(el, text, at, dur = text.length * 0.04) {
  const o = { n: 0 };
  el.textContent = '';
  tl.to(o, { n: text.length, duration: dur, ease: 'none', onUpdate: () => { el.textContent = text.slice(0, Math.round(o.n)); } }, at);
}

function count(el, to, at, dur = 1.1, suffix = '') {
  const o = { n: 0 };
  el.textContent = '0' + suffix;
  tl.to(o, { n: to, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.n) + suffix; } }, at);
}

// Centre of an element in stage pixels — measure BEFORE tweens move it.
function centre(el, dx = 0, dy = 0) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2 + dx, y: r.top + r.height / 2 + dy };
}

function cursorTo(p, at, dur = 0.55) {
  tl.to('.cursor', { x: p.x - 10, y: p.y - 6, duration: dur, ease: 'power3.inOut' }, at);
}
function tap(p, at, target) {
  tl.to('.cursor', { scale: 0.82, duration: 0.09, ease: 'power2.in', transformOrigin: '10px 6px' }, at)
    .to('.cursor', { scale: 1, duration: 0.18, ease: 'back.out(3)' }, at + 0.09)
    .fromTo('.ripple', { x: p.x, y: p.y, scale: 0.25, autoAlpha: 0.95 }, { scale: 1.25, autoAlpha: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, at + 0.05);
  if (target) tl.to(target, { scale: 0.95, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.inOut' }, at);
}

// Slow light drift behind everything, across the whole reel.
function atmosphere() {
  tl.to('.a1', { x: 260, y: 220, duration: DURATION / 2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0)
    .to('.a2', { x: -240, y: -300, duration: DURATION / 2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0)
    .to('.a3', { x: 200, y: -160, duration: DURATION / 2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0);
}

const STAGE_BG = `
  <div class="aura a1"></div><div class="aura a2"></div><div class="aura a3"></div>
  <div class="grid-lines"></div>
  <svg class="grain" width="1080" height="1920" aria-hidden="true"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;

const CURSOR = `
  <div class="ripple"></div>
  <div class="cursor"><svg viewBox="0 0 32 32"><path d="M6 3l19 11.2-8.3 1.9 4.9 9.4-3.6 1.9-4.9-9.5L6 24.6z" fill="#fff" stroke="#0C0A1C" stroke-width="1.6" stroke-linejoin="round"/></svg></div>`;
