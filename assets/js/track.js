/* ============================================================
 *  KRODOSEN · 访问统计采集
 *  每个公开页面加载时上报一次：页面路径 / 标题 / 来源 / 访客标识
 *  只上报，不影响页面渲染；失败静默。
 * ============================================================ */
(function () {
  'use strict';

  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  var API = 'https://api.krodosen.com/api/hit';

  function vid() {
    try {
      var v = localStorage.getItem('krd_vid');
      if (!v) {
        v = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('krd_vid', v);
      }
      return v;
    } catch (e) { return ''; }
  }

  function lang() {
    try {
      return localStorage.getItem('krd_lang') || document.documentElement.lang || '';
    } catch (e) { return ''; }
  }

  function send() {
    var payload = {
      path: location.pathname + location.search,
      title: (document.title || '').slice(0, 140),
      ref: document.referrer || '',
      vid: vid(),
      lang: lang()
    };
    var body = JSON.stringify(payload);

    /* text/plain 属于「简单请求」，跨域不触发预检，sendBeacon 才可靠 */
    try {
      if (navigator.sendBeacon) {
        if (navigator.sendBeacon(API, new Blob([body], { type: 'text/plain;charset=UTF-8' }))) return;
      }
    } catch (e) {}

    try {
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: body,
        keepalive: true,
        mode: 'cors'
      }).catch(function () {});
    } catch (e) {}
  }

  if (document.readyState === 'complete') setTimeout(send, 0);
  else window.addEventListener('load', send, { once: true });
})();
