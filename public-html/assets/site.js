/* Fashion Freelancing — public site shared scripts */

(function () {
  // Resolve link paths so they work under file:// (direct open), a local
  // server, AND Cloudflare Pages — which serves /pages/signup.html at the
  // CLEAN URL /pages/signup (no .html). So detect the /pages/ segment by
  // path, not by file extension.
  // Service pages live one level deeper (/pages/services/<slug>.html).
  const inServicesDir = /\/pages\/services\//i.test(location.pathname);
  const inPagesDir = /\/pages\//i.test(location.pathname);
  const ROOT = inServicesDir ? '../../' : inPagesDir ? '../' : './';
  const r = (p) => ROOT + p.replace(/^\/+/, '');

  // Expose path resolver for pages that need it
  window.FF_ROOT = ROOT;

  // LAUNCH: no logins on the services site — clear any stale marketplace test
  // session so nothing (cached or future code) can render auth UI in the header.
  try { localStorage.removeItem('ff_session'); } catch (e) {}
  window.FF_R = r;

  // -- Auto-load shared modules in order: store → api → ui --
  // Each script is appended only after the previous one's `load` event,
  // so execution order is guaranteed regardless of the `async` attribute.
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // already on the page? (matched by exact filename, anchored)
      const file = src.split('/').pop();
      const existing = [...document.scripts].some(s => {
        const sf = (s.src || '').split('/').pop().split('?')[0];
        return sf === file;
      });
      if (existing) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }
  // Tracks readiness so late listeners still fire.
  window.FF_READY = window.FF_READY || false;

  // Floating AI chat widget — loaded on every page that boots site.js.
  // intake.js (renderer) → ff-chat.js (launcher + panel). Independent
  // chain from the api/store/ui chain so the widget appears even before
  // those finish loading.
  function loadStylesheet(href) {
    if (document.querySelector(`link[href$="${href.split('/').pop()}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }
  /* HIDDEN FOR LAUNCH: marketplace intake chat widget — its flow asks
     hire / get-hired questions that don't exist in the launch scope, and
     its styling predates the night-glass system. Re-enable (or rebuild as
     an on-brand quote bot) when the marketplace ships.
  loadStylesheet(r('shared/intake.css'));
  loadScript(r('shared/intake.js'))
    .then(() => loadScript(r('assets/ff-chat.js')))
    .catch(e => console.error('Chat widget failed to load:', e && e.message ? e.message : e));
  HIDDEN FOR LAUNCH */
  // Launch quote bot — night-glass widget, flow dedicated to the current services.
  // Loaded at idle so it never competes with first paint on mobile.
  const bootQuoteBot = () => loadScript(r('assets/quote-bot.js'))
    .catch(e => console.error('Quote bot failed to load:', e && e.message ? e.message : e));
  if ('requestIdleCallback' in window) requestIdleCallback(bootQuoteBot, { timeout: 4000 });
  else setTimeout(bootQuoteBot, 1500);

  if (!window.api) {
    loadScript(r('assets/store.js'))
      .then(() => loadScript(r('assets/api.js')))
      .then(() => loadScript(r('assets/ui.js')))
      .then(() => {
        if (!window.api) throw new Error('api.js loaded but window.api is undefined');
        window.FF_READY = true;
        window.dispatchEvent(new CustomEvent('ff:ready', { detail: { api: window.api, ui: window.UI } }));
      })
      .catch(e => {
        console.error('Shared modules failed to load:', e && e.message ? e.message : e);
      });
  } else {
    window.FF_READY = true;
  }

  /**
   * Run a callback once shared modules (api, UI) are loaded.
   * Safe whether called before OR after they finish loading —
   * fixes the race where the page's inline script attaches a
   * listener after 'ff:ready' already fired.
   */
  window.onFFReady = function (cb) {
    if (window.FF_READY && window.api) { cb(); return; }
    window.addEventListener('ff:ready', function handler() {
      window.removeEventListener('ff:ready', handler);
      cb();
    });
  };

  // ---- Top navigation ----
  // Logo mark — violet→cyan gradient tile, "FF" needle motif, cyan accent dot.
  const logoSVG = `
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="ffLogoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#6E56F0"/>
          <stop offset="0.5" stop-color="#5468F5"/>
          <stop offset="1" stop-color="#2BA8E8"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#ffLogoGrad)"/>
      <path d="M10 23V9h12M10 16h9" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="23" cy="23" r="2.4" fill="#FFFFFF"/>
    </svg>`;

  // Wording: simple, plain English. Same nav for everyone.
  const navHTML = (current) => `
  <div class="topnav">
    <div class="container topnav-inner">
      <!-- LAUNCH: logo points at the services page (current homepage) -->
      <a href="${r("index.html")}" class="logo" aria-label="Fashion Freelancing home">
        <img class="logo-img" src="${r("assets/logo.png")}" alt="Fashion Freelancing" />
      </a>

      <!-- HIDDEN FOR LAUNCH: marketplace search
      <form class="topnav-search" action="${r("pages/marketplace.html")}" role="search" aria-label="Search freelancers">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/>
          <path d="M20 20l-3-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        </svg>
        <input name="q" placeholder="Search 'tech pack designer', 'photographer'…" aria-label="Search"/>
        <kbd>⌘K</kbd>
      </form>
      HIDDEN FOR LAUNCH -->

      <nav class="topnav-links" aria-label="Primary">
        <a href="${r("index.html")}" id="nav-svc-trigger" class="nav-svc-trigger ${current==='agency'?'active':''}" aria-haspopup="true" aria-expanded="false" aria-controls="nav-svc-panel">Our services<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></a>
        <a href="${r("pages/about.html")}">About</a>
        <a href="${r("pages/help.html")}">Help</a>
        <!-- HIDDEN FOR LAUNCH: marketplace links
        <a href="${r("pages/marketplace.html")}" class="${current==='talent'?'active':''}">Find a freelancer</a>
        <a href="${r("pages/marketplace.html")}#jobs" class="${current==='work'?'active':''}">Find a job</a>
        <a href="${r("pages/how-it-works.html")}" class="${current==='how'?'active':''}">How it works</a>
        <a href="${r("pages/pricing.html")}" class="${current==='pricing'?'active':''}">Pricing</a>
        HIDDEN FOR LAUNCH -->
      </nav>

      <div class="topnav-cta">
        <!-- LAUNCH: single CTA to the brief form -->
        <a href="${r("index.html")}#contact" class="btn btn-primary btn-sm">Start a project</a>
        <!-- HIDDEN FOR LAUNCH: auth
        <a href="${r("pages/login.html")}" class="topnav-signin">Sign in</a>
        <a href="${r("pages/signup.html")}" class="btn btn-primary btn-sm">Join free</a>
        HIDDEN FOR LAUNCH -->
      </div>

      <!-- Mobile hamburger -->
      <button class="topnav-burger" id="nav-burger" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>

  <!-- Mobile slide-out menu — sibling of .topnav so backdrop-filter
       on .topnav does not trap its fixed positioning -->
  <div class="topnav-mobile" id="nav-mobile" aria-hidden="true">
    <div class="topnav-mobile-inner">
      <!-- HIDDEN FOR LAUNCH: mobile search
      <form class="topnav-search topnav-search-mobile" action="${r("pages/marketplace.html")}" role="search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M20 20l-3-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        <input name="q" placeholder="Search…"/>
      </form>
      HIDDEN FOR LAUNCH -->
      <nav class="topnav-mobile-links" aria-label="Mobile primary">
        <a href="${r("index.html")}">Our services</a>
        <a href="${r("pages/about.html")}">About</a>
        <a href="${r("pages/help.html")}">Help</a>
        <span class="tm-label" aria-hidden="true">Services</span>
        <div class="tm-svcs">
          <a class="sub" href="${r("pages/services/tech-pack.html")}">Tech packs</a>
          <a class="sub" href="${r("pages/services/3d-virtual-sampling.html")}">3D sampling</a>
          <a class="sub" href="${r("pages/services/seamless-pattern.html")}">Seamless patterns</a>
          <a class="sub" href="${r("pages/services/pattern-cad.html")}">Pattern (CAD)</a>
          <a class="sub" href="${r("pages/services/dobby-jacquard.html")}">Dobby &amp; jacquard</a>
          <a class="sub" href="${r("pages/services/website.html")}">Websites</a>
          <a class="sub" href="${r("pages/services/ai-agent.html")}">AI agent</a>
          <a class="sub" href="${r("pages/services/ai-photography.html")}">AI photography</a>
          <a class="sub" href="${r("pages/services/ecom-listing.html")}">E-com listings</a>
          <a class="sub" href="${r("pages/services/graphic-design.html")}">Graphic design</a>
        </div>
        <!-- HIDDEN FOR LAUNCH: marketplace links
        <a href="${r("pages/marketplace.html")}">Find a freelancer</a>
        <a href="${r("pages/marketplace.html")}#jobs">Find a job</a>
        <a href="${r("pages/how-it-works.html")}">How it works</a>
        <a href="${r("pages/pricing.html")}">Pricing</a>
        HIDDEN FOR LAUNCH -->
      </nav>
      <div class="topnav-mobile-cta">
        <!-- LAUNCH: single CTA to the brief form -->
        <a href="${r("index.html")}#contact" class="btn btn-primary w-full">Start a project</a>
        <!-- HIDDEN FOR LAUNCH: auth
        <a href="${r("pages/login.html")}" class="btn btn-ghost w-full">Sign in</a>
        <a href="${r("pages/signup.html")}" class="btn btn-primary w-full">Join free</a>
        HIDDEN FOR LAUNCH -->
      </div>
    </div>
  </div>

  <!-- Desktop services dropdown — sibling of the pill (its overflow:hidden would clip a child) -->
  <div class="nav-svc-panel" id="nav-svc-panel" role="menu" aria-label="All services">
    <div class="nsp-col">
      <h6>Design &amp; development</h6>
      <a role="menuitem" href="${r("pages/services/tech-pack.html")}">Tech packs</a>
      <a role="menuitem" href="${r("pages/services/3d-virtual-sampling.html")}">3D virtual sampling</a>
      <a role="menuitem" href="${r("pages/services/seamless-pattern.html")}">Seamless patterns</a>
      <a role="menuitem" href="${r("pages/services/pattern-cad.html")}">Pattern making (CAD)</a>
      <a role="menuitem" href="${r("pages/services/dobby-jacquard.html")}">Dobby &amp; jacquard</a>
    </div>
    <div class="nsp-col">
      <h6>AI &amp; digital</h6>
      <a role="menuitem" href="${r("pages/services/website.html")}">Website development</a>
      <a role="menuitem" href="${r("pages/services/ai-agent.html")}">AI customer agent</a>
      <a role="menuitem" href="${r("pages/services/ai-photography.html")}">AI photography</a>
      <a role="menuitem" href="${r("pages/services/ecom-listing.html")}">E-commerce listings</a>
      <a role="menuitem" href="${r("pages/services/graphic-design.html")}">Graphic design</a>
    </div>
  </div>`;

  // ---- Footer ----
  const footerHTML = `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="${r("index.html")}" class="logo">
            <img class="logo-img" src="${r("assets/logo.png")}" alt="Fashion Freelancing" style="height:36px;" />
          </a>
          <p style="color:var(--ink-5);font-size:14px;max-width:340px;margin-top:14px;line-height:1.55;">
            Fashion Freelancing is a fashion design and production-services studio — factory-ready
            tech packs, 3D virtual samples, digital patterns, seamless prints, woven designs,
            AI product photography, marketplace listings, websites and brand design.
          </p>
          <p style="color:var(--ink-5);font-size:13px;max-width:340px;margin-top:10px;line-height:1.55;">
            Every quote is fixed before work starts. Two revision rounds included in every package.
            Full ownership transfers to you on final payment.
          </p>
        </div>

        <details class="footer-acc">
          <summary class="footer-acc-head"><h5>Design &amp; development</h5><span class="footer-acc-icon" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span></summary>
          <ul>
            <li><a href="${r("pages/services/tech-pack.html")}">Tech packs</a></li>
            <li><a href="${r("pages/services/3d-virtual-sampling.html")}">3D virtual sampling</a></li>
            <li><a href="${r("pages/services/seamless-pattern.html")}">Seamless patterns</a></li>
            <li><a href="${r("pages/services/pattern-cad.html")}">Pattern making (CAD)</a></li>
            <li><a href="${r("pages/services/dobby-jacquard.html")}">Dobby &amp; jacquard</a></li>
          </ul>
        </details>

        <details class="footer-acc">
          <summary class="footer-acc-head"><h5>AI &amp; digital</h5><span class="footer-acc-icon" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span></summary>
          <ul>
            <li><a href="${r("pages/services/website.html")}">Website development</a></li>
            <li><a href="${r("pages/services/ai-agent.html")}">AI customer agent</a></li>
            <li><a href="${r("pages/services/ai-photography.html")}">AI photography</a></li>
            <li><a href="${r("pages/services/ecom-listing.html")}">E-commerce listings</a></li>
            <li><a href="${r("pages/services/graphic-design.html")}">Graphic design</a></li>
          </ul>
        </details>

        <details class="footer-acc">
          <summary class="footer-acc-head"><h5>Company</h5><span class="footer-acc-icon" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span></summary>
          <ul>
            <li><a href="${r("index.html")}">Our services</a></li>
            <li><a href="${r("pages/about.html")}">About us</a></li>
            <li><a href="${r("pages/help.html")}">Help &amp; FAQ</a></li>
            <li><a href="${r("index.html")}#contact">Start a project</a></li>
          </ul>
        </details>
      </div>

      <div class="footer-bottom">
        <div>© 2026 Fashion Freelancing · Made for fashion people.</div>
        <div style="display:flex;gap:20px;">
          <a href="${r("pages/privacy.html")}">Privacy</a>
          <a href="${r("pages/terms.html")}">Terms</a>
        </div>
      </div>
    </div>
  </footer>`;

  // Inject
  document.addEventListener('DOMContentLoaded', () => {
    const navMount = document.getElementById('site-nav');
    if (navMount) navMount.outerHTML = navHTML(navMount.dataset.current || '');
    const footerMount = document.getElementById('site-footer');
    if (footerMount) footerMount.outerHTML = footerHTML;

    // Services dropdown + drawer styles (component-scoped, night-glass)
    if (!document.getElementById('ff-nav-style')) {
      const st = document.createElement('style');
      st.id = 'ff-nav-style';
      st.textContent = [
        '.nav-svc-trigger svg{margin-left:5px;vertical-align:1px;transition:transform .25s ease;}',
        '.nav-svc-trigger[aria-expanded="true"] svg{transform:rotate(180deg);}',
        '.nav-svc-panel{position:fixed;left:50%;top:104px;transform:translateX(-50%) translateY(-8px);z-index:70;',
        'display:grid;grid-template-columns:1fr 1fr;gap:6px 34px;padding:22px 28px;width:min(560px,calc(100vw - 32px));',
        'background:rgba(16,13,32,.94);border:1px solid rgba(255,255,255,.14);border-radius:20px;',
        '-webkit-backdrop-filter:saturate(160%) blur(22px);backdrop-filter:saturate(160%) blur(22px);',
        'box-shadow:0 30px 80px -20px rgba(0,0,0,.75);opacity:0;visibility:hidden;pointer-events:none;',
        'transition:opacity .25s cubic-bezier(.22,1,.36,1),transform .25s cubic-bezier(.22,1,.36,1),visibility .25s;}',
        '.nav-svc-panel.open{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0);}',
        '.nsp-col h6{font-family:"IBM Plex Mono",monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;',
        'color:#A78BFA;margin:0 0 10px;font-weight:500;}',
        '.nsp-col a{display:block;padding:8px 10px;margin:0 -10px;border-radius:10px;text-decoration:none;',
        'font-family:Inter,sans-serif;font-size:14px;font-weight:500;color:rgba(244,242,250,.72);',
        'transition:background .2s ease,color .2s ease;}',
        '.nsp-col a:hover{background:rgba(255,255,255,.07);color:#fff;}',
        '@media (max-width:720px){.nav-svc-panel{display:none;}.nav-svc-trigger svg{display:none;}}',
        '.tm-label{display:block;font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:.2em;',
        'text-transform:uppercase;color:#A78BFA;padding:22px 4px 10px;}',
        '.tm-svcs{display:grid;grid-template-columns:1fr 1fr;gap:2px 14px;width:100%;}',
        '.topnav-mobile-links .tm-svcs a.sub{font-family:Inter,sans-serif !important;font-size:15px !important;',
        'font-weight:500 !important;color:rgba(244,242,250,.66) !important;padding:10px 4px !important;',
        'border-bottom:0 !important;letter-spacing:0;}',
        '.topnav-mobile-links .tm-svcs a.sub:active{color:#fff !important;}',
      ].join('');
      document.head.appendChild(st);
    }

    // Dropdown behavior: hover-open on desktop, closes on leave/Escape/outside click
    const svcTrigger = document.getElementById('nav-svc-trigger');
    const svcPanel = document.getElementById('nav-svc-panel');
    if (svcTrigger && svcPanel) {
      let closeTimer = null;
      const isDesktop = () => window.innerWidth >= 721 && window.matchMedia('(hover: hover)').matches;
      const openP = () => {
        if (!isDesktop()) return;
        clearTimeout(closeTimer);
        svcPanel.classList.add('open');
        svcTrigger.setAttribute('aria-expanded', 'true');
      };
      const closeP = (now) => {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          svcPanel.classList.remove('open');
          svcTrigger.setAttribute('aria-expanded', 'false');
        }, now ? 0 : 160);
      };
      svcTrigger.addEventListener('mouseenter', openP);
      svcTrigger.addEventListener('mouseleave', () => closeP());
      svcPanel.addEventListener('mouseenter', openP);
      svcPanel.addEventListener('mouseleave', () => closeP());
      svcTrigger.addEventListener('focus', openP);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeP(true); });
      document.addEventListener('click', (e) => {
        if (!svcPanel.contains(e.target) && !svcTrigger.contains(e.target)) closeP(true);
      });
    }

    // Footer accordion: always open on desktop, toggle on mobile
    function syncFooterAccordion() {
      const desktop = window.innerWidth >= 721; // match the site-wide mobile breakpoint
      document.querySelectorAll('.footer-acc').forEach(d => {
        if (desktop) d.setAttribute('open', '');
        else if (!d.dataset.userOpened) d.removeAttribute('open');
      });
    }
    syncFooterAccordion();
    window.addEventListener('resize', syncFooterAccordion);

    // Mobile hamburger
    const burger = document.getElementById('nav-burger');
    const mobile = document.getElementById('nav-mobile');
    if (burger && mobile) {
      const close = () => {
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        mobile.classList.remove('is-open');
        mobile.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      };
      const open = () => {
        burger.classList.add('is-open');
        burger.setAttribute('aria-expanded', 'true');
        mobile.classList.add('is-open');
        mobile.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      };
      burger.addEventListener('click', () => {
        burger.classList.contains('is-open') ? close() : open();
      });
      // Close when a link is tapped
      mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
      // Close on escape
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
      // Close on backdrop tap (any non-interactive area of the panel)
      mobile.addEventListener('click', (e) => {
        if (!e.target.closest('a, button, input, form')) close();
      });
      // Never leave the body scroll-locked if the burger disappears
      // (rotate to landscape / resize past the 1100px desktop breakpoint)
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 1100 && mobile.classList.contains('is-open')) close();
      });
    }

    // Cmd/Ctrl + K → focus search
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const input = document.querySelector('.topnav-search input');
        if (input) { e.preventDefault(); input.focus(); }
      }
    });

    // ---- Header condenses once the page is scrolled ----
    const topnav = document.querySelector('.topnav');
    if (topnav) {
      let ticking = false;
      const syncHeader = () => {
        topnav.classList.toggle('is-scrolled', window.scrollY > 12);
        ticking = false;
      };
      window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(syncHeader); ticking = true; }
      }, { passive: true });
      syncHeader(); // set correct state on load (e.g. when restored mid-page)
    }

    // ---- PERF: lazy-load images that aren't above the fold ----
    // Skips the first 3 images on the page (likely the hero/cover/avatar)
    // and any image inside .topnav. Adds decoding="async" everywhere so the
    // main thread isn't blocked decoding portfolio photos during scroll.
    (function () {
      const imgs = document.querySelectorAll('img:not([loading])');
      imgs.forEach((img, i) => {
        if (img.closest('.topnav')) return;
        if (!img.hasAttribute('decoding')) img.decoding = 'async';
        if (i < 3) {
          // above-the-fold: load eagerly, but ask for high priority
          img.setAttribute('fetchpriority', 'high');
        } else {
          img.loading = 'lazy';
        }
      });
    })();

    // ---- PERF: pause heavy CSS animations when off-screen ----
    // Orbs (filter: blur) and marquees keep the GPU awake even when nobody's
    // looking. We toggle `.paused-fx` on the closest "stage" parent the moment
    // it scrolls out of view; CSS does the rest (animation-play-state: paused).
    if ('IntersectionObserver' in window) {
      const stages = new Set();
      document.querySelectorAll('.fx-orb, .hv-orb, .hv-marquee, .marquee, .ticker-track, [data-fx-loop]').forEach(el => {
        const stage = el.closest('.fx-stage, .hv-hero, .hv-cta, .hv-marquee-wrap, section, header, body') || el.parentElement;
        if (stage) stages.add(stage);
      });
      if (stages.size) {
        const fxObs = new IntersectionObserver((entries) => {
          entries.forEach(e => e.target.classList.toggle('paused-fx', !e.isIntersecting));
        }, { rootMargin: '120px' }); // start a bit before, end a bit after — no flicker at edges
        stages.forEach(s => fxObs.observe(s));
      }
    }

    // ---- Auto-wire the v8 motion system site-wide ----
    // Pages don't all hand-tag .reveal/.spotlight, so opt every content
    // .card and major section into scroll-reveal + cursor glow for free.
    // Cards that share a parent get a soft per-row stagger so they reveal
    // in sequence rather than all at once.
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      const cardsByParent = new Map();
      document.querySelectorAll('.card').forEach(el => {
        if (el.closest('.topnav, .footer')) return;
        el.classList.add('reveal');
        if (!el.classList.contains('spotlight')) el.classList.add('spotlight');
        const parent = el.parentElement;
        if (!parent) return;
        if (!cardsByParent.has(parent)) cardsByParent.set(parent, []);
        cardsByParent.get(parent).push(el);
      });
      cardsByParent.forEach(siblings => {
        siblings.forEach((el, i) => {
          // Cap delay at 4 to keep things snappy; rest fire together.
          el.style.transitionDelay = (Math.min(i, 4) * 0.08) + 's';
        });
      });
      // section-level headers / blocks fade up too
      document.querySelectorAll('.section > .container > *, main > section').forEach(el => {
        if (!el.classList.contains('reveal') && !el.querySelector('.topnav')) el.classList.add('reveal');
      });
    }

    // ---- Reveal-on-scroll (.reveal, .reveal-scale, [data-stagger]) ----
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal, .reveal-scale, [data-stagger]').forEach(el => io.observe(el));

    // ---- Spotlight cursor glow on .spotlight cards ----
    if (!reduceMotion) {
      document.addEventListener('pointermove', (e) => {
        const card = e.target.closest && e.target.closest('.spotlight');
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });

      // ---- Magnetic effect on [data-magnetic] buttons ----
      document.querySelectorAll('[data-magnetic]').forEach(btn => {
        btn.addEventListener('pointermove', (e) => {
          const r = btn.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * 0.25;
          const y = (e.clientY - r.top - r.height / 2) * 0.25;
          btn.style.transform = `translate(${x}px, ${y}px)`;
        });
        btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
      });

      // ---- Count-up for [data-count] numbers ----
      const countObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const el = e.target;
          countObs.unobserve(el);
          const raw = el.getAttribute('data-count');
          const target = parseFloat(raw);
          const suffix = el.getAttribute('data-suffix') || '';
          const prefix = el.getAttribute('data-prefix') || '';
          if (isNaN(target)) return;
          const dur = 1100, start = performance.now();
          const decimals = (raw.split('.')[1] || '').length;
          function tick(t) {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            const val = target * eased;
            el.textContent = prefix + (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString()) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.5 });
      document.querySelectorAll('[data-count]').forEach(el => countObs.observe(el));
    }
  });
})();
