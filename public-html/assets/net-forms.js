/**
 * Form behaviour for the specialist network.
 *
 * The server is always the authority — every rule enforced here is enforced
 * again in src/server/validate.ts, and with JavaScript off the forms submit and
 * validate exactly as before. What this adds is the behaviour people expect
 * from a form they are asked to spend ten minutes on:
 *
 *   1. Validate a field when they LEAVE it, not while they are mid-word, and
 *      never before they have touched it.
 *   2. Once a field has shown an error, re-check it as they type so the message
 *      disappears the moment it is fixed.
 *   3. Block submit on problems the browser can already see, so the page never
 *      round-trips. That matters because a password field can never be echoed
 *      back — one unticked checkbox used to cost the visitor everything typed.
 *   4. Disable the button while submitting, so a slow save cannot be
 *      double-posted.
 *   5. A show/hide control on password fields.
 *
 * Messages and placement match the server's exactly, so a client-side error and
 * a server-side one are indistinguishable.
 */
(function () {
  'use strict';

  var MESSAGES = {
    valueMissing: function (el) {
      if (el.type === 'checkbox') return 'Please tick this to continue.';
      if (el.tagName === 'SELECT') return 'Please choose an option.';
      return 'This one is required.';
    },
    tooShort: function (el) {
      var n = el.minLength;
      var have = el.value.trim().length;
      return 'A bit more detail, please — ' + have + ' of ' + n + ' characters.';
    },
    tooLong: function (el) { return 'Please keep this under ' + el.maxLength + ' characters.'; },
    typeMismatch: function (el) {
      if (el.type === 'email') return 'That email does not look right.';
      if (el.type === 'url') return 'That web address does not look right.';
      return 'That value does not look right.';
    },
    rangeUnderflow: function (el) { return 'Must be ' + el.min + ' or more.'; },
    rangeOverflow: function (el) { return 'Must be ' + el.max + ' or less.'; },
    stepMismatch: function () { return 'Please use a whole number.'; },
    patternMismatch: function (el) { return el.dataset.hint || 'That format is not quite right.'; },
    badInput: function () { return 'Please check this value.'; },
  };

  function messageFor(el) {
    for (var key in MESSAGES) {
      if (el.validity[key]) return MESSAGES[key](el);
    }
    return 'Please check this field.';
  }

  /* Errors go immediately after the control's label wrapper — the same slot the
     server renders into, so the two are visually identical. */
  function anchorFor(el) {
    return el.closest('label') || el;
  }

  function existingSlot(el) {
    var next = anchorFor(el).nextElementSibling;
    return next && next.classList && next.classList.contains('cform-err') && next.dataset.client === '1'
      ? next
      : null;
  }

  function show(el) {
    var slot = existingSlot(el);
    if (!slot) {
      var anchor = anchorFor(el);
      slot = document.createElement('span');
      slot.className = 'cform-err';
      slot.setAttribute('role', 'alert');
      slot.dataset.client = '1';
      if (!el.id) el.id = 'ff-f-' + Math.random().toString(36).slice(2, 9);
      slot.id = el.id + '-err';
      anchor.parentNode.insertBefore(slot, anchor.nextSibling);
    }
    slot.textContent = messageFor(el);
    el.setAttribute('aria-invalid', 'true');
    describe(el, slot.id, true);
  }

  function clear(el) {
    var slot = existingSlot(el);
    if (slot) {
      describe(el, slot.id, false);
      slot.remove();
    }
    el.removeAttribute('aria-invalid');
  }

  /** Keep aria-describedby in step with the error, without clobbering hints. */
  function describe(el, id, add) {
    var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    var at = ids.indexOf(id);
    if (add && at === -1) ids.push(id);
    if (!add && at !== -1) ids.splice(at, 1);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
    else el.removeAttribute('aria-describedby');
  }

  function validatable(el) {
    return !el.disabled && el.type !== 'hidden' && el.willValidate;
  }

  function check(el) {
    if (!validatable(el)) return true;
    if (el.checkValidity()) { clear(el); return true; }
    show(el);
    return false;
  }

  /* Link a `.fh` helper line to its input so screen readers read it too. */
  function wireHints(form) {
    var hints = form.querySelectorAll('.fh');
    for (var i = 0; i < hints.length; i++) {
      var hint = hints[i];
      var label = hint.closest('label');
      if (!label) continue;
      var field = label.querySelector('input, select, textarea');
      if (!field) continue;
      if (!hint.id) hint.id = 'ff-h-' + Math.random().toString(36).slice(2, 9);
      describe(field, hint.id, true);
    }
  }

  /* A password nobody can read back is a common cause of a failed submit. */
  function wirePasswordReveal(form) {
    var fields = form.querySelectorAll('input[type="password"]');
    for (var i = 0; i < fields.length; i++) {
      (function (field) {
        if (field.dataset.reveal === '1') return;
        field.dataset.reveal = '1';
        var wrap = document.createElement('span');
        wrap.className = 'pw-wrap';
        field.parentNode.insertBefore(wrap, field);
        wrap.appendChild(field);

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'pw-toggle';
        button.textContent = 'Show';
        button.setAttribute('aria-label', 'Show password');
        button.addEventListener('click', function () {
          var shown = field.type === 'text';
          field.type = shown ? 'password' : 'text';
          button.textContent = shown ? 'Show' : 'Hide';
          button.setAttribute('aria-label', shown ? 'Show password' : 'Hide password');
          field.focus({ preventScroll: true });
        });
        wrap.appendChild(button);
      })(fields[i]);
    }
  }

  function wire(form) {
    wireHints(form);
    wirePasswordReveal(form);

    var touched = new WeakSet();

    /* Validate on the way OUT of a field, never while they are still typing —
       and never scold someone for a field they only tabbed through. An empty
       field they have not filled in yet is the submit step's business, not
       something to flag the instant focus moves on. A field they DID type in,
       or one already showing an error, is re-checked immediately. */
    form.addEventListener('blur', function (event) {
      var el = event.target;
      if (!el.matches || !el.matches('input, select, textarea')) return;
      touched.add(el);
      var isEmpty = el.type === 'checkbox' || el.type === 'radio' ? false : el.value.trim() === '';
      if (isEmpty && !el.hasAttribute('aria-invalid')) return;
      check(el);
    }, true);

    // Once a field has complained, keep re-checking so the message clears the
    // instant it is fixed.
    function revalidate(event) {
      var el = event.target;
      if (!el.matches || !el.matches('input, select, textarea')) return;
      if (!touched.has(el) && !el.hasAttribute('aria-invalid')) return;
      if (el.checkValidity()) clear(el);
    }
    form.addEventListener('input', revalidate);
    form.addEventListener('change', function (event) {
      var el = event.target;
      if (el.matches && el.matches('input[type="checkbox"], input[type="radio"], select')) {
        touched.add(el);
        // Answering it can only ever clear a complaint, never start one.
        if (el.checkValidity()) clear(el);
        else if (el.hasAttribute('aria-invalid')) show(el);
      } else {
        revalidate(event);
      }
    });

    form.addEventListener('submit', function (event) {
      // Secondary submits ("show this service's fields", "remove") must not be
      // blocked by fields they have nothing to do with.
      var trigger = event.submitter;
      if (trigger && trigger.hasAttribute('formnovalidate')) return;

      var fields = form.querySelectorAll('input, select, textarea');
      var invalid = [];
      for (var i = 0; i < fields.length; i++) {
        if (!validatable(fields[i])) continue;
        if (!fields[i].checkValidity()) invalid.push(fields[i]);
        else clear(fields[i]);
      }

      if (invalid.length) {
        event.preventDefault();
        for (var j = 0; j < invalid.length; j++) show(invalid[j]);
        var first = invalid[0];
        // A drawn checkbox hides its real input, so send focus to the label.
        var target = first.offsetParent === null ? (first.closest('label') || first) : first;
        if (target.scrollIntoView) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (target.focus) target.focus({ preventScroll: true });
        return;
      }

      // Valid: lock the button so a slow save cannot be submitted twice.
      //
      // Deferred by a tick on purpose. A disabled control is NOT included in the
      // submitted payload, so disabling it synchronously here would strip the
      // button's own name/value — which several forms rely on (`action=hire`,
      // `_reload`, `intent=add`). By the next tick the payload is built.
      if (trigger && !trigger.disabled) {
        var label = trigger.textContent;
        trigger.dataset.label = label;
        setTimeout(function () {
          trigger.disabled = true;
          trigger.setAttribute('aria-busy', 'true');
          trigger.textContent = trigger.dataset.busy || 'Saving…';
        }, 0);
        // If the browser restores this page from cache (back button), the
        // button must not stay dead.
        setTimeout(function () {
          trigger.disabled = false;
          trigger.removeAttribute('aria-busy');
          trigger.textContent = label;
        }, 15000);
      }
    });
  }

  function init() {
    var forms = document.querySelectorAll('form.cform[novalidate]');
    for (var i = 0; i < forms.length; i++) wire(forms[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Restoring from the back/forward cache must re-enable any locked button.
  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    var busy = document.querySelectorAll('button[aria-busy="true"]');
    for (var i = 0; i < busy.length; i++) {
      busy[i].disabled = false;
      busy[i].removeAttribute('aria-busy');
      if (busy[i].dataset.label) busy[i].textContent = busy[i].dataset.label;
    }
  });
})();
