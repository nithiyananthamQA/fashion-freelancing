/**
 * Fashion Freelancing — shared UI helpers
 *
 * Toasts, scroll-reveal, header session swap, page transitions.
 * Plain JS, no framework. Works in HTML and Astro.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UI = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var root = (typeof self !== 'undefined') ? self : (typeof window !== 'undefined' ? window : {});

  // -----------------------------------------------------
  //  TOASTS — small bottom-right notifications
  // -----------------------------------------------------
  function ensureToastRoot() {
    let root = document.getElementById('ff-toast-root');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'ff-toast-root';
    root.setAttribute('aria-live', 'polite');
    root.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:200;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(root);
    return root;
  }

  function toast(message, opts = {}) {
    if (typeof document === 'undefined') return;
    const { kind = 'info', duration = 3500, action } = opts;
    const root = ensureToastRoot();
    const el = document.createElement('div');
    const icon = kind === 'success' ? '✓' : kind === 'error' ? '!' : kind === 'warn' ? '⚠' : 'ⓘ';
    const iconColor = kind === 'success' ? '#16744D' : kind === 'error' ? '#B43A18' : kind === 'warn' ? '#B8993F' : '#525252';
    el.style.cssText = `
      pointer-events:auto;
      background:#0A0A0A;color:#FAFAF7;
      border-radius:12px;padding:12px 16px;
      box-shadow:0 18px 40px -12px rgba(0,0,0,.45);
      font-family:Inter,sans-serif;font-size:14px;line-height:1.4;
      max-width:340px;display:flex;align-items:center;gap:10px;
      transform:translateY(20px);opacity:0;
      transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .25s;
    `;
    el.innerHTML = `
      <span style="width:22px;height:22px;border-radius:99px;background:${iconColor};color:#FAFAF7;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${icon}</span>
      <span style="flex:1;">${message}</span>
      ${action ? `<button style="background:#C9A961;color:#0A0A0A;border:0;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:500;cursor:pointer;flex-shrink:0;">${action.label}</button>` : ''}
      <button aria-label="Close" style="background:transparent;border:0;color:#A3A3A3;cursor:pointer;font-size:18px;padding:0 4px;line-height:1;flex-shrink:0;">×</button>
    `;
    const buttons = el.querySelectorAll('button');
    if (action) buttons[0].onclick = () => { action.onClick && action.onClick(); remove(); };
    buttons[buttons.length - 1].onclick = remove;

    root.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = 'translateY(0)'; el.style.opacity = '1'; });

    let timer = setTimeout(remove, duration);
    function remove() {
      clearTimeout(timer);
      el.style.transform = 'translateY(20px)'; el.style.opacity = '0';
      setTimeout(() => el.remove(), 350);
    }
    return remove;
  }

  // -----------------------------------------------------
  //  SCROLL REVEAL — fade-up sections as they enter viewport
  // -----------------------------------------------------
  function initScrollReveal() {
    if (typeof IntersectionObserver === 'undefined') return;
    const els = document.querySelectorAll('.reveal:not(.in)');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    els.forEach(el => io.observe(el));
  }

  // -----------------------------------------------------
  //  AUTO-REVEAL — auto-add .reveal to top-level sections
  // -----------------------------------------------------
  function autoReveal() {
    document.querySelectorAll('main > section, .auto-reveal').forEach((s, i) => {
      if (s.classList.contains('reveal')) return;
      s.classList.add('reveal');
      // Small stagger via inline transition delay
      s.style.transitionDelay = (Math.min(i, 4) * 50) + 'ms';
    });
  }

  // -----------------------------------------------------
  //  Pretty count-up animation for stats numbers
  // -----------------------------------------------------
  function countUp(el, from, to, duration = 1200, formatter) {
    const start = performance.now();
    const fmt = formatter || (n => Math.round(n).toLocaleString());
    function step(t) {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // -----------------------------------------------------
  //  Update header to reflect signed-in user
  // -----------------------------------------------------
  function applySessionToHeader() {
    if (!root.api) return;
    const session = root.api.users.sessionSync();
    const cta = document.querySelector('.topnav-cta');
    if (!cta) return;
    if (session) {
      // Replace the Sign in / Join free with avatar dropdown
      cta.innerHTML = `
        <a href="/pages/dashboard-router.html" class="topnav-signin" style="display:flex;align-items:center;gap:8px;">
          <img src="${session.avatar}" alt="${session.name}" style="width:28px;height:28px;border-radius:99px;object-fit:cover;border:1px solid #E0DDD3;"/>
          <span style="font-weight:500;color:#0A0A0A;">${session.name.split(' ')[0]}</span>
        </a>
        <button id="ff-signout" class="btn btn-ghost btn-sm" style="font-size:13px;">Sign out</button>
      `;
      const so = document.getElementById('ff-signout');
      if (so) so.addEventListener('click', async () => {
        await root.api.users.signOut();
        toast('Signed out.', { kind: 'success' });
        setTimeout(() => location.reload(), 400);
      });
    }
  }

  // -----------------------------------------------------
  //  Auth gate — one consistent way to require sign-in
  // -----------------------------------------------------
  /**
   * Returns true if the user is signed in. If not, shows a toast with a
   * "Sign in" action that returns to the current page afterwards, and
   * returns false. `verb` customises the message, e.g. "to hire Amara".
   *
   *   if (!UI.requireAuth('to send a message')) return;
   */
  function requireAuth(verb) {
    const api = (typeof window !== 'undefined') && window.api;
    const signedIn = api && api.users && api.users.sessionSync && api.users.sessionSync();
    if (signedIn) return true;
    const loginPath = location.pathname.includes('/pages/') ? './login.html' : '/pages/login.html';
    const next = encodeURIComponent(location.pathname + location.search);
    toast('Please sign in ' + (verb || 'to continue') + '.', {
      kind: 'warn',
      action: { label: 'Sign in', onClick: () => { location.href = loginPath + '?next=' + next; } },
    });
    return false;
  }

  // -----------------------------------------------------
  //  Boot
  // -----------------------------------------------------
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
  function boot() {
    autoReveal();
    initScrollReveal();
    // wait a tick — the nav from site.js mounts in DOMContentLoaded too
    setTimeout(applySessionToHeader, 50);
  }

  return { toast, initScrollReveal, autoReveal, countUp, applySessionToHeader, requireAuth };
});
