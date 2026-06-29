# Fashion Freelancing — Design System (MASTER)

> **Source of truth for this site only.** This documents **Pranesh's "Nebula Light" v8 redesign** which the team LIKES and is KEEPING. We only *fix and refine* within this system — do NOT replace the design, swap the palette, or change fonts. The ui-ux-pro-max skill is a reference for *filling gaps* within this style, not for overriding it.

Canonical token source: `fashion-os/public/assets/styles.css` (`:root`). Source-of-truth pages live in `public-html/`; run `cd fashion-os && node scripts/sync-public.mjs` after editing.

## Theme
**Main surface is white / light** (lavender-tinted white base `#F4F4FB`, white cards `#FFFFFF`, charcoal ink). The color comes from **per-card accents** — Pranesh used a **different color for each card** in the horizontal services slider (violet, cyan, green, yellow, pink). So: light/white canvas + multi-color accent cards. (NOT the old dark-grey + orange — that was a previous version, gone now.)

## Color tokens (from styles.css `:root`)
| Role | Token | Hex |
|------|-------|-----|
| Main background | `--paper` | `#F4F4FB` (lavender base) |
| Alt section | `--paper-2` | `#ECECF7` |
| Cards / wells | `--paper-3` | `#FFFFFF` |
| Primary text | `--ink` | `#14132B` |
| Body/lead text | `--ink-4` | `#5C5A7E` |
| Muted | `--ink-5` | `#82809E` |
| **Primary accent (indigo)** | `--champagne` | `#5468F5` |
| Accent hover | `--champagne-2` | `#4453E0` |
| Accent text/dark | `--champagne-3` | `#3A3AB0` |
| Secondary accent (cyan) | `--mint` | `#2BA8E8` |
| Accent gradient | `--grad` | `linear-gradient(118deg,#6E56F0,#5468F5,#2BA8E8)` |

> Note: accent kept under the legacy name `--champagne*` so old class references re-skin. Don't rename.

## Per-card service accents (agency.html `.px-card`)
Each service card carries a unique `--local-accent`, cycled every 5 (`nth-child(5n+N)`):
1. Violet `#6E56F0` · 2. Cyan `#2BA8E8` · 3. Green `#00C853` · 4. Yellow/Orange `#F0A93B` · 5. Pink `#FF0055`

**User's plan:** each of the 11 service landing pages (`service.html?svc=…`) should adopt ITS card's accent color for a unique, creative per-service hero.

## Typography
- Display/headings: **Plus Jakarta Sans** (500–800)
- Body: **Inter** (400–800), `font-feature-settings: "ss01","cv11","kern","liga"`
- Mono (labels/tags): **IBM Plex Mono** (400–500)
- Hero style = "Exaggerated Minimalism": oversized `clamp()` type, weight 700–800, `letter-spacing: -0.05em`, lots of whitespace, single accent. (Skill-confirmed best-for: fashion/agency/editorial.)

## Surfaces & effects
- Radii: `--r-sm 8 / --r-md 12 / --r-lg 16 / --r-xl 22`
- Shadows: `--shadow-1/2/3` + `--shadow-indigo` (glow). Glass surfaces.
- Easing: `--easing: cubic-bezier(0.22,1,0.36,1)`. Container `1560px`, 12-col, 30px gap.

## What we're FIXING (not redesigning) — user's list
1. **Header**: use the homepage header on the Our Services (agency) page; make the home header more creative too.
2. **Our Services hero (#2)**: current hero looks "simple/dummy" — make it creative & professional, *within* Nebula Light.
3. **Card highlight bug (#3)** [DOING FIRST]: in the horizontal cards, the FIRST and LAST card don't highlight — only middle ones do (center-distance logic in the `onUpdate`; first/last never reach viewport center). Every card 1→N must highlight in turn.
4. **11 service pages**: each uses its card's accent + a fully creative hero matching the best design.
5. Mobile fixes pending (see [[agency-mobile-todo]] memory).

## The ui-ux-pro-max skill is copied INTO this project
Full skill (SKILL.md + scripts + all data CSVs) lives at `design-system/ui-ux-pro-max/`. It is self-contained and runnable here — use it for detailed desktop **and mobile/responsive** requirements before any UI work. Query it:

```bash
cd design-system/ui-ux-pro-max
python3 scripts/search.py "<query>" --design-system            # full design system
python3 scripts/search.py "<query>" --domain ux -n 5           # UX/mobile/responsive rules
python3 scripts/search.py "<query>" --domain style|color|typography|landing
python3 scripts/search.py "<query>" --stack html-tailwind|astro
```

It contains: 99 UX guidelines (incl. 20+ mobile/responsive/touch rules), 161 color palettes, 57 font pairings, 50+ styles, landing-page structures, and per-stack best practices. ALWAYS consult `--domain ux` for the mobile design of a section before building it.

## Rules to honor (from ui-ux-pro-max skill, applied to THIS site)
- SVG icons only (no emoji). cursor-pointer on clickables. Hover transitions 150–300ms.
- Contrast ≥4.5:1; visible focus rings; respect `prefers-reduced-motion`.
- Responsive at 375/768/1024/1440. Mobile: no horizontal scroll on main content, min 44px touch targets.
- Keep the accent semantic; don't introduce new ad-hoc hex — use the tokens above.
