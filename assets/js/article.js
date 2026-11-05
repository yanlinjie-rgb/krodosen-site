/* ============================================================
 *  KRODOSEN · article detail (article.html?id=xxx)
 * ============================================================ */
(function () {
  'use strict';

  var S = window.KRD_STORE;
  var DICT = window.KRD_I18N || {};

  function currentLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q) return q;
      return localStorage.getItem('krd_lang') || 'en';
    } catch (e) { return 'en'; }
  }
  function t(key, fb) {
    var d = DICT[currentLang()] || DICT.en || {};
    return d[key] != null ? d[key] : fb;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    if (String(currentLang()).indexOf('zh') === 0) {
      return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
    }
    var mEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return mEn[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }
  function pick(a, base) {
    var zh = String(currentLang()).indexOf('zh') === 0;
    var v = zh ? a[base + 'Zh'] : a[base + 'En'];
    if (!v) v = a[base + 'En'] || a[base + 'Zh'] || '';
    return v;
  }

  var ID = '';
  try { ID = new URLSearchParams(location.search).get('id') || ''; } catch (e) {}

  var CACHE = null;

  function bodyHtml(text) {
    return String(text || '')
      .split(/\n{2,}/)
      .map(function (block) {
        block = block.trim();
        if (!block) return '';
        if (/^##\s+/.test(block)) return '<h2>' + esc(block.replace(/^##\s+/, '')) + '</h2>';
        if (/^###\s+/.test(block)) return '<h3>' + esc(block.replace(/^###\s+/, '')) + '</h3>';
        if (/^[-*]\s+/.test(block)) {
          var items = block.split('\n').map(function (l) {
            return '<li>' + esc(l.replace(/^[-*]\s+/, '')) + '</li>';
          }).join('');
          return '<ul>' + items + '</ul>';
        }
        if (/^>\s+/.test(block)) return '<blockquote>' + esc(block.replace(/^>\s+/, '')) + '</blockquote>';
        return '<p>' + esc(block).replace(/\n/g, '<br>') + '</p>';
      })
      .join('');
  }

  function setAll(sel, txt) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) { el.textContent = txt; });
  }

  function render() {
    var main = document.querySelector('[data-ar-main]');
    var nf = document.querySelector('[data-ar-404]');
    var list = (CACHE || []).filter(function (a) { return a.published; });
    var a = list.filter(function (x) { return x.id === ID; })[0] || null;

    if (!a) {
      if (main) main.hidden = true;
      if (nf) nf.hidden = false;
      setAll('[data-ar-title]', t('ar.notfound', 'Article not found'));
      setAll('[data-ar-excerpt]', '');
      document.title = t('ar.notfound', 'Article not found') + ' — KRODOSEN';
      return;
    }

    if (main) main.hidden = false;
    if (nf) nf.hidden = true;

    var title = pick(a, 'title');
    var cat = t('nd.cat.' + (a.category || 'Company'), a.category || 'Company');

    setAll('[data-ar-title]', title);
    setAll('[data-ar-excerpt]', pick(a, 'excerpt'));
    setAll('[data-ar-cat]', cat);
    setAll('[data-ar-cat2]', cat);
    setAll('[data-ar-date]', fmt(a.publishedAt || a.created));

    var body = document.querySelector('[data-ar-body]');
    if (body) body.innerHTML = bodyHtml(pick(a, 'body'));

    document.title = title + ' — KRODOSEN';
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', pick(a, 'excerpt') || title);
  }

  function load() {
    if (!S || !S.articles) { render(); return; }
    S.articles.list().then(function (rows) {
      CACHE = rows || [];
      render();
    }).catch(function () { render(); });
  }

  document.addEventListener('krd:lang', render);
  load();
})();
