/* Max K Media  site.js
   Small progressive enhancements only. Every page works with this file blocked:
   links are real links, the form posts natively, gallery images open on their own. */
(function () {
  'use strict';
  var d = document;

  /* 1. Mobile menu */
  var burger = d.querySelector('.burger');
  var nav = d.getElementById('nav');
  if (burger && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      d.documentElement.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); burger.focus(); }
    });
    window.matchMedia('(min-width: 881px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });
  }

  /* 2. Gallery lightbox on a native <dialog> */
  var links = Array.prototype.slice.call(d.querySelectorAll('.gallery a[data-full]'));
  var lb = d.getElementById('lb');
  if (links.length && lb && typeof lb.showModal === 'function') {
    var img = d.createElement('img');   // added to the page on first open, so no empty image sits in the markup
    img.decoding = 'async';
    var stage = lb.querySelector('.lb__stage');
    var cap = lb.querySelector('.lb__cap');
    var count = lb.querySelector('.lb__count');
    var at = 0;
    var show = function (i) {
      at = (i + links.length) % links.length;
      var a = links[at];
      if (!img.parentNode) stage.appendChild(img);
      img.src = a.getAttribute('data-full');
      img.alt = a.querySelector('img').alt;
      cap.textContent = a.getAttribute('data-cap') || '';
      count.textContent = (at + 1) + ' of ' + links.length;
    };
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault(); show(i); lb.showModal();
      });
    });
    lb.querySelector('[data-lb="prev"]').addEventListener('click', function () { show(at - 1); });
    lb.querySelector('[data-lb="next"]').addEventListener('click', function () { show(at + 1); });
    lb.querySelector('[data-lb="close"]').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb__stage')) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(at - 1);
      if (e.key === 'ArrowRight') show(at + 1);
    });
    lb.addEventListener('close', function () { if (img.parentNode) stage.removeChild(img); links[at].focus(); });
  }

  /* 3. Enquiry form: send as JSON, report inline. Falls back to the native POST. */
  var form = d.getElementById('enquiry');
  if (form && window.fetch) {
    var msg = form.querySelector('.form__msg');
    var btn = form.querySelector('button[type="submit"]');
    var say = function (text, state) {
      msg.hidden = false; msg.textContent = text; msg.setAttribute('data-state', state);
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.botcheck && form.botcheck.checked) return;   // honeypot
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'redirect') data[k] = v; });
      btn.disabled = true; var label = btn.textContent; btn.textContent = 'Sending';
      say('Sending your enquiry.', 'wait');
      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j || !j.success) throw new Error('rejected');
        form.reset();
        say('Enquiry sent. Max will reply by email or phone.', 'good');
      }).catch(function () {
        say('That did not send. Email ' + form.getAttribute('data-email') + ' or call ' + form.getAttribute('data-phone') + ' instead.', 'bad');
      }).then(function () { btn.disabled = false; btn.textContent = label; });
    });
    /* Prefill the service from ?service= so links from service pages land ready. */
    try {
      var want = new URLSearchParams(location.search).get('service');
      if (want && form.service) {
        Array.prototype.forEach.call(form.service.options, function (o) { if (o.value === want) form.service.value = want; });
      }
    } catch (err) { /* older browsers: no prefill */ }
  }
})();
