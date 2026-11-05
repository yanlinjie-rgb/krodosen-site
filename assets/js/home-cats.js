/* ============================================================
 *  KRODOSEN · homepage category cards + hero rail
 *  Renders from catalog-data.js so the homepage never drifts
 *  away from the real catalogue.
 * ============================================================ */
(function () {
  'use strict';

  var DICT = window.KRD_I18N || {};
  var CATS = (window.KRD_CATALOG && window.KRD_CATALOG.categories) || [];
  var ALL = window.KRD_PRODUCTS || [];

  var ICONS = {
    sensor: '<svg viewBox="0 0 24 24" fill="none" stroke="#FF8A5B" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2"/></svg>',
    rf_components: '<svg viewBox="0 0 24 24" fill="none" stroke="#FF8A5B" stroke-width="1.5"><path d="M4 18V9M8 18V5M12 18v-6M16 18V7M20 18v-9"/><path d="M3 21h18"/></svg>',
    power_mgmt: '<svg viewBox="0 0 24 24" fill="none" stroke="#FF8A5B" stroke-width="1.5"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
    auto_connector: '<svg viewBox="0 0 24 24" fill="none" stroke="#FF8A5B" stroke-width="1.5"><path d="M3 16V9l3-3h9l3 3v7z"/><circle cx="7.5" cy="18" r="1.8"/><circle cx="16.5" cy="18" r="1.8"/></svg>',
    industrial_connector: '<svg viewBox="0 0 24 24" fill="none" stroke="#FF8A5B" stroke-width="1.5"><rect x="3" y="7" width="18" height="10" rx="1.5"/><path d="M7 10v4M11 10v4M15 10v4"/></svg>',
    oscillator: '<svg viewBox="0 0 24 24" fill="none" stroke="#FF8A5B" stroke-width="1.5"><path d="M2 12h3l2-6 3 12 3-9 2 3h7"/></svg>',
    mosfet: '<svg viewBox="0 0 24 24" fill="none" stroke="#FF8A5B" stroke-width="1.5"><rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/></svg>',
    op_amp: '<svg viewBox="0 0 24 24" fill="none" stroke="#FF8A5B" stroke-width="1.5"><path d="M5 4l14 8-14 8z"/><path d="M2 9h3M2 15h3M19 12h3"/></svg>',
    photodiode: '<svg viewBox="0 0 24 24" fill="none" stroke="#FF8A5B" stroke-width="1.5"><circle cx="12" cy="12" r="6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
    other_industrial: '<svg viewBox="0 0 24 24" fill="none" stroke="#FF8A5B" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>'
  };

  function lang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'zh-Hant') return q;
    try { var s = localStorage.getItem('krd_lang'); if (s === 'en' || s === 'zh-Hant') return s; } catch (e) {}
    return 'en';
  }
  function t(key, fb) {
    var cur = DICT[lang()] || {}, en = DICT.en || {};
    if (cur[key] != null && cur[key] !== '') return cur[key];
    if (en[key] != null && en[key] !== '') return en[key];
    return fb != null ? fb : key;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function label(c) { return lang() === 'zh-Hant' ? c.name : c.nameEn; }

  function countOf(id) { return ALL.filter(function (p) { return p.cat === id; }).length; }
  function kindsOf(c) {
    return c.kinds.filter(function (k) { return ALL.some(function (p) { return p.cat === c.id && p.kindKey === k.key; }); });
  }

  // six categories for the homepage grid: the four that carry the brand story + the two biggest sensor/RF lines
  var ORDER = ['sensor', 'rf_components', 'power_mgmt', 'auto_connector', 'industrial_connector', 'oscillator'];

  function renderGrid() {
    var host = document.querySelector('[data-home-cats]');
    if (!host) return;
    var cats = ORDER.map(function (id) { return CATS.find(function (c) { return c.id === id; }); }).filter(Boolean);
    host.innerHTML = cats.map(function (c, i) {
      var kinds = kindsOf(c);
      var n = countOf(c);
      var art = (ALL.find(function (p) { return p.cat === c.id; }) || {}).img || 'img/art-chip.svg';
      var tags = kinds.slice(0, 3).map(function (k) { return '<span>' + esc(k.name) + '</span>'; }).join('');
      return '<a class="pcard" href="products.html?cat=' + encodeURIComponent(c.id) + '">' +
        '<div class="pcard__fig">' +
          '<span class="pcard__idx">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<img class="art" src="' + esc(art) + '" alt="' + esc(label(c)) + '">' +
          '<span class="pcard__go"><svg viewBox="0 0 16 16" fill="none" stroke="#16183F" stroke-width="1.8"><path d="M2 8h11M9 4l4 4-4 4"/></svg></span>' +
        '</div>' +
        '<div class="pcard__body">' +
          '<h3>' + esc(label(c)) + '</h3>' +
          '<p>' + kinds.length + ' ' + esc(t('pd.subtypes', 'sub-types')) + ' · ' + n + ' ' + esc(t('pd.parts', 'part numbers')) + '</p>' +
          '<div class="tags">' + tags + '</div>' +
        '</div></a>';
    }).join('');
  }

  function renderRail() {
    var host = document.querySelector('[data-home-rail]');
    if (!host) return;
    var ids = ['sensor', 'rf_components', 'power_mgmt', 'industrial_connector'];
    host.innerHTML = ids.map(function (id) {
      var c = CATS.find(function (x) { return x.id === id; });
      if (!c) return '';
      return '<a class="railcell" href="products.html?cat=' + encodeURIComponent(c.id) + '">' +
        (ICONS[c.id] || '') +
        '<div><b>' + esc(label(c)) + '</b><small>' + countOf(c) + ' ' + esc(t('pd.parts', 'part numbers')) + '</small></div></a>';
    }).join('');
  }

  function render() { renderGrid(); renderRail(); }

  function boot() { if (!CATS.length) return; render(); document.addEventListener('krd:lang', render); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
