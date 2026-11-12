/* ============================================================
 *  KRODOSEN · package artwork resolver
 *  按产品的封装字段（pkg / package_spec）自动匹配示意图：
 *    SOT / QFN / LGA / DFN / SOP(含 SOIC、ESOP、MSOP、TSSOP) / TO(TO-263、TO-220、DPAK)
 *  自定义上传的图片优先保留；无匹配时回退通用芯片图。
 *  window.KRD_PKG_ART(pkg)   -> 图片路径 | null
 *  window.KRD_ART(product)   -> 最终用于渲染的图片路径
 * ============================================================ */
(function (w) {
  'use strict';

  var FALLBACK = 'img/art-chip.svg';

  var RULES = [
    { re: /SOT/i,               file: 'img/pkg/sot.svg' },
    { re: /QFN/i,              file: 'img/pkg/qfn.svg' },
    { re: /LGA/i,              file: 'img/pkg/lga.svg' },
    { re: /DFN/i,              file: 'img/pkg/dfn.svg' },
    { re: /(SOP|SOIC|MSOP|TSSOP|SSOP)/i, file: 'img/pkg/sop.svg' },
    { re: /(TO-?\d{3}|DPAK|D2PAK)/i,     file: 'img/pkg/to.svg' }
  ];

  /* 封装字符串 -> 示意图 */
  function art(pkg) {
    if (!pkg) return null;
    var s = String(pkg);
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].re.test(s)) return RULES[i].file;
    }
    return null;
  }

  /* 判断是否为用户自行上传的图片（优先于示意图） */
  function isCustom(img) {
    if (!img) return false;
    return /^data:/i.test(img) || /^https?:/i.test(img) || img.indexOf('img/p/') === 0 || img.indexOf('/uploads/') >= 0;
  }

  /* 产品对象 -> 渲染用图片 */
  function resolve(p) {
    if (!p) return FALLBACK;
    var img = p.img || p.image || p.image_url || '';
    if (isCustom(img)) return img;
    var pkg = p.pkg || (p.specRaw && (p.specRaw.package_spec || p.specRaw.package)) || '';
    var a = art(pkg);
    if (a) return a;
    return img || FALLBACK;
  }

  w.KRD_PKG_ART = art;
  w.KRD_ART = resolve;
})(window);
