-- Sprint Enterprise 014
-- Matriz de isolamento RLS por produto/tenant.
--
-- Este script e um template nao destrutivo. Ele usa apenas SELECTs.
-- Execute em Supabase local/staging com uma sessao autenticada de teste.
--
-- Para simular usuario via SQL local, ajuste os placeholders e use transacao:
--
-- begin;
-- set local role authenticated;
-- set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}';
-- -- executar consultas
-- rollback;
--
-- Em producao, nao execute sem aprovacao explicita.

-- A. Contexto da sessao.
select
  auth.uid() as auth_uid,
  public.current_tenant_id() as current_tenant_id,
  public.is_super_admin() as is_super_admin;

-- B. O usuario autenticado deve enxergar apenas seus tenants.
select
  tenant_id,
  slug,
  name,
  role,
  is_default,
  status
from public.get_meus_tenants();

-- C. Product registry deve ser invisivel para usuario comum e visivel para super_admin.
-- Expected usuario comum: 0 linhas.
-- Expected super_admin: produtos registrados.
select
  slug,
  name,
  product_type,
  status,
  tenant_slug
from public.saas_products
order by slug;

select
  p.slug as product_slug,
  d.environment,
  d.status,
  d.supabase_project_ref
from public.saas_product_databases d
join public.saas_products p on p.id = d.product_id
order by p.slug, d.environment;

-- D. Casa Mineira Servicos: usuario de outro tenant nao deve ver registros operacionais.
-- Expected para usuario sem vinculo ao tenant dos registros: 0 em tabelas privadas.
select 'pedidos' as table_name, count(*) as visible_rows from public.pedidos
union all
select 'propostas', count(*) from public.propostas
union all
select 'pagamentos', count(*) from public.pagamentos
union all
select 'comissoes', count(*) from public.comissoes
union all
select 'produtos_fornecedor', count(*) from public.produtos_fornecedor
union all
select 'wallets', count(*) from public.wallets
union all
select 'wallet_transactions', count(*) from public.wallet_transactions;

-- E. Hospedagens: usuario de outro tenant nao deve ver registros privados.
-- Expected para usuario sem vinculo ao tenant dos registros: 0 em tabelas privadas.
-- Avaliacoes publicadas podem ser excecao publica, conforme policy.
select 'caminho_hospedagem_reservas' as table_name, count(*) as visible_rows from public.caminho_hospedagem_reservas
union all
select 'caminho_hospedagem_pousada_saldos', count(*) from public.caminho_hospedagem_pousada_saldos
union all
select 'caminho_hospedagem_movimentos', count(*) from public.caminho_hospedagem_movimentos
union all
select 'caminho_hospedagem_aceites', count(*) from public.caminho_hospedagem_aceites
union all
select 'caminho_hospedagem_favoritos', count(*) from public.caminho_hospedagem_favoritos
union all
select 'caminho_hospedagem_notificacoes', count(*) from public.caminho_hospedagem_notificacoes
union all
select 'caminho_hospedagem_chamados', count(*) from public.caminho_hospedagem_chamados;

-- F. Linhas visiveis fora do tenant atual indicam falha P0 em tabelas privadas.
-- Expected usuario comum: 0 em todas.
select 'pedidos_outside_current_tenant' as check_name, count(*) as visible_rows
from public.pedidos
where tenant_id is distinct from public.current_tenant_id()
union all
select 'pagamentos_outside_current_tenant', count(*)
from public.pagamentos
where tenant_id is distinct from public.current_tenant_id()
union all
select 'produtos_fornecedor_outside_current_tenant', count(*)
from public.produtos_fornecedor
where tenant_id is distinct from public.current_tenant_id()
union all
select 'hospedagem_reservas_outside_current_tenant', count(*)
from public.caminho_hospedagem_reservas
where tenant_id is distinct from public.current_tenant_id()
union all
select 'hospedagem_movimentos_outside_current_tenant', count(*)
from public.caminho_hospedagem_movimentos
where tenant_id is distinct from public.current_tenant_id();

-- G. Catalogos publicos SaaS podem retornar linhas ativas.
-- Expected anon/authenticated: linhas ativas permitidas.
select 'business_dna_active' as table_name, count(*) as visible_rows
from public.business_dna
where is_active = true
union all
select 'premium_templates_active', count(*)
from public.premium_templates
where is_active = true;

-- H. Tabelas compartilhadas com risco: resultado deve ser interpretado manualmente.
-- Expected: confirmar se ha tenant_id/product_id/policy suficiente antes de usar em producao.
select 'analytics_eventos' as table_name, count(*) as visible_rows from public.analytics_eventos
union all
select 'app_branding', count(*) from public.app_branding
union all
select 'banners_publicitarios', count(*) from public.banners_publicitarios
union all
select 'integracao_apps', count(*) from public.integracao_apps
union all
select 'white_label_templates', count(*) from public.white_label_templates;
