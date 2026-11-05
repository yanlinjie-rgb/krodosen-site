-- ============================================================
--  KRODOSEN CMS · Supabase schema
--  在 Supabase → SQL Editor 里整段执行，然后把 URL / anon key
--  填到 assets/js/cms-config.js，并把 mode 改为 'cloud'。
-- ============================================================

-- ---------- 产品 ----------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  model         text unique not null,
  category      text,
  kind          text,
  kind_name     text,
  package       text,
  price         text,
  status        text default 'stock',
  key_spec      text,
  specs         jsonb default '[]'::jsonb,
  spec_data     jsonb default '{}'::jsonb,
  image_url     text,
  datasheet_url text,
  remarks       text,
  sort_order    int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 如不需要外键（分类来自 catalog-data.js 静态配置），可跳过 categories_slug，
-- 并把上面 category 一行改成：  category text,

-- ---------- 页面装修文案 ----------
create table if not exists public.site_content (
  key        text primary key,
  value_en   text default '',
  value_zh   text default '',
  updated_at timestamptz default now()
);

-- ---------- 询盘 ----------
create table if not exists public.inquiries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  company    text,
  email      text not null,
  phone      text,
  subject    text,
  message    text,
  lang       text default 'en',
  is_read    boolean default false,
  created_at timestamptz default now()
);

create index if not exists inquiries_created_idx on public.inquiries (created_at desc);
create index if not exists products_category_idx on public.products (category, kind);

-- ============================================================
--  行级权限（RLS）
--  ⚠️ 下面这套规则让 anon key 就能读写，好处是前台/后台零登录即可用；
--     风险是任何人都能改数据。正式对外运营前请改为：
--       - 产品/文案：select 允许 anon，insert/update/delete 仅 authenticated
--       - 询盘：insert 允许 anon，select/update/delete 仅 authenticated
--     并在后台改用 Supabase Auth 登录（不再用 cms-config.js 明文密码）。
-- ============================================================
alter table public.products    enable row level security;
alter table public.site_content enable row level security;
alter table public.inquiries   enable row level security;

drop policy if exists products_read  on public.products;
drop policy if exists products_write on public.products;
create policy products_read  on public.products for select using (true);
create policy products_write on public.products for all    using (true) with check (true);

drop policy if exists content_read  on public.site_content;
drop policy if exists content_write on public.site_content;
create policy content_read  on public.site_content for select using (true);
create policy content_write on public.site_content for all    using (true) with check (true);

drop policy if exists inquiries_insert on public.inquiries;
drop policy if exists inquiries_all    on public.inquiries;
create policy inquiries_insert on public.inquiries for insert with check (true);
create policy inquiries_all    on public.inquiries for all    using (true) with check (true);

-- ============================================================
--  图片存储（可选）：后台"上传图片"目前是转 base64 存进 products.image_url。
--  若想改用 Storage 桶，请在 Storage 里建公开桶 cms-images，
--  并把 image_url 存成 https://<project>.supabase.co/storage/v1/object/public/cms-images/xxx.jpg
-- ============================================================
