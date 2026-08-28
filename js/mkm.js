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
    window.addEventListener('resize', function () { if (window.innerWidth > 900) close(); });
  })();

  /* ---------- 2. PHOTO GRID (masonry + filters + lightbox) ----------
     Photos come from js/gallery-data.js (window.MKM_PHOTOS), which is generated
     by tools/build-gallery.sh. Nothing about the gallery is hardcoded here:
     categories, chip counts and row spans are all derived from that manifest,
     so adding media never means editing markup.
  ------------------------------------------------------------------- */
  var PHOTOS = Array.isArray(window.MKM_PHOTOS) ? window.MKM_PHOTOS : [];
  var SIZES = '(max-width: 340px) 100vw, (max-width: 1000px) 50vw, 33vw';
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
      // sizes mirrors the grid: 1 column under 340px, 2 up to 1000px, 3 above,
      // inside a 1500px container. Without it the browser assumes 100vw and
      // downloads the largest candidate every time.
      b.innerHTML =
        '<img src="' + p.src + '"' +
        (p.srcset ? ' srcset="' + p.srcset + '" sizes="' + SIZES + '"' : '') +
        ' alt="' + (p.label || 'Photograph') +
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
      lbImg.removeAttribute('srcset');
      lbImg.src = ph.full || ph.src;
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
  /* Report missing screenshots to the console. A card with no poster looks
     deliberate on purpose — which also makes it easy to assume the site is
     broken rather than that a file was never generated. Dev-facing only;
     visitors see nothing.

     Posters are lazy-loaded, so a timer set at parse time fires long before
     they've been requested. Listen for the error event instead — in the capture
     phase, because `error` doesn't bubble and the inline onerror removes the
     image. */
  (function missingPosters() {
    var views = $$('.frame__view[data-embed="poster"]');
    if (!views.length || !window.console) return;
    var missing = [];
    var timer = null;

    document.addEventListener('error', function (e) {
      var img = e.target;
      if (!img || !img.classList || !img.classList.contains('poster')) return;
      var name = (img.getAttribute('src') || '').split('/').pop();
      if (name && missing.indexOf(name) === -1) missing.push(name);
      clearTimeout(timer);
      timer = setTimeout(function () {
        console.warn('[MKM] ' + missing.length + ' of ' + views.length +
          ' client cards have no screenshot. Add these to img/work/ — run ' +
          '`node tools/shots.mjs`, or drop the files in by hand: ' + missing.join(', '));
      }, 900);
    }, true);
  })();

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

  /* ---------- 8. SUPPORT QUOTE CONFIGURATOR ----------
     Every number comes from js/pricing-data.js. The customer's own selections
     drive the figure — nothing is inferred about who they are, and two people
     making the same choices see the same price.

        monthly = (base x response x coverage + add-ons) x term

     shown as a band, because a real quote depends on things a form can't see.
     "Send this" hands the whole selection to the enquiry email so the first
     reply can be an actual number instead of twenty questions.
  ------------------------------------------------------------------------- */
  (function quoteCalc() {
    var form = $('#calc');
    var out = $('#quote');
    var P = window.MKM_PRICING;
    if (!form || !out || !P) return;

    var money = function (n) {
      return '$' + Math.round(n).toLocaleString('en-AU');
    };

    var GROUPS = [
      ['domain',   'domains',  'What needs covering'],
      ['response', 'response', 'Response time'],
      ['coverage', 'coverage', 'Cover'],
      ['term',     'term',     'Commitment']
    ];

    /* ---- build the controls from the config ---- */
    var html = '';
    GROUPS.forEach(function (g) {
      var name = g[0], list = P[g[1]];
      if (!list || !list.length) return;
      html += '<fieldset class="calc__group"><legend class="calc__legend">' + g[2] + '</legend><div class="opts">';
      list.forEach(function (o, i) {
        html += '<label class="opt"><input type="radio" name="' + name + '" value="' + o.id + '"' +
                (i === 0 ? ' checked' : '') + '><span>' + o.label +
                (o.hint ? '<small>' + o.hint + '</small>' : '') + '</span></label>';
      });
      html += '</div></fieldset>';
    });
    if (P.addons && P.addons.length) {
      html += '<fieldset class="calc__group"><legend class="calc__legend">Add on</legend><div class="addons-grid">';
      P.addons.forEach(function (a) {
        html += '<label class="addon"><input type="checkbox" name="addon" value="' + a.id + '">' +
                '<span><span>' + a.label + (a.hint ? '<small>' + a.hint + '</small>' : '') +
                '</span><i>' + money(a.price) + '</i></span></label>';
      });
      html += '</div></fieldset>';
    }
    form.innerHTML = html;

    var pick = function (name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      if (!el) return null;
      var key = { domain: 'domains', response: 'response', coverage: 'coverage', term: 'term' }[name];
      for (var i = 0; i < P[key].length; i++) if (P[key][i].id === el.value) return P[key][i];
      return null;
    };

    function compute() {
      var d = pick('domain'), r = pick('response'), c = pick('coverage'), t = pick('term');
      var addons = $$('input[name="addon"]:checked', form).map(function (el) {
        for (var i = 0; i < P.addons.length; i++) if (P.addons[i].id === el.value) return P.addons[i];
        return null;
      }).filter(Boolean);

      var base = (d ? d.base : 0) * (r ? r.mult : 1) * (c ? c.mult : 1);
      var extra = addons.reduce(function (n, a) { return n + a.price; }, 0);
      var total = (base + extra) * (t ? t.mult : 1);
      return { d: d, r: r, c: c, t: t, addons: addons, base: base, extra: extra, total: total };
    }

    function render() {
      var q = compute();
      var pct = typeof P.rangePct === 'number' ? P.rangePct : 0.15;
      var lo = q.total * (1 - pct), hi = q.total * (1 + pct);

      var lines = '';
      var line = function (k, v) {
        lines += '<li><span>' + k + '</span><b>' + v + '</b></li>';
      };
      if (q.d) line(q.d.label, money(q.d.base));
      if (q.r && q.r.mult !== 1) line(q.r.label, '&times; ' + q.r.mult.toFixed(2));
      if (q.c && q.c.mult !== 1) line(q.c.label, '&times; ' + q.c.mult.toFixed(2));
      q.addons.forEach(function (a) { line(a.label, money(a.price)); });
      if (q.t && q.t.mult !== 1) line(q.t.label, (q.t.mult < 1 ? '&minus;' : '+') + Math.round(Math.abs(1 - q.t.mult) * 100) + '%');

      var flag = P.confirmed ? '' :
        '<p class="quote__flag"><b>Worked example.</b> These rates are not final ' +
        'and are shown to illustrate how the estimate is put together.</p>';

      out.innerHTML =
        flag +
        '<p class="quote__k">Indicative</p>' +
        '<p class="quote__fig">' + money(lo) + '&ndash;' + money(hi) + '</p>' +
        '<p class="quote__per">per month, ' + (P.currency || 'AUD') +
        (P.calloutHours ? ', includes the ' + P.calloutHours + '-hour callout' : '') + '</p>' +
        '<ul class="quote__lines">' + lines + '</ul>' +
        '<p class="quote__note">A range, not a quote &mdash; what you actually pay depends on how ' +
        'your setup is built and who else touches it. Send the selection through and you\'ll get ' +
        'a fixed number back.</p>' +
        rateLine(q) +
        '<button class="btn btn-solid" type="button" id="quoteSend">Send this for an exact quote ' +
        '<svg aria-hidden="true" width="14" height="14"><use href="#i-arrow"/></svg></button>' +
        '<button class="btn btn-ghost" type="button" id="quotePdf" style="width:100%;justify-content:center;margin-top:10px">' +
        'Download as PDF</button>' +
        '<button class="quote__reset" type="button" id="quoteReset">Start again</button>';

      out.dataset.summary = summary(q, lo, hi);
      buildDoc(q, lo, hi);
    }

    /* the printable version — same numbers, laid out as a document */
    function buildDoc(q, lo, hi) {
      var doc = document.getElementById('quoteDoc');
      if (!doc) {
        doc = document.createElement('div');
        doc.id = 'quoteDoc';
        doc.className = 'qdoc';
        doc.setAttribute('aria-hidden', 'true');
        document.body.appendChild(doc);
      }
      var d = new Date();
      var date = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
      var valid = new Date(d.getTime() + 30 * 864e5)
        .toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

      var rows = '';
      var row = function (k, v) { rows += '<tr><td>' + k + '</td><td>' + v + '</td></tr>'; };
      if (q.d) row('Covering', q.d.label);
      if (q.r) row('Response time', q.r.label);
      if (q.c) row('Cover', q.c.label);
      if (q.t) row('Commitment', q.t.label);
      row('Add-ons', q.addons.length
        ? q.addons.map(function (a) { return a.label; }).join(', ') : 'None');

      var build = '';
      if (q.d) build += '<tr><td>' + q.d.label + ' base</td><td>' + money(q.d.base) + '</td></tr>';
      if (q.r && q.r.mult !== 1) build += '<tr><td>' + q.r.label + '</td><td>&times; ' + q.r.mult.toFixed(2) + '</td></tr>';
      if (q.c && q.c.mult !== 1) build += '<tr><td>' + q.c.label + '</td><td>&times; ' + q.c.mult.toFixed(2) + '</td></tr>';
      q.addons.forEach(function (a) { build += '<tr><td>' + a.label + '</td><td>' + money(a.price) + '</td></tr>'; });
      if (q.t && q.t.mult !== 1) build += '<tr><td>' + q.t.label + '</td><td>' +
        (q.t.mult < 1 ? '&minus;' : '+') + Math.round(Math.abs(1 - q.t.mult) * 100) + '%</td></tr>';

      var rate = q.d && q.d.hourly;
      var terms = '<li>This is an <b>indicative range</b>, not a fixed quote. The final figure ' +
                  'depends on how the site or system is built and who else has access to it.</li>' +
                  '<li>Response time is the commitment to <b>begin work</b>, not to complete a repair.</li>' +
                  (P.calloutHours
                    ? '<li>Includes the standard <b>' + P.calloutHours + '-hour callout</b>, waived because ' +
                      'you\'re on a plan' +
                      (rate ? ' &mdash; off-plan the same callout starts at ' + money(rate * P.calloutHours) : '') +
                      '. Work beyond it is billed at <b>' + money(rate) + '/hr</b>.</li>' : '') +
                  '<li>Projects and redesigns are quoted separately, never billed against a support plan.</li>' +
                  '<li>Thirty days notice to cancel. No exit fee. You keep every account.</li>';

      doc.innerHTML =
        '<div class="qd-brand">MAX K MEDIA <span>On-call support &middot; ' + date + '</span></div>' +
        '<h1>Indicative support estimate</h1>' +
        '<p class="qd-lede">Prepared from the options selected on maxkmedia. ' +
        'Valid for discussion until ' + valid + '.</p>' +
        (P.confirmed ? '' :
          '<p class="qd-flag"><b>Worked example.</b> These rates are illustrative and not ' +
          'final. Ask for a written quote before relying on any figure here.</p>') +
        '<h2>Your selection</h2><table>' + rows + '</table>' +
        '<h2>Indicative monthly</h2>' +
        '<p class="qd-fig">' + money(lo) + '&ndash;' + money(hi) + '</p>' +
        '<p class="qd-per">per month, ' + (P.currency || 'AUD') + ', excluding GST</p>' +
        '<h2>How that is built up</h2><table>' + build + '</table>' +
        '<h2>Terms</h2><ul class="qd-terms">' + terms + '</ul>' +
        '<div class="qd-foot"><span>Max Krause &middot; Max K Media &middot; Bathurst NSW</span>' +
        '<span>0490 365 553 &middot; krausemax44@gmail.com</span></div>';
    }

    function rateLine(q) {
      var rate = q.d && q.d.hourly;
      if (!rate) return '';
      var out = '<p class="quote__note">';
      if (P.calloutWaived && P.calloutHours) {
        out += 'The standard <strong>' + P.calloutHours + '-hour callout is included</strong> &mdash; ' +
               'waived because you subscribed. Off-plan the same callout starts at ' +
               money(rate * P.calloutHours) + ' before anyone looks at it. ';
      }
      return out + 'Work beyond it is billed at <strong>' + money(rate) + '/hr</strong>.</p>';
    }

    function summary(q, lo, hi) {
      var L = [];
      L.push('Covering:   ' + (q.d ? q.d.label : '-'));
      L.push('Response:   ' + (q.r ? q.r.label : '-'));
      L.push('Cover:      ' + (q.c ? q.c.label : '-'));
      L.push('Commitment: ' + (q.t ? q.t.label : '-'));
      L.push('Add-ons:    ' + (q.addons.length ? q.addons.map(function (a) { return a.label; }).join(', ') : 'none'));
      L.push('');
      L.push('Indicative: ' + money(lo) + '-' + money(hi) + ' per month' +
             (P.confirmed ? '' : '  (worked example, rates not final)'));
      if (q.d && q.d.hourly) {
        if (P.calloutWaived && P.calloutHours) {
          L.push('Callout:    ' + P.calloutHours + '-hour callout included (waived on a plan)');
        }
        L.push('Hourly:     ' + money(q.d.hourly) + '/hr beyond that');
      }
      return L.join('\n');
    }

    form.addEventListener('change', render);
    out.addEventListener('click', function (e) {
      if (e.target.closest('#quoteReset')) {
        form.reset();
        $$('input[name="addon"]', form).forEach(function (el) { el.checked = false; });
        render();
        return;
      }
      if (e.target.closest('#quotePdf')) { window.print(); return; }
      if (!e.target.closest('#quoteSend')) return;
      var body = [
        'I put a support plan together on the site:',
        '',
        out.dataset.summary,
        '',
        'A bit about the setup:',
        '',
        '',
        '— sent from maxkmedia'
      ].join('\n');
      window.location.href = 'mailto:krausemax44@gmail.com' +
        '?subject=' + encodeURIComponent('On-call support enquiry') +
        '&body=' + encodeURIComponent(body);
    });

    /* tier cards prefill the builder — data-preset="domain|response|coverage|term|addon,addon" */
    $$('[data-preset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.dataset.preset.split('|');
        [['domain', v[0]], ['response', v[1]], ['coverage', v[2]], ['term', v[3]]].forEach(function (pair) {
          var el = form.querySelector('input[name="' + pair[0] + '"][value="' + pair[1] + '"]');
          if (el) el.checked = true;
        });
        var want = (v[4] || '').split(',').filter(Boolean);
        $$('input[name="addon"]', form).forEach(function (el) {
          el.checked = want.indexOf(el.value) > -1;
        });
        render();
        var target = document.getElementById('build');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    render();

    if (!P.confirmed && window.console) {
      console.warn('[MKM] Support pricing is unconfirmed — the figures in ' +
                   'js/pricing-data.js are placeholders. Set confirmed: true once checked.');
    }
  })();

  /* ---------- 9. YEAR ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
