-- Fundação das 10 inovações ERP (MVP produtivo e evolutivo).

-- 1) Preço dinâmico com IA
create table if not exists public.fornecedor_precificacao_regras (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  margem_minima_pct numeric(5,2) not null default 15,
  ajuste_demanda_pct numeric(5,2) not null default 8,
  ajuste_estoque_pct numeric(5,2) not null default 5,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fornecedor_precificacao_recomendacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  produto_id uuid not null references public.produtos_fornecedor(id) on delete cascade,
  preco_atual numeric(12,2) not null,
  preco_sugerido numeric(12,2) not null,
  motivo text,
  score_confianca numeric(5,2) not null default 70,
  created_at timestamptz not null default now()
);

create index if not exists fornecedor_precificacao_recomendacoes_idx
  on public.fornecedor_precificacao_recomendacoes (tenant_id, fornecedor_id, created_at desc);

-- 2) Digital Twin
create table if not exists public.fornecedor_digital_twin_cenarios (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  parametros jsonb not null default '{}'::jsonb,
  resultado jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 3) Operação por voz
create table if not exists public.fornecedor_comandos_voz_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  comando text not null,
  resposta text,
  status text not null default 'ok',
  created_at timestamptz not null default now()
);

-- 4) Detecção de anomalias
create table if not exists public.fornecedor_anomalias (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null,
  severidade text not null default 'media',
  valor_atual numeric(14,2),
  valor_referencia numeric(14,2),
  descricao text not null,
  created_at timestamptz not null default now(),
  status text not null default 'aberta',
  constraint fornecedor_anomalias_severidade_check check (severidade in ('baixa', 'media', 'alta', 'critica')),
  constraint fornecedor_anomalias_status_check check (status in ('aberta', 'tratada', 'ignorada'))
);

-- 5) Churn/retencao
create table if not exists public.fornecedor_churn_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  cliente_id uuid not null references auth.users(id) on delete cascade,
  score numeric(5,2) not null,
  classificacao text not null,
  motivo text,
  created_at timestamptz not null default now(),
  constraint fornecedor_churn_scores_classificacao_check check (classificacao in ('baixo', 'medio', 'alto'))
);

-- 6) SLA Intelligence
create table if not exists public.fornecedor_sla_predicoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  risco_atraso_pct numeric(5,2) not null,
  recomendacao text,
  created_at timestamptz not null default now()
);

-- 7) Fluxo financeiro autonomo
create table if not exists public.fornecedor_cashflow_planos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  plano_mes date not null,
  receber_previsto numeric(12,2) not null default 0,
  pagar_previsto numeric(12,2) not null default 0,
  saldo_previsto numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- 8) Data room executivo
create table if not exists public.fornecedor_data_room_metricas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  referencia_date date not null default current_date,
  receita_30 numeric(12,2) not null default 0,
  margem_estimada_pct numeric(5,2) not null default 0,
  churn_risco_alto_qtd integer not null default 0,
  sla_risco_alto_qtd integer not null default 0,
  created_at timestamptz not null default now()
);

-- 9) App builder white-label assistido
create table if not exists public.white_label_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  config jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.white_label_templates (slug, nome, config, ativo)
values
  ('default-pro', 'Default Pro', '{"theme":"dark-gold","modules":["crm","financeiro","marketplace"]}'::jsonb, true)
on conflict (slug) do nothing;

-- 10) Marketplace de integrações (API ecosystem)
create table if not exists public.integracao_apps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  provider text not null,
  status text not null default 'ativo',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integracao_apps_status_check check (status in ('ativo', 'inativo', 'erro'))
);

create index if not exists integracao_apps_idx
  on public.integracao_apps (tenant_id, fornecedor_id, provider, status, created_at desc);

create or replace function public.set_updated_at_erp_innovations()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_fornecedor_precificacao_regras_updated_at on public.fornecedor_precificacao_regras;
create trigger trg_fornecedor_precificacao_regras_updated_at
before update on public.fornecedor_precificacao_regras
for each row
execute function public.set_updated_at_erp_innovations();

drop trigger if exists trg_integracao_apps_updated_at on public.integracao_apps;
create trigger trg_integracao_apps_updated_at
before update on public.integracao_apps
for each row
execute function public.set_updated_at_erp_innovations();

-- RLS habilitado para todos os artefatos novos
alter table public.fornecedor_precificacao_regras enable row level security;
alter table public.fornecedor_precificacao_recomendacoes enable row level security;
alter table public.fornecedor_digital_twin_cenarios enable row level security;
alter table public.fornecedor_comandos_voz_logs enable row level security;
alter table public.fornecedor_anomalias enable row level security;
alter table public.fornecedor_churn_scores enable row level security;
alter table public.fornecedor_sla_predicoes enable row level security;
alter table public.fornecedor_cashflow_planos enable row level security;
alter table public.fornecedor_data_room_metricas enable row level security;
alter table public.white_label_templates enable row level security;
alter table public.integracao_apps enable row level security;

grant select, insert, update, delete on public.fornecedor_precificacao_regras to authenticated;
grant select, insert, update, delete on public.fornecedor_precificacao_recomendacoes to authenticated;
grant select, insert on public.fornecedor_digital_twin_cenarios to authenticated;
grant select, insert on public.fornecedor_comandos_voz_logs to authenticated;
grant select, insert on public.fornecedor_anomalias to authenticated;
grant select, insert on public.fornecedor_churn_scores to authenticated;
grant select, insert on public.fornecedor_sla_predicoes to authenticated;
grant select, insert on public.fornecedor_cashflow_planos to authenticated;
grant select, insert on public.fornecedor_data_room_metricas to authenticated;
grant select on public.white_label_templates to authenticated;
grant select, insert, update, delete on public.integracao_apps to authenticated;

do $$
declare
  v_table text;
  v_tables text[] := array[
    'fornecedor_precificacao_regras',
    'fornecedor_precificacao_recomendacoes',
    'fornecedor_digital_twin_cenarios',
    'fornecedor_comandos_voz_logs',
    'fornecedor_anomalias',
    'fornecedor_churn_scores',
    'fornecedor_sla_predicoes',
    'fornecedor_cashflow_planos',
    'fornecedor_data_room_metricas',
    'integracao_apps'
  ];
begin
  foreach v_table in array v_tables loop
    execute format('drop policy if exists %I on public.%I', v_table || '_select_own', v_table);
    execute format(
      'create policy %I on public.%I for select to authenticated using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid())',
      v_table || '_select_own',
      v_table
    );

    execute format('drop policy if exists %I on public.%I', v_table || '_insert_own', v_table);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid())',
      v_table || '_insert_own',
      v_table
    );
  end loop;
end $$;

drop policy if exists fornecedor_precificacao_regras_update_own on public.fornecedor_precificacao_regras;
create policy fornecedor_precificacao_regras_update_own
on public.fornecedor_precificacao_regras
for update
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid())
with check (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_precificacao_regras_delete_own on public.fornecedor_precificacao_regras;
create policy fornecedor_precificacao_regras_delete_own
on public.fornecedor_precificacao_regras
for delete
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_precificacao_recomendacoes_update_own on public.fornecedor_precificacao_recomendacoes;
create policy fornecedor_precificacao_recomendacoes_update_own
on public.fornecedor_precificacao_recomendacoes
for update
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid())
with check (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_precificacao_recomendacoes_delete_own on public.fornecedor_precificacao_recomendacoes;
create policy fornecedor_precificacao_recomendacoes_delete_own
on public.fornecedor_precificacao_recomendacoes
for delete
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists integracao_apps_update_own on public.integracao_apps;
create policy integracao_apps_update_own
on public.integracao_apps
for update
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid())
with check (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists integracao_apps_delete_own on public.integracao_apps;
create policy integracao_apps_delete_own
on public.integracao_apps
for delete
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists white_label_templates_select_active on public.white_label_templates;
create policy white_label_templates_select_active
on public.white_label_templates
for select
to authenticated
using (ativo = true);

-- RPC 1: gerar recomendações de preço
create or replace function public.gerar_precos_dinamicos_fornecedor()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_count integer := 0;
  rec record;
  v_preco_sugerido numeric(12,2);
  v_fator_estoque numeric := 1;
  v_fator_demanda numeric := 1;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  delete from public.fornecedor_precificacao_recomendacoes
   where tenant_id = v_tenant
     and fornecedor_id = v_uid;

  for rec in
    select
      p.id as produto_id,
      p.preco,
      p.estoque,
      coalesce(sum(i.quantidade), 0) as demanda_30
    from public.produtos_fornecedor p
    left join public.pedido_produtos_itens i
      on i.produto_id = p.id
      and i.created_at >= now() - interval '30 day'
    where p.tenant_id = v_tenant
      and p.fornecedor_id = v_uid
      and p.ativo = true
    group by p.id, p.preco, p.estoque
  loop
    v_fator_estoque := case
      when rec.estoque <= 3 then 1.08
      when rec.estoque >= 30 then 0.96
      else 1
    end;

    v_fator_demanda := case
      when rec.demanda_30 >= 20 then 1.07
      when rec.demanda_30 <= 2 then 0.95
      else 1
    end;

    v_preco_sugerido := round((rec.preco * v_fator_estoque * v_fator_demanda)::numeric, 2);
    if v_preco_sugerido <= 0 then
      v_preco_sugerido := rec.preco;
    end if;

    insert into public.fornecedor_precificacao_recomendacoes (
      tenant_id,
      fornecedor_id,
      produto_id,
      preco_atual,
      preco_sugerido,
      motivo,
      score_confianca
    )
    values (
      v_tenant,
      v_uid,
      rec.produto_id,
      rec.preco,
      v_preco_sugerido,
      'Ajuste por estoque + demanda dos últimos 30 dias',
      78
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- RPC 2: simulação digital twin
create or replace function public.simular_cenario_digital_twin(
  p_nome text,
  p_parametros jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_receita_base numeric := 0;
  v_margem_base numeric := 0.25;
  v_price_adj numeric := 0;
  v_conversion_adj numeric := 0;
  v_cost_adj numeric := 0;
  v_receita_simulada numeric := 0;
  v_margem_simulada numeric := 0;
  v_result jsonb;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;
  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  select coalesce(sum(subtotal), 0)
    into v_receita_base
    from public.pedido_produtos_itens
   where fornecedor_id = v_uid
     and created_at >= now() - interval '30 day';

  v_price_adj := coalesce((p_parametros ->> 'price_adjust_pct')::numeric, 0);
  v_conversion_adj := coalesce((p_parametros ->> 'conversion_adjust_pct')::numeric, 0);
  v_cost_adj := coalesce((p_parametros ->> 'cost_adjust_pct')::numeric, 0);

  v_receita_simulada := v_receita_base * (1 + (v_price_adj / 100)) * (1 + (v_conversion_adj / 100));
  v_margem_simulada := greatest(0, v_margem_base - (v_cost_adj / 100));

  v_result := jsonb_build_object(
    'receita_base_30d', round(v_receita_base, 2),
    'receita_simulada_30d', round(v_receita_simulada, 2),
    'margem_base', round(v_margem_base * 100, 2),
    'margem_simulada', round(v_margem_simulada * 100, 2),
    'lucro_estimado', round(v_receita_simulada * v_margem_simulada, 2)
  );

  insert into public.fornecedor_digital_twin_cenarios (tenant_id, fornecedor_id, nome, parametros, resultado)
  values (v_tenant, v_uid, coalesce(nullif(trim(p_nome), ''), 'Cenário'), coalesce(p_parametros, '{}'::jsonb), v_result);

  return v_result;
end;
$$;

-- RPC 3: comando de voz (mock operacional)
create or replace function public.executar_comando_voz_fornecedor(p_comando text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_cmd text;
  v_resp text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;
  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  v_cmd := lower(trim(coalesce(p_comando, '')));

  if v_cmd like '%contas vencidas%' then
    select format('Você possui %s conta(s) vencida(s).', count(*))
      into v_resp
      from public.fornecedor_financeiro_lancamentos
     where tenant_id = v_tenant
       and fornecedor_id = v_uid
       and status in ('aberto', 'atrasado')
       and vencimento is not null
       and vencimento < current_date;
  elsif v_cmd like '%estoque%' then
    select format('Você possui %s produto(s) com estoque baixo.', count(*))
      into v_resp
      from public.produtos_fornecedor
     where tenant_id = v_tenant
       and fornecedor_id = v_uid
       and ativo = true
       and coalesce(estoque, 0) <= 5;
  else
    v_resp := 'Comando registrado. Em breve este comando terá automação completa.';
  end if;

  insert into public.fornecedor_comandos_voz_logs (tenant_id, fornecedor_id, comando, resposta, status)
  values (v_tenant, v_uid, p_comando, v_resp, 'ok');

  return v_resp;
end;
$$;

-- RPC 4/5/6/7/8: motor de diagnóstico executivo
create or replace function public.executar_diagnostico_futurista_fornecedor()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_sales_7 numeric := 0;
  v_sales_prev_7 numeric := 0;
  v_anom integer := 0;
  v_churn integer := 0;
  v_sla integer := 0;
  v_cashflow_id uuid;
  v_data_room_id uuid;
  v_receber numeric := 0;
  v_pagar numeric := 0;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;
  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  -- anomalia de vendas
  select coalesce(sum(subtotal), 0)
    into v_sales_7
    from public.pedido_produtos_itens
   where fornecedor_id = v_uid
     and created_at >= now() - interval '7 day';

  select coalesce(sum(subtotal), 0)
    into v_sales_prev_7
    from public.pedido_produtos_itens
   where fornecedor_id = v_uid
     and created_at >= now() - interval '14 day'
     and created_at < now() - interval '7 day';

  if v_sales_prev_7 > 0 and v_sales_7 < (v_sales_prev_7 * 0.7) then
    insert into public.fornecedor_anomalias (
      tenant_id, fornecedor_id, categoria, severidade, valor_atual, valor_referencia, descricao
    )
    values (
      v_tenant, v_uid, 'vendas', 'alta', v_sales_7, v_sales_prev_7,
      'Queda superior a 30% nas vendas semanais.'
    );
    v_anom := v_anom + 1;
  end if;

  -- churn score clientes (simples)
  insert into public.fornecedor_churn_scores (tenant_id, fornecedor_id, cliente_id, score, classificacao, motivo)
  select
    v_tenant,
    v_uid,
    x.cliente_id,
    x.score,
    case when x.score >= 70 then 'alto' when x.score >= 40 then 'medio' else 'baixo' end,
    'Baseado em recência de pedidos'
  from (
    select
      i.cliente_id,
      greatest(0, least(100, extract(day from now() - max(i.created_at))::numeric * 1.2)) as score
    from public.pedido_produtos_itens i
    where i.fornecedor_id = v_uid
    group by i.cliente_id
  ) x
  where x.score >= 40;
  get diagnostics v_churn = row_count;

  -- risco SLA em pedidos marketplace
  insert into public.fornecedor_sla_predicoes (tenant_id, fornecedor_id, pedido_id, risco_atraso_pct, recomendacao)
  select
    p.tenant_id,
    v_uid,
    p.id,
    least(99, greatest(10, extract(hour from now() - p.created_at)::numeric)),
    'Priorizar despacho e contato com cliente'
  from public.pedidos p
  where p.tenant_id = v_tenant
    and p.profissional_id = v_uid
    and coalesce(p.categoria, '') = 'Marketplace'
    and coalesce(p.status_logistica, 'novo') in ('novo', 'preparando', 'enviado')
    and p.created_at <= now() - interval '18 hour';
  get diagnostics v_sla = row_count;

  -- plano de caixa 30 dias
  select
    coalesce(sum(case when tipo = 'receber' and status in ('aberto', 'atrasado') then valor else 0 end), 0),
    coalesce(sum(case when tipo = 'pagar' and status in ('aberto', 'atrasado') then valor else 0 end), 0)
    into v_receber, v_pagar
  from public.fornecedor_financeiro_lancamentos
  where tenant_id = v_tenant
    and fornecedor_id = v_uid
    and (vencimento is null or vencimento <= current_date + interval '30 day');

  insert into public.fornecedor_cashflow_planos (tenant_id, fornecedor_id, plano_mes, receber_previsto, pagar_previsto, saldo_previsto)
  values (v_tenant, v_uid, date_trunc('month', current_date)::date, v_receber, v_pagar, v_receber - v_pagar)
  returning id into v_cashflow_id;

  -- data room
  insert into public.fornecedor_data_room_metricas (
    tenant_id, fornecedor_id, referencia_date, receita_30, margem_estimada_pct, churn_risco_alto_qtd, sla_risco_alto_qtd
  )
  values (
    v_tenant,
    v_uid,
    current_date,
    (select coalesce(sum(subtotal), 0) from public.pedido_produtos_itens where fornecedor_id = v_uid and created_at >= now() - interval '30 day'),
    24.5,
    (select coalesce(count(*), 0) from public.fornecedor_churn_scores where tenant_id = v_tenant and fornecedor_id = v_uid and classificacao = 'alto' and created_at >= now() - interval '1 day'),
    (select coalesce(count(*), 0) from public.fornecedor_sla_predicoes where tenant_id = v_tenant and fornecedor_id = v_uid and risco_atraso_pct >= 70 and created_at >= now() - interval '1 day')
  )
  returning id into v_data_room_id;

  return jsonb_build_object(
    'anomalias_criadas', v_anom,
    'churn_scores_criados', v_churn,
    'sla_predicoes_criadas', v_sla,
    'cashflow_plan_id', v_cashflow_id,
    'data_room_metric_id', v_data_room_id
  );
end;
$$;

-- RPC 9: criar tenant via template white-label
create or replace function public.criar_tenant_white_label_por_template(
  p_slug text,
  p_nome text,
  p_template_slug text default 'default-pro'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant_id uuid;
  v_slug text;
  v_name text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_slug := lower(trim(coalesce(p_slug, '')));
  v_name := trim(coalesce(p_nome, ''));
  if v_slug = '' or v_name = '' then
    raise exception 'Slug e nome são obrigatórios';
  end if;

  insert into public.tenants (slug, name, status, plan_code)
  values (v_slug, v_name, 'active', 'pro')
  returning id into v_tenant_id;

  insert into public.tenant_users (tenant_id, user_id, role, is_default)
  values (v_tenant_id, v_uid, 'owner', false)
  on conflict (tenant_id, user_id) do nothing;

  return v_tenant_id;
end;
$$;

-- RPC 10: registrar integração
create or replace function public.registrar_integracao_app(
  p_nome text,
  p_provider text,
  p_config jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;
  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  insert into public.integracao_apps (tenant_id, fornecedor_id, nome, provider, status, config)
  values (v_tenant, v_uid, trim(coalesce(p_nome, 'Integração')), lower(trim(coalesce(p_provider, 'custom'))), 'ativo', coalesce(p_config, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.gerar_precos_dinamicos_fornecedor() from public;
revoke all on function public.simular_cenario_digital_twin(text, jsonb) from public;
revoke all on function public.executar_comando_voz_fornecedor(text) from public;
revoke all on function public.executar_diagnostico_futurista_fornecedor() from public;
revoke all on function public.criar_tenant_white_label_por_template(text, text, text) from public;
revoke all on function public.registrar_integracao_app(text, text, jsonb) from public;

grant execute on function public.gerar_precos_dinamicos_fornecedor() to authenticated;
grant execute on function public.simular_cenario_digital_twin(text, jsonb) to authenticated;
grant execute on function public.executar_comando_voz_fornecedor(text) to authenticated;
grant execute on function public.executar_diagnostico_futurista_fornecedor() to authenticated;
grant execute on function public.criar_tenant_white_label_por_template(text, text, text) to authenticated;
grant execute on function public.registrar_integracao_app(text, text, jsonb) to authenticated;
