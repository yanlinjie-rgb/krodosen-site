/* ============================================================
 *  KRODOSEN · newsroom list (renders articles from the CMS)
 *  有已发布文章 → 用文章列表替换静态示例；没有则保留静态内容
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
    var mEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (String(currentLang()).indexOf('zh') === 0) {
      return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
    }
    return mEn[d.getMonth()] + ' ' + (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + ', ' + d.getFullYear();
  }
  function pick(a, base) {
    var zh = String(currentLang()).indexOf('zh') === 0;
    var v = zh ? a[base + 'Zh'] : a[base + 'En'];
    if (!v) v = a[base + 'En'] || a[base + 'Zh'] || '';
    return v;
  }

  var CACHE = null;

  function render() {
    var host = document.querySelector('[data-news]');
    var staticList = document.querySelector('[data-news-static]');
    if (!host) return;

    var list = (CACHE || []).filter(function (a) { return a.published; });
    if (!list.length) {
      host.hidden = true;
      host.innerHTML = '';
      if (staticList) staticList.hidden = false;
      return;
    }

    if (staticList) staticList.hidden = true;
    host.hidden = false;
    host.innerHTML = list.map(function (a) {
      var cat = t('nd.cat.' + (a.category || 'Company'), a.category || 'Company');
      return '<a class="newsrow" href="article.html?id=' + encodeURIComponent(a.id) + '">' +
        '<time>' + esc(fmt(a.publishedAt || a.created)) + '</time>' +
        '<span class="cat">' + esc(cat) + '</span>' +
        '<div>' +
          '<h4>' + esc(pick(a, 'title')) + '</h4>' +
          '<p>' + esc(pick(a, 'excerpt')) + '</p>' +
        '</div>' +
        '<span class="arrow"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 8h11M9 4l4 4-4 4"/></svg></span>' +
      '</a>';
    }).join('');
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
