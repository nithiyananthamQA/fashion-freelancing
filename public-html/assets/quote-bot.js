/**
 * Fashion Freelancing — Quote Bot (launch version)
 *
 * A self-contained floating chat widget in the night-glass design system.
 * Flow is dedicated to the direct-service journey: pick a service, describe
 * the project, timeline, name + email.
 *
 * Leads post to /api/leads, the same endpoint the page contact forms use.
 */
(function () {
  if (window.__ffQuoteBot) return;
  window.__ffQuoteBot = true;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var SERVICES = [
    ['tech-pack', 'Tech pack'],
    ['3d-virtual-sampling', '3D sampling'],
    ['seamless-pattern', 'Graphics & prints'],
    ['pattern-cad', 'Pattern (CAD)'],
    ['dobby-jacquard', 'Dobby & jacquard'],
    ['website', 'Website'],
    ['ai-agent', 'AI agent'],
    ['ai-photography', 'AI video & photography'],
    ['ecom-listing', 'E-com listings'],
    ['graphic-design', 'Graphic design'],
    ['multiple', 'A bit of everything']
  ];
  var TIMELINES = [['asap', 'ASAP'], ['2-4w', 'In 2–4 weeks'], ['flexible', 'Flexible']];

  /* ---------- styles ---------- */
  var css = [
    '.qb-launch{position:fixed;right:22px;bottom:22px;z-index:80;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;',
    'background:linear-gradient(135deg,#8B5CF6,#FF4FA0);color:#fff;display:grid;place-items:center;',
    'box-shadow:0 10px 34px rgba(139,92,246,.5);transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s ease;}',
    '.qb-launch:hover{transform:translateY(-3px);box-shadow:0 14px 44px rgba(139,92,246,.65);}',
    '.qb-launch svg{width:24px;height:24px;}',
    '.qb-launch .qb-x{display:none;}',
    '.qb-launch.open .qb-chat{display:none;}.qb-launch.open .qb-x{display:block;}',
    '@media (max-width:720px){.qb-launch{bottom:calc(84px + env(safe-area-inset-bottom));right:16px;}}',
    '.qb-panel{position:fixed;right:22px;bottom:92px;z-index:81;width:min(380px,calc(100vw - 32px));',
    'height:min(600px,calc(100vh - 130px));display:flex;flex-direction:column;overflow:hidden;',
    'background:rgba(16,13,32,.94);border:1px solid rgba(255,255,255,.14);border-radius:22px;',
    '-webkit-backdrop-filter:saturate(160%) blur(22px);backdrop-filter:saturate(160%) blur(22px);',
    'box-shadow:0 30px 90px -20px rgba(0,0,0,.8);',
    'opacity:0;transform:translateY(16px) scale(.98);pointer-events:none;',
    'transition:opacity .3s cubic-bezier(.22,1,.36,1),transform .3s cubic-bezier(.22,1,.36,1);}',
    '.qb-panel.open{opacity:1;transform:none;pointer-events:auto;}',
    '@media (max-width:720px){.qb-panel{right:16px;bottom:calc(152px + env(safe-area-inset-bottom));height:min(540px,calc(100vh - 200px));}}',
    '.qb-head{display:flex;align-items:center;gap:11px;padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.1);flex:none;}',
    '.qb-dot{width:9px;height:9px;border-radius:50%;background:#34C165;box-shadow:0 0 10px #34C165;flex:none;}',
    '.qb-head b{font-family:"Plus Jakarta Sans",Inter,sans-serif;font-size:14.5px;color:#F4F2FA;font-weight:700;}',
    '.qb-head span{font-family:"IBM Plex Mono",monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(244,242,250,.46);display:block;margin-top:1px;}',
    '.qb-stream{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:10px;}',
    '.qb-m{max-width:85%;padding:11px 15px;border-radius:15px;font-family:Inter,sans-serif;font-size:14px;line-height:1.55;}',
    '.qb-bot{align-self:flex-start;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:rgba(244,242,250,.88);border-bottom-left-radius:5px;}',
    '.qb-user{align-self:flex-end;background:linear-gradient(135deg,#8B5CF6,#B45CF6);color:#fff;border-bottom-right-radius:5px;}',
    '.qb-m.in{animation:qb-in .35s cubic-bezier(.22,1,.36,1) both;}',
    '@keyframes qb-in{from{opacity:0;transform:translateY(9px);}to{opacity:1;transform:none;}}',
    '@media (prefers-reduced-motion:reduce){.qb-m.in{animation:none;}}',
    '.qb-typing{align-self:flex-start;display:flex;gap:4px;padding:13px 16px;}',
    '.qb-typing i{width:6px;height:6px;border-radius:50%;background:rgba(244,242,250,.5);animation:qb-b 1.1s ease-in-out infinite;}',
    '.qb-typing i:nth-child(2){animation-delay:.18s;}.qb-typing i:nth-child(3){animation-delay:.36s;}',
    '@keyframes qb-b{0%,100%{transform:translateY(0);opacity:.4;}40%{transform:translateY(-4px);opacity:1;}}',
    '.qb-chips{display:flex;flex-wrap:wrap;gap:7px;align-self:flex-start;max-width:96%;}',
    '.qb-chip{padding:9px 14px;border-radius:999px;cursor:pointer;border:1px solid rgba(255,255,255,.16);',
    'background:rgba(255,255,255,.055);color:rgba(244,242,250,.86);font-family:Inter,sans-serif;font-size:12.5px;font-weight:500;',
    'transition:background .2s ease,border-color .2s ease,transform .2s ease;}',
    '.qb-chip:hover{background:rgba(139,92,246,.18);border-color:rgba(167,139,250,.5);transform:translateY(-1px);}',
    '.qb-foot{display:flex;gap:9px;padding:13px 14px;border-top:1px solid rgba(255,255,255,.1);flex:none;}',
    '.qb-in{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);border-radius:13px;',
    'padding:11px 14px;font-family:Inter,sans-serif;font-size:16px;color:#F4F2FA;outline:none;transition:border-color .2s ease;}',
    '.qb-in::placeholder{color:rgba(244,242,250,.4);}',
    '.qb-in:focus{border-color:#A78BFA;}',
    '.qb-in[aria-invalid="true"]{border-color:#FF7AB8;}',
    '.qb-send{width:44px;height:44px;min-width:44px;min-height:44px;border-radius:12px;border:0;cursor:pointer;flex:none;',
    'background:linear-gradient(135deg,#8B5CF6,#FF4FA0);color:#fff;display:grid;place-items:center;',
    'transition:transform .2s ease,opacity .2s ease;}',
    '.qb-send:hover{transform:translateY(-1px);}',
    '.qb-send:disabled{opacity:.45;cursor:default;transform:none;}',
    '.qb-send svg{width:17px;height:17px;}'
  ].join('');
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- DOM ---------- */
  var launch = document.createElement('button');
  launch.className = 'qb-launch';
  launch.id = 'qb-launch';
  launch.setAttribute('aria-label', 'Chat with us — get a fixed quote');
  launch.setAttribute('aria-expanded', 'false');
  launch.innerHTML =
    '<svg class="qb-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12c0 4.4-4 8-9 8-1.2 0-2.4-.2-3.4-.6L3 21l1.7-4.1C3.6 15.5 3 13.8 3 12c0-4.4 4-8 9-8s9 3.6 9 8z"/></svg>' +
    '<svg class="qb-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var panel = document.createElement('div');
  panel.className = 'qb-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Quote chat');
  panel.innerHTML =
    '<div class="qb-head"><span class="qb-dot" aria-hidden="true"></span><div><b>Fashion Freelancing</b><span>Fixed quote in 24h</span></div></div>' +
    '<div class="qb-stream" id="qb-stream" aria-live="polite"></div>' +
    '<form class="qb-foot" id="qb-form"><input class="qb-in" id="qb-input" autocomplete="off" placeholder="Type here…" aria-label="Your answer" disabled>' +
    '<button class="qb-send" id="qb-send" type="submit" disabled aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button></form>';

  document.body.appendChild(launch);
  document.body.appendChild(panel);

  var stream = panel.querySelector('#qb-stream');
  var form = panel.querySelector('#qb-form');
  var input = panel.querySelector('#qb-input');
  var send = panel.querySelector('#qb-send');

  /* ---------- helpers ---------- */
  function scrollDown() { stream.scrollTop = stream.scrollHeight; }
  function el(cls, html) {
    var d = document.createElement('div');
    d.className = cls;
    d.innerHTML = html || '';
    return d;
  }
  function botSay(text, cb) {
    var t = el('qb-m qb-bot qb-typing', '<i></i><i></i><i></i>');
    stream.appendChild(t); scrollDown();
    setTimeout(function () {
      t.remove();
      var m = el('qb-m qb-bot in');
      m.textContent = text;
      stream.appendChild(m); scrollDown();
      if (cb) cb();
    }, reduced ? 0 : 520);
  }
  function userSay(text) {
    var m = el('qb-m qb-user in');
    m.textContent = text;
    stream.appendChild(m); scrollDown();
  }
  function chips(options, onPick) {
    var wrap = el('qb-chips');
    options.forEach(function (opt) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'qb-chip';
      b.textContent = opt[1];
      b.addEventListener('click', function () {
        wrap.remove();
        userSay(opt[1]);
        onPick(opt[0], opt[1]);
      });
      wrap.appendChild(b);
    });
    stream.appendChild(wrap); scrollDown();
  }
  function askText(placeholder, validate, onValue) {
    input.disabled = false; send.disabled = false;
    input.placeholder = placeholder;
    input.setAttribute('aria-invalid', 'false');
    input.focus();
    form.onsubmit = function (e) {
      e.preventDefault();
      var v = input.value.trim();
      var err = validate ? validate(v) : null;
      if (err) {
        input.setAttribute('aria-invalid', 'true');
        input.placeholder = err;
        input.value = '';
        return;
      }
      input.value = '';
      input.disabled = true; send.disabled = true;
      input.setAttribute('aria-invalid', 'false');
      userSay(v);
      onValue(v);
    };
  }

  /* ---------- lead pipeline (same endpoint as the page forms) ---------- */
  function saveLead(lead) {
    var body = new FormData();
    Object.keys(lead).forEach(function (k) {
      if (lead[k] !== undefined && lead[k] !== null) body.set(k, String(lead[k]));
    });
    body.set('source', 'quote-bot');
    return fetch('/api/leads', { method: 'POST', body: body })
      .then(function (r) { if (!r.ok) throw new Error('lead ' + r.status); })
      .catch(function () {
        /* The closing message already gives the email address, so the person
           still has a way through even if this call fails. */
      });
  }

  /* ---------- the flow — dedicated to the current services setup ---------- */
  var lead = { source: 'quote-bot', page: location.pathname };
  var started = false;
  var finished = false;

  function start() {
    if (started) return;
    started = true;
    botSay('Hi! I’ll get you a fixed quote within 24 hours — no pricing games.', function () {
      botSay('What do you need done?', function () {
        chips(SERVICES, function (val, label) {
          lead.service = val;
          stepDetails(label);
        });
      });
    });
  }

  function stepDetails(serviceLabel) {
    botSay('Nice — ' + serviceLabel + '. Tell me about the project in a line or two. What are you making?', function () {
      askText('e.g. An AW25 bomber, tech pack ready, need 3 colorways…', function (v) {
        return v.length < 5 ? 'A few words about the project, please' : null;
      }, function (v) {
        lead.message = v;
        stepTimeline();
      });
    });
  }

  function stepTimeline() {
    botSay('When do you need it?', function () {
      chips(TIMELINES, function (val) {
        lead.timeline = val;
        stepName();
      });
    });
  }

  function stepName() {
    botSay('Almost done. What’s your name?', function () {
      askText('First & last name', function (v) {
        return v.length < 2 ? 'Your name, please' : null;
      }, function (v) {
        lead.name = v;
        stepEmail();
      });
    });
  }

  function stepEmail() {
    botSay('And the email where the quote should land?', function () {
      askText('you@brand.com', function (v) {
        return EMAIL_RE.test(v) ? null : 'That email doesn’t look right — try again';
      }, function (v) {
        lead.email = v;
        lead.ts = new Date().toISOString();
        saveLead(lead);
        finished = true;
        botSay('Done — brief received. A real person will reply to ' + v + ' within 24 hours with a fixed quote.', function () {
          botSay('Have files to share (sketches, tech packs, photos)? Send them to hello@fashionos.app and mention your name.');
        });
      });
    });
  }

  /* ---------- open/close ---------- */
  function setOpen(open) {
    panel.classList.toggle('open', open);
    launch.classList.toggle('open', open);
    launch.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      if (finished) return;
      setTimeout(start, reduced ? 0 : 250);
    }
  }
  launch.addEventListener('click', function () { setOpen(!panel.classList.contains('open')); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) setOpen(false);
  });
})();
