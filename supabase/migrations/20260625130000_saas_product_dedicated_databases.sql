-- Control Plane registry for products with dedicated Supabase data planes.

create extension if not exists pgcrypto;

create table if not exists public.saas_products (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresa_configuracoes(id) on delete set null,
  name text not null,
  slug text not null unique,
  product_type text not null default 'custom',
  status text not null default 'provisioning',
  app_slug text,
  app_scheme text,
  android_package text,
  ios_bundle_id text,
  domain text,
  tenant_slug text,
  requires_dedicated_supabase boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saas_products_status_check check (
    status in ('draft', 'provisioning', 'active', 'paused', 'failed', 'archived')
  )
);

create table if not exists public.saas_product_databases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.saas_products(id) on delete cascade,
  provider text not null default 'supabase',
  environment text not null default 'production',
  status text not null default 'pending',
  supabase_project_ref text,
  supabase_url text,
  supabase_region text,
  supabase_org_id text,
  anon_key_env text,
  service_role_secret_name text,
  migrations_status text not null default 'pending',
  functions_status text not null default 'pending',
  storage_status text not null default 'pending',
  auth_status text not null default 'pending',
  last_health_status text,
  last_health_checked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saas_product_databases_env_check check (
    environment in ('development', 'preview', 'staging', 'production')
  ),
  constraint saas_product_databases_status_check check (
    status in ('pending', 'provisioning', 'active', 'degraded', 'failed', 'paused', 'archived')
  ),
  constraint saas_product_databases_unique_env unique (product_id, environment)
);

create table if not exists public.saas_product_provisioning_runs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.saas_products(id) on delete cascade,
  database_id uuid references public.saas_product_databases(id) on delete set null,
  run_type text not null default 'provision',
  status text not null default 'queued',
  requested_by uuid references auth.users(id) on delete set null,
  started_at timestamptz,
  finished_at timestamptz,
  input jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error_message text,
  rollback_plan text,
  created_at timestamptz not null default now(),
  constraint saas_product_provisioning_runs_type_check check (
    run_type in ('provision', 'migration', 'functions_deploy', 'health_check', 'rollback', 'audit')
  ),
  constraint saas_product_provisioning_runs_status_check check (
    status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')
  )
);

create index if not exists saas_products_status_idx
  on public.saas_products (status, created_at desc);

create index if not exists saas_product_databases_project_ref_idx
  on public.saas_product_databases (supabase_project_ref)
  where supabase_project_ref is not null;

create index if not exists saas_product_provisioning_runs_product_idx
  on public.saas_product_provisioning_runs (product_id, created_at desc);

drop trigger if exists trg_saas_products_updated_at on public.saas_products;
create trigger trg_saas_products_updated_at
before update on public.saas_products
for each row
execute function public.set_updated_at();

drop trigger if exists trg_saas_product_databases_updated_at on public.saas_product_databases;
create trigger trg_saas_product_databases_updated_at
before update on public.saas_product_databases
for each row
execute function public.set_updated_at();

alter table public.saas_products enable row level security;
alter table public.saas_product_databases enable row level security;
alter table public.saas_product_provisioning_runs enable row level security;

drop policy if exists saas_products_select_super_admin on public.saas_products;
create policy saas_products_select_super_admin
on public.saas_products
for select
to authenticated
using (public.is_super_admin());

drop policy if exists saas_products_manage_super_admin on public.saas_products;
create policy saas_products_manage_super_admin
on public.saas_products
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists saas_product_databases_select_super_admin on public.saas_product_databases;
create policy saas_product_databases_select_super_admin
on public.saas_product_databases
for select
to authenticated
using (public.is_super_admin());

drop policy if exists saas_product_databases_manage_super_admin on public.saas_product_databases;
create policy saas_product_databases_manage_super_admin
on public.saas_product_databases
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists saas_product_provisioning_runs_select_super_admin on public.saas_product_provisioning_runs;
create policy saas_product_provisioning_runs_select_super_admin
on public.saas_product_provisioning_runs
for select
to authenticated
using (public.is_super_admin());

drop policy if exists saas_product_provisioning_runs_manage_super_admin on public.saas_product_provisioning_runs;
create policy saas_product_provisioning_runs_manage_super_admin
on public.saas_product_provisioning_runs
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

grant select, insert, update, delete on public.saas_products to authenticated;
grant select, insert, update, delete on public.saas_product_databases to authenticated;
grant select, insert, update, delete on public.saas_product_provisioning_runs to authenticated;

create or replace function public.register_saas_product_database(
  p_slug text,
  p_name text,
  p_product_type text,
  p_app_slug text,
  p_app_scheme text,
  p_android_package text,
  p_ios_bundle_id text,
  p_domain text,
  p_tenant_slug text,
  p_supabase_project_ref text,
  p_supabase_url text,
  p_supabase_region text,
  p_supabase_org_id text,
  p_anon_key_env text,
  p_service_role_secret_name text,
  p_status text default 'active'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Apenas super_admin pode registrar bancos dedicados.';
  end if;

  insert into public.saas_products (
    name,
    slug,
    product_type,
    status,
    app_slug,
    app_scheme,
    android_package,
    ios_bundle_id,
    domain,
    tenant_slug,
    requires_dedicated_supabase
  )
  values (
    p_name,
    p_slug,
    coalesce(nullif(p_product_type, ''), 'custom'),
    coalesce(nullif(p_status, ''), 'active'),
    p_app_slug,
    p_app_scheme,
    p_android_package,
    p_ios_bundle_id,
    nullif(p_domain, ''),
    p_tenant_slug,
    true
  )
  on conflict (slug) do update
  set
    name = excluded.name,
    product_type = excluded.product_type,
    status = excluded.status,
    app_slug = excluded.app_slug,
    app_scheme = excluded.app_scheme,
    android_package = excluded.android_package,
    ios_bundle_id = excluded.ios_bundle_id,
    domain = excluded.domain,
    tenant_slug = excluded.tenant_slug,
    requires_dedicated_supabase = true,
    updated_at = now()
  returning id into v_product_id;

  insert into public.saas_product_databases (
    product_id,
    environment,
    status,
    supabase_project_ref,
    supabase_url,
    supabase_region,
    supabase_org_id,
    anon_key_env,
    service_role_secret_name,
    migrations_status,
    functions_status,
    storage_status,
    auth_status,
    notes
  )
  values (
    v_product_id,
    'production',
    coalesce(nullif(p_status, ''), 'active'),
    nullif(p_supabase_project_ref, ''),
    nullif(p_supabase_url, ''),
    nullif(p_supabase_region, ''),
    nullif(p_supabase_org_id, ''),
    nullif(p_anon_key_env, ''),
    nullif(p_service_role_secret_name, ''),
    'applied',
    'deployed',
    'configured',
    'configured',
    'Banco dedicado registrado pelo Control Plane.'
  )
  on conflict (product_id, environment) do update
  set
    status = excluded.status,
    supabase_project_ref = excluded.supabase_project_ref,
    supabase_url = excluded.supabase_url,
    supabase_region = excluded.supabase_region,
    supabase_org_id = excluded.supabase_org_id,
    anon_key_env = excluded.anon_key_env,
    service_role_secret_name = excluded.service_role_secret_name,
    migrations_status = excluded.migrations_status,
    functions_status = excluded.functions_status,
    storage_status = excluded.storage_status,
    auth_status = excluded.auth_status,
    notes = excluded.notes,
    updated_at = now();

  return v_product_id;
end;
$$;

revoke all on function public.register_saas_product_database(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) from public;
grant execute on function public.register_saas_product_database(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) to authenticated;
