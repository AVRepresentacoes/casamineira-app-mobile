-- Sprint Enterprise 016
-- Matriz assertiva RLS com personas reais locais.
--
-- Pre-requisito:
--   psql local -f supabase/seed/rls_personas_seed.sql
--
-- Uso:
--   psql local -v ON_ERROR_STOP=1 -f supabase/tests/rls/02_persona_access_matrix.sql
--
-- Nao executar em producao. Este script nao altera dados persistentes nem policies.

\set ON_ERROR_STOP on

create temp table rls_persona_results (
  scenario text not null,
  persona text not null,
  check_name text not null,
  severity text not null,
  expected text not null,
  actual text not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);

grant all on table rls_persona_results to public;

create or replace function pg_temp.visible_count(p_sql text)
returns integer
language plpgsql
as $$
declare
  v_count integer;
begin
  execute p_sql into v_count;
  return coalesce(v_count, 0);
exception
  when insufficient_privilege then
    return -1;
end;
$$;

create or replace function pg_temp.record_eq(
  p_scenario text,
  p_persona text,
  p_check_name text,
  p_severity text,
  p_expected integer,
  p_actual integer
)
returns void
language plpgsql
as $$
begin
  insert into rls_persona_results (
    scenario,
    persona,
    check_name,
    severity,
    expected,
    actual,
    passed
  )
  values (
    p_scenario,
    p_persona,
    p_check_name,
    p_severity,
    p_expected::text,
    p_actual::text,
    p_actual = p_expected
  );
end;
$$;

create or replace function pg_temp.record_private_zero_or_denied(
  p_scenario text,
  p_persona text,
  p_check_name text,
  p_severity text,
  p_actual integer
)
returns void
language plpgsql
as $$
begin
  insert into rls_persona_results (
    scenario,
    persona,
    check_name,
    severity,
    expected,
    actual,
    passed
  )
  values (
    p_scenario,
    p_persona,
    p_check_name,
    p_severity,
    '0 visible rows or permission denied',
    case when p_actual = -1 then 'permission denied' else p_actual::text end,
    p_actual in (-1, 0)
  );
end;
$$;

-- saas_owner: nao deve acessar dados operacionais indevidos.
begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","tenant_id":"20000000-0000-4000-8000-000000000001"}',
  true
);

select pg_temp.record_eq('saas_owner nao acessa operacao', 'saas_owner', 'pedidos visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.pedidos'));
select pg_temp.record_eq('saas_owner nao acessa operacao', 'saas_owner', 'pagamentos visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.pagamentos'));
select pg_temp.record_eq('saas_owner nao acessa operacao', 'saas_owner', 'reservas visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.caminho_hospedagem_reservas'));
select pg_temp.record_eq('saas_owner nao acessa operacao', 'saas_owner', 'movimentos visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.caminho_hospedagem_movimentos'));
select pg_temp.record_eq('saas_owner catalogos publicos', 'saas_owner', 'business_dna publico rls016', 'P2', 1, pg_temp.visible_count($$select count(*) from public.business_dna where slug = 'rls-016-publico'$$));
select pg_temp.record_eq('saas_owner catalogos publicos', 'saas_owner', 'premium_template publico rls016', 'P2', 1, pg_temp.visible_count($$select count(*) from public.premium_templates where slug = 'rls-016-publico'$$));
commit;

-- Casa Mineira Servicos owner: acessa dados do produto/tenant de servicos, nao Hospedagens.
begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","tenant_id":"20000000-0000-4000-8000-000000000002"}',
  true
);

select pg_temp.record_eq('servicos_owner isolamento produto', 'casa_mineira_servicos_owner', 'pedidos do servicos visiveis', 'P0', 2, pg_temp.visible_count($$select count(*) from public.pedidos where tenant_id = '20000000-0000-4000-8000-000000000002'$$));
select pg_temp.record_eq('servicos_owner isolamento produto', 'casa_mineira_servicos_owner', 'pagamentos do servicos visiveis', 'P0', 2, pg_temp.visible_count($$select count(*) from public.pagamentos where tenant_id = '20000000-0000-4000-8000-000000000002'$$));
select pg_temp.record_eq('servicos_owner isolamento produto', 'casa_mineira_servicos_owner', 'pedidos fora do tenant atual', 'P0', 0, pg_temp.visible_count($$select count(*) from public.pedidos where tenant_id is distinct from public.current_tenant_id()$$));
select pg_temp.record_eq('servicos_owner nao acessa hospedagens', 'casa_mineira_servicos_owner', 'reservas de hospedagens visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.caminho_hospedagem_reservas'));
select pg_temp.record_eq('servicos_owner nao acessa hospedagens', 'casa_mineira_servicos_owner', 'movimentos de hospedagens visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.caminho_hospedagem_movimentos'));
commit;

-- Hospedagens owner: acessa somente dados de Hospedagens.
begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","tenant_id":"20000000-0000-4000-8000-000000000003"}',
  true
);

select pg_temp.record_eq('hospedagens_owner isolamento produto', 'hospedagens_owner', 'reservas de hospedagens visiveis', 'P0', 2, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_reservas where tenant_id = '20000000-0000-4000-8000-000000000003'$$));
select pg_temp.record_eq('hospedagens_owner isolamento produto', 'hospedagens_owner', 'movimentos de hospedagens visiveis', 'P0', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_movimentos where tenant_id = '20000000-0000-4000-8000-000000000003'$$));
select pg_temp.record_eq('hospedagens_owner isolamento produto', 'hospedagens_owner', 'reservas fora do tenant atual', 'P0', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_reservas where tenant_id is distinct from public.current_tenant_id()$$));
select pg_temp.record_eq('hospedagens_owner nao acessa servicos', 'hospedagens_owner', 'pedidos de servicos visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.pedidos'));
select pg_temp.record_eq('hospedagens_owner nao acessa servicos', 'hospedagens_owner', 'pagamentos de servicos visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.pagamentos'));
commit;

-- cliente_servicos: acessa apenas seus proprios pedidos/pagamentos.
begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated","tenant_id":"20000000-0000-4000-8000-000000000002"}',
  true
);

select pg_temp.record_eq('cliente_servicos dados proprios', 'cliente_servicos', 'pedidos proprios visiveis', 'P0', 1, pg_temp.visible_count($$select count(*) from public.pedidos where cliente_id = auth.uid()$$));
select pg_temp.record_eq('cliente_servicos dados proprios', 'cliente_servicos', 'pedidos de outros clientes visiveis', 'P0', 0, pg_temp.visible_count($$select count(*) from public.pedidos where cliente_id <> auth.uid()$$));
select pg_temp.record_eq('cliente_servicos dados proprios', 'cliente_servicos', 'pagamentos proprios visiveis', 'P0', 1, pg_temp.visible_count($$select count(*) from public.pagamentos where pedido_id = '30000000-0000-4000-8000-000000000001'$$));
select pg_temp.record_eq('cliente_servicos nao acessa hospedagens', 'cliente_servicos', 'reservas de hospedagens visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.caminho_hospedagem_reservas'));
select pg_temp.record_eq('cliente_servicos nao acessa hospedagens', 'cliente_servicos', 'movimentos de hospedagens visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.caminho_hospedagem_movimentos'));
commit;

-- cliente_hospedagens: acessa apenas suas proprias reservas.
begin;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000005","role":"authenticated","tenant_id":"20000000-0000-4000-8000-000000000003"}',
  true
);

select pg_temp.record_eq('cliente_hospedagens dados proprios', 'cliente_hospedagens', 'total de reservas visiveis', 'P0', 1, pg_temp.visible_count('select count(*) from public.caminho_hospedagem_reservas'));
select pg_temp.record_eq('cliente_hospedagens dados proprios', 'cliente_hospedagens', 'reservas proprias visiveis', 'P0', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_reservas where cliente_id = auth.uid()$$));
select pg_temp.record_eq('cliente_hospedagens dados proprios', 'cliente_hospedagens', 'reservas de outros clientes visiveis', 'P0', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_reservas where cliente_id <> auth.uid()$$));
select pg_temp.record_eq('cliente_hospedagens dados proprios', 'cliente_hospedagens', 'movimentos financeiros visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.caminho_hospedagem_movimentos'));
select pg_temp.record_eq('cliente_hospedagens nao acessa servicos', 'cliente_hospedagens', 'pedidos de servicos visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.pedidos'));
select pg_temp.record_eq('cliente_hospedagens nao acessa servicos', 'cliente_hospedagens', 'pagamentos de servicos visiveis', 'P0', 0, pg_temp.visible_count('select count(*) from public.pagamentos'));
commit;

-- anon: acessa apenas catalogos publicos ativos.
begin;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select pg_temp.record_private_zero_or_denied('anon somente publico', 'anon', 'pedidos privados', 'P0', pg_temp.visible_count('select count(*) from public.pedidos'));
select pg_temp.record_private_zero_or_denied('anon somente publico', 'anon', 'pagamentos privados', 'P0', pg_temp.visible_count('select count(*) from public.pagamentos'));
select pg_temp.record_private_zero_or_denied('anon somente publico', 'anon', 'reservas privadas', 'P0', pg_temp.visible_count('select count(*) from public.caminho_hospedagem_reservas'));
select pg_temp.record_private_zero_or_denied('anon somente publico', 'anon', 'movimentos privados', 'P0', pg_temp.visible_count('select count(*) from public.caminho_hospedagem_movimentos'));
select pg_temp.record_private_zero_or_denied('anon somente publico', 'anon', 'saas_products control plane privado', 'P1', pg_temp.visible_count('select count(*) from public.saas_products'));
select pg_temp.record_eq('anon catalogos publicos', 'anon', 'business_dna publico ativo', 'P2', 1, pg_temp.visible_count($$select count(*) from public.business_dna where slug = 'rls-016-publico'$$));
select pg_temp.record_eq('anon catalogos publicos', 'anon', 'business_dna inativo bloqueado', 'P2', 0, pg_temp.visible_count($$select count(*) from public.business_dna where slug = 'rls-016-privado'$$));
select pg_temp.record_eq('anon catalogos publicos', 'anon', 'premium_template publico ativo', 'P2', 1, pg_temp.visible_count($$select count(*) from public.premium_templates where slug = 'rls-016-publico'$$));
select pg_temp.record_eq('anon catalogos publicos', 'anon', 'premium_template inativo bloqueado', 'P2', 0, pg_temp.visible_count($$select count(*) from public.premium_templates where slug = 'rls-016-privado'$$));
commit;

reset role;

select
  severity,
  persona,
  scenario,
  check_name,
  expected,
  actual,
  passed
from rls_persona_results
order by
  case severity when 'P0' then 0 when 'P1' then 1 else 2 end,
  persona,
  scenario,
  check_name;

do $$
declare
  v_failures integer;
begin
  select count(*) into v_failures
  from rls_persona_results
  where passed = false;

  if v_failures > 0 then
    raise exception 'RLS persona access matrix failed: % failing checks. See result rows above.', v_failures;
  end if;
end;
$$;
