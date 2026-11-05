/* ============================================================
 *  KRODOSEN · product detail page renderer
 *  读取 ?id=<partNumber>，从 products-data.js 取数渲染。
 *  依赖：i18n.js (window.KRD_I18N) + products-data.js (window.KRD_PRODUCTS)
 *  不依赖任何构建工具，纯原生 JS。
 * ============================================================ */
(function () {
  'use strict';

  var DICT = window.KRD_I18N || {};
  var LIST = window.KRD_PRODUCTS || [];

  /* merge products managed in the admin console (local mode) */
  try {
    if (window.KRD_STORE && window.KRD_STORE.products && window.KRD_STORE.products.sync) {
      var live = window.KRD_STORE.products.sync();
      if (live && live.length) LIST = live;
    }
  } catch (e) {}

  /* ---------------- helpers ---------------- */
  function currentLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'zh-Hant') return q;
    try {
      var s = localStorage.getItem('krd_lang');
      if (s === 'en' || s === 'zh-Hant') return s;
    } catch (e) {}
    return 'en';
  }

  // 取翻译；缺词回退英文，再回退给定默认值
  function t(key, fallback) {
    var cur = DICT[currentLang()] || {};
    if (cur[key] != null && cur[key] !== '') return cur[key];
    var en = DICT.en || {};
    if (en[key] != null && en[key] !== '') return en[key];
    return fallback != null ? fallback : key;
  }

  function el(sel, root) { return (root || document).querySelector(sel); }
  function els(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function setText(sel, txt) { els(sel).forEach(function (n) { n.textContent = txt; }); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------------- resolve product ---------------- */
  var qid = (new URLSearchParams(location.search).get('id') || '').trim();
  var product = null;
  if (qid) {
    for (var i = 0; i < LIST.length; i++) {
      if (LIST[i].id.toLowerCase() === qid.toLowerCase()) { product = LIST[i]; break; }
    }
  }

  var mainEl = el('[data-pd-main]');
  var notFoundEl = el('[data-pd-404]');

  if (!product) {
    if (mainEl) mainEl.hidden = true;
    if (notFoundEl) notFoundEl.hidden = false;
    function nfTitle() { document.title = t('pdp.notfound', 'Part number not found') + ' — KRODOSEN'; }
    nfTitle();
    document.addEventListener('krd:lang', nfTitle);
    return;
  }

  /* ---------------- share networks ---------------- */
  var ICONS = {
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.29-.04-1.28-.12-2.43-.12-2.4 0-4.05 1.47-4.05 4.16v2.25H7.5V13h2.72v8z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.53 3H21l-7.19 8.21L21.9 21h-6.1l-4.3-5.62L6.4 21H3l7.6-8.68L2.4 3h6.2l3.96 5.24zm-1.2 16.1h1.86L7.6 4.8H5.6z"/></svg>',
    li: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 8.5H3.6V21h3.34zM5.27 3a1.94 1.94 0 1 0 0 3.88A1.94 1.94 0 0 0 5.27 3M21 21h-3.33v-6.53c0-1.64-.6-2.5-1.8-2.5-1.15 0-1.87.79-1.87 2.5V21H10.7V8.5H14v1.76a3.9 3.9 0 0 1 3.3-1.94c2.3 0 3.7 1.5 3.7 4.5z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.87.5 3.62 1.44 5.13L2 22l5.2-1.6a9.9 9.9 0 0 0 4.84 1.25h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.48 2 12.04 2m0 17.94a8.2 8.2 0 0 1-4.16-1.13l-.3-.18-3.08.95.96-3.02-.19-.31a8.1 8.1 0 0 1-1.25-4.4 8.2 8.2 0 0 1 8.2-8.19c2.19 0 4.24.86 5.79 2.4a8.1 8.1 0 0 1 2.4 5.8 8.2 8.2 0 0 1-8.2 8.19m4.5-6.13c-.25-.13-1.46-.72-1.69-.8-.23-.09-.4-.13-.56.12-.17.25-.65.8-.8.96-.14.17-.29.19-.54.06a6.7 6.7 0 0 1-1.96-1.21 7.4 7.4 0 0 1-1.36-1.69c-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.44.12-.14.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.83-.2-.49-.4-.42-.56-.43h-.48c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2 0 1.19.86 2.33.98 2.49.12.17 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.5.58.19 1.1.16 1.52.1.46-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.17-.47-.3"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9.6 14.4a4 4 0 0 0 5.66 0l2.83-2.83a4 4 0 0 0-5.66-5.66l-1.1 1.1"/><path d="M14.4 9.6a4 4 0 0 0-5.66 0L5.9 12.43a4 4 0 1 0 5.66 5.66l1.1-1.1"/></svg>'
  };

  function pageUrl() {
    return location.origin + location.pathname + '?id=' + encodeURIComponent(product.id);
  }

  function shareList() {
    var u = encodeURIComponent(pageUrl());
    var txt = encodeURIComponent(product.id + ' — ' + product.key + ' | KRODOSEN');
    return [
      { k: 'fb', label: 'Facebook', href: 'https://www.facebook.com/sharer/sharer.php?u=' + u },
      { k: 'x', label: 'X', href: 'https://twitter.com/intent/tweet?url=' + u + '&text=' + txt },
      { k: 'li', label: 'LinkedIn', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + u },
      { k: 'wa', label: 'WhatsApp', href: 'https://wa.me/?text=' + txt + '%20' + u },
      { k: 'mail', label: t('pdp.share.mail', 'Email'), href: 'mailto:klein@krodosen.com?subject=' + encodeURIComponent(product.id + ' — datasheet request') + '&body=' + txt + '%0A' + u },
      { k: 'link', label: t('pdp.share.copy', 'Copy link'), copy: true }
    ];
  }

  /* ---------------- render ---------------- */
  function render() {
    var lang = currentLang();
    var catKey = product.cat;

    /* page header */
    setText('[data-pd-pn]', product.id);
    setText('[data-pd-key]', product.key);
    setText('[data-pd-pkg]', product.pkg);
    setText('[data-pd-tagcat]', product.pill);
    setText('[data-pd-tagstatus]', product.status === 'stock' ? t('pd.stock', 'In stock') : t('pd.build', 'Build to order'));

    var stTag = el('[data-pd-tagstatus]');
    if (stTag) {
      stTag.className = 'pill' + (product.status === 'stock' ? ' pill--ok' : '');
    }
    setText('[data-pd-status]', product.status === 'stock' ? t('pd.stock', 'In stock') : t('pd.build', 'Build to order'));

    /* description / blurb */
    var blurb = el('[data-pd-blurb]');
    if (blurb) {
      blurb.textContent = t('pdp.blurb.' + catKey, '') || (product.key + ' · ' + product.pkg);
    }

    /* main figure */
    var fig = el('.pdp__fig');
    if (fig) {
      fig.setAttribute('data-zoom', product.img);
      fig.setAttribute('data-zoom-alt', product.id);
      var figImg = el('img', fig);
      if (figImg) {
        figImg.src = product.img;
        figImg.alt = product.id + ' — ' + product.pill + ' ' + product.pkg;
        figImg.width = 400; figImg.height = 400;
      }
    }

    /* datasheet */
    var dsName = product.id + '.pdf';
    setText('[data-pd-dsname]', dsName);
    var dl = el('[data-pd-download]');
    if (dl) { dl.href = product.ds; dl.setAttribute('download', dsName); }
    var pv = el('[data-ds-preview]');
    if (pv) { pv.setAttribute('data-ds', product.ds); pv.setAttribute('data-ds-name', dsName); }

    /* share bar */
    var shareWrap = el('[data-pd-share]');
    if (shareWrap) {
      shareWrap.innerHTML = shareList().map(function (s) {
        if (s.copy) {
          return '<button type="button" class="sharebtn" data-share-copy data-copied-label="' + esc(t('pdp.share.copied', 'Copied')) + '">' +
            ICONS[s.k] + '<span>' + esc(s.label) + '</span></button>';
        }
        return '<a class="sharebtn" href="' + s.href + '" target="_blank" rel="noopener noreferrer">' +
          ICONS[s.k] + '<span>' + esc(s.label) + '</span></a>';
      }).join('');
    }

    /* specifications */
    var specBody = el('[data-pd-specs]');
    if (specBody) {
      specBody.innerHTML = (product.specs || []).map(function (row) {
        return '<tr><th>' + esc(t('sp.' + row[0], row[0])) + '</th><td>' + esc(row[1]) + '</td></tr>';
      }).join('');
    }

    /* features + applications（按类别，1–4 条） */
    var featUl = el('[data-pd-features]');
    if (featUl) {
      var feats = [];
      for (var n = 1; n <= 4; n++) {
        var k = 'kf.' + catKey + '.' + n;
        if (DICT[lang] && DICT[lang][k] != null) feats.push(DICT[lang][k]);
        else if (DICT.en && DICT.en[k] != null) feats.push(DICT.en[k]);
      }
      featUl.innerHTML = feats.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
    }

    var appUl = el('[data-pd-apps]');
    if (appUl) {
      var apps = [];
      for (var m = 1; m <= 4; m++) {
        var ak = 'ka.' + catKey + '.' + m;
        if (DICT[lang] && DICT[lang][ak] != null) apps.push(DICT[lang][ak]);
        else if (DICT.en && DICT.en[ak] != null) apps.push(DICT.en[ak]);
      }
      appUl.innerHTML = apps.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('');
    }

    /* related part numbers（同类别，最多 3 个） */
    var relWrap = el('[data-pd-related]');
    if (relWrap) {
      var rel = LIST.filter(function (x) { return x.cat === product.cat && x.id !== product.id; }).slice(0, 3);
      relWrap.innerHTML = rel.map(function (r) {
        return '<a class="relcard" href="product.html?id=' + encodeURIComponent(r.id) + '">' +
          '<img src="' + esc(r.img) + '" alt="" width="52" height="52" loading="lazy">' +
          '<div class="relcard__body"><div class="relcard__pn">' + esc(r.id) + '</div>' +
          '<div class="relcard__key">' + esc(r.key) + '</div></div></a>';
      }).join('');
    }

    /* SEO */
    document.title = product.id + ' · ' + product.pill + ' ' + product.pkg + ' — KRODOSEN';
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', product.id + ' ' + product.key + '. ' + product.pkg + ' package. Datasheet, specifications and applications from KRODOSEN.');
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.setAttribute('href', pageUrl());
  }

  render();

  /* 云端模式下用最新数据刷新（后台改过的产品） */
  try {
    var ST = window.KRD_STORE;
    if (ST && ST.isApi && ST.isApi()) {
      ST.products.list().then(function (rows) {
        var live = (rows || []).filter(function (x) { return x.id.toLowerCase() === product.id.toLowerCase(); })[0];
        if (live) { LIST = rows; product = live; render(); }
      }).catch(function () {});
    }
  } catch (e) {}

  /* 语言切换后重渲染（app.js 会派发 krd:lang） */
  document.addEventListener('krd:lang', render);

  /* ---------------- copy link ---------------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-share-copy]') : null;
    if (!btn) return;
    e.preventDefault();
    var url = pageUrl();
    function done() {
      var span = btn.querySelector('span');
      var old = span ? span.textContent : '';
      btn.classList.add('is-done');
      if (span) span.textContent = btn.getAttribute('data-copied-label') || 'Copied';
      setTimeout(function () {
        btn.classList.remove('is-done');
        if (span) span.textContent = old;
      }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () { window.prompt('Copy link:', url); });
    } else {
      window.prompt('Copy link:', url);
    }
  });

  /* ---------------- datasheet preview modal ---------------- */
  function ensureDsModal() {
    var m = el('#dsModal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'dsModal';
    m.className = 'dsmodal';
    m.innerHTML =
      '<div class="dsmodal__in">' +
        '<div class="dsmodal__hd">' +
          '<div class="dsmodal__t"></div>' +
          '<button type="button" class="dsmodal__x" aria-label="Close">&times;</button>' +
        '</div>' +
        '<iframe title="Datasheet preview" src="about:blank"></iframe>' +
      '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.classList.contains('dsmodal__x')) closeDs();
    });
    return m;
  }
  function openDs(src, name) {
    var m = ensureDsModal();
    var frame = m.querySelector('iframe');
    frame.src = src;
    m.querySelector('.dsmodal__t').textContent = name || t('pdp.ds.previewTitle', 'Datasheet preview');
    m.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeDs() {
    var m = el('#dsModal');
    if (!m) return;
    m.classList.remove('is-open');
    var frame = m.querySelector('iframe');
    if (frame) frame.src = 'about:blank';
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDs();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-ds-preview]') : null;
    if (!b) return;
    e.preventDefault();
    openDs(b.getAttribute('data-ds'), b.getAttribute('data-ds-name'));
  });
})();
