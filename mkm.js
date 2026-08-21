/* ==========================================================================
   MAX K MEDIA — mkm.js
   No dependencies. Every block guards for its own elements, so this one file
   is safe to include on every page.
   ========================================================================== */
(function () {
  'use strict';

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
     Photos come from js/gallery-data.js (window.MKM_PHOTOS), which is generated
     by tools/build-gallery.sh. Nothing about the gallery is hardcoded here:
     categories, chip counts and row spans are all derived from that manifest,
     so adding media never means editing markup.
  ------------------------------------------------------------------- */
  var PHOTOS = Array.isArray(window.MKM_PHOTOS) ? window.MKM_PHOTOS : [];
  var visible = [];

  (function gallery() {
    var grid = $('#grid');
    if (!grid) return;

    if (!PHOTOS.length) {
      grid.innerHTML = '<p class="gal-meta">Gallery manifest missing — run ' +
                       '<code>./tools/build-gallery.sh</code>.</p>';
      return;
    }

    var meta = $('#galMeta');
    var bar = $('.gal-bar');
    var GAPROW = 6, GAP = 14;

    /* ---- chips: built from whatever categories exist in the manifest ---- */
    var order = [], counts = {}, labels = {};
    PHOTOS.forEach(function (p) {
      if (!counts[p.cat]) { counts[p.cat] = 0; order.push(p.cat); labels[p.cat] = p.label || p.cat; }
      counts[p.cat]++;
    });

    function title(slug, label) {
      // prefer a short human name: "Studio Modelling" -> "Studio"
      var first = String(label || slug).split(' ')[0];
      return first.charAt(0).toUpperCase() + first.slice(1);
    }

    // lead with the biggest bodies of work rather than folder order
    order.sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });

    if (bar) {
      bar.innerHTML = '';
      var mk = function (cat, text, n, on) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip' + (on ? ' active' : '');
        b.dataset.cat = cat;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.innerHTML = text + '<span class="n">' + n + '</span>';
        bar.appendChild(b);
        return b;
      };
      mk('all', 'All', PHOTOS.length, true);
      order.forEach(function (c) { mk(c, title(c, labels[c]), counts[c], false); });
    }

    /* ---- tiles ---- */
    PHOTOS.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tile';
      b.dataset.cat = p.cat;
      b.dataset.i = String(i);
      b.setAttribute('aria-label', (p.label || 'Photograph') + ' — open full size');
      b.innerHTML =
        '<img src="' + p.src + '" alt="' + (p.label || 'Photograph') +
        ' — photograph by Max Krause" loading="lazy" decoding="async"' +
        (p.w && p.h ? ' width="' + p.w + '" height="' + p.h + '"' : '') + '>' +
        '<span class="tile-cap"><span class="t">' + (p.label || '') + '</span>' +
        '<span class="s">Max K Media</span></span>';
      grid.appendChild(b);

      var img = b.querySelector('img');
      var span = function () {
        var w = b.clientWidth || 400;
        var r = (p.w && p.h) ? p.h / p.w
              : (img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1.25);
        b.style.gridRowEnd = 'span ' + Math.max(20, Math.round((w * r + GAP) / (GAPROW + GAP)) + 1);
      };
      span();                                   // exact immediately when w/h are known
      img.addEventListener('load', span);       // measured fallback otherwise
      b.__span = span;
    });

    var tiles = $$('.tile', grid);
    var relayout = function () { tiles.forEach(function (t) { if (t.__span) t.__span(); }); };
    window.addEventListener('resize', function () {
      clearTimeout(relayout.__t);
      relayout.__t = setTimeout(relayout, 160);
    });

    function apply(cat) {
      visible = [];
      tiles.forEach(function (t) {
        var on = cat === 'all' || t.dataset.cat === cat;
        t.classList.toggle('hide', !on);
        if (on) visible.push(parseInt(t.dataset.i, 10));
      });
      if (meta) {
        meta.innerHTML = '<b>' + visible.length + '</b> ' +
          (visible.length === 1 ? 'frame' : 'frames') +
          (cat === 'all'
            ? ' across ' + order.length + (order.length === 1 ? ' category' : ' categories')
            : ' in this set');
      }
      requestAnimationFrame(relayout);
    }

    var chips = $$('.chip[data-cat]');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
        apply(chip.dataset.cat);
      });
    });

    apply('all');

    /* ---- lightbox ---- */
    var lb = $('#lb');
    if (!lb) return;
    var lbImg = $('.lb-img', lb), lbCap = $('.lb-cap', lb), lbCount = $('.lb-count', lb);
    var pos = 0, last = null;

    function show(p) {
      if (!visible.length) return;
      pos = (p + visible.length) % visible.length;
      var ph = PHOTOS[visible[pos]];
      lbImg.src = ph.src;
      lbImg.alt = (ph.label || 'Photograph') + ' — photograph by Max Krause';
      lbCap.innerHTML = '<b>' + (ph.label || '') + '</b>';
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

  /* ---------- 3. CLIENT SITE CARDS ----------
     Screenshots are the default and need no JS at all — the <img> and its
     onerror handle both the loaded and the not-yet-captured case.

     This block only runs for cards explicitly marked data-embed="live". Note
     that a site sending X-Frame-Options or a CSP frame-ancestors directive
     cannot be framed, and the browser still fires load on its error page, so
     there is no reliable way to detect it from here. Only set live on sites
     you have confirmed with tools/check-embeds.sh.
  ------------------------------------------------------------------------- */
  (function embeds() {
    var views = $$('.frame__view[data-embed="live"]');
    if (!views.length) return;

    var W = 1440;

    function fit(view) {
      var f = view.querySelector('iframe');
      if (f) f.style.transform = 'scale(' + (view.clientWidth / W) + ')';
    }

    function build(view) {
      if (view.dataset.built) return;
      view.dataset.built = '1';

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
        // never loaded — drop back to the screenshot underneath
        if (!settled) { settled = true; f.remove(); view.dataset.embed = 'poster'; }
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
