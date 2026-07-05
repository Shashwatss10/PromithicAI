/* ===================================================================
   FX.JS — Cursor, Tilt, Ripple & Scroll-Assemble Engine
   PromithicAI v1.1
   
   STYLE CONTRACT (preserve in all future updates):
   ─────────────────────────────────────────────────
   • No changes to any existing JS logic or event handlers
   • All fx elements injected with aria-hidden="true"
   • Spotlight: lazy rAF loop for smooth sub-pixel trailing
   • Tilt: clamped ±7° X, ±7° Y. Perspective 900px.
   • Magnetic: 0.22 pull factor, only on primary/secondary btns
   • Ripple: skips when target is .monaco-editor or #sandbox-iframe
   • Scroll reveal: IntersectionObserver threshold 0.12
   • Auto-assigns data-fx / data-fx-group to known selectors
   • Skips elements already handled by .anim-fade-in-up/right
   =================================================================== */
(function () {
  'use strict';

  /* ── Bail out for reduced motion ── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ════════════════════════════════════════
     CURSOR SPOTLIGHT
     ════════════════════════════════════════ */
  var spotlight = document.createElement('div');
  spotlight.className = 'fx-spotlight';
  spotlight.setAttribute('aria-hidden', 'true');
  document.body.appendChild(spotlight);

  var mx = window.innerWidth / 2;
  var my = window.innerHeight / 2;
  var sx = mx;
  var sy = my;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
  });

  /* Smooth trailing via rAF */
  (function tickSpotlight() {
    sx += (mx - sx) * 0.055;
    sy += (my - sy) * 0.055;
    spotlight.style.left = sx + 'px';
    spotlight.style.top  = sy + 'px';
    requestAnimationFrame(tickSpotlight);
  }());

  /* ════════════════════════════════════════
     CLICK RIPPLE
     ════════════════════════════════════════ */
  document.addEventListener('click', function (e) {
    /* Skip ripple inside Monaco editor & iframe */
    var t = e.target;
    if (t && (
      t.closest && (
        t.closest('.monaco-editor') ||
        t.closest('#sandbox-iframe') ||
        t.closest('.toast-close') ||
        t.closest('a') && t.tagName !== 'BUTTON'
      )
    )) return;

    var r = document.createElement('div');
    r.className = 'fx-ripple';
    r.setAttribute('aria-hidden', 'true');
    r.style.left = e.clientX + 'px';
    r.style.top  = e.clientY + 'px';
    document.body.appendChild(r);
    setTimeout(function () { r.remove(); }, 700);
  });

  /* ════════════════════════════════════════
     PARALLAX ORBS (background orbs only)
     ════════════════════════════════════════ */
  function bindOrbs() {
    var orbs = document.querySelectorAll(
      '.hero-orb, .auth-brand-orb, .orb, .mesh-orb'
    );
    if (!orbs.length) return;

    document.addEventListener('mousemove', function (e) {
      var cx = window.innerWidth  / 2;
      var cy = window.innerHeight / 2;
      orbs.forEach(function (orb, i) {
        var factor = 0.012 + i * 0.008;
        var dx = (e.clientX - cx) * factor;
        var dy = (e.clientY - cy) * factor;
        orb.classList.add('fx-orb');
        orb.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      });
    });
  }

  /* ════════════════════════════════════════
     3D CARD TILT
     ════════════════════════════════════════ */
  var TILT_SELECTORS = [
    '.feature-card',
    '.upgrade-card',
    '.pipeline-node',
    '.how-step',
    '.provider-card',
    '.roadmap-item',
    '.hero-demo',
    '.version-info-box',
    '.settings-card'
  ].join(',');

  function bindTilt(root) {
    var cards = (root || document).querySelectorAll(TILT_SELECTORS);
    cards.forEach(function (card) {
      if (card.dataset.fxTilt) return; /* skip already bound */
      card.dataset.fxTilt = '1';
      card.classList.add('fx-tilt');

      card.addEventListener('mouseenter', function () {
        card.style.transition = 'transform 0.1s ease-out, box-shadow 0.3s ease';
      });

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var cx = rect.left + rect.width  / 2;
        var cy = rect.top  + rect.height / 2;
        var dx = (e.clientX - cx) / (rect.width  / 2); /* –1 … 1 */
        var dy = (e.clientY - cy) / (rect.height / 2); /* –1 … 1 */

        /* Clamp tilt to ±7° */
        var rotX = Math.max(-7, Math.min(7, dy * -6));
        var rotY = Math.max(-7, Math.min(7, dx *  6));

        card.style.transform =
          'perspective(900px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) translateZ(4px)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.72s cubic-bezier(0.16,1,0.3,1), box-shadow 0.72s ease';
        card.style.transform  = '';
      });
    });
  }

  /* ════════════════════════════════════════
     MAGNETIC BUTTONS
     ════════════════════════════════════════ */
  function bindMagnetic(root) {
    var btns = (root || document).querySelectorAll('.btn-primary, .btn-secondary');
    btns.forEach(function (btn) {
      if (btn.dataset.fxMag) return;
      btn.dataset.fxMag = '1';
      btn.classList.add('fx-magnetic');

      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var dx = (e.clientX - (rect.left + rect.width  / 2)) * 0.22;
        var dy = (e.clientY - (rect.top  + rect.height / 2)) * 0.22;
        btn.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ════════════════════════════════════════
     SCROLL ASSEMBLE — REVEAL ENGINE
     ════════════════════════════════════════ */

  /*
   * Map: CSS selector  →  data-fx direction
   * "group" means the CONTAINER gets data-fx-group (children stagger in).
   * Skips any element that already carries .anim-fade-in-up / .anim-fade-in-right
   * (those are handled by index.html's own observer).
   */
  var REVEAL_MAP = [
    /* Page headers / section intros */
    { sel: '.section-header',          fx: 'up'    },
    { sel: '.section-label',           fx: 'fade'  },
    { sel: '.settings-page-header',    fx: 'up'    },

    /* Hero columns */
    { sel: '.hero-copy',               fx: 'left'  },
    { sel: '.hero-demo',               fx: 'right' },

    /* Cards — single element reveals */
    { sel: '.feature-card',            fx: 'up'    },
    { sel: '.upgrade-card',            fx: 'up'    },
    { sel: '.how-step',                fx: 'scale' },
    { sel: '.provider-card',           fx: 'scale' },
    { sel: '.roadmap-item',            fx: 'left'  },
    { sel: '.settings-card',           fx: 'up'    },
    { sel: '.pipeline-node',           fx: 'scale' },
    { sel: '.version-info-box',        fx: 'scale' },

    /* Auth page split panels */
    { sel: '.auth-brand',              fx: 'left'  },
    { sel: '.auth-form-wrapper',       fx: 'right' },

    /* Builder sidebar content */
    { sel: '.prompt-panel',            fx: 'up'    },
    { sel: '.output-tabs-bar',         fx: 'down'  },
  ];

  /* Grid CONTAINERS that get the stagger treatment */
  var GROUP_SELECTORS = [
    '.features-grid',
    '.upgrade-cards',
    '.how-steps',
    '.provider-cards',
    '.roadmap-list',
    '.settings-nav-list',
    '.auth-features',
  ].join(',');

  /* Elements to ALWAYS skip (already animated elsewhere) */
  var SKIP_CLASSES = [
    'anim-fade-in-up',
    'anim-fade-in-right',
    'anim-fade-in-down',
    'anim-fade-in-left',
    'anim-scale-in',
  ];

  function shouldSkip(el) {
    return SKIP_CLASSES.some(function (c) { return el.classList.contains(c); });
  }

  function assignRevealAttributes() {
    /* Single-element reveals */
    REVEAL_MAP.forEach(function (entry) {
      document.querySelectorAll(entry.sel).forEach(function (el, idx) {
        if (shouldSkip(el) || el.hasAttribute('data-fx')) return;
        el.setAttribute('data-fx', entry.fx);
        /* gentle stagger for sibling cards */
        if (idx > 0 && idx < 6) {
          var extra = idx * 90;
          el.style.transitionDelay = extra + 'ms';
        }
      });
    });

    /* Group containers — children stagger */
    document.querySelectorAll(GROUP_SELECTORS).forEach(function (el) {
      if (el.hasAttribute('data-fx-group')) return;
      el.setAttribute('data-fx-group', '');
    });
  }

  function buildRevealObserver() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('fx-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('[data-fx], [data-fx-group]').forEach(function (el) {
      /* Items already in viewport → reveal after tiny delay */
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        setTimeout(function () { el.classList.add('fx-in'); }, 80);
      } else {
        io.observe(el);
      }
    });
  }

  /* ════════════════════════════════════════
     INIT — runs once DOM is ready
     ════════════════════════════════════════ */
  function init() {
    bindOrbs();
    bindTilt();
    bindMagnetic();
    assignRevealAttributes();
    buildRevealObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Expose so future modules can re-bind dynamic content ── */
  window.FX = {
    /** Call after dynamically injecting new cards/buttons into the DOM */
    rebind: function () {
      bindTilt();
      bindMagnetic();
    }
  };

}());
