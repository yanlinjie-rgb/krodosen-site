/* ============================================================
 *  KRODOSEN · data layer (products / page content / inquiries)
 *  Local mode  : localStorage, zero setup, works offline.
 *  Cloud mode  : Supabase REST (anon key), enabled by cms-config.js.
 *  Public API  : window.KRD_STORE
 * ============================================================ */
(function () {
  'use strict';

  var CFG = window.KRD_CMS || {};
  var CLOUD = CFG.mode === 'cloud' && CFG.supabaseUrl && CFG.supabaseKey;
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
  function uid() {
    return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function rest(path, opts) {
    opts = opts || {};
    var url = CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/' + path;
    return fetch(url, {
      method: opts.method || 'GET',
      headers: Object.assign({
        'apikey': CFG.supabaseKey,
        'Authorization': 'Bearer ' + CFG.supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': opts.prefer || 'return=representation'
      }, opts.headers || {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(r.status + ' ' + t.slice(0, 160)); });
      var ct = r.headers.get('content-type') || '';
      return ct.indexOf('json') > -1 ? r.json() : null;
    });
  }

  /* ---------------- products ---------------- */
  function seedProducts() {
    var existing = lsGet(K_PRODUCTS, null);
    if (existing) return existing;
    var base = (window.KRD_PRODUCTS || []).map(function (p) {
      return {
        id: p.id,
        model: p.model || p.id,
        cat: p.cat,
        kindKey: p.kindKey || '',
        kind: p.kind || '',
        pkg: p.pkg || '',
        price: p.price || '',
        status: p.status || 'stock',
        key: p.key || '',
        specs: p.specs || [],
        specRaw: p.specRaw || {},
        img: p.img || '',
        ds: p.ds || '',
        remarks: '',
        updated: ''
      };
    });
    lsSet(K_PRODUCTS, base);
    return base;
  }

  var Products = {
    list: function () {
      if (CLOUD) {
        return rest('products?select=*&order=model.asc').then(function (rows) {
          return (rows || []).map(fromRow);
        });
      }
      return Promise.resolve(seedProducts());
    },
    save: function (p) {
      p.updated = new Date().toISOString();
      if (CLOUD) {
        var row = toRow(p);
        var exists = !!p._cloudId;
        var path = exists ? 'products?id=eq.' + encodeURIComponent(p._cloudId) : 'products';
        return rest(path, { method: exists ? 'PATCH' : 'POST', body: exists ? row : [row] })
          .then(function () { return p; });
      }
      var all = seedProducts();
      var i = all.findIndex(function (x) { return x.id === p.id; });
      if (i >= 0) all[i] = p; else all.unshift(p);
      lsSet(K_PRODUCTS, all);
      return Promise.resolve(p);
    },
    remove: function (id) {
      if (CLOUD) return rest('products?model=eq.' + encodeURIComponent(id), { method: 'DELETE' });
      var all = seedProducts().filter(function (x) { return x.id !== id; });
      lsSet(K_PRODUCTS, all);
      return Promise.resolve(true);
    },
    /* synchronous read (local mode only) — lets detail pages resolve instantly */
    /* read-only: never seeds, so public visitors are not polluted */
    sync: function () {
      if (CLOUD) return null;
      return lsGet(K_PRODUCTS, null) || (window.KRD_PRODUCTS || []);
    },
    reset: function () {
      localStorage.removeItem(K_PRODUCTS);
      return Promise.resolve(seedProducts());
    }
  };

  // cloud row <-> local object（字段与 supabase-krodosen.sql 对齐）
  function toRow(p) {
    return {
      model: p.model, category: p.cat, kind: p.kindKey, kind_name: p.kind,
      package: p.pkg, price: p.price, status: p.status, key_spec: p.key,
      specs: p.specs, spec_data: p.specRaw, image_url: p.img,
      datasheet_url: p.ds, remarks: p.remarks || ''
    };
  }
  function fromRow(r) {
    return {
      _cloudId: r.id, id: r.model, model: r.model, cat: r.category, kindKey: r.kind,
      kind: r.kind_name || r.kind || '', pkg: r.package || '', price: r.price || '',
      status: r.status || 'stock', key: r.key_spec || '', specs: r.specs || [],
      specRaw: r.spec_data || {}, img: r.image_url || '', ds: r.datasheet_url || '',
      remarks: r.remarks || '', updated: r.updated_at || ''
    };
  }

  /* ---------------- page content (装修) ---------------- */
  var Content = {
    all: function () {
      if (CLOUD) {
        return rest('site_content?select=*').then(function (rows) {
          var out = {};
          (rows || []).forEach(function (r) { out[r.key] = r; });
          return out;
        });
      }
      return Promise.resolve(lsGet(K_CONTENT, {})); // { key: {en, zhHant} }
    },
    set: function (key, lang, value) {
      if (CLOUD) {
        return Content.all().then(function (all) {
          var row = all[key] || { key: key, value_en: '', value_zh: '' };
          if (lang === 'zh-Hant') row.value_zh = value; else row.value_en = value;
          return rest('site_content', {
            method: 'POST',
            prefer: 'resolution=merge-duplicates,return=representation',
            body: [{ key: key, value_en: row.value_en || '', value_zh: row.value_zh || '' }]
          });
        });
      }
      var all = lsGet(K_CONTENT, {});
      all[key] = all[key] || { en: '', zhHant: '' };
      if (lang === 'zh-Hant') all[key].zhHant = value; else all[key].en = value;
      lsSet(K_CONTENT, all);
      return Promise.resolve(true);
    },
    reset: function (key) {
      if (CLOUD) return rest('site_content?key=eq.' + encodeURIComponent(key), { method: 'DELETE' });
      var all = lsGet(K_CONTENT, {});
      delete all[key];
      lsSet(K_CONTENT, all);
      return Promise.resolve(true);
    }
  };

  /* ---------------- inquiries ---------------- */
  var Inquiries = {
    list: function () {
      if (CLOUD) {
        return rest('inquiries?select=*&order=created_at.desc').then(function (rows) {
          return (rows || []).map(function (r) {
            return {
              id: r.id, name: r.name, company: r.company || '', email: r.email,
              phone: r.phone || '', subject: r.subject || '', message: r.message || '',
              lang: r.lang || '', createdAt: r.created_at, read: !!r.is_read, from: 'cloud'
            };
          });
        });
      }
      return Promise.resolve(lsGet(K_INQ, []));
    },
    add: function (data) {
      var rec = {
        id: uid(), name: data.name || '', company: data.company || '',
        email: data.email || '', phone: data.phone || '',
        subject: data.subject || '', message: data.message || '',
        lang: data.lang || 'en', createdAt: new Date().toISOString(), read: false, from: 'local'
      };
      if (CLOUD) {
        return rest('inquiries', {
          method: 'POST',
          prefer: 'return=representation',
          body: [{
            name: rec.name, company: rec.company, email: rec.email, phone: rec.phone,
            subject: rec.subject, message: rec.message, lang: rec.lang
          }]
        }).then(function () { return rec; });
      }
      var all = lsGet(K_INQ, []);
      all.unshift(rec);
      lsSet(K_INQ, all);
      return Promise.resolve(rec);
    },
    markRead: function (id, read) {
      if (CLOUD) return rest('inquiries?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: { is_read: !!read } });
      var all = lsGet(K_INQ, []);
      all.forEach(function (x) { if (x.id === id) x.read = !!read; });
      lsSet(K_INQ, all);
      return Promise.resolve(true);
    },
    remove: function (id) {
      if (CLOUD) return rest('inquiries?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
      var all = lsGet(K_INQ, []).filter(function (x) { return x.id !== id; });
      lsSet(K_INQ, all);
      return Promise.resolve(true);
    }
  };

  window.KRD_STORE = {
    isCloud: function () { return !!CLOUD; },
    products: Products,
    content: Content,
    inquiries: Inquiries
  };
})();
