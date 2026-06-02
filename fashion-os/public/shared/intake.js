/* ============================================================
   Fashion Freelancing — AI Project Intake (shared renderer)

   ONE deterministic 5-question flow, mounted into ANY container.
   - /pages/start.html mounts it full-page (compact: false).
   - The floating chat widget mounts it in a panel (compact: true).
   Both surfaces share QUESTIONS, persistence, and the JSON shape
   defined in /docs/02-ai-intake-agent.md.

   Public API (window.FFIntake):
     - renderInto(rootEl, opts)  → controller { destroy, reset, getState, goToStep }
     - QUESTIONS                  → array of question objects
     - AUDIENCE_MAP               → ?audience= URL prefill
     - blankIntake()              → empty intake JSON
     - loadState(persistKey)      → { v, step, intake, ts, completed } | null
     - saveState(persistKey, st)  → boolean
     - clearState(persistKey)
     - SCHEMA_VERSION             → bump when QUESTIONS shape changes
============================================================ */
(function (root) {
  'use strict';
  if (root.FFIntake) return; // idempotent — never re-register

  // ----- constants -------------------------------------------------------
  const SCHEMA_VERSION = 1;
  const LEGACY_KEY = 'ff_intake'; // existing key marketplace etc. consume
  const DEFAULT_KEY = 'ff_intake_state';
  const TYPING_MS = 700;
  const STEP_DELAY_MS = 350;

  // ----- the 5 questions (data, no DOM) ---------------------------------
  const QUESTIONS = [
    {
      field: 'clientType',
      botText: 'Hi! What kind of business are you running?',
      options: [
        { value: 'startup',           label: 'I am a fashion brand / startup', sub: 'New collection, DTC store, early stage' },
        { value: 'established_brand', label: 'Established brand',              sub: 'Multi-season label, retail or wholesale' },
        { value: 'apparel_exporter',  label: 'Apparel exporter',               sub: 'Garment export house, factory floor' },
        { value: 'industrial_factory',label: 'Industrial textile factory',     sub: 'Mill, weaving, knit, dye-house' },
      ],
    },
    {
      field: 'neededEcosystem',
      botText: "Got it. Which piece of the puzzle do you need most help with today?",
      multi: true,
      options: [
        { value: 'tech_pack',         label: 'Tech packs & specs',         sub: 'Production-ready files for factories' },
        { value: '3d_clo3d',          label: '3D virtual sampling',        sub: 'CLO3D / Browzwear digital fitting' },
        { value: 'ai_trend_forecast', label: 'AI / LLM agent',             sub: 'Trend forecasting, catalog tagging' },
        { value: 'ecom_amazon',       label: 'Marketplace integration',    sub: 'Amazon, Flipkart, Myntra, Tata CLiQ' },
        { value: 'textile_jacquard',  label: 'Jacquard / Dobby / textile', sub: 'Mill-grade weave engineering' },
        { value: 'quality_audit',     label: 'Quality audit / inspection', sub: 'Third-party QC, social compliance' },
        { value: 'photography',       label: 'Photo / video',              sub: 'Editorial, e-commerce, lifestyle' },
        { value: 'web_storefront',    label: 'Website / Shopify store',    sub: 'Storefront, UX, performance' },
      ],
    },
    {
      field: 'engagementType',
      botText: 'How do you want to engage someone?',
      options: [
        { value: 'fixed_package',   label: 'Fixed package',    sub: 'Off-the-shelf — fastest start' },
        { value: 'fixed_milestone', label: 'Fixed milestones', sub: 'Custom project, paid per stage' },
        { value: 'hourly',          label: 'Hourly tracked',   sub: 'Open-ended, weekly timesheet' },
        { value: 'retainer',        label: 'Monthly retainer', sub: 'Ongoing work each month' },
      ],
    },
    {
      field: 'budgetBracket',
      botText: 'Roughly what budget bracket are we working with?',
      options: [
        { value: 'under_1k',  label: 'Under $1,000' },
        { value: '1k_5k',     label: '$1,000 – $5,000' },
        { value: '5k_25k',    label: '$5,000 – $25,000' },
        { value: '25k_100k',  label: '$25,000 – $100,000' },
        { value: '100k_plus', label: '$100,000+' },
      ],
    },
    {
      field: 'timeline',
      botText: 'And when do you need this?',
      options: [
        { value: 'this_week',     label: 'This week',         sub: 'Urgent — pays a small rush fee' },
        { value: 'this_month',    label: 'Within a month' },
        { value: 'next_3_months', label: 'Within 3 months' },
        { value: 'this_quarter',  label: 'This quarter' },
        { value: 'no_rush',       label: 'No rush' },
      ],
    },
  ];

  const AUDIENCE_MAP = {
    brand:    'startup',
    exporter: 'apparel_exporter',
    factory:  'industrial_factory',
    tech:     'startup',
  };

  // ----- pure helpers ----------------------------------------------------
  function blankIntake() {
    return {
      clientType: null,
      neededEcosystem: [],
      engagementType: null,
      budgetBracket: null,
      timeline: null,
      currency: 'USD',
      primaryServiceSlug: null,
      suggestedRoadmap: [],
      languagePreference: 'en',
      summary: '',
      rawTurns: [],
    };
  }

  function inferPrimaryServiceSlug(ecosystem) {
    const map = {
      tech_pack:         'tech-pack-designer',
      '3d_clo3d':        '3d-fitting-clo3d',
      ai_trend_forecast: 'ai-trend-forecast',
      ecom_amazon:       'marketplace-integration',
      textile_jacquard:  'jacquard-dobby',
      quality_audit:     'quality-technician',
      photography:       'fashion-photography',
      web_storefront:    'fashion-website',
    };
    for (const eco of ecosystem || []) if (map[eco]) return map[eco];
    return null;
  }

  function inferRoadmap(ecosystem) {
    const order = [
      'ai_trend_forecast', 'tech_pack', '3d_clo3d',
      'textile_jacquard',  'quality_audit', 'photography',
      'web_storefront',    'ecom_amazon',
    ];
    return order.filter(p => (ecosystem || []).includes(p));
  }

  function buildSummary(intake) {
    const audienceWord = {
      startup:           'Fashion brand / startup',
      established_brand: 'Established brand',
      apparel_exporter:  'Apparel exporter',
      industrial_factory:'Industrial textile factory',
    }[intake.clientType] || 'Client';

    const budgetLabel = {
      under_1k:   'under $1k', '1k_5k': '$1k – $5k', '5k_25k': '$5k – $25k',
      '25k_100k': '$25k – $100k', '100k_plus': '$100k+',
    }[intake.budgetBracket] || intake.budgetBracket;

    const timelineLabel = {
      this_week: 'this week', this_month: 'within a month',
      next_3_months: 'within 3 months', this_quarter: 'this quarter',
      no_rush: 'no specific rush',
    }[intake.timeline] || intake.timeline;

    const ecoLabels = QUESTIONS[1].options
      .filter(o => (intake.neededEcosystem || []).includes(o.value))
      .map(o => o.label.toLowerCase());

    return audienceWord + ' looking for ' + ecoLabels.join(', ') +
      '. Engagement: ' + (intake.engagementType || '').replace('_', ' ') +
      '. Budget bracket ' + budgetLabel + ', timeline ' + timelineLabel + '.';
  }

  // ----- persistence -----------------------------------------------------
  function loadState(persistKey) {
    persistKey = persistKey || DEFAULT_KEY;
    try {
      const raw = localStorage.getItem(persistKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== SCHEMA_VERSION) {
        // schema drift — nuke it, no silent stale-restore
        localStorage.removeItem(persistKey);
        return null;
      }
      return parsed;
    } catch (_) { return null; }
  }

  function saveState(persistKey, state) {
    persistKey = persistKey || DEFAULT_KEY;
    try {
      localStorage.setItem(persistKey, JSON.stringify({
        v: SCHEMA_VERSION,
        step: state.step | 0,
        intake: state.intake,
        ts: Date.now(),
        completed: !!state.completed,
      }));
      return true;
    } catch (_) { return false; }
  }

  function clearState(persistKey) {
    persistKey = persistKey || DEFAULT_KEY;
    try { localStorage.removeItem(persistKey); } catch (_) {}
  }

  // ----- the renderer ----------------------------------------------------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  }

  function reducedMotion() {
    return typeof matchMedia !== 'undefined' &&
           matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * renderInto(rootEl, opts)
   *   opts: {
   *     audience: 'brand'|'exporter'|'factory'|'tech',
   *     compact:  boolean,        // widget mode — affects layout
   *     persistKey: string,
   *     ctas: 'redirect'|'inline',// redirect = location.href, inline = onComplete only
   *     onComplete: (intake, state) => void,
   *     onProgress: (step, total) => void,
   *     resume: boolean,          // if true, replay bubbles silently up to saved step
   *   }
   * Returns: { destroy, reset, getState, goToStep, root }
   */
  function renderInto(rootEl, opts) {
    opts = opts || {};
    const compact     = !!opts.compact;
    const persistKey  = opts.persistKey || DEFAULT_KEY;
    const ctas        = opts.ctas || 'redirect';
    const reduce      = reducedMotion();
    const TYPE_DELAY  = reduce ? 0 : TYPING_MS;
    const STEP_DELAY  = reduce ? 0 : STEP_DELAY_MS;

    // Wipe whatever was in root and build the scaffold.
    rootEl.innerHTML =
      '<div class="ffi-root' + (compact ? ' ffi-compact' : '') + '">' +
        '<div class="ffi-progress" role="progressbar" aria-valuemin="0" aria-valuemax="5" aria-valuenow="0" aria-label="Intake progress">' +
          '<span></span><span></span><span></span><span></span><span></span>' +
        '</div>' +
        '<div class="ffi-stream" aria-live="polite" aria-busy="false"></div>' +
      '</div>';

    const wrap     = rootEl.querySelector('.ffi-root');
    const progress = rootEl.querySelector('.ffi-progress');
    const stream   = rootEl.querySelector('.ffi-stream');

    let step   = 0;
    let intake = blankIntake();
    let completed = false;
    let destroyed = false;
    let saveTimer = null;

    function paintProgress() {
      const bars = progress.querySelectorAll('span');
      bars.forEach((s, i) => s.classList.toggle('done', i < step));
      progress.setAttribute('aria-valuenow', String(step));
      if (typeof opts.onProgress === 'function') opts.onProgress(step, QUESTIONS.length);
    }

    function debouncedSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveState(persistKey, { step, intake, completed }), 250);
    }

    function botBubble(text, withTyping) {
      const row = document.createElement('div');
      row.className = 'ffi-bot-row';
      row.innerHTML =
        '<div class="ffi-bot-av" aria-hidden="true">FF</div>' +
        '<div class="ffi-bot-bubble">' +
          (withTyping && TYPE_DELAY > 0
            ? '<span class="ffi-typing" aria-hidden="true"><span></span><span></span><span></span></span>'
            : esc(text)) +
        '</div>';
      stream.appendChild(row);
      if (withTyping && TYPE_DELAY > 0) {
        stream.setAttribute('aria-busy', 'true');
        setTimeout(() => {
          if (destroyed) return;
          row.querySelector('.ffi-bot-bubble').textContent = text;
          stream.setAttribute('aria-busy', 'false');
        }, TYPE_DELAY);
      }
      scrollToBottom();
      return row;
    }

    function userBubble(text) {
      const row = document.createElement('div');
      row.className = 'ffi-user-row';
      row.innerHTML = '<div class="ffi-user-bubble">' + esc(text) + '</div>';
      stream.appendChild(row);
      intake.rawTurns.push({ role: 'user', content: text });
      scrollToBottom();
    }

    function scrollToBottom() {
      try { stream.scrollTop = stream.scrollHeight; } catch (_) {}
    }

    function renderOptions(q) {
      const wrapEl = document.createElement('div');
      wrapEl.className = 'ffi-answers' + (q.multi ? ' ffi-answers-multi' : '');

      if (q.multi) {
        q.options.forEach(opt => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'ffi-a-btn';
          b.setAttribute('aria-pressed', 'false');
          b.dataset.value = opt.value;
          b.innerHTML =
            '<strong>' + esc(opt.label) + '</strong>' +
            (opt.sub ? '<span class="ffi-sub">' + esc(opt.sub) + '</span>' : '');
          b.addEventListener('click', () => {
            const arr = intake[q.field];
            const i = arr.indexOf(opt.value);
            if (i >= 0) {
              arr.splice(i, 1);
              b.classList.remove('is-on');
              b.setAttribute('aria-pressed', 'false');
            } else {
              arr.push(opt.value);
              b.classList.add('is-on');
              b.setAttribute('aria-pressed', 'true');
            }
            continueBtn.disabled = arr.length === 0;
            debouncedSave();
          });
          wrapEl.appendChild(b);
        });
        const continueBtn = document.createElement('button');
        continueBtn.type = 'button';
        continueBtn.className = 'ffi-continue';
        continueBtn.textContent = 'Continue →';
        continueBtn.disabled = true;
        continueBtn.addEventListener('click', () => {
          const chosen = intake[q.field];
          const labels = q.options.filter(o => chosen.includes(o.value)).map(o => o.label);
          userBubble(labels.join(' · '));
          wrapEl.remove();
          nextStep();
        });
        wrapEl.appendChild(continueBtn);
      } else {
        q.options.forEach(opt => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'ffi-a-btn';
          b.innerHTML =
            '<strong>' + esc(opt.label) + '</strong>' +
            (opt.sub ? '<span class="ffi-sub">' + esc(opt.sub) + '</span>' : '');
          b.addEventListener('click', () => {
            intake[q.field] = opt.value;
            userBubble(opt.label);
            wrapEl.remove();
            nextStep();
          });
          wrapEl.appendChild(b);
        });
      }

      if (step > 0) {
        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'ffi-back';
        back.textContent = '← Back';
        back.addEventListener('click', () => {
          if (destroyed) return;
          step--;
          paintProgress();
          wrapEl.remove();
          // Remove last user bubble and bot question
          const rows = stream.querySelectorAll('.ffi-bot-row, .ffi-user-row');
          for (let i = 0; i < 2 && rows.length; i++) {
            rows[rows.length - 1 - i] && rows[rows.length - 1 - i].remove();
          }
          // Roll back the answer on the just-completed field
          const prev = QUESTIONS[step];
          if (prev && prev.multi) intake[prev.field] = [];
          else if (prev) intake[prev.field] = null;
          debouncedSave();
          askQuestion(prev);
        });
        wrapEl.appendChild(back);
      }

      stream.appendChild(wrapEl);
      scrollToBottom();
    }

    function askQuestion(q) {
      paintProgress();
      intake.rawTurns.push({ role: 'agent', content: q.botText });
      botBubble(q.botText, !reduce);
      setTimeout(() => { if (!destroyed) renderOptions(q); }, TYPE_DELAY + 200);
    }

    function nextStep() {
      step++;
      paintProgress();
      debouncedSave();
      if (step >= QUESTIONS.length) { finish(); return; }
      setTimeout(() => { if (!destroyed) askQuestion(QUESTIONS[step]); }, STEP_DELAY);
    }

    function finish() {
      intake.primaryServiceSlug = inferPrimaryServiceSlug(intake.neededEcosystem);
      intake.suggestedRoadmap   = inferRoadmap(intake.neededEcosystem);
      intake.summary            = buildSummary(intake);
      completed = true;

      // Write canonical state + legacy key the rest of the app reads.
      saveState(persistKey, { step: QUESTIONS.length, intake, completed: true });
      try { localStorage.setItem(LEGACY_KEY, JSON.stringify(intake)); } catch (_) {}

      botBubble("Got everything I need. Here's the brief I'll send to the matcher.", !reduce);

      setTimeout(() => {
        if (destroyed) return;
        const sum = document.createElement('div');
        sum.className = 'ffi-summary';
        const eco = intake.neededEcosystem.join(', ') || '—';
        const cta = ctaMarkup();
        sum.innerHTML =
          '<h3>Your project brief</h3>' +
          '<p class="ffi-summary-text">' + esc(intake.summary) + '</p>' +
          '<dl>' +
            '<dt>Type</dt><dd>' + esc(intake.clientType || '—') + '</dd>' +
            '<dt>Needs</dt><dd>' + esc(eco) + '</dd>' +
            '<dt>Engagement</dt><dd>' + esc(intake.engagementType || '—') + '</dd>' +
            '<dt>Budget</dt><dd>' + esc(intake.budgetBracket || '—') + '</dd>' +
            '<dt>Timeline</dt><dd>' + esc(intake.timeline || '—') + '</dd>' +
            (intake.primaryServiceSlug
              ? '<dt>Best fit</dt><dd>' + esc(intake.primaryServiceSlug) + '</dd>' : '') +
          '</dl>' +
          cta;
        stream.appendChild(sum);
        step = QUESTIONS.length;
        paintProgress();
        scrollToBottom();

        if (typeof opts.onComplete === 'function') {
          try { opts.onComplete(intake, { step, completed: true }); } catch (_) {}
        }
      }, TYPE_DELAY + 250);
    }

    // CTAs differ per surface:
    //   redirect → full-page start.html sends user to marketplace
    //   inline   → widget keeps user in place and lets host handle next move
    function ctaMarkup() {
      // Honor approval gate when the api is available (Astro dashboards).
      const api = root.api;
      const session = api && api.users && api.users.sessionSync ? api.users.sessionSync() : null;
      let primaryHref = './marketplace.html';
      let primaryText = 'See matched freelancers →';
      if (intake.primaryServiceSlug) {
        primaryHref += '?cat=' + encodeURIComponent(intake.primaryServiceSlug);
      }
      if (session && session.role === 'creator') {
        // A pending creator shouldn't be pushed to hire UI — send to onboarding.
        try {
          const st = api._store && api._store.getState ? api._store.getState() : null;
          const me = st && st.freelancers ? st.freelancers.find(f => f.id === session.userId) : null;
          if (me && me.approvalStatus && me.approvalStatus !== 'approved') {
            primaryHref = './onboarding.html';
            primaryText = 'Continue your onboarding →';
          }
        } catch (_) {}
      }
      if (ctas === 'redirect') {
        return '<div class="ffi-cta-row">' +
          '<a href="' + primaryHref + '" class="ffi-cta-primary">' + esc(primaryText) + '</a>' +
          '<a href="./help.html#contact" class="ffi-cta-ghost">Talk to a human first</a>' +
        '</div>';
      }
      // inline mode (widget) — same CTAs but lets host close panel afterward
      return '<div class="ffi-cta-row">' +
        '<a href="' + primaryHref + '" class="ffi-cta-primary" data-ffi-action="primary">' + esc(primaryText) + '</a>' +
        '<button type="button" class="ffi-cta-ghost" data-ffi-action="reset">Start over</button>' +
      '</div>';
    }

    // ----- replay (resume) ------------------------------------------------
    function silentReplay(saved) {
      // Re-render bubbles for completed questions WITHOUT typing delays.
      intake = saved.intake || blankIntake();
      step = Math.min(saved.step | 0, QUESTIONS.length);
      paintProgress();
      for (let i = 0; i < step; i++) {
        const q = QUESTIONS[i];
        botBubble(q.botText, false);
        const v = intake[q.field];
        if (q.multi) {
          const labels = q.options.filter(o => (v || []).includes(o.value)).map(o => o.label);
          if (labels.length) userBubble(labels.join(' · '));
        } else {
          const opt = q.options.find(o => o.value === v);
          if (opt) userBubble(opt.label);
        }
      }
      if (saved.completed) {
        completed = true;
        finish();
      } else if (step < QUESTIONS.length) {
        askQuestion(QUESTIONS[step]);
      }
    }

    // ----- boot -----------------------------------------------------------
    const audience = opts.audience && AUDIENCE_MAP[opts.audience];

    if (opts.resume) {
      const saved = loadState(persistKey);
      if (saved && saved.step > 0) { silentReplay(saved); return controller(); }
    }

    if (audience) {
      intake.clientType = AUDIENCE_MAP[opts.audience];
      step = 1;
      paintProgress();
      botBubble(QUESTIONS[0].botText, false);
      const prefilled = QUESTIONS[0].options.find(o => o.value === intake.clientType);
      if (prefilled) userBubble(prefilled.label);
      setTimeout(() => { if (!destroyed) askQuestion(QUESTIONS[1]); }, STEP_DELAY + 100);
    } else {
      askQuestion(QUESTIONS[0]);
    }
    debouncedSave();

    function controller() {
      return {
        root: rootEl,
        destroy() {
          destroyed = true;
          clearTimeout(saveTimer);
          try { rootEl.innerHTML = ''; } catch (_) {}
        },
        reset() {
          clearState(persistKey);
          try { localStorage.removeItem(LEGACY_KEY); } catch (_) {}
          renderInto(rootEl, opts);
        },
        getState() { return { step, intake, completed }; },
        goToStep(n) {
          // Not used today; reserved for back-navigation from host chrome.
          n = Math.max(0, Math.min(QUESTIONS.length, n | 0));
          step = n;
          paintProgress();
          if (n < QUESTIONS.length) askQuestion(QUESTIONS[n]);
        },
      };
    }
    return controller();
  }

  // ----- expose ---------------------------------------------------------
  root.FFIntake = {
    SCHEMA_VERSION,
    QUESTIONS,
    AUDIENCE_MAP,
    blankIntake,
    inferPrimaryServiceSlug,
    inferRoadmap,
    buildSummary,
    loadState,
    saveState,
    clearState,
    renderInto,
  };
})(typeof self !== 'undefined' ? self : this);
