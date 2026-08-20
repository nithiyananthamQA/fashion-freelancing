# Hero marquee — LOCKED to the bottom of the viewport

**File:** `public-html/index.html` — the `.hero-t` hero section. (This doc moved out of the web root; the hero moved from the old `agency.html` to the homepage.)

## The rule (do not break this)

The running services marquee (`.hero-t-marquee` — "Tech Pack · 3D Virtual Sampling · Seamless Pattern · …") **must always sit flush at the bottom of the hero viewport**, no matter what you change in the headline or the foot above it.

This is the desired result:

```
┌─────────────────────────────────────────┐
│  [nav]                                   │
│                                          │
│  Everything                              │
│  your fashion                            │
│  business needs                          │
│  — under one team.                       │
│                                          │
│  [subline]        [SEE SERVICES][START]  │
│  ─────────────────────────────────────  │
│  · Seamless Pattern · Pattern CAD · …    │ ← marquee, pinned to bottom
└─────────────────────────────────────────┘   (no gap below it, no next section bleeding in)
```

## How it's enforced (the CSS that makes it work)

1. **Hero height fills the viewport below the sticky nav:**
   ```css
   .hero-t { height: calc(100vh - var(--nav-h, 82px)); min-height: 600px; overflow: hidden; }
   ```
   `--nav-h` is set live by JS (measures the real `.topnav` height). The sticky `.topnav` is in normal flow, so without subtracting it the hero overflowed and the next section bled into the bottom of the viewport.

2. **Marquee is absolutely pinned to the hero's bottom edge:**
   ```css
   .hero-t-marquee { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; }
   ```
   Because it's `position: absolute; bottom: 0`, it stays locked to the bottom **regardless of how tall the headline gets** — change the headline size, add lines, change the foot, and the marquee does NOT move.

3. **The content wrap groups headline + foot together near the top, and reserves room for the marquee:**
   ```css
   .hero-t-wrap {
     justify-content: flex-start;                  /* headline + foot grouped just below the header */
     gap: calc(var(--u) * 4);                      /* the ONLY space between headline and foot */
     padding: calc(var(--u) * 3) 0 calc(var(--u) * 4 + 80px);  /* 80px ≈ marquee height */
   }
   ```
   `flex-start` keeps the headline and the subline+CTA buttons together at the top (small `gap`
   between them) — do NOT use `space-between`, it opens a big empty gap in the middle of the hero.

4. **JS keeps `--nav-h` accurate** (in the `<script>` near the bottom of the page):
   ```js
   const setNavH = () => {
     const nav = document.querySelector('.topnav');
     if (nav) document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
   };
   requestAnimationFrame(setNavH);
   window.addEventListener('resize', setNavH);
   ```

## If you edit the hero

- **Changing the headline size / lines:** fine — marquee stays pinned. If the headline gets so tall it would overlap the marquee, it just clips (`overflow:hidden` on `.hero-t`).
- **Changing the marquee height** (its `padding: 16px 0` or font size): update the `80px` in `.hero-t-wrap` padding-bottom to match the new marquee height, or the foot may sit too close to / behind it.
- **Do NOT** put the marquee back to `position: relative` / `flex-shrink: 0` — that was the old behavior where it floated mid-hero and left a gap. Keep it `position: absolute; bottom: 0`.

## Remember: edits don't show until you sync

`localhost:4321` is the **Astro dev server** serving from `fashion-os/public/`, NOT from `public-html/`. After editing `public-html/pages/agency.html`, run:

```
cd fashion-os && node scripts/sync-public.mjs
```

then hard-reload the page. (`astro dev` does not auto-run the sync.)
