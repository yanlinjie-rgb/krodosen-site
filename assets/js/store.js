/* ============================================================
 *  KRODOSEN · data layer (products / page content / inquiries)
 *  mode = 'local' → localStorage（零配置，仅本浏览器）
 *  mode = 'api'   → Cloudflare Worker + D1（跨设备共享，正式模式）
 *  Public API: window.KRD_STORE
 * ============================================================ */
(function () {
  'use strict';

  var CFG = window.KRD_CMS || {};
  var MODE = CFG.mode || 'local';
  var API = MODE === 'api' && CFG.apiBase ? CFG.apiBase.replace(/\/$/, '') : null;
  var CLOUD = !!API;

  var K_PRODUCTS = 'krd_products';
  var K_CONTENT = 'krd_content';
  var K_INQ = 'krd_inquiries';

  /* ---------------- helpers ---------------- */
  function lsGet(k, d) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { console.warn('localStorage full', e); return false; }
  }
  function uid() { return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function token() {
    try { return sessionStorage.getItem('krd_api_token') || ''; } catch (e) { return ''; }
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = { 'Accept': 'application/json' };
    if (opts.body) headers['Content-Type'] = 'application/json';
    if (opts.auth && token()) headers['Authorization'] = 'Bearer ' + token();
    return fetch(API + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
        return j;
      });
    });
  }

  /* ---------------- products ---------------- */
  function seedProducts() {
    var existing = lsGet(K_PRODUCTS, null);
    if (existing) return existing;
    var base = (window.KRD_PRODUCTS || []).map(function (p) {
      return {
        id: p.id, model: p.model || p.id, cat: p.cat, kindKey: p.kindKey || '',
        kind: p.kind || '', pkg: p.pkg || '', price: p.price || '', status: p.status || 'stock',
        key: p.key || '', specs: p.specs || [], specRaw: p.specRaw || {},
        img: p.img || '', ds: p.ds || '', remarks: '', updated: ''
      };
    });
    lsSet(K_PRODUCTS, base);
    return base;
  }

  var Products = {
    list: function () {
      if (CLOUD) return api('/api/products').then(function (j) { return j.products || []; });
      return Promise.resolve(seedProducts());
    },
    save: function (p) {
      p.updated = new Date().toISOString();
      p.id = p.model;
      if (CLOUD) return api('/api/products', { method: 'POST', body: p, auth: true }).then(function () { return p; });
      var all = seedProducts();
      var i = all.findIndex(function (x) { return x.id === p.id; });
      if (i >= 0) all[i] = p; else all.unshift(p);
      lsSet(K_PRODUCTS, all);
      return Promise.resolve(p);
    },
    remove: function (id) {
      if (CLOUD) return api('/api/products/' + encodeURIComponent(id), { method: 'DELETE', auth: true });
      var all = seedProducts().filter(function (x) { return x.id !== id; });
      lsSet(K_PRODUCTS, all);
      return Promise.resolve(true);
    },
    /* synchronous read (local mode only) — used for first paint on detail pages */
    sync: function () {
      if (CLOUD) return null;
      return lsGet(K_PRODUCTS, null) || (window.KRD_PRODUCTS || []);
    },
    reset: function () {
      if (CLOUD) return Promise.resolve([]);
      localStorage.removeItem(K_PRODUCTS);
      return Promise.resolve(seedProducts());
    }
  };

  /* ---------------- page content ---------------- */
  var Content = {
    all: function () {
      if (CLOUD) return api('/api/content').then(function (j) { return j.content || {}; });
      return Promise.resolve(lsGet(K_CONTENT, {}));
    },
    set: function (key, lang, value) {
      if (CLOUD) return api('/api/content', { method: 'POST', body: { key: key, lang: lang, value: value }, auth: true });
      var all = lsGet(K_CONTENT, {});
      all[key] = all[key] || { en: '', zhHant: '' };
      if (lang === 'zh-Hant') all[key].zhHant = value; else all[key].en = value;
      lsSet(K_CONTENT, all);
      return Promise.resolve(true);
    },
    reset: function (key) {
      if (CLOUD) return api('/api/content?key=' + encodeURIComponent(key), { method: 'DELETE', auth: true });
      var all = lsGet(K_CONTENT, {});
      delete all[key];
      lsSet(K_CONTENT, all);
      return Promise.resolve(true);
    }
  };

  /* ---------------- inquiries ---------------- */
  var Inquiries = {
    list: function () {
      if (CLOUD) return api('/api/inquiries', { auth: true }).then(function (j) { return j.inquiries || []; });
      return Promise.resolve(lsGet(K_INQ, []));
    },
    add: function (data) {
      var rec = {
        id: uid(), name: data.name || '', company: data.company || '', email: data.email || '',
        phone: data.phone || '', subject: data.subject || '', message: data.message || '',
        lang: data.lang || 'en', createdAt: new Date().toISOString(), read: false, from: 'local'
      };
      if (CLOUD) return api('/api/inquiries', { method: 'POST', body: rec }).then(function () { return rec; });
      var all = lsGet(K_INQ, []);
      all.unshift(rec);
      lsSet(K_INQ, all);
      return Promise.resolve(rec);
    },
    markRead: function (id, read) {
      if (CLOUD) return api('/api/inquiries/' + encodeURIComponent(id), { method: 'PATCH', body: { read: !!read }, auth: true });
      var all = lsGet(K_INQ, []);
      all.forEach(function (x) { if (x.id === id) x.read = !!read; });
      lsSet(K_INQ, all);
      return Promise.resolve(true);
    },
    remove: function (id) {
      if (CLOUD) return api('/api/inquiries/' + encodeURIComponent(id), { method: 'DELETE', auth: true });
      var all = lsGet(K_INQ, []).filter(function (x) { return x.id !== id; });
      lsSet(K_INQ, all);
      return Promise.resolve(true);
    }
  };

  /* ---------------- auth (api mode) ---------------- */
  function login(pw) {
    if (!CLOUD) return Promise.resolve(String(pw) === String(CFG.adminPassword || 'krodosen2026'));
    return api('/api/login', { method: 'POST', body: { password: String(pw) } })
      .then(function (j) {
        try { sessionStorage.setItem('krd_api_token', j.token); } catch (e) {}
        return true;
      })
      .catch(function () { return false; });
  }
  function logout() { try { sessionStorage.removeItem('krd_api_token'); } catch (e) {} }
  function hasSession() {
    if (!CLOUD) return true;
    return !!token();
  }

  window.KRD_STORE = {
    isCloud: function () { return CLOUD; },
    isApi: function () { return !!API; },
    mode: MODE,
    products: Products,
    content: Content,
    inquiries: Inquiries,
    login: login,
    logout: logout,
    hasSession: hasSession
  };
})();
