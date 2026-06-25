-- Register current products and their dedicated data planes in the SaaS Control Plane.

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
values
  (
    'Casa Mineira Serviços',
    'casa-mineira-servicos',
    'services_marketplace',
    'active',
    'casa-mineira',
    'casamineira',
    'br.app.casamineiraservicos',
    'com.casamineira.app',
    'casamineiraservicos.app.br',
    'default',
    true
  ),
  (
    'Hospedagens Caminhos da Fé',
    'hospedagens-caminhos-da-fe',
    'hotel_booking',
    'active',
    'hospedagens-caminhos-da-fe',
    'hospedagenscaminhosdafe',
    'br.app.hospedagenscaminhosdafe',
    'br.app.hospedagenscaminhosdafe',
    'hospedagenscaminhosdafe.com.br',
    'hospedagens-caminhos-da-fe',
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
  requires_dedicated_supabase = excluded.requires_dedicated_supabase,
  updated_at = now();

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
select
  p.id,
  'production',
  'active',
  'uinrmrclgzztilrtxboq',
  'https://uinrmrclgzztilrtxboq.supabase.co',
  'sa-east-1',
  'prqebjwrinljbirztfxv',
  'CASA_MINEIRA_SERVICOS_SUPABASE_ANON_KEY',
  'CASA_MINEIRA_SERVICOS_SUPABASE_SERVICE_ROLE_KEY',
  'legacy_existing',
  'legacy_existing',
  'legacy_existing',
  'legacy_existing',
  'Projeto existente usado pelo AAB publicado da Casa Mineira Serviços.'
from public.saas_products p
where p.slug = 'casa-mineira-servicos'
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
select
  p.id,
  'production',
  'active',
  'uxtqwsckvrsxjvvtdwhg',
  'https://uxtqwsckvrsxjvvtdwhg.supabase.co',
  'sa-east-1',
  'eqjexllrlvjwvjlloupm',
  'HOSPEDAGENS_CAMINHOS_SUPABASE_ANON_KEY',
  'HOSPEDAGENS_CAMINHOS_SUPABASE_SERVICE_ROLE_KEY',
  'applied',
  'deployed',
  'configured',
  'configured',
  'Projeto dedicado de Hospedagens Caminhos da Fé.'
from public.saas_products p
where p.slug = 'hospedagens-caminhos-da-fe'
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
