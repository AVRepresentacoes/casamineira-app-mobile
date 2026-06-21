-- Camada futurista ERP: copilot, previsões, autopilot, alertas, risco e benchmark.

create table if not exists public.fornecedor_alertas_inteligentes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  severidade text not null default 'media',
  titulo text not null,
  descricao text not null,
  status text not null default 'aberto',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fornecedor_alertas_inteligentes_severidade_check check (severidade in ('baixa', 'media', 'alta', 'critica')),
  constraint fornecedor_alertas_inteligentes_status_check check (status in ('aberto', 'resolvido', 'ignorado'))
);

create index if not exists fornecedor_alertas_inteligentes_idx
  on public.fornecedor_alertas_inteligentes (tenant_id, fornecedor_id, status, severidade, created_at desc);

create table if not exists public.fornecedor_workflow_regras (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  evento text not null,
  condicao jsonb not null default '{}'::jsonb,
  acao jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fornecedor_workflow_regras_idx
  on public.fornecedor_workflow_regras (tenant_id, fornecedor_id, ativo, created_at desc);

create table if not exists public.fornecedor_workflow_execucoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  regra_id uuid references public.fornecedor_workflow_regras(id) on delete set null,
  evento text not null,
  resultado text not null default 'ok',
  detalhes jsonb,
  created_at timestamptz not null default now()
);

create index if not exists fornecedor_workflow_execucoes_idx
  on public.fornecedor_workflow_execucoes (tenant_id, fornecedor_id, created_at desc);

create table if not exists public.fornecedor_risco_eventos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  score numeric(5,2) not null,
  categoria text not null,
  referencia_tipo text,
  referencia_id uuid,
  descricao text,
  created_at timestamptz not null default now(),
  constraint fornecedor_risco_eventos_score_check check (score >= 0 and score <= 100)
);

create index if not exists fornecedor_risco_eventos_idx
  on public.fornecedor_risco_eventos (tenant_id, fornecedor_id, score desc, created_at desc);

create or replace function public.set_updated_at_fornecedor_futuristic()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_fornecedor_alertas_inteligentes_updated_at on public.fornecedor_alertas_inteligentes;
create trigger trg_fornecedor_alertas_inteligentes_updated_at
before update on public.fornecedor_alertas_inteligentes
for each row
execute function public.set_updated_at_fornecedor_futuristic();

drop trigger if exists trg_fornecedor_workflow_regras_updated_at on public.fornecedor_workflow_regras;
create trigger trg_fornecedor_workflow_regras_updated_at
before update on public.fornecedor_workflow_regras
for each row
execute function public.set_updated_at_fornecedor_futuristic();

alter table public.fornecedor_alertas_inteligentes enable row level security;
alter table public.fornecedor_workflow_regras enable row level security;
alter table public.fornecedor_workflow_execucoes enable row level security;
alter table public.fornecedor_risco_eventos enable row level security;

grant select, insert, update, delete on public.fornecedor_alertas_inteligentes to authenticated;
grant select, insert, update, delete on public.fornecedor_workflow_regras to authenticated;
grant select on public.fornecedor_workflow_execucoes to authenticated;
grant select, insert on public.fornecedor_risco_eventos to authenticated;

drop policy if exists fornecedor_alertas_inteligentes_select_own on public.fornecedor_alertas_inteligentes;
create policy fornecedor_alertas_inteligentes_select_own
on public.fornecedor_alertas_inteligentes
for select
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_alertas_inteligentes_insert_own on public.fornecedor_alertas_inteligentes;
create policy fornecedor_alertas_inteligentes_insert_own
on public.fornecedor_alertas_inteligentes
for insert
to authenticated
with check (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_alertas_inteligentes_update_own on public.fornecedor_alertas_inteligentes;
create policy fornecedor_alertas_inteligentes_update_own
on public.fornecedor_alertas_inteligentes
for update
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid())
with check (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_alertas_inteligentes_delete_own on public.fornecedor_alertas_inteligentes;
create policy fornecedor_alertas_inteligentes_delete_own
on public.fornecedor_alertas_inteligentes
for delete
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_workflow_regras_select_own on public.fornecedor_workflow_regras;
create policy fornecedor_workflow_regras_select_own
on public.fornecedor_workflow_regras
for select
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_workflow_regras_insert_own on public.fornecedor_workflow_regras;
create policy fornecedor_workflow_regras_insert_own
on public.fornecedor_workflow_regras
for insert
to authenticated
with check (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_workflow_regras_update_own on public.fornecedor_workflow_regras;
create policy fornecedor_workflow_regras_update_own
on public.fornecedor_workflow_regras
for update
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid())
with check (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_workflow_regras_delete_own on public.fornecedor_workflow_regras;
create policy fornecedor_workflow_regras_delete_own
on public.fornecedor_workflow_regras
for delete
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_workflow_execucoes_select_own on public.fornecedor_workflow_execucoes;
create policy fornecedor_workflow_execucoes_select_own
on public.fornecedor_workflow_execucoes
for select
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_risco_eventos_select_own on public.fornecedor_risco_eventos;
create policy fornecedor_risco_eventos_select_own
on public.fornecedor_risco_eventos
for select
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_risco_eventos_insert_own on public.fornecedor_risco_eventos;
create policy fornecedor_risco_eventos_insert_own
on public.fornecedor_risco_eventos
for insert
to authenticated
with check (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

create or replace function public.gerar_alertas_inteligentes_fornecedor()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_count integer := 0;
  v_low_stock integer := 0;
  v_overdue integer := 0;
  v_pending_conc integer := 0;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  -- limpa alertas abertos antigos para evitar duplicidade
  delete from public.fornecedor_alertas_inteligentes
   where tenant_id = v_tenant
     and fornecedor_id = v_uid
     and status = 'aberto';

  select count(*)
    into v_low_stock
    from public.produtos_fornecedor p
   where p.tenant_id = v_tenant
     and p.fornecedor_id = v_uid
     and p.ativo = true
     and coalesce(p.estoque, 0) <= 5;

  if v_low_stock > 0 then
    insert into public.fornecedor_alertas_inteligentes (
      tenant_id, fornecedor_id, tipo, severidade, titulo, descricao, metadata
    ) values (
      v_tenant, v_uid, 'estoque', 'alta',
      'Estoque crítico detectado',
      format('%s produto(s) com estoque baixo.', v_low_stock),
      jsonb_build_object('qtd_produtos', v_low_stock)
    );
    v_count := v_count + 1;
  end if;

  select count(*)
    into v_overdue
    from public.fornecedor_financeiro_lancamentos f
   where f.tenant_id = v_tenant
     and f.fornecedor_id = v_uid
     and f.status = 'aberto'
     and f.vencimento is not null
     and f.vencimento < current_date;

  if v_overdue > 0 then
    insert into public.fornecedor_alertas_inteligentes (
      tenant_id, fornecedor_id, tipo, severidade, titulo, descricao, metadata
    ) values (
      v_tenant, v_uid, 'financeiro', 'critica',
      'Contas vencidas em aberto',
      format('%s lançamento(s) em atraso precisam de ação.', v_overdue),
      jsonb_build_object('qtd_atrasados', v_overdue)
    );
    v_count := v_count + 1;
  end if;

  select count(*)
    into v_pending_conc
    from public.fornecedor_conciliacao_extratos c
   where c.tenant_id = v_tenant
     and c.fornecedor_id = v_uid
     and c.status = 'pendente';

  if v_pending_conc > 0 then
    insert into public.fornecedor_alertas_inteligentes (
      tenant_id, fornecedor_id, tipo, severidade, titulo, descricao, metadata
    ) values (
      v_tenant, v_uid, 'conciliacao', 'media',
      'Conciliações pendentes',
      format('%s registro(s) de extrato pendentes de conciliação.', v_pending_conc),
      jsonb_build_object('qtd_pendentes', v_pending_conc)
    );
    v_count := v_count + 1;
  end if;

  return v_count;
end;
$$;

create or replace function public.run_fornecedor_autopilot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_updated integer := 0;
  v_alerts integer := 0;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  update public.fornecedor_financeiro_lancamentos
     set status = 'atrasado'
   where tenant_id = v_tenant
     and fornecedor_id = v_uid
     and status = 'aberto'
     and vencimento is not null
     and vencimento < current_date;

  get diagnostics v_updated = row_count;

  -- registra execução de regras ativas (MVP)
  insert into public.fornecedor_workflow_execucoes (tenant_id, fornecedor_id, regra_id, evento, resultado, detalhes)
  select
    v_tenant,
    v_uid,
    r.id,
    r.evento,
    'ok',
    jsonb_build_object('modo', 'autopilot', 'descricao', 'Regra avaliada automaticamente')
  from public.fornecedor_workflow_regras r
  where r.tenant_id = v_tenant
    and r.fornecedor_id = v_uid
    and r.ativo = true;

  v_alerts := public.gerar_alertas_inteligentes_fornecedor();

  return jsonb_build_object(
    'lancamentos_atualizados', v_updated,
    'alertas_gerados', v_alerts
  );
end;
$$;

create or replace function public.get_fornecedor_copilot_snapshot()
returns table (
  receber_30 numeric,
  pagar_30 numeric,
  saldo_30 numeric,
  risco_medio numeric,
  risco_alto_qtd integer,
  alertas_abertos integer,
  conciliacoes_pendentes integer,
  pipeline_valor numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_receber_30 numeric := 0;
  v_pagar_30 numeric := 0;
  v_risco_medio numeric := 0;
  v_risco_alto_qtd integer := 0;
  v_alertas_abertos integer := 0;
  v_conciliacoes_pendentes integer := 0;
  v_pipeline_valor numeric := 0;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  select coalesce(sum(valor), 0)
    into v_receber_30
    from public.fornecedor_financeiro_lancamentos f
   where f.tenant_id = v_tenant
     and f.fornecedor_id = v_uid
     and f.tipo = 'receber'
     and f.status in ('aberto', 'atrasado')
     and (f.vencimento is null or f.vencimento <= (current_date + interval '30 day'));

  select coalesce(sum(valor), 0)
    into v_pagar_30
    from public.fornecedor_financeiro_lancamentos f
   where f.tenant_id = v_tenant
     and f.fornecedor_id = v_uid
     and f.tipo = 'pagar'
     and f.status in ('aberto', 'atrasado')
     and (f.vencimento is null or f.vencimento <= (current_date + interval '30 day'));

  select coalesce(avg(score), 0), coalesce(sum(case when score >= 70 then 1 else 0 end), 0)
    into v_risco_medio, v_risco_alto_qtd
    from public.fornecedor_risco_eventos r
   where r.tenant_id = v_tenant
     and r.fornecedor_id = v_uid
     and r.created_at >= now() - interval '60 day';

  select count(*)
    into v_alertas_abertos
    from public.fornecedor_alertas_inteligentes a
   where a.tenant_id = v_tenant
     and a.fornecedor_id = v_uid
     and a.status = 'aberto';

  select count(*)
    into v_conciliacoes_pendentes
    from public.fornecedor_conciliacao_extratos c
   where c.tenant_id = v_tenant
     and c.fornecedor_id = v_uid
     and c.status = 'pendente';

  select coalesce(sum(valor_potencial), 0)
    into v_pipeline_valor
    from public.fornecedor_crm_leads l
   where l.tenant_id = v_tenant
     and l.fornecedor_id = v_uid
     and l.etapa in ('novo', 'contato', 'proposta');

  return query
  select
    v_receber_30,
    v_pagar_30,
    (v_receber_30 - v_pagar_30),
    coalesce(v_risco_medio, 0),
    coalesce(v_risco_alto_qtd, 0),
    v_alertas_abertos,
    v_conciliacoes_pendentes,
    v_pipeline_valor;
end;
$$;

create or replace function public.get_fornecedor_benchmark_snapshot()
returns table (
  vendas_30 numeric,
  media_mercado_30 numeric,
  indice_vendas numeric,
  ticket_medio numeric,
  ticket_medio_mercado numeric,
  indice_ticket numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_vendas_30 numeric := 0;
  v_media_mercado_30 numeric := 0;
  v_ticket_medio numeric := 0;
  v_ticket_medio_mercado numeric := 0;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  select coalesce(sum(i.subtotal), 0)
    into v_vendas_30
    from public.pedido_produtos_itens i
   where i.fornecedor_id = v_uid
     and i.created_at >= now() - interval '30 day';

  with vendas_fornecedor as (
    select i.fornecedor_id, coalesce(sum(i.subtotal), 0)::numeric as vendas
    from public.pedido_produtos_itens i
    where i.created_at >= now() - interval '30 day'
    group by i.fornecedor_id
  )
  select coalesce(avg(vf.vendas), 0)
    into v_media_mercado_30
    from vendas_fornecedor vf;

  select coalesce(avg(i.subtotal), 0)
    into v_ticket_medio
    from public.pedido_produtos_itens i
   where i.fornecedor_id = v_uid
     and i.created_at >= now() - interval '30 day';

  select coalesce(avg(i.subtotal), 0)
    into v_ticket_medio_mercado
    from public.pedido_produtos_itens i
   where i.created_at >= now() - interval '30 day';

  return query
  select
    v_vendas_30,
    v_media_mercado_30,
    case when v_media_mercado_30 > 0 then (v_vendas_30 / v_media_mercado_30) else 0 end,
    v_ticket_medio,
    v_ticket_medio_mercado,
    case when v_ticket_medio_mercado > 0 then (v_ticket_medio / v_ticket_medio_mercado) else 0 end;
end;
$$;

revoke all on function public.gerar_alertas_inteligentes_fornecedor() from public;
revoke all on function public.run_fornecedor_autopilot() from public;
revoke all on function public.get_fornecedor_copilot_snapshot() from public;
revoke all on function public.get_fornecedor_benchmark_snapshot() from public;

grant execute on function public.gerar_alertas_inteligentes_fornecedor() to authenticated;
grant execute on function public.run_fornecedor_autopilot() to authenticated;
grant execute on function public.get_fornecedor_copilot_snapshot() to authenticated;
grant execute on function public.get_fornecedor_benchmark_snapshot() to authenticated;
