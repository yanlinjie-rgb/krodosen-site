/* ==========================================================================
   KRODOSEN — site behaviour
   ========================================================================== */
(function () {
  'use strict';

  var DICT = window.KRD_I18N || {};
  var LS_KEY = 'krd_lang';

  /* ---------------- language ---------------- */
  function currentLang() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
    if (q && DICT[q]) return q;
    var saved = null;
    try { saved = localStorage.getItem(LS_KEY); } catch (e) {}
    if (saved && DICT[saved]) return saved;
    return 'en';
  }

  function applyLang(lang) {
    var dict = DICT[lang] || DICT.en;
    document.documentElement.setAttribute('lang', lang === 'zh-Hant' ? 'zh-Hant' : 'en');
    document.body.setAttribute('data-lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (dict[k] != null) el.textContent = dict[k];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      if (dict[k] != null) el.innerHTML = dict[k];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-ph');
      if (dict[k] != null) el.setAttribute('placeholder', dict[k]);
    });
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-lang') === lang);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-title');
      if (dict[k] != null) el.setAttribute('title', dict[k]);
    });

    try { localStorage.setItem(LS_KEY, lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent('krd:lang', { detail: { lang: lang } }));
  }

  /* ---------------- header ---------------- */
  function initHeader() {
    var hd = document.querySelector('.hd');
    if (!hd) return;
    var darkHero = document.body.getAttribute('data-hero') === 'dark';

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      var stuck = y > 24;
      hd.classList.toggle('is-stuck', stuck);
      if (darkHero && !stuck) hd.setAttribute('data-theme', 'dark');
      else hd.removeAttribute('data-theme');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    document.querySelectorAll('.lang button').forEach(function (b) {
      b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
    });
  }

  /* ---------------- mobile drawer ---------------- */
  function initDrawer() {
    var burger = document.querySelector('.burger');
    var drawer = document.querySelector('.drawer');
    if (!burger || !drawer) return;
    var x = drawer.querySelector('.drawer__x');
    burger.addEventListener('click', function () { drawer.classList.add('is-open'); });
    if (x) x.addEventListener('click', function () { drawer.classList.remove('is-open'); });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { drawer.classList.remove('is-open'); });
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  function initReveal() {
    var items = document.querySelectorAll('.rv');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- counters ---------------- */
  function initCounters() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    var done = new WeakSet();

    function run(el) {
      if (done.has(el)) return;
      done.add(el);
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      var dur = 1500, t0 = null;

      function frame(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        var v = target * e;
        el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- product table filter ---------------- */
  function initProducts() {
    var table = document.querySelector('[data-products]');
    if (!table) return;

    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
    var tabs = document.querySelectorAll('.tab');
    var input = document.querySelector('.search input');
    var countEl = document.querySelector('[data-count-el]');
    var emptyEl = document.querySelector('[data-empty]');
    var cat = 'all';

    function norm(s) { return (s || '').toLowerCase(); }

    function render() {
      var q = norm(input ? input.value.trim() : '');
      var shown = 0;
      rows.forEach(function (r) {
        var c = r.getAttribute('data-cat') || '';
        var text = norm(r.textContent);
        var ok = (cat === 'all' || c === cat) && (!q || text.indexOf(q) > -1);
        r.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      if (countEl) countEl.textContent = shown;
      if (emptyEl) emptyEl.style.display = shown ? 'none' : '';
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (o) { o.classList.remove('is-on'); });
        t.classList.add('is-on');
        cat = t.getAttribute('data-cat');
        render();
      });
    });
    if (input) input.addEventListener('input', render);
    render();
    document.addEventListener('krd:lang', render);
  }

  /* ---------------- contact form ---------------- */
  function initForm() {
    var form = document.querySelector('[data-inquiry]');
    if (!form) return;
    var note = form.querySelector('.formnote');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lang = document.body.getAttribute('data-lang') || 'en';
      var dict = DICT[lang] || DICT.en;

      var name = form.querySelector('[name="name"]');
      var email = form.querySelector('[name="email"]');
      var msg = form.querySelector('[name="message"]');
      var agree = form.querySelector('[name="agree"]');

      var valid = name.value.trim() && email.value.trim() && /.+@.+\..+/.test(email.value) &&
                  msg.value.trim() && agree && agree.checked;

      note.className = 'formnote ' + (valid ? 'ok' : 'err');
      note.textContent = valid ? dict['cd.f.ok'] : dict['cd.f.err'];

      if (!valid) return;

      var subject = (form.querySelector('[name="subject"]') || {}).value || 'Enquiry';
      var company = (form.querySelector('[name="company"]') || {}).value || '';
      var phone = (form.querySelector('[name="phone"]') || {}).value || '';
      var body =
        'Name: ' + name.value + '\n' +
        'Company: ' + company + '\n' +
        'Email: ' + email.value + '\n' +
        'Phone: ' + phone + '\n\n' +
        msg.value;

      var href = 'mailto:klein@krodosen.com?subject=' +
        encodeURIComponent('[KRODOSEN] ' + subject) + '&body=' + encodeURIComponent(body);

      setTimeout(function () { window.location.href = href; }, 700);
    });
  }

  /* ---------------- misc ---------------- */
  function initMisc() {
    var y = document.querySelectorAll('[data-year]');
    y.forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    applyLang(currentLang());
    initHeader();
    initDrawer();
    initReveal();
    initCounters();
    initProducts();
    initForm();
    initMisc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.KRD = { setLang: applyLang };
})();
