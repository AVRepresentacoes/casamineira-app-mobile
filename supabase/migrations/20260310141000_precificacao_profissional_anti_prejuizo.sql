-- Precificação profissional anti-prejuízo (custo total + break-even + margem mínima).

create table if not exists public.fornecedor_precificacao_custos_produto (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  produto_id uuid not null references public.produtos_fornecedor(id) on delete cascade,
  custo_produto numeric(12,2),
  custo_frete_medio numeric(12,2) not null default 0,
  custo_embalagem numeric(12,2) not null default 0,
  custo_fixo_rateio numeric(12,2) not null default 0,
  imposto_pct numeric(5,2) not null default 0,
  taxa_gateway_pct numeric(5,2) not null default 0,
  taxa_comissao_pct numeric(5,2) not null default 0,
  taxa_marketing_pct numeric(5,2) not null default 0,
  perda_operacional_pct numeric(5,2) not null default 0,
  margem_minima_pct numeric(5,2) not null default 15,
  margem_alvo_pct numeric(5,2) not null default 28,
  desconto_maximo_pct numeric(5,2) not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, fornecedor_id, produto_id)
);

alter table public.fornecedor_precificacao_custos_produto
  add constraint fornecedor_precificacao_custos_produto_pct_check
  check (
    imposto_pct >= 0 and taxa_gateway_pct >= 0 and taxa_comissao_pct >= 0
    and taxa_marketing_pct >= 0 and perda_operacional_pct >= 0
    and margem_minima_pct >= 0 and margem_alvo_pct >= 0 and desconto_maximo_pct >= 0
  );

create index if not exists fornecedor_precificacao_custos_produto_idx
  on public.fornecedor_precificacao_custos_produto (tenant_id, fornecedor_id, produto_id);

alter table public.fornecedor_precificacao_custos_produto enable row level security;
grant select, insert, update, delete on public.fornecedor_precificacao_custos_produto to authenticated;

drop policy if exists fornecedor_precificacao_custos_produto_select_own on public.fornecedor_precificacao_custos_produto;
create policy fornecedor_precificacao_custos_produto_select_own
on public.fornecedor_precificacao_custos_produto
for select
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_precificacao_custos_produto_insert_own on public.fornecedor_precificacao_custos_produto;
create policy fornecedor_precificacao_custos_produto_insert_own
on public.fornecedor_precificacao_custos_produto
for insert
to authenticated
with check (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_precificacao_custos_produto_update_own on public.fornecedor_precificacao_custos_produto;
create policy fornecedor_precificacao_custos_produto_update_own
on public.fornecedor_precificacao_custos_produto
for update
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid())
with check (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

drop policy if exists fornecedor_precificacao_custos_produto_delete_own on public.fornecedor_precificacao_custos_produto;
create policy fornecedor_precificacao_custos_produto_delete_own
on public.fornecedor_precificacao_custos_produto
for delete
to authenticated
using (tenant_id = public.current_tenant_id() and fornecedor_id = auth.uid());

create or replace function public.set_updated_at_fornecedor_precificacao_custos()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_fornecedor_precificacao_custos_produto_updated_at on public.fornecedor_precificacao_custos_produto;
create trigger trg_fornecedor_precificacao_custos_produto_updated_at
before update on public.fornecedor_precificacao_custos_produto
for each row
execute function public.set_updated_at_fornecedor_precificacao_custos();

alter table public.fornecedor_precificacao_recomendacoes
  add column if not exists custo_total_unitario numeric(12,2),
  add column if not exists preco_ponto_equilibrio numeric(12,2),
  add column if not exists preco_minimo_lucrativo numeric(12,2),
  add column if not exists margem_pct_sugerida numeric(6,2),
  add column if not exists lucro_unitario_sugerido numeric(12,2),
  add column if not exists risco_prejuizo boolean not null default false,
  add column if not exists observacoes text;

create or replace function public.salvar_custo_precificacao_produto(
  p_produto_id uuid,
  p_custo_produto numeric,
  p_custo_frete_medio numeric default 0,
  p_custo_embalagem numeric default 0,
  p_custo_fixo_rateio numeric default 0,
  p_imposto_pct numeric default 0,
  p_taxa_gateway_pct numeric default 0,
  p_taxa_comissao_pct numeric default 0,
  p_taxa_marketing_pct numeric default 0,
  p_perda_operacional_pct numeric default 0,
  p_margem_minima_pct numeric default 15,
  p_margem_alvo_pct numeric default 28,
  p_desconto_maximo_pct numeric default 10
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
  if p_produto_id is null then
    raise exception 'Produto é obrigatório';
  end if;

  insert into public.fornecedor_precificacao_custos_produto (
    tenant_id, fornecedor_id, produto_id, custo_produto, custo_frete_medio, custo_embalagem, custo_fixo_rateio,
    imposto_pct, taxa_gateway_pct, taxa_comissao_pct, taxa_marketing_pct, perda_operacional_pct,
    margem_minima_pct, margem_alvo_pct, desconto_maximo_pct
  )
  values (
    v_tenant, v_uid, p_produto_id, p_custo_produto, coalesce(p_custo_frete_medio, 0), coalesce(p_custo_embalagem, 0), coalesce(p_custo_fixo_rateio, 0),
    coalesce(p_imposto_pct, 0), coalesce(p_taxa_gateway_pct, 0), coalesce(p_taxa_comissao_pct, 0), coalesce(p_taxa_marketing_pct, 0), coalesce(p_perda_operacional_pct, 0),
    greatest(coalesce(p_margem_minima_pct, 15), 0), greatest(coalesce(p_margem_alvo_pct, 28), 0), greatest(coalesce(p_desconto_maximo_pct, 10), 0)
  )
  on conflict (tenant_id, fornecedor_id, produto_id)
  do update set
    custo_produto = excluded.custo_produto,
    custo_frete_medio = excluded.custo_frete_medio,
    custo_embalagem = excluded.custo_embalagem,
    custo_fixo_rateio = excluded.custo_fixo_rateio,
    imposto_pct = excluded.imposto_pct,
    taxa_gateway_pct = excluded.taxa_gateway_pct,
    taxa_comissao_pct = excluded.taxa_comissao_pct,
    taxa_marketing_pct = excluded.taxa_marketing_pct,
    perda_operacional_pct = excluded.perda_operacional_pct,
    margem_minima_pct = excluded.margem_minima_pct,
    margem_alvo_pct = excluded.margem_alvo_pct,
    desconto_maximo_pct = excluded.desconto_maximo_pct
  returning id into v_id;

  return v_id;
end;
$$;

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
  v_fator_estoque numeric := 1;
  v_fator_demanda numeric := 1;
  v_custo_produto numeric;
  v_custo_total numeric;
  v_pct_total numeric;
  v_break_even numeric;
  v_margem_min numeric;
  v_margem_alvo numeric;
  v_preco_min_lucro numeric;
  v_preco_sugerido numeric;
  v_lucro_unit numeric;
  v_margem_real numeric;
  v_risco_prejuizo boolean;
  v_obs text;
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
      coalesce(sum(i.quantidade), 0) as demanda_30,
      c.custo_produto,
      c.custo_frete_medio,
      c.custo_embalagem,
      c.custo_fixo_rateio,
      c.imposto_pct,
      c.taxa_gateway_pct,
      c.taxa_comissao_pct,
      c.taxa_marketing_pct,
      c.perda_operacional_pct,
      c.margem_minima_pct,
      c.margem_alvo_pct
    from public.produtos_fornecedor p
    left join public.pedido_produtos_itens i
      on i.produto_id = p.id
      and i.created_at >= now() - interval '30 day'
    left join public.fornecedor_precificacao_custos_produto c
      on c.produto_id = p.id
      and c.tenant_id = p.tenant_id
      and c.fornecedor_id = p.fornecedor_id
    where p.tenant_id = v_tenant
      and p.fornecedor_id = v_uid
      and p.ativo = true
    group by
      p.id, p.preco, p.estoque,
      c.custo_produto, c.custo_frete_medio, c.custo_embalagem, c.custo_fixo_rateio,
      c.imposto_pct, c.taxa_gateway_pct, c.taxa_comissao_pct, c.taxa_marketing_pct, c.perda_operacional_pct,
      c.margem_minima_pct, c.margem_alvo_pct
  loop
    -- fallback conservador quando custo de compra não foi cadastrado
    v_custo_produto := coalesce(rec.custo_produto, rec.preco * 0.62);
    v_custo_total := v_custo_produto
      + coalesce(rec.custo_frete_medio, 0)
      + coalesce(rec.custo_embalagem, 0)
      + coalesce(rec.custo_fixo_rateio, 0);

    v_pct_total := (
      coalesce(rec.imposto_pct, 0)
      + coalesce(rec.taxa_gateway_pct, 0)
      + coalesce(rec.taxa_comissao_pct, 0)
      + coalesce(rec.taxa_marketing_pct, 0)
      + coalesce(rec.perda_operacional_pct, 0)
    ) / 100;

    if v_pct_total >= 0.95 then
      v_pct_total := 0.95;
    end if;

    v_break_even := round((v_custo_total / (1 - v_pct_total))::numeric, 2);
    v_margem_min := greatest(coalesce(rec.margem_minima_pct, 15), 0);
    v_margem_alvo := greatest(coalesce(rec.margem_alvo_pct, 28), v_margem_min);
    v_preco_min_lucro := round((v_break_even * (1 + (v_margem_min / 100)))::numeric, 2);

    v_fator_estoque := case
      when rec.estoque <= 3 then 1.08
      when rec.estoque >= 30 then 0.97
      else 1
    end;

    v_fator_demanda := case
      when rec.demanda_30 >= 20 then 1.07
      when rec.demanda_30 <= 2 then 0.96
      else 1
    end;

    v_preco_sugerido := round((v_break_even * (1 + (v_margem_alvo / 100)) * v_fator_estoque * v_fator_demanda)::numeric, 2);
    if v_preco_sugerido < v_preco_min_lucro then
      v_preco_sugerido := v_preco_min_lucro;
    end if;

    v_lucro_unit := round(((v_preco_sugerido * (1 - v_pct_total)) - v_custo_total)::numeric, 2);
    v_margem_real := case when v_preco_sugerido > 0 then round(((v_lucro_unit / v_preco_sugerido) * 100)::numeric, 2) else 0 end;
    v_risco_prejuizo := rec.preco < v_preco_min_lucro;
    v_obs := case when rec.custo_produto is null then 'Custo de compra não informado. Usado fallback conservador.' else null end;

    insert into public.fornecedor_precificacao_recomendacoes (
      tenant_id,
      fornecedor_id,
      produto_id,
      preco_atual,
      preco_sugerido,
      motivo,
      score_confianca,
      custo_total_unitario,
      preco_ponto_equilibrio,
      preco_minimo_lucrativo,
      margem_pct_sugerida,
      lucro_unitario_sugerido,
      risco_prejuizo,
      observacoes
    )
    values (
      v_tenant,
      v_uid,
      rec.produto_id,
      rec.preco,
      v_preco_sugerido,
      'Modelo anti-prejuízo com custo total + taxas + margem mínima',
      case when rec.custo_produto is null then 62 else 88 end,
      v_custo_total,
      v_break_even,
      v_preco_min_lucro,
      v_margem_real,
      v_lucro_unit,
      v_risco_prejuizo,
      v_obs
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.salvar_custo_precificacao_produto(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric) from public;
revoke all on function public.gerar_precos_dinamicos_fornecedor() from public;

grant execute on function public.salvar_custo_precificacao_produto(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric) to authenticated;
grant execute on function public.gerar_precos_dinamicos_fornecedor() to authenticated;
