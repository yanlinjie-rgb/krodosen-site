/* ============================================================
 *  KRODOSEN · CMS config
 *  mode = 'local'  → 数据存在本浏览器 localStorage（零配置，立即可用）
 *  mode = 'cloud'  → 数据存 Supabase（填好 url / anon key 后切换）
 *  注意：adminPassword 是明文，仅用于前端轻量门禁，不是安全边界。
 *        正式上线请改用 Supabase Auth（见 supabase-krodosen.sql 注释）。
 * ============================================================ */
window.KRD_CMS = {
  mode: 'local',                 // 'local' | 'cloud'
  supabaseUrl: '',               // 例：https://xxxx.supabase.co
  supabaseKey: '',               // Supabase anon / publishable key
  adminPassword: 'krodosen2026', // 后台登录密码（请自行修改）
  brand: 'KRODOSEN'
};
