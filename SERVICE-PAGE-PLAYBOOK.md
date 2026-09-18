# Service Landing Page Playbook

How the Fashion Freelancing service pages are designed, built and checked.
Hand this file to any AI or developer before they touch a service page. It
records the thinking and the parts that are finished and approved, so every
new page reaches the same standard without repeating old mistakes.

Finished reference pages (open them, copy their patterns):

| Page | File | Accent |
|---|---|---|
| AI Video & Photography | `public-html/pages/services/ai-photography.html` | pink `#FF6FB3` |
| AI Customer Agent | `public-html/pages/services/ai-agent.html` | teal `#3EC8C0` |
| Web Development | `public-html/pages/services/web-development.html` | blue `#7E9BEA` |
| Digital Marketing & SEO | `public-html/pages/services/digital-marketing.html` | violet `#A78BFA` |
| E-Commerce Listing | `public-html/pages/services/ecom-listing.html` | lime `#A8D84A` |

---

## 1. Ground rules

1. **Change only what was asked.** Sections the owner has approved stay
   exactly as they are — same layout, same content, same animation. When asked
   to "change the files" in a section, change the files, not the design.
2. **Use the owner's content word for word.** If they paste card titles,
   bullets or headlines, those go in unchanged. Do not "improve" them into
   something else.
3. **Real assets only.** Use images from `public-html/assets/img/`. Portfolio
   links are the dev URLs (Cloudflare Pages / surge.sh); only projects the team
   actually launched are shown as live. Logos must be the correct, official
   marks.
4. **No invented proof.** No fake clients, ratings, prices, results or
   testimonials. Any simulated UI (dashboard, chat, listing, report) carries a
   visible **Example** badge and uses neutral names — `Yourbrand`,
   `yourbrand.com`, `example.com`.
5. **Work through to the end.** Finish the whole page, verify it, then report.
   Ask only when truly blocked.
6. **Never commit, push or stage.** The owner commits every change by hand.

---

## 2. The thinking — every page gets its own idea

Each service page must feel like one family, yet no two heroes may use the
same mechanic. Before writing markup, answer these four questions in writing:

1. **What does the customer hand over, and what do they get back?**
   (flat photos → on-model photos; a messy product note → a search-ready listing.)
2. **What is the one promise?** (24/7 answers; enquiries, not likes; found and bought.)
3. **What moving picture proves that promise in five seconds?**
   That picture is the hero.
4. **Which question does each section below answer?** One question per
   section, and no two sections share the same shape.

How the finished pages answered question 3:

| Service | Hero concept | Why it fits |
|---|---|---|
| AI Photography | Real input files fly into the centre logo, and the finished on-model photos scroll out on the right | The service *is* a transformation of files |
| AI Agent | A phone chat in a night scene at 3 AM, with "try a moment" chips a visitor can click | The product is a conversation; the promise is availability |
| Web Development | A wall of real sites we built, plus an address bar typing a domain that goes LIVE | Proof of real work, plus "on your own address" |
| Digital Marketing | A growth board: enquiry figures count up, a chart draws itself, enquiries arrive by source | The promise is sales measured, not likes |
| E-Commerce Listing | A rewrite workbench: messy supplier text is scanned, then a listing is written; checks tick; titles are rewritten per marketplace | Shows the craft: keywords, attributes, size content, per-platform rules |

**Using reference sites.** When the owner shares a reference site, take its
*qualities* — clarity, image-led cards, a confident animated hero — and design
something that suits *this* service. Never clone its layout, and never reuse
another of our pages' hero mechanics (e.g. input → output flow) for a service
it doesn't describe.

**Headlines.** Outcome first, specific, and short. Two sentences, with the
second one in the accent colour. The owner approved lines like:
"Answers every customer, 24/7. Even at 3AM." and
"Listings that get found. Copy that gets bought."
Avoid gimmicks such as weekday phrasing ("Monday … Friday").

---

## 3. Hero specification

### Layout (desktop, ≥ 901px)
- Section: `<section class="hero hero-run xx-hero">`. The shared rule in
  `assets/night.css` makes it one screen tall: `height: calc(100svh - 104px)`.
- Two columns: copy on the left at roughly `.82–.84fr`, visual on the right at
  `1.16–1.18fr`. Side padding `clamp(24px, 4vw, 72px)`.
- h1: `clamp(36px, min(4.3vw, 7svh), 64px)`, `max-width: 12–13ch`, line-height 1.05.

### Copy block, top to bottom
1. Kicker — mono, uppercase: `SERVICE — the promise`.
2. h1 — two sentences; the second wrapped in `<span class="acc-t">`.
3. Sub — up to 46ch: what we do, for whom, in plain words.
4. Buttons: primary `Get my fixed quote` (to `#contact`) and a glass
   secondary pointing at section 01 (`What we do ↓`, `Inside a listing ↓`).
5. Three short check chips (e.g. `Fixed quote in 24h`).

### The visual (the demo panel)
- **Fill the room.** The panel should be about as tall as the hero allows:
  roughly 610px at 1440×900, 530–580px at 1366×768 and about 620px at 1920×1080.
  Growing to that height with `min-height: clamp(440px, calc(100svh - 290px), 620px)`
  works well.
- **Fill it with meaning, not padding.** If panels look empty, add a block that
  explains the service (a "what shoppers search" list, a size row, a source
  strip). Never add decoration just to take up space.
- **Scale type with width**: panel text uses `clamp(min, ~0.9vw, max)`, so big
  screens don't leave gaps.
- **Never clip.** If the panel is taller than the room (short or narrow
  windows), zoom it down to fit. Measure it with its longest content in place,
  and set `el.style.zoom = room / need` (minimum around 0.72). On very short
  windows, hide the optional blocks.
- Give every simulated UI an **Example** badge.

### Hero animation — a story in phases
- Tell it in steps (scan → write → check; count up → draw → feed), then loop
  or rotate variants.
- Pause when off screen (IntersectionObserver) and when the tab is hidden
  (`visibilitychange`).
- If there are controls (tabs, chips), a click shows that state immediately,
  finishes any half-built state, and **stops auto-rotation** — the visitor is
  in charge now.
- Change labels and the content they describe in the same frame. Don't let a
  label switch before its content fades.
- `prefers-reduced-motion`: render the final, complete state with no
  movement, and nothing left at `opacity: 0`.
- Animate `transform` and `opacity` only.

### Mobile (≤ 900px)
- The copy stacks above the same demo, **customised for mobile**, not
  removed: one column, compact controls (e.g. inactive tabs show only their
  icon), and the arrow rotates to point down.
- Every grid that holds the demo uses `grid-template-columns: minmax(0, 1fr)`,
  and flex children get `min-width: 0`. Without this the demo grows wider than
  the screen and text gets cut off.

---

## 4. Sections below the hero

Adapt the order to the service, but keep the shared pieces so the pages stay
one family.

| # | Section | Pattern / classes |
|---|---|---|
| — | Optional strip under the hero (platforms, tools) — only with real logos | `.mk` marquee; the duplicated half is `aria-hidden` |
| 01 | What you get / What we do | `.dl-head` (heading left, note right), then a **six-card grid** `.offer > .off`: preview area `.off-mv` (mini illustration or real image, masked fade), `.off-n` number, `.off-ic` icon, `h3`, three bullets. Then "In every delivery": `.dl-spec` eight tiles (icon, bold line, short line) |
| 02 | See the difference / Why it matters | A proof section on a tonal band `.sec.stage.gate`: before/after, a toggle, or three problem → fix cards |
| 03 | A service-specific section | Something only this service has: scale (hero vs bulk), stack explorer, selected work, reporting |
| NN | How it works | `.weeks.rail.rv-steps` with four steps (numbered circles and a progress line), then honest expectations (`.hx` / `.assure`) |
| — | FAQ | 6–10 questions, hairline rows, plus a `FAQPage` JSON-LD block that mirrors the text exactly |
| — | Specialist strip | `.svc-net`: "Would you rather hire one person?" linking to `/specialists?service=<slug>` |
| — | Contact | `.contact-panel`: form (name, email, brand optional, service select **preselected to this page**, message), a list of promises, and copy-email |

Section rules:
- Eyebrows are numbered and run in order: `01 — What you get`, `02 — …`.
- Headings are two-tone: the closing phrase goes in `<span class="acc-t">`.
- Use `.head-split` / `.dl-head`: heading on the left, one-sentence note on the right.
- No empty stretches: keep vertical rhythm tight and even, and give cards in
  the same row matching heights.
- Rail steps: `.weeks.rail .week` needs `align-content: start` so all step
  titles line up when step texts have different lengths.
- Include an **honest expectations** block ("what changes when, truthfully",
  "what copy can't fix"). The owner values this.

---

## 5. Visual system

**Base:** the night-glass system. Shared rules are in `public-html/assets/night.css`;
nav, footer and reveal are in `public-html/assets/site.js`. Each service page
carries its own inline `<style>` and `<script>`.

**Type:** Plus Jakarta Sans for display (`--disp`), Instrument Sans for body
(`--sans`), IBM Plex Mono (`--mono`) for kickers, labels, data and codes.

**Accent tokens (one hue per page):**
```css
--acc-bright   /* the hue itself: fills, dots, dark-mode text */
--acc-ink      /* dark shade for text on light backgrounds (≥ 4.5:1) */
--acc-disp     /* heading accent on light */
--acc-l        /* pale tint */
--acc-deep     /* stronger fill */
--acc-08 … --acc-45  /* rgba steps of the hue */
```
- A new service picks a hue no other page uses. A page being redesigned keeps
  its current accent.
- Never use the bright accent as text on a light background; use `--acc-ink`.
- Dark text on accent-filled buttons, e.g. `#1B2608` on lime.

**Surfaces:** `--card`, `--card-2`, `--edge`, `--lift` / `--lift-h` shadows;
radius 24px on panels and 14px on inner boxes.

**Dark mode:** every custom colour needs both
`:root[data-theme="dark"] …` and
`@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) … }`.
Check that dark badges and marks stay visible on dark cards; add a faint ring
if needed.

**Brand logos:** Simple Icons (CC0) as inline SVG paths in the brand's own
colour (`cdn.jsdelivr.net/npm/simple-icons`). When a brand is not in that set,
use a plain name badge — never draw an imitation logo.

**Motion:** each block type gets its own entrance (count-up for numbers, draw
for lines, stagger for lists). Reveal uses `.rv` → `.in`, guarded so content
is never hidden when script fails.

---

## 6. Content rules

- The visitor should understand what this is, who it is for and why it's
  different within five seconds of seeing the hero.
- Benefit first, in the customer's own words. Name the pain directly.
- CTA text states the value: `Get my fixed quote`, never `Submit`.
- Answer the objections somewhere on the page: price (fixed quote), trust
  (honest expectations), effort (what we need from you), fit (who it's for).
- Fictional product data stays consistent across the page (the same example
  product in the hero and in the cards).
- SEO: one `h1`; `<title>` and meta description tagged `head.title` /
  `head.description`; JSON-LD for `Service` and `FAQPage`.

---

## 7. Build workflow

1. **Start from the newest finished page as a shell.** Copy it, swap the accent
   tokens, then replace the hero and sections. Carry over the old page's title,
   meta, JSON-LD, FAQ, specialist strip and contact copy where the owner still
   wants them.
2. **Keep CMS keys.** Every editable element has a `data-cms` key
   (`section.kind-n`). Where the text is unchanged, reuse the old key so
   dashboard edits survive. Tag new elements with
   `cd fashion-os && node scripts/annotate-cms.mjs` (existing keys never
   renumber). Keys must be unique on the page.
3. **Edit in `public-html/`, then sync.** The running app serves copies:
   `cd fashion-os && node scripts/sync-public.mjs` after **every** edit, then
   check on the dev server (`npx astro dev status` shows the port). If served
   text differs from the file, a row in the D1 `site_content` table is
   overriding it.
4. **Form behaviour** (keep it as the finished pages have it): show the success
   panel only inside the fetch `.then`; show the error panel on failure; mark
   invalid fields with `aria-invalid` and `aria-describedby`; focus the first
   error.
5. **Clean up.** Check CSS brace balance, then remove CSS inherited from the
   shell that no element on this page uses. Check this against the live DOM at
   desktop, mobile and dark, and keep selectors for runtime-only states (`.in`,
   `.on`, `.hit`, success panels, nav/footer injected by `site.js`).
6. **Only when adding a brand-new service** (not a redesign), also update:
   `fashion-os/src/data/taxonomy.ts`, then regenerate the taxonomy SQL and add
   a migration; `src/server/site-content.ts` (`SERVICE_SLUGS`, `PAGE_NAMES`);
   the `PAGES` list in `scripts/annotate-cms.mjs`; nav and footer links in
   `assets/site.js`; the homepage service cards; the service `<select>` on
   every page; `sitemap.xml`; terms; the quote bot; and `public/_redirects`
   if a URL changes.

---

## 8. Verification — required before calling a page done

Render the page in a real browser, look at the screenshots, and probe it. Code
review alone is not verification.

**Viewports:** 1920×1080, 1440×900, 1366×768, 1280×720, 1024×768, 390×844,
plus dark theme and `prefers-reduced-motion`.

**Checks:**
- No horizontal overflow: `document.documentElement.scrollWidth - innerWidth === 0`.
- No broken images: every `img` has `naturalWidth > 0` once loaded.
- No JS exceptions or console errors.
- The hero fits: the demo's bottom edge is inside the hero, and its
  `scrollHeight` is at most its `clientHeight` at every desktop size.
- Hero animation: screenshot it at several moments (start, mid-build,
  finished, variant switch) and confirm labels match content in every frame.
- Every control works: clicking a tab or chip shows the right state, and
  auto-rotation stops afterwards.
- The rail reveals, and all step titles sit on the same line.
- Every `href="#…"` points to an existing id.
- The service select is preselected to this page.
- Force `fetch` to fail and submit the form: the error shows, the success
  panel does not, and the form stays.
- Reduced motion: final state shown, nothing invisible.
- Dark theme: every custom colour, badge and logo stays readable.

Note: full-page screenshots can show scroll-revealed parts (like the rail) as
blank. Scroll the section into view before judging it.

---

## 9. Working with the owner

- One service page at a time, finished and verified before the next.
- Report briefly: what changed, what was verified, which content is example
  data, and that nothing is committed.
- Treat each piece of feedback as a precise instruction: fix exactly what was
  pointed at, and keep everything else as it was.
