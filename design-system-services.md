# Services Design System — agency.html

## Design tokens

```css
--u: 8px;                /* base spacing unit */
--paper:   #1C1D20;      /* page background (dark default) */
--paper-2: #25272B;      /* card background */
--paper-3: #2E3035;      /* card hover background */
--ink:     #EAE7DD;      /* primary text */
--clay:    #FF5C1F;      /* orange accent / CTA */
--hair:    …             /* subtle divider (light) */
--hair-2:  …             /* card border (slightly lighter) */
--ink-3:   …             /* body text, ~70% ink */
--ink-5:   …             /* muted text, ~50% ink */
--ink-7:   …             /* very muted, ~30% ink */
--sans:    Plus Jakarta Sans
--mono:    JetBrains Mono (or similar monospace)
```

Light mode overrides via `:root[data-theme="light"]`:
```css
--paper: #E9E8E3;
--ink:   #1C1D20;
```

---

## Pattern A — Horizontal scroll card carousel (`.px-block`)

Used for: "Fashion design & development" and "AI, website & digital production" service groups.

### Markup structure

```html
<section id="side-01" class="px-block">
  <div class="px-pin" id="px-pin-s1">
    <div class="px-viewport">

      <!-- Heading — absolutely pinned to top of viewport -->
      <div class="wrap px-head-wrap">
        <div class="px-head">
          <div>
            <h2 class="display md">Section title <span class="it">&amp; subtitle.</span></h2>
          </div>
          <div class="index">Short descriptor line.<br>
            <span style="color:var(--ink-7);">Count · summary.</span>
          </div>
        </div>
      </div>

      <!-- Scrolling card track -->
      <div class="px-track" id="px-track-s1">
        <article class="px-card" data-step="1" data-side="Side 01" data-side-tag="01" data-svc="slug">
          <div class="px-top">
            <span class="px-num">01<span class="of"> / 05</span></span>
          </div>
          <div class="px-body">
            <h3>Service Name.</h3>
            <ul>
              <li><span class="li-n">01</span><span>Point one.</span></li>
              <li><span class="li-n">02</span><span>Point two.</span></li>
              <li><span class="li-n">03</span><span>Point three.</span></li>
              <li><span class="li-n">04</span><span>Point four.</span></li>
            </ul>
          </div>
          <div class="px-foot">
            <a href="#" class="px-cta">Start →</a>
          </div>
        </article>
        <!-- repeat cards -->
      </div>

      <!-- Cockpit — progress bar + current counter -->
      <div class="px-cockpit">
        <div class="pc-num"><span class="now" id="pc-now-s1">01</span><span style="color:var(--ink-5);"> / 05</span></div>
        <div class="pc-track" id="pc-track-cockpit-s1" style="--p:20%;"></div>
      </div>

    </div>
  </div>
</section>
```

### CSS layout

```css
/* Section shell */
.px-block {
  background: var(--paper);
  border-top: 1px solid var(--hair);
  border-bottom: 1px solid var(--hair);
  position: relative;
  min-height: 100vh;
}

/* JS sets exact height: 2 * innerHeight + horizontal travel */
.px-pin {
  min-height: 100vh;
  position: relative;
}

/* Sticky viewport — full screen, holds everything */
.px-viewport {
  position: sticky; top: 0;
  height: 100vh; overflow: hidden;
  background: var(--paper);
}

/* Heading pinned to the top */
.px-head-wrap {
  position: absolute; top: 0; left: 0; right: 0; z-index: 6;
  padding-top: calc(var(--u) * 3);   /* 24px */
  pointer-events: none;
}
.px-head {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: calc(var(--u) * 6); align-items: end;
}

/* Card track — GSAP translates this horizontally */
.px-track {
  position: absolute;
  top: calc(var(--u) * 15);     /* 120px — below heading */
  bottom: calc(var(--u) * 7);   /* 56px — above cockpit */
  left: 0;
  display: flex; align-items: stretch; gap: calc(var(--u) * 2);
  padding: 0 6vw;
  will-change: transform;
}

/* Cockpit — progress + counter */
.px-cockpit {
  position: absolute; left: 0; right: 0;
  bottom: calc(var(--u) * 3);   /* 24px */
  z-index: 6;
  display: grid; grid-template-columns: auto 1fr auto;
  align-items: center; gap: calc(var(--u) * 4);
  padding: 0 8vw;
  pointer-events: none;
}
```

### Card CSS

```css
.px-card {
  flex: 0 0 clamp(360px, 42vw, 560px);
  height: 100%;                     /* stretches to fill track height */
  border: 1px solid var(--hair-2);
  background: var(--paper-2);
  padding: calc(var(--u) * 3);      /* 24px */
  display: grid;
  grid-template-rows: auto 1fr auto; /* counter | body | button */
  gap: calc(var(--u) * 4);           /* 32px between rows */
  overflow: hidden;
}
.px-card:hover {
  background: var(--paper-3);
  border-color: var(--clay);
}

/* Counter row */
.px-num { font: 500 13px/1 var(--mono); letter-spacing: 0.18em; color: var(--ink-5); }
.px-num .of { color: var(--ink-7); }

/* Body row */
.px-body { display: grid; gap: calc(var(--u) * 4); align-content: start; }

/* Service title */
.px-card h3 {
  font: 800 clamp(26px, 2.8vw, 38px)/1.1 var(--sans);
  letter-spacing: -0.03em; white-space: nowrap;
  color: var(--ink);
}
.px-card:hover h3 { color: var(--clay); }

/* Bullet list */
.px-card ul  { display: grid; gap: 10px; list-style: none; }
.px-card li  { display: grid; grid-template-columns: 24px 1fr; gap: 12px; font-size: 14px; color: var(--ink-3); }
.li-n        { font: 9.5px var(--mono); letter-spacing: 0.16em; color: var(--ink-7); padding-top: 4px; }

/* CTA button row */
.px-cta {
  display: inline-flex; align-items: center; gap: 10px;
  font: 10.5px var(--mono); letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink); padding: 12px 16px; border: 1px solid var(--ink);
}
.px-card:hover .px-cta { background: var(--clay); color: var(--paper); border-color: var(--clay); gap: 14px; }
```

### GSAP wiring

```js
wireParallaxBlock({
  pinId: 'px-pin-s1', trackId: 'px-track-s1',
  numId: 'pc-now-s1', trackBarId: 'pc-track-cockpit-s1',
  total: 5, numOffset: 0,
});
```

`sizePin` sets `px-pin.style.height = 2 * innerHeight + travel` so scroll = enter + horizontal + exit.

---

## Pattern B — Service row (`.svc`)

Defined in CSS, not yet placed in HTML. Use for individual service detail rows with image + text.

### Markup structure

```html
<article class="svc">                       <!-- or .svc.flip to reverse -->
  <div class="svc-media">
    <img src="…" alt="…">
    <span class="tag">Tag label</span>       <!-- clay background, top-left -->
    <span class="corner">Corner note</span>  <!-- dark glass, bottom-right -->
  </div>
  <div class="svc-text">
    <span class="mono with-rule label">Category</span>
    <h2><span class="pn">01.</span> Service Title</h2>
    <ul class="svc-lines">
      <li>Feature point one</li>
      <li>Feature point two</li>
    </ul>
    <a href="#" class="cta">Learn more →</a>
  </div>
</article>
```

### CSS

```css
.svc {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: calc(var(--u) * 8);         /* 64px */
  align-items: center;
  padding: calc(var(--u) * 12) 0;  /* 96px top/bottom */
  border-top: 1px solid var(--hair);
}
.svc:last-of-type { border-bottom: 1px solid var(--hair); }
.svc.flip .svc-media { order: 2; }  /* image on right */

/* Media column */
.svc-media { aspect-ratio: 4/5; overflow: hidden; border: 1px solid var(--hair); }
.svc-media img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.04); transition: transform 8s ease-out; }
.svc-media:hover img { transform: scale(1.12); }
.svc-media .tag    { position: absolute; top: 16px; left: 16px; background: var(--clay); color: var(--paper); padding: 6px 12px; font: 500 10px var(--mono); letter-spacing: 0.16em; text-transform: uppercase; }
.svc-media .corner { position: absolute; bottom: 16px; right: 16px; background: rgba(28,29,32,.85); backdrop-filter: blur(6px); padding: 6px 12px; font: 500 10px var(--mono); letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink); }

/* Text column */
.svc-text h2 { font: 700 clamp(32px, 3.6vw, 56px)/1.05 var(--sans); letter-spacing: -0.032em; margin: 0 0 calc(var(--u) * 3); }
.svc-text h2 .pn { color: var(--ink-7); font-weight: 500; margin-right: 8px; }
.svc-lines { display: grid; gap: 10px; padding-top: calc(var(--u) * 2); border-top: 1px solid var(--hair); }
.svc-lines li { padding-left: 22px; position: relative; font-size: 15.5px; line-height: 1.55; color: var(--ink-3); }
.svc-lines li::before { content: ''; position: absolute; left: 0; top: 12px; width: 12px; height: 1px; background: var(--ink-7); }
.svc-text .cta { margin-top: calc(var(--u) * 4); display: inline-flex; align-items: center; gap: 10px; font: 11px var(--mono); letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink); border-bottom: 1px solid var(--ink); padding-bottom: 4px; }
.svc-text .cta:hover { color: var(--clay); border-color: var(--clay); gap: 14px; }
```

---

## Section heading system

```css
/* Used above card carousels and other sections */
.display.md {
  font: 700 clamp(24px, 2.8vw, 42px)/1.1 var(--sans);
  letter-spacing: -0.028em;
}

/* Eyebrow label */
.mono.with-rule.label {
  font: 11px var(--mono);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-5);
}
```

---

## Responsive breakpoints

| Breakpoint | Change |
|---|---|
| `≤ 860px` | `.svc` → single column; `.px-head` → single column; card `flex-basis: 78vw` |
| `≤ 720px` | Horizontal scroll carousel → CSS scroll-snap; cockpit hidden; cards `height: 70vh` |
