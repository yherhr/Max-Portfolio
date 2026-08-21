/* ==========================================================================
   MAX K MEDIA — mkm.js
   No dependencies. Every block guards for its own elements, so this one file
   is safe to include on every page.
   ========================================================================== */
(function () {
  'use strict';

  var CDN = 'https://cdn.jsdelivr.net/gh/yherhr/Krause_Photography@main/';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. HEADER ---------- */
  (function header() {
    var bar = $('header');
    var burger = $('.burger');
    var nav = $('nav.primary');
    if (!bar) return;

    var dock = function () { bar.classList.toggle('docked', window.scrollY > 10); };
    dock();
    window.addEventListener('scroll', dock, { passive: true });

    if (!burger || !nav) return;
    var close = function () {
      nav.classList.remove('open');
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    };
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 720) close(); });
  })();

  /* ---------- 2. PHOTO GRID (masonry + filters + lightbox) ----------
     Tiles are generated so the aspect ratios stay in one place and the
     masonry row-spans can be computed from the real image dimensions.
  ------------------------------------------------------------------- */
  var PHOTOS = [
    ['_DSC5307.jpg', 'studio',  'Studio Modelling'],
    ['_DSC5448.jpg', 'studio',  'Studio Modelling'],
    ['_DSC6093.jpg', 'studio',  'Studio Modelling'],
    ['_DSC6147.jpg', 'studio',  'Studio Modelling'],
    ['_DSC6102.jpg', 'studio',  'Studio Modelling'],
    ['_DSC9706.jpg', 'studio',  'Studio Modelling'],
    ['_DSC9696.jpg', 'studio',  'Studio Modelling'],
    ['_DSC1997.jpg', 'gym',     'Gym Modelling'],
    ['_DSC1739-4.jpg', 'gym',   'Gym Modelling'],
    ['_DSC4999.jpg', 'outdoor', 'Outdoor Modelling'],
    ['_DSC3028.jpg', 'family',  'Family Moments'],
    ['_DSC4042.jpg', 'family',  'Family Moments'],
    ['_DSC0936.jpg', 'product', 'Product Photography'],
    ['_DSC0806.jpg', 'product', 'Product Photography'],
    ['_DSC0835.jpg', 'product', 'Product Photography'],
    ['_DSC0933.jpg', 'product', 'Product Photography']
  ];

  var visible = [];

  (function gallery() {
    var grid = $('#grid');
    if (!grid) return;

    var meta = $('#galMeta');
    var chips = $$('.chip[data-cat]');
    var GAPROW = 6, GAP = 14;

    PHOTOS.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tile';
      b.dataset.cat = p[1];
      b.dataset.i = String(i);
      b.setAttribute('aria-label', p[2] + ' — open full size');
      b.innerHTML =
        '<img src="' + CDN + p[0] + '" alt="' + p[2] + ' — photograph by Max Krause"' +
        ' loading="lazy" decoding="async">' +
        '<span class="tile-cap"><span class="t">' + p[2] + '</span>' +
        '<span class="s">Max K Media</span></span>';
      grid.appendChild(b);

      var img = b.querySelector('img');
      var span = function () {
        var w = b.clientWidth || 400;
        var r = (img.naturalHeight && img.naturalWidth)
          ? img.naturalHeight / img.naturalWidth
          : 1.25;
        b.style.gridRowEnd = 'span ' + Math.max(20, Math.round((w * r + GAP) / (GAPROW + GAP) * 1.0) + 1);
      };
      img.addEventListener('load', span);
      if (img.complete) span();
      b.__span = span;
    });

    var tiles = $$('.tile', grid);

    var relayout = function () { tiles.forEach(function (t) { if (t.__span) t.__span(); }); };
    window.addEventListener('resize', function () {
      clearTimeout(relayout.__t);
      relayout.__t = setTimeout(relayout, 160);
    });

    var apply = function (cat) {
      visible = [];
      tiles.forEach(function (t) {
        var on = cat === 'all' || t.dataset.cat === cat;
        t.classList.toggle('hide', !on);
        if (on) visible.push(parseInt(t.dataset.i, 10));
      });
      if (meta) {
        meta.innerHTML = '<b>' + visible.length + '</b> ' +
          (visible.length === 1 ? 'frame' : 'frames') +
          (cat === 'all' ? ' across five categories' : ' in this set');
      }
      requestAnimationFrame(relayout);
    };

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
        apply(chip.dataset.cat);
      });
    });

    apply('all');

    /* lightbox */
    var lb = $('#lb');
    if (!lb) return;
    var lbImg = $('.lb-img', lb), lbCap = $('.lb-cap', lb), lbCount = $('.lb-count', lb);
    var pos = 0, last = null;

    function show(p) {
      if (!visible.length) return;
      pos = (p + visible.length) % visible.length;
      var ph = PHOTOS[visible[pos]];
      lbImg.src = CDN + ph[0];
      lbImg.alt = ph[2] + ' — photograph by Max Krause';
      lbCap.innerHTML = '<b>' + ph[2] + '</b>';
      lbCount.textContent = String(pos + 1).padStart(2, '0') + ' / ' + String(visible.length).padStart(2, '0');
    }
    function open(idx) {
      var p = visible.indexOf(idx);
      if (p < 0) return;
      last = document.activeElement;
      show(p);
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      $('.lb-x', lb).focus();
    }
    function close() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lbImg.removeAttribute('src');
      if (last) last.focus();
    }

    grid.addEventListener('click', function (e) {
      var t = e.target.closest('.tile');
      if (t) open(parseInt(t.dataset.i, 10));
    });
    $('.lb-x', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', function () { show(pos - 1); });
    $('.lb-next', lb).addEventListener('click', function () { show(pos + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(pos - 1);
      if (e.key === 'ArrowRight') show(pos + 1);
    });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) show(dx < 0 ? pos + 1 : pos - 1);
      x0 = null;
    }, { passive: true });
  })();

  /* ---------- 3. CLIENT SITE EMBEDS ----------
     The iframe renders the real site at 1440px and is scaled down to fit the
     card, so the desktop layout is what you see. Built lazily on scroll so
     four third-party sites don't load on first paint.

     Sites that send X-Frame-Options: DENY / SAMEORIGIN, or a CSP
     frame-ancestors directive, cannot be framed at all. Those cards should be
     set to data-embed="poster" — see tools/check-embeds.sh.
  ------------------------------------------------------------------------- */
  (function embeds() {
    var views = $$('.frame__view');
    if (!views.length) return;

    var W = 1440;

    function fit(view) {
      var f = view.querySelector('iframe');
      if (!f) return;
      f.style.transform = 'scale(' + (view.clientWidth / W) + ')';
    }

    function build(view) {
      if (view.dataset.built) return;
      view.dataset.built = '1';

      if (view.dataset.embed !== 'live') { view.dataset.state = 'blocked'; return; }

      var f = document.createElement('iframe');
      f.src = view.dataset.src;
      f.title = view.dataset.title || 'Live site preview';
      f.loading = 'lazy';
      f.setAttribute('scrolling', 'no');
      f.setAttribute('tabindex', '-1');
      f.setAttribute('aria-hidden', 'true');
      f.setAttribute('referrerpolicy', 'no-referrer');
      f.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      view.insertBefore(f, view.firstChild);
      fit(view);

      var settled = false;
      var give = setTimeout(function () {
        if (!settled) { settled = true; view.dataset.state = 'blocked'; f.remove(); }
      }, 8000);

      f.addEventListener('load', function () {
        if (settled) return;
        settled = true;
        clearTimeout(give);
        view.dataset.state = 'live';
        fit(view);
      });
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { build(e.target); io.unobserve(e.target); } });
      }, { rootMargin: '260px' });
      views.forEach(function (v) { io.observe(v); });
    } else {
      views.forEach(build);
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { views.forEach(fit); }, 160);
    });
  })();

  /* ---------- 4. REVEAL ---------- */
  (function reveal() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        setTimeout(function () { el.classList.add('in'); }, parseInt(el.dataset.delay || '0', 10));
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 5. SCROLLSPY (home page nav) ---------- */
  (function spy() {
    var links = $$('nav.primary .navlink[data-spy]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var secs = links.map(function (l) { return document.getElementById(l.dataset.spy); }).filter(Boolean);
    if (!secs.length) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.toggle('active', l.dataset.spy === e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  })();

  /* ---------- 6. ENQUIRY FORM → MAILTO ---------- */
  (function enquiry() {
    var form = $('#enquiry');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { var el = $('#' + id, form); return el ? el.value.trim() : ''; };
      var name = (v('f_first') + ' ' + v('f_last')).trim();
      var svc = v('f_service') || 'General enquiry';
      var body = [
        'Name:    ' + (name || '—'),
        'Email:   ' + (v('f_email') || '—'),
        'Phone:   ' + (v('f_phone') || '—'),
        'Service: ' + svc,
        '',
        'Message:',
        v('f_msg') || '—',
        '',
        '— sent from maxkmedia'
      ].join('\n');
      window.location.href = 'mailto:krausemax44@gmail.com'
        + '?subject=' + encodeURIComponent('Enquiry — ' + svc + (name ? ' — ' + name : ''))
        + '&body=' + encodeURIComponent(body);
    });
  })();

  /* ---------- 7. YEAR ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
