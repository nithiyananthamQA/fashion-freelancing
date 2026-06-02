/* ============================================================
   Fashion Freelancing — Floating AI Chat Widget
   A bottom-right launcher + slide-up panel that runs the
   /start.html 5-question intake without leaving the page.

   Self-contained: this file injects its own CSS, its own DOM,
   loads /shared/intake.js for the question logic, and exposes
   window.FFChat = { open(audience), close(), toggle() }.

   Mounted by site.js on every public-html page.
============================================================ */
(function (root) {
  'use strict';
  if (root.FFChat) return;                              // idempotent
  if (typeof document === 'undefined') return;

  // ---- where the assets live (works in both /pages/ and at root) -------
  // site.js exposes FF_R which resolves paths from any depth. If we're
  // injected via site.js, FF_R is there. If we're loaded directly (Astro
  // / dashboards), use absolute "/" paths.
  function asset(p) {
    if (typeof root.FF_R === 'function') return root.FF_R(p);
    return '/' + p.replace(/^\/+/, '');
  }

  // ---- inject CSS once -------------------------------------------------
  function injectCSS() {
    if (document.getElementById('ff-chat-css')) return;
    const css = `
      :root { --ffc-z-fab: 150; --ffc-z-backdrop: 170; --ffc-z-panel: 180; }
      #ff-chat-fab {
        position: fixed;
        right: 20px;
        bottom: calc(20px + env(safe-area-inset-bottom, 0px));
        z-index: var(--ffc-z-fab);
        width: 56px; height: 56px;
        border-radius: 99px; border: 0; padding: 0;
        background: linear-gradient(135deg, #6E56F0 0%, #5468F5 50%, #2BA8E8 100%);
        background-size: 160% 160%;
        color: #fff;
        font: 600 13px/1 'Plus Jakarta Sans', system-ui, sans-serif;
        cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
        box-shadow: 0 14px 32px -10px rgba(84,104,245,.55), 0 4px 12px -4px rgba(20,19,43,.2);
        transition: transform .25s cubic-bezier(.22,1,.36,1),
                    box-shadow .25s cubic-bezier(.22,1,.36,1),
                    background-position .4s cubic-bezier(.22,1,.36,1);
      }
      #ff-chat-fab:hover {
        transform: translateY(-2px) scale(1.04);
        background-position: 100% 0;
        box-shadow: 0 20px 44px -10px rgba(110,86,240,.65), 0 6px 16px -4px rgba(20,19,43,.25);
      }
      #ff-chat-fab:focus-visible {
        outline: 3px solid rgba(110,86,240,.55); outline-offset: 3px;
      }
      #ff-chat-fab .ffc-icon { width: 24px; height: 24px; }
      #ff-chat-fab .ffc-dot {
        position: absolute; top: 6px; right: 6px;
        width: 10px; height: 10px; border-radius: 99px;
        background: #fff; box-shadow: 0 0 0 2px rgba(110,86,240,.6);
        animation: ffc-pulse 1.6s ease-in-out infinite;
        display: none;
      }
      #ff-chat-fab.has-unread .ffc-dot { display: block; }

      /* hide states */
      body.ffc-hide-fab #ff-chat-fab { display: none; }

      #ff-chat-backdrop {
        position: fixed; inset: 0; z-index: var(--ffc-z-backdrop);
        background: rgba(15,15,30,.45);
        backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
        opacity: 0; visibility: hidden;
        transition: opacity .25s ease, visibility .25s;
      }
      body.ffc-open #ff-chat-backdrop { opacity: 1; visibility: visible; }

      #ff-chat-panel {
        position: fixed;
        right: 20px;
        bottom: 92px;
        z-index: var(--ffc-z-panel);
        width: 380px;
        max-width: calc(100vw - 40px);
        height: min(620px, calc(100dvh - 120px));
        display: flex; flex-direction: column;
        background: rgba(255,255,255,.92);
        backdrop-filter: blur(18px) saturate(140%);
        -webkit-backdrop-filter: blur(18px) saturate(140%);
        border: 1px solid rgba(20,19,43,.08);
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 24px 64px -16px rgba(40,40,90,.4), 0 2px 6px rgba(20,19,43,.06);
        opacity: 0; visibility: hidden;
        transform: translateY(16px) scale(.97);
        transition: opacity .3s cubic-bezier(.22,1,.36,1),
                    transform .3s cubic-bezier(.22,1,.36,1),
                    visibility .3s;
      }
      body.ffc-open #ff-chat-panel {
        opacity: 1; visibility: visible;
        transform: translateY(0) scale(1);
      }
      body.ffc-open #ff-chat-fab { transform: scale(.92); opacity: .85; }

      /* header strip */
      .ffc-header {
        position: relative;
        padding: 14px 18px;
        border-bottom: 1px solid rgba(20,19,43,.08);
        display: flex; align-items: center; gap: 12px;
      }
      .ffc-header::after {
        content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px;
        background: linear-gradient(90deg,
          transparent, rgba(110,86,240,.45), rgba(43,168,232,.45), transparent);
        opacity: .8;
      }
      .ffc-header .ffc-av {
        width: 32px; height: 32px; border-radius: 99px;
        background: linear-gradient(135deg, #6E56F0, #2BA8E8);
        color: #fff; display: flex; align-items: center; justify-content: center;
        font: 700 12px 'Plus Jakarta Sans', system-ui, sans-serif;
      }
      .ffc-header .ffc-title {
        flex: 1; font: 600 14.5px 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #14132B; letter-spacing: -0.012em;
      }
      .ffc-header .ffc-sub {
        font: 400 11.5px 'Inter', system-ui, sans-serif;
        color: #82809E; margin-top: 1px;
      }
      .ffc-close {
        width: 32px; height: 32px; border-radius: 8px; border: 0;
        background: transparent; color: #5C5A7E; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
        transition: background .15s, color .15s;
      }
      .ffc-close:hover { background: rgba(20,19,43,.06); color: #14132B; }
      .ffc-close svg { width: 18px; height: 18px; }

      /* body */
      .ffc-body {
        flex: 1;
        padding: 16px 18px 18px;
        overflow-y: auto;
        scroll-behavior: smooth;
      }
      .ffc-body::-webkit-scrollbar { width: 6px; }
      .ffc-body::-webkit-scrollbar-thumb { background: rgba(20,19,43,.15); border-radius: 99px; }
      .ffc-body .ffi-stream { gap: 12px; }

      /* footer link out */
      .ffc-footer {
        padding: 10px 18px;
        border-top: 1px solid rgba(20,19,43,.08);
        font: 400 12.5px 'Inter', system-ui, sans-serif;
        color: #82809E;
        text-align: center;
      }
      .ffc-footer a { color: #5468F5; font-weight: 600; text-decoration: none; }
      .ffc-footer a:hover { text-decoration: underline; }

      /* mobile: bottom sheet */
      @media (max-width: 640px) {
        #ff-chat-panel {
          right: 0; left: 0; bottom: 0;
          width: 100vw; max-width: 100vw;
          height: 86dvh; max-height: 86vh;
          border-radius: 18px 18px 0 0;
          transform: translateY(100%);
        }
        body.ffc-open #ff-chat-panel { transform: translateY(0); }
        #ff-chat-fab {
          right: 16px;
          bottom: calc(16px + env(safe-area-inset-bottom, 0px));
          width: 52px; height: 52px;
        }
        body.ffc-open { overflow: hidden; }
      }

      /* reduced motion */
      @media (prefers-reduced-motion: reduce) {
        #ff-chat-fab,
        #ff-chat-panel,
        #ff-chat-backdrop { transition: opacity .12s !important; }
        #ff-chat-fab:hover { transform: none; }
        #ff-chat-fab.has-unread .ffc-dot { animation: none; }
        body.ffc-open #ff-chat-panel { transform: none; }
      }

      @keyframes ffc-pulse {
        0%,100% { opacity: 1; transform: scale(1); }
        50%     { opacity: .4; transform: scale(.85); }
      }
    `;
    const tag = document.createElement('style');
    tag.id = 'ff-chat-css';
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  // ---- build the DOM (idempotent) -------------------------------------
  function buildDOM() {
    if (document.getElementById('ff-chat-fab')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'ff-chat-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    const fab = document.createElement('button');
    fab.id = 'ff-chat-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Open AI project intake');
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'ff-chat-panel');
    fab.innerHTML =
      '<svg class="ffc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' +
      '</svg>' +
      '<span class="ffc-dot" aria-hidden="true"></span>';

    const panel = document.createElement('div');
    panel.id = 'ff-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'ff-chat-title');
    panel.innerHTML =
      '<header class="ffc-header">' +
        '<span class="ffc-av" aria-hidden="true">FF</span>' +
        '<div style="flex:1;min-width:0">' +
          '<div class="ffc-title" id="ff-chat-title">Project intake</div>' +
          '<div class="ffc-sub">5 quick questions · we route to the right team</div>' +
        '</div>' +
        '<button type="button" class="ffc-close" aria-label="Close chat">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
        '</button>' +
      '</header>' +
      '<div class="ffc-body"><div id="ff-chat-mount"></div></div>' +
      '<footer class="ffc-footer">' +
        'Prefer the full page? <a href="' + asset('pages/start.html') + '?resume=1">Open full intake →</a>' +
      '</footer>';

    document.body.appendChild(backdrop);
    document.body.appendChild(fab);
    document.body.appendChild(panel);

    // wire close
    panel.querySelector('.ffc-close').addEventListener('click', close);
    backdrop.addEventListener('click', close);
    fab.addEventListener('click', () => { isOpen() ? close() : open(); });

    // unread badge: show whenever an in-progress intake is saved
    refreshUnreadBadge();
  }

  function refreshUnreadBadge() {
    const fab = document.getElementById('ff-chat-fab');
    if (!fab) return;
    let hasUnread = false;
    try {
      const FFI = root.FFIntake;
      if (FFI) {
        const saved = FFI.loadState();
        if (saved && saved.step > 0 && !saved.completed) hasUnread = true;
      }
    } catch (_) {}
    fab.classList.toggle('has-unread', hasUnread);
    fab.setAttribute('aria-label', hasUnread
      ? 'Resume your project intake'
      : 'Open AI project intake');
  }

  // ---- intake mount lifecycle -----------------------------------------
  let controller = null;

  function mountIntake(audience) {
    const FFI = root.FFIntake;
    const mount = document.getElementById('ff-chat-mount');
    if (!FFI || !mount) return;

    // Destroy any previous controller and re-mount fresh OR resume.
    if (controller && typeof controller.destroy === 'function') {
      try { controller.destroy(); } catch (_) {}
    }
    const saved = FFI.loadState();
    const resume = saved && saved.step > 0 && !saved.completed && !audience;

    controller = FFI.renderInto(mount, {
      compact: true,
      audience: audience || null,
      persistKey: 'ff_intake_state',
      ctas: 'inline',
      resume: !!resume,
      onComplete: function () { refreshUnreadBadge(); },
      onProgress: function () { refreshUnreadBadge(); },
    });

    // Wire inline CTA actions (Start over). Primary CTA is a real link.
    mount.addEventListener('click', function (e) {
      const t = e.target && e.target.closest && e.target.closest('[data-ffi-action]');
      if (!t) return;
      const act = t.getAttribute('data-ffi-action');
      if (act === 'reset' && controller && controller.reset) {
        e.preventDefault();
        controller.reset();
        refreshUnreadBadge();
      }
    });
  }

  // ---- open / close ---------------------------------------------------
  function isOpen() { return document.body.classList.contains('ffc-open'); }

  function open(audience) {
    if (!root.FFIntake) {
      // Module not ready yet (race). Try again on next tick.
      setTimeout(() => open(audience), 50);
      return;
    }
    buildDOM();
    mountIntake(audience);
    document.body.classList.add('ffc-open');
    const fab = document.getElementById('ff-chat-fab');
    if (fab) fab.setAttribute('aria-expanded', 'true');
    // focus the panel title for screen readers; bubbles then announce via aria-live
    const title = document.getElementById('ff-chat-title');
    if (title) title.setAttribute('tabindex', '-1');
    setTimeout(() => title && title.focus({ preventScroll: true }), 50);
  }

  function close() {
    document.body.classList.remove('ffc-open');
    const fab = document.getElementById('ff-chat-fab');
    if (fab) {
      fab.setAttribute('aria-expanded', 'false');
      fab.focus({ preventScroll: true });
    }
    refreshUnreadBadge();
  }

  function toggle(audience) { isOpen() ? close() : open(audience); }

  // ---- ESC to close ----------------------------------------------------
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      e.stopPropagation();
      close();
    }
  }, true); // capture so we run before site.js burger ESC

  // ---- delegated handler: audience pills on homepage ------------------
  // Any anchor that points to /pages/start.html?audience=… opens the
  // widget on plain left-click. Modified clicks (ctrl/cmd/middle/shift)
  // fall through to the real navigation so deep-linking still works.
  document.addEventListener('click', function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const m = href.match(/start\.html\?audience=([a-z]+)/i);
    if (!m) return;
    e.preventDefault();
    open(m[1].toLowerCase());
  });

  // ---- boot ------------------------------------------------------------
  // Defer DOM/badge setup until DOMContentLoaded so document.body exists.
  function boot() {
    injectCSS();
    buildDOM();
    refreshUnreadBadge();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  // ---- expose ----------------------------------------------------------
  root.FFChat = { open, close, toggle, isOpen };
})(typeof self !== 'undefined' ? self : this);
