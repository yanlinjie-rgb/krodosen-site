/* ============================================================
 *  KRODOSEN · catalogue browser
 *  Categories → sub-types → parameter filters (multi-select) + search
 *  Data: catalog-data.js (window.KRD_CATALOG / window.KRD_PRODUCTS)
 * ============================================================ */
(function () {
  'use strict';

  var DICT = window.KRD_I18N || {};
  var CATS = (window.KRD_CATALOG && window.KRD_CATALOG.categories) || [];
  var ALL = window.KRD_PRODUCTS || [];

  var PAGE_SIZE = 10;
  var state = { cat: 'all', kind: '', q: '', filters: {}, page: 1 };
  var booted = false;

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
  /* 封装示意图：按 pkg 自动分配（pkg-art.js） */
  function art(p) {
    if (window.KRD_ART) return window.KRD_ART(p);
    return (p && p.img) || 'img/art-chip.svg';
  }

  /* ---------- 产品状态：现货 / 订货 / 停产 ---------- */
  var STATUS = {
    stock: { cls: 'pill--ok', key: 'pd.stock', fb: 'In stock' },
    build: { cls: 'pill--build', key: 'pd.build', fb: 'Build to order' },
    eol:   { cls: 'pill--eol',  key: 'pd.eol',   fb: 'Discontinued' }
  };
  function statusMeta(s) { return STATUS[s] || STATUS.stock; }
  function statusBadge(s) {
    var m = statusMeta(s);
    return '<span class="pill ' + m.cls + '">' + esc(t(m.key, m.fb)) + '</span>';
  }
  function $(sel, root) { return (root || document).querySelector(sel); }

  var catLabel = function (c) { return lang() === 'zh-Hant' ? c.name : c.nameEn; };

  /* ---------- scope ---------- */
  function scopeProducts() {
    return ALL.filter(function (p) {
      if (state.cat !== 'all' && p.cat !== state.cat) return false;
      if (state.kind && p.kindKey !== state.kind) return false;
      if (state.q) {
        var hay = (p.model + ' ' + p.catName + ' ' + p.kind + ' ' + p.key + ' ' + JSON.stringify(p.specRaw || {})).toLowerCase();
        if (hay.indexOf(state.q.toLowerCase()) < 0) return false;
      }
      return true;
    });
  }

  function matchFilters(p) {
    return Object.keys(state.filters).every(function (k) {
      var set = state.filters[k];
      if (!set || !set.length) return true;
      var v = (p.specRaw || {})[k];
      return set.indexOf(String(v)) >= 0;
    });
  }

  /* ---------- filter option values ---------- */
  function filterDefs() {
    var cat = CATS.find(function (c) { return c.id === state.cat; });
    if (!cat) {
      // all categories: aggregate (models only, filters stay empty)
      return [];
    }
    if (cat.kinds.length > 1 && !state.kind) return [];
    var kinds = cat.kinds.filter(function (k) { return !state.kind || k.key === state.kind; });
    var map = {};
    kinds.forEach(function (k) {
      k.filters.forEach(function (f) {
        if (!map[f.key]) map[f.key] = { key: f.key, name: f.name, order: Object.keys(map).length };
      });
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function optionValues(defs, prods) {
    var out = {};
    defs.forEach(function (d) {
      var set = {};
      prods.forEach(function (p) {
        var v = (p.specRaw || {})[d.key];
        if (v != null && v !== '' && v !== '-') set[String(v)] = (set[String(v)] || 0) + 1;
      });
      out[d.key] = Object.keys(set).sort(function (a, b) {
        var na = parseFloat(a), nb = parseFloat(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      }).map(function (v) { return { v: v, n: set[v] }; });
    });
    return out;
  }

  /* ---------- render ---------- */
  function renderTabs() {
    var host = $('[data-cat-tabs]');
    if (!host) return;
    var html = '<button type="button" class="tab' + (state.cat === 'all' ? ' is-on' : '') + '" data-cat="all">' +
      esc(t('pd.tabAll', 'All')) + '<span>' + ALL.length + '</span></button>';
    CATS.forEach(function (c) {
      var n = ALL.filter(function (p) { return p.cat === c.id; }).length;
      html += '<button type="button" class="tab' + (state.cat === c.id ? ' is-on' : '') + '" data-cat="' + esc(c.id) + '">' +
        esc(catLabel(c)) + '<span>' + n + '</span></button>';
    });
    host.innerHTML = html;
  }

  function renderKinds() {
    var host = $('[data-kind-chips]');
    if (!host) return;
    var cat = CATS.find(function (c) { return c.id === state.cat; });
    if (!cat || cat.kinds.length <= 1) { host.innerHTML = ''; host.hidden = true; return; }
    host.hidden = false;
    var html = '<button type="button" class="chip' + (!state.kind ? ' is-on' : '') + '" data-kind="">' +
      esc(t('pd.allTypes', 'All types')) + '</button>';
    cat.kinds.forEach(function (k) {
      var n = ALL.filter(function (p) { return p.cat === cat.id && p.kindKey === k.key; }).length;
      if (!n) return;
      html += '<button type="button" class="chip' + (state.kind === k.key ? ' is-on' : '') + '" data-kind="' + esc(k.key) + '">' +
        esc(k.name) + '<i>' + n + '</i></button>';
    });
    host.innerHTML = html;
  }

  function renderFilters(scope) {
    var host = $('[data-filterbar]');
    if (!host) return;
    var defs = filterDefs();
    if (!defs.length) { host.innerHTML = ''; host.hidden = true; return; }
    var vals = optionValues(defs, scope);
    var html = '';
    defs.forEach(function (d) {
      var opts = vals[d.key] || [];
      if (opts.length < 2) return; // a filter with one value is useless
      var sel = state.filters[d.key] || [];
      html += '<details class="fgroup' + (sel.length ? ' is-on' : '') + '">' +
        '<summary>' + esc(d.name) + (sel.length ? '<i>' + sel.length + '</i>' : '') + '</summary>' +
        '<div class="fopts">' +
        opts.map(function (o) {
          var on = sel.indexOf(o.v) >= 0;
          return '<label class="fopt' + (on ? ' is-on' : '') + '"><input type="checkbox" data-fkey="' + esc(d.key) +
            '" value="' + esc(o.v) + '"' + (on ? ' checked' : '') + '><span>' + esc(o.v) + '</span><em>' + o.n + '</em></label>';
        }).join('') +
        '</div></details>';
    });
    var active = Object.keys(state.filters).filter(function (k) { return state.filters[k] && state.filters[k].length; });
    if (active.length) {
      html = '<button type="button" class="fclear" data-clear>' + esc(t('pd.clear', 'Clear all')) + ' (' + active.length + ')</button>' + html;
    }
    host.hidden = false;
    host.innerHTML = html;
  }

  function renderRows(list) {
    var body = $('[data-rows]');
    if (!body) return;

    var cnt = $('[data-count-el]');
    if (cnt) cnt.textContent = list.length;

    if (!list.length) {
      body.innerHTML = '';
      var empty = $('[data-empty]');
      if (empty) empty.hidden = false;
      renderPager(0, 0, 0);
      return;
    }
    var emptyEl = $('[data-empty]');
    if (emptyEl) emptyEl.hidden = true;

    /* --- pagination --- */
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    if (state.page < 1) state.page = 1;
    var start = (state.page - 1) * PAGE_SIZE;
    var pageList = list.slice(start, start + PAGE_SIZE);

    body.innerHTML = pageList.map(function (p) {
      var cat = CATS.find(function (c) { return c.id === p.cat; });
      return '<tr data-cat="' + esc(p.cat) + '">' +
        '<td><div class="pncell">' +
          '<button type="button" class="pthumb" data-zoom="' + esc(art(p)) + '" data-zoom-alt="' + esc(p.model) + '" aria-label="Enlarge ' + esc(p.model) + '">' +
            '<img src="' + esc(art(p)) + '" alt="" width="40" height="40" loading="lazy" decoding="async"></button>' +
          '<a class="pnlink" href="product.html?id=' + encodeURIComponent(p.model) + '">' + esc(p.model) + '</a>' +
        '</div></td>' +
        '<td><span class="pill">' + esc(cat ? catLabel(cat) : p.catName) + '</span>' +
          (p.kind ? '<div class="psub">' + esc(p.kind) + '</div>' : '') + '</td>' +
        '<td class="pkey">' + esc(p.key || '—') + '</td>' +
        '<td>' + esc(p.pkg || '—') + '</td>' +
        '<td>' + statusBadge(p.status) + '</td>' +
        '<td>' + (p.ds
          ? '<a class="dl" href="' + esc(p.ds) + '" target="_blank" rel="noopener"><span data-i18n="common.datasheet">Datasheet</span></a>'
          : '<span class="pmuted">—</span>') + '</td>' +
        '</tr>';
    }).join('');

    renderPager(list.length, pages, start);
  }

  function renderPager(total, pages, start) {
    var host = $('[data-pager]');
    if (!host) return;
    if (pages <= 1) { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;

    var cur = state.page;
    var btns = '';
    for (var p = 1; p <= pages; p++) {
      if (p === 1 || p === pages || Math.abs(p - cur) <= 1) {
        btns += '<button type="button" class="pager__b' + (p === cur ? ' is-on' : '') + '" data-page="' + p + '">' + p + '</button>';
      } else if (Math.abs(p - cur) === 2) {
        btns += '<span class="pager__gap">…</span>';
      }
    }

    var shown = Math.min(PAGE_SIZE, total - start);
    host.innerHTML =
      '<div class="pager__info">' +
        '<b>' + (start + 1) + '–' + (start + shown) + '</b> / ' + total +
        ' <span>' + esc(t('pd.pagenote', 'part numbers')) + '</span>' +
      '</div>' +
      '<div class="pager__ctl">' +
        '<button type="button" class="pager__b pager__b--nav" data-page="' + (cur - 1) + '"' + (cur === 1 ? ' disabled' : '') + '>‹</button>' +
        btns +
        '<button type="button" class="pager__b pager__b--nav" data-page="' + (cur + 1) + '"' + (cur === pages ? ' disabled' : '') + '>›</button>' +
      '</div>';
  }

  function syncUrl() {
    var u = new URLSearchParams();
    if (state.cat !== 'all') u.set('cat', state.cat);
    if (state.kind) u.set('kind', state.kind);
    if (state.q) u.set('q', state.q);
    if (state.page > 1) u.set('page', state.page);
    var s = u.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  function renderCatCards() {
    var host = $('[data-cat-cards]');
    if (!host) return;
    host.innerHTML = CATS.map(function (c) {
      var n = ALL.filter(function (p) { return p.cat === c.id; }).length;
      if (!n) return '';
      var kinds = c.kinds.filter(function (k) {
        return ALL.some(function (p) { return p.cat === c.id && p.kindKey === k.key; });
      });
      var art = (ALL.find(function (p) { return p.cat === c.id; }) || {}).img || 'img/art-chip.svg';
      return '<a class="catcard" href="products.html?cat=' + encodeURIComponent(c.id) + '">' +
        '<div class="catcard__fig"><img src="' + esc(art) + '" alt="" loading="lazy"></div>' +
        '<div class="catcard__body">' +
          '<b>' + esc(catLabel(c)) + '</b>' +
          '<span class="catcard__meta">' + kinds.length + ' ' + esc(t('pd.subtypes', 'sub-types')) + ' · ' + n + ' ' + esc(t('pd.parts', 'part numbers')) + '</span>' +
        '</div></a>';
    }).join('');
  }

  function render() {
    if (!booted) return;
    renderTabs();
    renderKinds();
    var scope = scopeProducts();
    renderFilters(scope);
    var list = scope.filter(matchFilters);
    renderRows(list);
    renderCatCards();
    syncUrl();
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var pg = e.target.closest ? e.target.closest('[data-page]') : null;
    if (pg) {
      var n = parseInt(pg.getAttribute('data-page'), 10);
      if (!isNaN(n) && n !== state.page) {
        state.page = n;
        render();
        var tb = document.querySelector('.ptable');
        if (tb) tb.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    var el = e.target.closest ? e.target.closest('[data-cat],[data-kind],[data-clear]') : null;
    if (el) {
      if (el.hasAttribute('data-cat')) { state.cat = el.getAttribute('data-cat'); state.kind = ''; state.filters = {}; state.page = 1; }
      else if (el.hasAttribute('data-kind')) { state.kind = el.getAttribute('data-kind'); state.filters = {}; state.page = 1; }
      else if (el.hasAttribute('data-clear')) { state.filters = {}; state.page = 1; }
      render();
      var top = document.querySelector('[data-cat-tabs]');
      if (top && el.hasAttribute('data-cat')) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  });

  document.addEventListener('change', function (e) {
    var cb = e.target;
    if (!cb.matches || !cb.matches('input[data-fkey]')) return;
    var key = cb.getAttribute('data-fkey'), val = cb.value;
    state.filters[key] = state.filters[key] || [];
    var i = state.filters[key].indexOf(val);
    if (cb.checked && i < 0) state.filters[key].push(val);
    if (!cb.checked && i >= 0) state.filters[key].splice(i, 1);
    if (!state.filters[key].length) delete state.filters[key];
    state.page = 1;
    render();
  });

  var timer = null;
  document.addEventListener('input', function (e) {
    if (!e.target.matches || !e.target.matches('[data-q]')) return;
    clearTimeout(timer);
    var v = e.target.value;
    timer = setTimeout(function () { state.q = v.trim(); state.page = 1; render(); }, 180);
  });

  /* ---------- boot ---------- */
  function boot() {
    var S = window.KRD_STORE;
    if (S && S.products && S.products.sync) {
      try {
        var live = S.products.sync();
        if (live && live.length) ALL = live;
      } catch (e) {}
    }
    if (!ALL.length) return;
    var u = new URLSearchParams(location.search);
    if (u.get('cat')) state.cat = u.get('cat');
    if (u.get('kind')) state.kind = u.get('kind');
    if (u.get('q')) { state.q = u.get('q'); var inp = $('[data-q]'); if (inp) inp.value = state.q; }
    if (u.get('page')) { var pn = parseInt(u.get('page'), 10); if (pn > 0) state.page = pn; }
    booted = true;
    render();
    document.addEventListener('krd:lang', render);
    if (S && S.isApi && S.isApi()) {
      S.products.list().then(function (rows) {
        if (rows && rows.length) { ALL = rows; render(); }
      }).catch(function () {});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
