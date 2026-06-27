-- Sprint Enterprise 014
-- Inventario nao destrutivo de prontidao RLS/produto/tenant.
--
-- Uso recomendado:
-- 1. Executar primeiro em Supabase local ou staging.
-- 2. Nao executar em producao sem aprovacao explicita.
-- 3. Este arquivo contem apenas SELECTs e nao altera schema, dados ou policies.

-- 1. Tabelas criticas e status de RLS.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'tenants',
    'tenant_users',
    'empresa_configuracoes',
    'planos_saas',
    'assinaturas_saas',
    'assinaturas_saas_historico',
    'saas_billing_integrations',
    'saas_billing_events',
    'saas_products',
    'saas_product_databases',
    'saas_product_provisioning_runs',
    'business_dna',
    'premium_templates',
    'ai_factory_runs',
    'ai_factory_agent_logs',
    'ai_factory_artifacts',
    'ai_factory_audit_logs',
    'pedidos',
    'propostas',
    'pagamentos',
    'comissoes',
    'profissionais',
    'servicos',
    'mensagens',
    'disparo_pedidos',
    'produtos_fornecedor',
    'pedido_produtos_itens',
    'contratos_digitais',
    'escrow_milestones',
    'wallets',
    'wallet_transactions',
    'saque_solicitacoes',
    'gas_revendedores',
    'gas_pedidos',
    'caminho_hospedagem_pousadas',
    'caminho_hospedagem_quartos',
    'caminho_hospedagem_servicos',
    'caminho_hospedagem_disponibilidade',
    'caminho_hospedagem_reservas',
    'caminho_hospedagem_pousada_saldos',
    'caminho_hospedagem_movimentos',
    'caminho_hospedagem_aceites',
    'caminho_hospedagem_avaliacoes',
    'caminho_hospedagem_favoritos',
    'caminho_hospedagem_notificacoes',
    'caminho_hospedagem_chamados',
    'analytics_eventos',
    'app_branding',
    'banners_publicitarios',
    'empresa_profissional_convites',
    'integracao_apps',
    'white_label_templates'
  )
order by c.relname;

-- 2. Tabelas criticas sem coluna tenant_id.
select
  t.table_name,
  case when c_tenant.column_name is null then 'missing_tenant_id' else 'has_tenant_id' end as tenant_status,
  case when c_product.column_name is null then 'missing_product_id' else 'has_product_id' end as product_status
from information_schema.tables t
left join information_schema.columns c_tenant
  on c_tenant.table_schema = t.table_schema
 and c_tenant.table_name = t.table_name
 and c_tenant.column_name = 'tenant_id'
left join information_schema.columns c_product
  on c_product.table_schema = t.table_schema
 and c_product.table_name = t.table_name
 and c_product.column_name = 'product_id'
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
  and t.table_name in (
    'analytics_eventos',
    'app_branding',
    'banners_publicitarios',
    'empresa_profissional_convites',
    'integracao_apps',
    'white_label_templates',
    'pedidos',
    'pagamentos',
    'caminho_hospedagem_reservas',
    'saas_products',
    'saas_product_databases'
  )
order by t.table_name;

-- 3. Policies por tabela critica.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'tenants',
    'tenant_users',
    'saas_products',
    'saas_product_databases',
    'pedidos',
    'propostas',
    'pagamentos',
    'produtos_fornecedor',
    'caminho_hospedagem_reservas',
    'caminho_hospedagem_pousada_saldos',
    'caminho_hospedagem_movimentos',
    'analytics_eventos',
    'app_branding',
    'banners_publicitarios'
  )
order by tablename, policyname;

-- 4. Produtos/data planes registrados no Control Plane.
select
  p.slug,
  p.name,
  p.product_type,
  p.status,
  p.tenant_slug,
  p.requires_dedicated_supabase,
  d.environment,
  d.status as database_status,
  d.supabase_project_ref,
  d.migrations_status,
  d.functions_status,
  d.storage_status,
  d.auth_status
from public.saas_products p
left join public.saas_product_databases d on d.product_id = p.id
where p.slug in ('casa-mineira-servicos', 'hospedagens-caminhos-da-fe')
order by p.slug, d.environment;

-- 5. Tenants relevantes.
select
  id,
  slug,
  name,
  status,
  plan_code,
  ativa
from public.tenants
where slug in ('default', 'casa-mineira-servicos', 'hospedagens-caminhos-da-fe')
order by slug;
