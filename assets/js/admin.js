/* ============================================================
 *  KRODOSEN · admin console
 *  产品管理（分页 10/页） · 页面装修（中英双栏） · 询盘消息
 * ============================================================ */
(function () {
  'use strict';

  var CFG = window.KRD_CMS || {};
  var S = window.KRD_STORE;
  var CATS = (window.KRD_CATALOG && window.KRD_CATALOG.categories) || [];
  var PAGE = 10;

  var state = {
    view: 'products',
    products: [], prodQ: '', prodCat: 'all', prodPage: 1,
    editing: null, imgData: '',
    content: {}, inq: [], inqQ: '', inqCur: null
  };

  /* ---------------- utils ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    var p = function (n) { return n < 10 ? '0' + n : n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  var toastTimer = null;
  function guard(err) {
    var msg = String(err && err.message || err);
    if (msg.indexOf('401') > -1 || msg.toLowerCase().indexOf('unauthor') > -1) {
      toast('登录已过期，请重新登录', true);
      if (S && S.logout) S.logout();
      setTimeout(function () { location.reload(); }, 1200);
      return true;
    }
    return false;
  }

  function toast(msg, isErr) {
    var t = $('#toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'toast is-on' + (isErr ? ' is-err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, 2400);
  }

  /* ---------------- auth ---------------- */
  function login(pw) {
    if (S && S.login) return S.login(pw);
    return Promise.resolve(String(pw) === String(CFG.adminPassword || 'krodosen2026'));
  }

  function showApp() {
    $('#loginView').hidden = true;
    $('#shellView').hidden = false;
    bootApp();
  }

  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('#loginForm button[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = '登录中…'; }
    Promise.resolve(login($('#loginPw').value)).then(function (ok) {
      if (btn) { btn.disabled = false; btn.textContent = '登 录'; }
      if (ok) {
        try { sessionStorage.setItem('krd_admin', '1'); } catch (err) {}
        showApp();
      } else {
        var m = $('#loginMsg');
        m.hidden = false;
        m.textContent = '密码不正确，请重试。';
        $('#loginPw').value = '';
        $('#loginPw').focus();
      }
    });
  });

  $('#logoutBtn').addEventListener('click', function () {
    if (S && S.logout) S.logout();
    try { sessionStorage.removeItem('krd_admin'); } catch (e) {}
    location.reload();
  });

  /* ---------------- navigation ---------------- */
  var TITLES = {
    products: ['产品管理', '新增、编辑、删除产品；前台按每页 10 条分页展示。'],
    content: ['页面装修', '直接改写网站上的标题与说明文案，支持英文 / 繁体中文。'],
    inquiries: ['询盘消息', '来自网站联系表单的客户询盘。']
  };

  function switchView(v) {
    state.view = v;
    $$('.side__link').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-view') === v); });
    ['products', 'content', 'inquiries'].forEach(function (k) {
      $('#view-' + k).hidden = k !== v;
    });
    $('#viewTitle').textContent = TITLES[v][0];
    $('#viewSub').textContent = TITLES[v][1];
    if (v === 'products') loadProducts();
    if (v === 'content') loadContent();
    if (v === 'inquiries') loadInquiries();
  }

  $$('.side__link').forEach(function (b) {
    b.addEventListener('click', function () { switchView(b.getAttribute('data-view')); });
  });

  /* ============================================================
   *  PRODUCTS
   * ============================================================ */
  function catOf(id) { return CATS.find(function (c) { return c.id === id; }); }
  function catName(p) {
    var c = catOf(p.cat);
    return c ? c.nameEn : (p.cat || '—');
  }

  function filtered() {
    var q = state.prodQ.toLowerCase();
    return state.products.filter(function (p) {
      if (state.prodCat !== 'all' && p.cat !== state.prodCat) return false;
      if (!q) return true;
      var hay = [p.model, p.cat, p.kind, p.pkg, p.key, JSON.stringify(p.specRaw || {})].join(' ').toLowerCase();
      return hay.indexOf(q) > -1;
    });
  }

  function loadProducts() {
    S.products.list().then(function (rows) {
      state.products = rows || [];
      renderProducts();
      $('#viewSub').textContent = TITLES.products[1] + '　共 ' + state.products.length + ' 条';
      var badge = $('[data-badge-products]');
      if (badge) badge.textContent = state.products.length;
    });
  }

  function renderProducts() {
    var list = filtered();
    var pages = Math.max(1, Math.ceil(list.length / PAGE));
    if (state.prodPage > pages) state.prodPage = pages;
    var start = (state.prodPage - 1) * PAGE;
    var slice = list.slice(start, start + PAGE);

    $('#prodEmpty').hidden = list.length > 0;
    $('#prodRows').innerHTML = slice.map(function (p) {
      var st = p.status === 'build'
        ? '<span class="tag tag--build">按单</span>'
        : '<span class="tag tag--ok">现货</span>';
      return '<tr data-id="' + esc(p.id) + '">' +
        '<td><div class="thumb"><img src="' + esc(p.img || 'img/art-chip.svg') + '" alt="" loading="lazy"></div></td>' +
        '<td><span class="mdl">' + esc(p.model) + '</span></td>' +
        '<td>' + esc(catName(p)) + '<span class="sub">' + esc(p.kind || '—') + '</span></td>' +
        '<td>' + esc(p.pkg || '—') + '</td>' +
        '<td><span class="price">' + (p.price ? esc(p.price) : '—') + '</span></td>' +
        '<td>' + st + '</td>' +
        '<td class="ro">' + fmtDate(p.updated) + '</td>' +
        '<td><div class="acts">' +
          '<button class="btn btn--sm" data-edit="' + esc(p.id) + '">编辑</button>' +
          '<button class="btn btn--sm btn--danger" data-del="' + esc(p.id) + '">删除</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    /* pager */
    var total = list.length;
    var host = $('#prodPager');
    if (pages <= 1) { host.innerHTML = ''; return; }
    var btns = '';
    for (var i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || Math.abs(i - state.prodPage) <= 1)
        btns += '<button class="pager__b' + (i === state.prodPage ? ' is-on' : '') + '" data-page="' + i + '">' + i + '</button>';
      else if (Math.abs(i - state.prodPage) === 2)
        btns += '<span class="pager__gap">…</span>';
    }
    host.innerHTML = '<div class="pager__info"><b>' + (start + 1) + '–' + (start + slice.length) + '</b> / ' + total + ' 条</div>' +
      '<div class="pager__ctl">' +
      '<button class="pager__b" data-page="' + (state.prodPage - 1) + '"' + (state.prodPage === 1 ? ' disabled' : '') + '>‹</button>' +
      btns +
      '<button class="pager__b" data-page="' + (state.prodPage + 1) + '"' + (state.prodPage === pages ? ' disabled' : '') + '>›</button>' +
      '</div>';
  }

  $('#prodSearch').addEventListener('input', function (e) {
    state.prodQ = e.target.value.trim();
    state.prodPage = 1;
    renderProducts();
  });
  $('#prodCat').addEventListener('change', function (e) {
    state.prodCat = e.target.value;
    state.prodPage = 1;
    renderProducts();
  });

  $('#prodPager').addEventListener('click', function (e) {
    var b = e.target.closest('[data-page]');
    if (!b || b.disabled) return;
    state.prodPage = parseInt(b.getAttribute('data-page'), 10);
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('#prodRows').addEventListener('click', function (e) {
    var ed = e.target.closest('[data-edit]');
    var del = e.target.closest('[data-del]');
    if (ed) openProduct(ed.getAttribute('data-edit'));
    if (del) {
      var id = del.getAttribute('data-del');
      if (!confirm('确定删除产品 ' + id + ' ？此操作不可撤销。')) return;
      S.products.remove(id).then(function () {
        toast('已删除 ' + id);
        loadProducts();
      });
    }
  });

  $('#resetProds').addEventListener('click', function () {
    if (!confirm('将清空本地修改，恢复为初始示例数据（147 条）。确定吗？')) return;
    S.products.reset().then(function () {
      toast('已重置为示例数据');
      loadProducts();
    });
  });

  /* ---------- product modal ---------- */
  function fillCatSelect() {
    var opts = CATS.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.nameEn + ' · ' + c.name) + '</option>'; }).join('');
    $('#pCat').innerHTML = opts;
    var sel = '<option value="all">全部分类</option>' + opts;
    $('#prodCat').innerHTML = sel;
  }

  function fillKindSelect(catId, value) {
    var c = catOf(catId);
    var kinds = (c && c.kinds) || [];
    $('#pKind').innerHTML = kinds.map(function (k) {
      return '<option value="' + esc(k.key) + '"' + (k.key === value ? ' selected' : '') + '>' +
        esc(k.key + ' · ' + k.name) + '</option>';
    }).join('') || '<option value="">（该分类无子类型）</option>';
    renderSpecHelp();
  }

  function currentKindDef() {
    var c = catOf($('#pCat').value);
    if (!c) return null;
    return c.kinds.find(function (k) { return k.key === $('#pKind').value; }) || null;
  }

  function renderSpecHelp() {
    var k = currentKindDef();
    var keys = k ? k.filters.map(function (f) { return f.key; }) : [];
    $('#pSpecsHelp').textContent = keys.length
      ? '可用参数键：' + keys.slice(0, 12).join(' / ') + (keys.length > 12 ? ' …' : '')
      : '该子类型没有预置筛选项，可自由填写参数键。';
  }

  function openProduct(id) {
    state.editing = id ? state.products.find(function (p) { return p.id === id; }) : null;
    var p = state.editing;
    $('#prodModalTitle').textContent = p ? '编辑产品 · ' + p.model : '新增产品';
    $('#pModel').value = p ? p.model : '';
    $('#pModel').readOnly = !!p;
    $('#pCat').value = p ? p.cat : (CATS[0] && CATS[0].id);
    fillKindSelect($('#pCat').value, p ? p.kindKey : '');
    $('#pPkg').value = p ? (p.pkg || '') : '';
    $('#pPrice').value = p ? (p.price || '') : '';
    $('#pStatus').value = p ? (p.status || 'stock') : 'stock';
    $('#pKey').value = p ? (p.key || '') : '';
    $('#pDs').value = p ? (p.ds || '') : '';
    $('#pRemarks').value = p ? (p.remarks || '') : '';
    state.imgData = p ? (p.img || '') : '';
    updatePreview(state.imgData);

    var lines = '';
    if (p && p.specRaw) {
      lines = Object.keys(p.specRaw).map(function (k) { return k + '=' + p.specRaw[k]; }).join('\n');
    }
    $('#pSpecs').value = lines;

    $('#prodModal').hidden = false;
    $('#pModel').focus();
  }

  function closeProduct() { $('#prodModal').hidden = true; state.editing = null; state.imgData = ''; }

  function updatePreview(src) {
    var img = $('#pPreview');
    var tip = $('#pPreviewTip');
    if (src) { img.src = src; img.style.display = ''; tip.textContent = '已选择图片'; }
    else { img.removeAttribute('src'); img.style.display = 'none'; tip.textContent = '未选择图片（默认使用分类示意图）'; }
  }

  $('#pCat').addEventListener('change', function () { fillKindSelect($('#pCat').value, ''); });
  $('#pKind').addEventListener('change', renderSpecHelp);

  $('#pImage').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 700;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var cv = document.createElement('canvas');
        cv.width = Math.round(img.width * scale);
        cv.height = Math.round(img.height * scale);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        state.imgData = cv.toDataURL('image/jpeg', 0.82);
        updatePreview(state.imgData);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
  });

  $('#prodSave').addEventListener('click', function () {
    var model = $('#pModel').value.trim();
    if (!model) { toast('请填写型号', true); return; }
    if (!state.editing && state.products.some(function (p) { return p.model === model; })) {
      toast('型号已存在：' + model, true); return;
    }

    var kindDef = currentKindDef();
    var specRaw = {}, specs = [];
    $('#pSpecs').value.split('\n').forEach(function (line) {
      line = line.trim();
      if (!line || line.indexOf('=') < 0) return;
      var i = line.indexOf('=');
      var k = line.slice(0, i).trim();
      var v = line.slice(i + 1).trim();
      if (!k) return;
      specRaw[k] = v;
      var def = kindDef && kindDef.filters.find(function (f) { return f.key === k; });
      specs.push([def ? def.name : k, v]);
    });

    var rec = {
      id: model,
      model: model,
      cat: $('#pCat').value,
      kindKey: $('#pKind').value,
      kind: kindDef ? kindDef.name : '',
      pkg: $('#pPkg').value.trim(),
      price: $('#pPrice').value.trim(),
      status: $('#pStatus').value,
      key: $('#pKey').value.trim(),
      specs: specs,
      specRaw: specRaw,
      img: state.imgData || 'img/art-chip.svg',
      ds: $('#pDs').value.trim(),
      remarks: $('#pRemarks').value.trim(),
      _cloudId: state.editing ? state.editing._cloudId : undefined
    };

    S.products.save(rec).then(function () {
      toast(state.editing ? '已保存修改' : '已添加 ' + model);
      closeProduct();
      loadProducts();
    }).catch(function (err) {
      if (!guard(err)) toast('保存失败：' + err.message, true);
    });
  });

  $('#prodClose').addEventListener('click', closeProduct);
  $('#prodCancel').addEventListener('click', closeProduct);
  $('#prodModal').addEventListener('click', function (e) { if (e.target.id === 'prodModal') closeProduct(); });

  /* ============================================================
   *  PAGE CONTENT (装修)
   * ============================================================ */
  var CONTENT_KEYS = [
    { k: 'home.h1', label: '首页 · 主标题', html: true },
    { k: 'home.sub', label: '首页 · 副标题' },
    { k: 'home.p.eyebrow', label: '首页 · 产品区小标题' },
    { k: 'home.p.h', label: '首页 · 产品区标题', html: true },
    { k: 'home.p.desc', label: '首页 · 产品区说明' },
    { k: 'home.t.eyebrow', label: '首页 · 技术区小标题' },
    { k: 'home.t.h', label: '首页 · 技术区标题', html: true },
    { k: 'home.a.eyebrow', label: '首页 · 应用区小标题' },
    { k: 'home.a.h', label: '首页 · 应用区标题' },
    { k: 'pd.h', label: '产品页 · 标题' },
    { k: 'pd.p', label: '产品页 · 说明' },
    { k: 'td.h', label: '技术页 · 标题' },
    { k: 'td.p', label: '技术页 · 说明' },
    { k: 'ad.h', label: '关于页 · 标题', html: true },
    { k: 'ad.p', label: '关于页 · 说明' },
    { k: 'cd.h', label: '联系页 · 标题' },
    { k: 'cd.p', label: '联系页 · 说明' },
    { k: 'ft.slogan', label: '页脚 · 标语' }
  ];

  function dictVal(key, lang) {
    var d = window.KRD_I18N || {};
    var src = (d[lang] || {})[key];
    if (src == null) src = (d.en || {})[key];
    return src == null ? '' : String(src).replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[^>]+>/g, '');
  }

  function loadContent() {
    S.content.all().then(function (all) {
      state.content = all || {};
      renderContent();
    });
  }

  function renderContent() {
    $('#contentList').innerHTML = CONTENT_KEYS.map(function (m) {
      var rec = state.content[m.k] || {};
      var en = rec.en != null ? rec.en : (rec.value_en || '');
      var zh = rec.zhHant != null ? rec.zhHant : (rec.value_zh || '');
      var overridden = !!(en || zh);
      return '<div class="citem" data-key="' + esc(m.k) + '">' +
        '<div class="citem__hd">' +
          '<span class="citem__l">' + esc(m.label) + '</span>' +
          '<span class="citem__k">' + esc(m.k) + '</span>' +
          '<span class="citem__st' + (overridden ? ' is-on' : '') + '">' + (overridden ? '已改写' : '默认') + '</span>' +
        '</div>' +
        '<div class="citem__row">' +
          '<div><span class="citem__sub">English</span>' +
            '<textarea data-lang="en" placeholder="' + esc(dictVal(m.k, 'en')) + '">' + esc(en) + '</textarea></div>' +
          '<div><span class="citem__sub">繁體中文</span>' +
            '<textarea data-lang="zh-Hant" placeholder="' + esc(dictVal(m.k, 'zh-Hant')) + '">' + esc(zh) + '</textarea></div>' +
        '</div>' +
        '<div class="citem__ft">' +
          '<button class="btn btn--sm btn--primary" data-save>' + '保存' + '</button>' +
          '<button class="btn btn--sm btn--ghost" data-reset>恢复默认</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  $('#contentList').addEventListener('click', function (e) {
    var item = e.target.closest('.citem');
    if (!item) return;
    var key = item.getAttribute('data-key');
    if (e.target.closest('[data-save]')) {
      var en = item.querySelector('textarea[data-lang="en"]').value;
      var zh = item.querySelector('textarea[data-lang="zh-Hant"]').value;
      Promise.all([
        S.content.set(key, 'en', en),
        S.content.set(key, 'zh-Hant', zh)
      ]).then(function () {
        toast('已保存：' + key);
        loadContent();
      }).catch(function (err) { toast('保存失败：' + err.message, true); });
    }
    if (e.target.closest('[data-reset]')) {
      S.content.reset(key).then(function () {
        toast('已恢复默认：' + key);
        loadContent();
      });
    }
  });

  /* ============================================================
   *  INQUIRIES
   * ============================================================ */
  function loadInquiries() {
    S.inquiries.list().then(function (rows) {
      state.inq = rows || [];
      renderInquiries();
      var unread = state.inq.filter(function (x) { return !x.read; }).length;
      var b = $('[data-badge-inq]');
      if (b) b.textContent = unread ? unread : '';
      $('#viewSub').textContent = TITLES.inquiries[1] + '　共 ' + state.inq.length + ' 条，未读 ' + unread + ' 条';
    });
  }

  function inqFiltered() {
    var q = state.inqQ.toLowerCase();
    if (!q) return state.inq;
    return state.inq.filter(function (m) {
      return [m.name, m.company, m.email, m.subject, m.message].join(' ').toLowerCase().indexOf(q) > -1;
    });
  }

  function renderInquiries() {
    var list = inqFiltered();
    $('#inqEmpty').hidden = list.length > 0;
    $('#inqRows').innerHTML = list.map(function (m) {
      return '<tr data-id="' + esc(m.id) + '">' +
        '<td><span class="dot' + (m.read ? '' : ' is-new') + '"></span></td>' +
        '<td><b>' + esc(m.name || '—') + '</b></td>' +
        '<td>' + esc(m.company || '—') + '</td>' +
        '<td class="ro">' + esc(m.email || '—') + '</td>' +
        '<td>' + esc(m.subject || '—') + '</td>' +
        '<td class="ro">' + fmtDate(m.createdAt) + '</td>' +
        '<td><div class="acts"><button class="btn btn--sm" data-open="' + esc(m.id) + '">查看</button></div></td>' +
      '</tr>';
    }).join('');
  }

  $('#inqSearch').addEventListener('input', function (e) {
    state.inqQ = e.target.value.trim();
    renderInquiries();
  });

  $('#inqRows').addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]');
    if (!b) return;
    var id = b.getAttribute('data-open');
    var m = state.inq.find(function (x) { return String(x.id) === String(id); });
    if (!m) return;
    state.inqCur = m;
    $('#inqDetail').innerHTML =
      '<dl class="dl">' +
        '<dt>姓名</dt><dd>' + esc(m.name || '—') + '</dd>' +
        '<dt>公司</dt><dd>' + esc(m.company || '—') + '</dd>' +
        '<dt>邮箱</dt><dd><a href="mailto:' + esc(m.email) + '">' + esc(m.email || '—') + '</a></dd>' +
        '<dt>电话</dt><dd>' + esc(m.phone || '—') + '</dd>' +
        '<dt>主题</dt><dd>' + esc(m.subject || '—') + '</dd>' +
        '<dt>语言</dt><dd>' + esc(m.lang || '—') + '</dd>' +
        '<dt>时间</dt><dd>' + fmtDate(m.createdAt) + '</dd>' +
      '</dl>' +
      '<div class="inq-msg">' + esc(m.message || '') + '</div>';
    $('#inqReply').href = 'mailto:' + encodeURIComponent(m.email) + '?subject=' +
      encodeURIComponent('Re: [KRODOSEN] ' + (m.subject || 'Your enquiry'));
    $('#inqModal').hidden = false;
    if (!m.read) {
      S.inquiries.markRead(m.id, true).then(function () { loadInquiries(); });
    }
  });

  $('#inqClose').addEventListener('click', function () { $('#inqModal').hidden = true; });
  $('#inqModal').addEventListener('click', function (e) { if (e.target.id === 'inqModal') $('#inqModal').hidden = true; });

  $('#inqDelete').addEventListener('click', function () {
    if (!state.inqCur) return;
    if (!confirm('删除这条询盘？')) return;
    S.inquiries.remove(state.inqCur.id).then(function () {
      $('#inqModal').hidden = true;
      toast('已删除');
      loadInquiries();
    });
  });

  $('#exportInq').addEventListener('click', function () {
    var rows = [['name', 'company', 'email', 'phone', 'subject', 'message', 'createdAt']];
    inqFiltered().forEach(function (m) {
      rows.push([m.name, m.company, m.email, m.phone, m.subject, (m.message || '').replace(/\n/g, ' '), m.createdAt]);
    });
    var csv = rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'krodosen-inquiries-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    toast('已导出 CSV');
  });

  /* ============================================================
   *  BOOT
   * ============================================================ */
  function bootApp() {
    fillCatSelect();
    renderSpecHelp();

    var badge = $('[data-mode-badge]');
    if (badge) {
      var cloud = S.isCloud();
      badge.textContent = cloud ? '云端模式 · Cloudflare D1' : '本地模式 · localStorage';
      badge.className = 'mode' + (cloud ? ' is-cloud' : '');
    }

    /* preload counts */
    S.products.list().then(function (rows) {
      var b = $('[data-badge-products]');
      if (b) b.textContent = (rows || []).length;
    });
    S.inquiries.list().then(function (rows) {
      var unread = (rows || []).filter(function (x) { return !x.read; }).length;
      var b = $('[data-badge-inq]');
      if (b) b.textContent = unread || '';
    });

    var u = new URLSearchParams(location.search).get('view');
    switchView(['products','content','inquiries'].indexOf(u) > -1 ? u : 'products');
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!$('#prodModal').hidden) closeProduct();
      if (!$('#inqModal').hidden) $('#inqModal').hidden = true;
    }
  });

  /* auto-login within the same browser session */
  var authed = false;
  try { authed = sessionStorage.getItem('krd_admin') === '1'; } catch (e) {}
  if (S && S.isApi && S.isApi()) authed = authed && S.hasSession();
  if (authed) showApp();
})();
