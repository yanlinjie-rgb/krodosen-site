/* ============================================================
 *  KRODOSEN · CMS config
 *  mode = 'local' → 数据仅存本浏览器（离线可用，适合试用）
 *  mode = 'api'   → Cloudflare Worker + D1（正式模式，跨设备共享）
 * ============================================================ */
window.KRD_CMS = {
  mode: 'api',                        // 'local' | 'api'
  apiBase: 'https://api.krodosen.com', // Worker 地址
  adminPassword: 'krodosen2026',      // 后台登录密码（Worker 端 secret 同名）
  brand: 'KRODOSEN'
};
