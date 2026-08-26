/* Fashion Freelancing — public site shared scripts */

(function () {
  // Resolve nav/footer link paths.
  //
  // Over http(s) every path is absolute from the site root. Relative paths were
  // wrong the moment a route had more than one segment: on /specialists/maya-sen
  // a './assets/logo.png' resolves to /specialists/assets/logo.png, so the logo
  // and every nav link 404'd on the profile, hire, workspace and company pages.
  //
  // file:// (opening a page straight off disk) has no site root, so it keeps the
  // directory-depth calculation.
  const isFile = location.protocol === 'file:';
  const inServicesDir = /\/pages\/services\//i.test(location.pathname);
  const inPagesDir = /\/pages\//i.test(location.pathname);
  const ROOT = !isFile ? '/' : inServicesDir ? '../../' : inPagesDir ? '../' : './';
  const r = (p) => ROOT + p.replace(/^\/+/, '');

  // Expose path resolver for pages that need it
  window.FF_ROOT = ROOT;

  // Purge the legacy marketplace session key so no stale browser data from the
  // old local-storage marketplace can ever be read again. Authentication for the
  // specialist network is server-side (HttpOnly cookie) and never touches storage.
  try { localStorage.removeItem('ff_session'); } catch (e) {}
  window.FF_R = r;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const file = src.split('/').pop();
      const existing = [...document.scripts].some(sc => {
        const sf = (sc.src || '').split('/').pop().split('?')[0];
        return sf === file;
      });
      if (existing) return resolve();
      const sc = document.createElement('script');
      sc.src = src;
      sc.async = false;
      sc.onload = () => resolve();
      sc.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(sc);
    });
  }

  // Quote bot — night-glass widget for the direct-service journey.
  // Loaded at idle so it never competes with first paint on mobile.
  // Pages that set FF_NO_QUOTE_BOT (the signed-in application and workspace
  // screens) opt out: it sells our team's services, which is the wrong offer
  // on top of a form someone is halfway through.
  const bootQuoteBot = () => window.FF_NO_QUOTE_BOT
    ? Promise.resolve()
    : loadScript(r('assets/quote-bot.js'))
    .catch(e => console.error('Quote bot failed to load:', e && e.message ? e.message : e));
  if ('requestIdleCallback' in window) requestIdleCallback(bootQuoteBot, { timeout: 4000 });
  else setTimeout(bootQuoteBot, 1500);

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


      <nav class="topnav-links" aria-label="Primary">
        <a href="${r("index.html")}" id="nav-svc-trigger" class="nav-svc-trigger ${current==='agency'?'active':''}" aria-haspopup="true" aria-expanded="false" aria-controls="nav-svc-panel">Our services<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></a>
        <a href="/specialists" class="${current==='specialists'?'active':''}">Find a specialist</a>
        <a href="${r("pages/about.html")}">About</a>
        <a href="${r("pages/help.html")}">Help</a>
        <!-- Returning users had no way in: the nav offered only "Start a project".
             /sign-in sends an already-signed-in visitor straight to their
             workspace, so this one link serves both cases. -->
        <a href="/sign-in" class="nav-signin">Sign in</a>
      </nav>

      <div class="topnav-cta">
        <button class="theme-toggle" type="button" data-theme-toggle
                aria-label="Switch to light theme" title="Switch theme">
          <svg class="t-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="4.2"/>
            <path d="M12 2.4v2.6M12 19v2.6M4.6 12H2M22 12h-2.6M5.6 5.6 7.4 7.4M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>
          </svg>
          <svg class="t-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z"/>
          </svg>
        </button>
        <!-- LAUNCH: single CTA to the brief form -->
        <a href="${r("index.html")}#contact" class="btn btn-primary btn-sm">Start a project</a>
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
      <nav class="topnav-mobile-links" aria-label="Mobile primary">
        <a href="${r("index.html")}">Our services</a>
        <a href="/specialists">Find a specialist</a>
        <a href="/apply">Join as a freelancer</a>
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
          <a class="sub" href="${r("pages/services/ai-photography.html")}">AI video &amp; photography</a>
          <a class="sub" href="${r("pages/services/ecom-listing.html")}">E-com listings</a>
          <a class="sub" href="${r("pages/services/graphic-design.html")}">Graphic design</a>
        </div>
      </nav>
      <a href="/sign-in" class="tm-signin">Sign in</a>
      <div class="topnav-mobile-cta">
        <button class="theme-toggle theme-toggle-wide" type="button" data-theme-toggle
                aria-label="Switch to light theme" title="Switch theme">
          <svg class="t-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="4.2"/>
            <path d="M12 2.4v2.6M12 19v2.6M4.6 12H2M22 12h-2.6M5.6 5.6 7.4 7.4M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>
          </svg>
          <svg class="t-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z"/>
          </svg>
        </button>
        <!-- LAUNCH: single CTA to the brief form -->
        <a href="${r("index.html")}#contact" class="btn btn-primary w-full">Start a project</a>
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
      <a role="menuitem" href="${r("pages/services/ai-photography.html")}">AI video &amp; photography</a>
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
            <li><a href="${r("pages/services/ai-photography.html")}">AI video &amp; photography</a></li>
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
            <li><a href="/specialists">Find a specialist</a></li>
            <li><a href="/apply">Join as a freelancer</a></li>
            <li><a href="/sign-in">Sign in</a></li>
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
    wireThemeToggle();
    revealFailsafe();
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
        'background:rgba(var(--scrim-rgb), .94);border:1px solid rgba(var(--surface-rgb), .14);border-radius:20px;',
        '-webkit-backdrop-filter:saturate(160%) blur(22px);backdrop-filter:saturate(160%) blur(22px);',
        'box-shadow:0 30px 80px -20px rgba(var(--shadow-rgb), .75);opacity:0;visibility:hidden;pointer-events:none;',
        'transition:opacity .25s cubic-bezier(.22,1,.36,1),transform .25s cubic-bezier(.22,1,.36,1),visibility .25s;}',
        '.nav-svc-panel.open{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0);}',
        '.nsp-col h6{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.04em;text-transform:uppercase;',
        'color:var(--ink-5);margin:0 0 10px;font-weight:500;}',
        '.nsp-col a{display:block;padding:8px 10px;margin:0 -10px;border-radius:10px;text-decoration:none;',
        'font-family:Inter,sans-serif;font-size:14px;font-weight:500;color:rgba(var(--ink-rgb), .72);',
        'transition:background .2s ease,color .2s ease;}',
        '.nsp-col a:hover{background:rgba(var(--surface-rgb), .07);color:var(--ink);}',
        '@media (max-width:720px){.nav-svc-panel{display:none;}.nav-svc-trigger svg{display:none;}}',
        '.tm-label{display:block;font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.04em;',
        'text-transform:uppercase;color:var(--ink-5);padding:22px 4px 10px;}',
        '.tm-svcs{display:grid;grid-template-columns:1fr 1fr;gap:2px 14px;width:100%;}',
        '.topnav-mobile-links .tm-svcs a.sub{font-family:Inter,sans-serif !important;font-size:15px !important;',
        'font-weight:500 !important;color:rgba(var(--ink-rgb), .66) !important;padding:10px 4px !important;',
        'border-bottom:0 !important;letter-spacing:0;}',
        '.topnav-mobile-links .tm-svcs a.sub:active{color:var(--ink) !important;}',
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


    // ---- Header condenses once the page is scrolled ----
    const topnav = document.querySelector('.topnav');
    if (topnav) {
      let ticking = false;
      // Hysteresis: the condensed header is 20px shorter than the tall one, so a
      // single threshold can oscillate — collapsing reflows the page, scrollY drops
      // back under the line, it expands, and the 320ms transition reads as a shake.
      // Separate enter/exit points give it a dead zone it can't flip inside.
      const ENTER = 64, EXIT = 24;
      const syncHeader = () => {
        const y = window.scrollY;
        const on = topnav.classList.contains('is-scrolled');
        if (!on && y > ENTER) topnav.classList.add('is-scrolled');
        else if (on && y < EXIT) topnav.classList.remove('is-scrolled');
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

  /**
   * Light / dark switching.
   *
   * The theme is already applied before first paint by the inline snippet in
   * every <head> — without that the page renders in one theme and repaints in
   * the other, which reads as a flash of the wrong colour. This only handles
   * the click, the label, and remembering the choice.
   *
   * Three states matter: the visitor picked light, the visitor picked dark, or
   * they picked neither and follow their system. Choosing is sticky; never
   * choosing means the site keeps following the system if it changes.
   */
  /**
   * Nothing may stay invisible.
   *
   * Every page ships 30-60 elements at opacity:0 waiting for a scroll observer.
   * If one of those observers never fires — a stale cached script, an early
   * error, a restored back/forward page — that content is gone for good and the
   * page looks broken. This sweeps up anything still hidden shortly after load,
   * and again once everything has loaded.
   */
  function revealFailsafe() {
    const sweep = () => {
      document.querySelectorAll('.rv:not(.in)').forEach((el) => {
        const box = el.getBoundingClientRect();
        // in view now, or the observer has plainly not done its job
        if (box.top < window.innerHeight * 1.4) el.classList.add('in');
      });
    };
    setTimeout(sweep, 1200);
    window.addEventListener('load', () => setTimeout(sweep, 400));
    // last resort: after this, show everything regardless of position
    setTimeout(() => document.querySelectorAll('.rv:not(.in)').forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in');
    }), 3500);
  }

  function wireThemeToggle() {
    const root = document.documentElement;

    const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
    const current = () => root.getAttribute('data-theme') || (systemDark() ? 'dark' : 'light');

    function paint() {
      const dark = current() === 'dark';
      document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        // The control announces where it takes you, not where you are.
        const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
      });
    }

    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = current() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('ff-theme', next); } catch (e) { /* private mode */ }
        paint();
      });
    });

    // Follow the system only while the visitor has not chosen for themselves.
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (!localStorage.getItem('ff-theme')) { root.removeAttribute('data-theme'); paint(); }
      });
    } catch (e) { /* older Safari */ }

    paint();
  }
})();
