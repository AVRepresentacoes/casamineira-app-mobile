-- Metas do Power BI do fornecedor: dono, SLA e acompanhamento.

create table if not exists public.fornecedor_bi_metas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  responsavel_id uuid references auth.users(id) on delete set null,
  titulo text not null,
  kpi_chave text not null,
  meta_valor numeric(14,2) not null,
  valor_atual numeric(14,2) not null default 0,
  unidade text not null default 'currency',
  prazo date,
  status text not null default 'aberta',
  progresso_pct numeric(5,2) not null default 0,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fornecedor_bi_metas
  drop constraint if exists fornecedor_bi_metas_meta_valor_check,
  drop constraint if exists fornecedor_bi_metas_valor_atual_check,
  drop constraint if exists fornecedor_bi_metas_progresso_check,
  drop constraint if exists fornecedor_bi_metas_status_check,
  drop constraint if exists fornecedor_bi_metas_unidade_check;

alter table public.fornecedor_bi_metas
  add constraint fornecedor_bi_metas_meta_valor_check
  check (meta_valor >= 0),
  add constraint fornecedor_bi_metas_valor_atual_check
  check (valor_atual >= 0),
  add constraint fornecedor_bi_metas_progresso_check
  check (progresso_pct >= 0 and progresso_pct <= 100),
  add constraint fornecedor_bi_metas_status_check
  check (status in ('aberta', 'em_risco', 'concluida', 'pausada')),
  add constraint fornecedor_bi_metas_unidade_check
  check (unidade in ('currency', 'percent', 'count'));

create index if not exists fornecedor_bi_metas_tenant_created_idx
  on public.fornecedor_bi_metas (tenant_id, created_at desc);

create index if not exists fornecedor_bi_metas_tenant_status_idx
  on public.fornecedor_bi_metas (tenant_id, status, prazo);

create or replace function public.set_updated_at_fornecedor_bi_metas()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_fornecedor_bi_metas_updated_at on public.fornecedor_bi_metas;
create trigger trg_fornecedor_bi_metas_updated_at
before update on public.fornecedor_bi_metas
for each row
execute function public.set_updated_at_fornecedor_bi_metas();

alter table public.fornecedor_bi_metas enable row level security;

drop policy if exists fornecedor_bi_metas_select_tenant on public.fornecedor_bi_metas;
create policy fornecedor_bi_metas_select_tenant
on public.fornecedor_bi_metas
for select
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists fornecedor_bi_metas_insert_own on public.fornecedor_bi_metas;
create policy fornecedor_bi_metas_insert_own
on public.fornecedor_bi_metas
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_bi_metas_update_tenant on public.fornecedor_bi_metas;
create policy fornecedor_bi_metas_update_tenant
on public.fornecedor_bi_metas
for update
to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

grant select, insert, update on public.fornecedor_bi_metas to authenticated;

create or replace function public.listar_fornecedor_bi_metas(
  p_limit integer default 50
)
returns table (
  id uuid,
  titulo text,
  kpi_chave text,
  meta_valor numeric,
  valor_atual numeric,
  unidade text,
  prazo date,
  status text,
  progresso_pct numeric,
  observacoes text,
  responsavel_id uuid,
  responsavel_nome text,
  responsavel_email text,
  responsavel_role text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_limit integer;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 50), 200));

  return query
  select
    m.id,
    m.titulo,
    m.kpi_chave,
    m.meta_valor,
    m.valor_atual,
    m.unidade,
    m.prazo,
    m.status,
    m.progresso_pct,
    m.observacoes,
    m.responsavel_id,
    coalesce(pr.name, split_part(coalesce(ur.email, ''), '@', 1), 'Usuário') as responsavel_nome,
    coalesce(ur.email, '') as responsavel_email,
    coalesce(tu.role, 'staff') as responsavel_role,
    m.created_at,
    m.updated_at
  from public.fornecedor_bi_metas m
  left join public.profiles pr on pr.id = m.responsavel_id
  left join auth.users ur on ur.id = m.responsavel_id
  left join public.tenant_users tu
    on tu.tenant_id = m.tenant_id
   and tu.user_id = m.responsavel_id
  where m.tenant_id = v_tenant
  order by
    case m.status
      when 'em_risco' then 0
      when 'aberta' then 1
      when 'pausada' then 2
      else 3
    end,
    m.prazo asc nulls last,
    m.created_at desc
  limit v_limit;
end;
$$;

create or replace function public.salvar_fornecedor_bi_meta(
  p_titulo text,
  p_kpi_chave text,
  p_meta_valor numeric,
  p_unidade text default 'currency',
  p_prazo date default null,
  p_responsavel_id uuid default null,
  p_observacoes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_role text;
  v_id uuid;
  v_unidade text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  select tu.role
    into v_role
    from public.tenant_users tu
   where tu.tenant_id = v_tenant
     and tu.user_id = v_uid
   limit 1;

  if v_role not in ('owner', 'admin', 'manager') then
    raise exception 'Sem permissão para criar meta';
  end if;

  if trim(coalesce(p_titulo, '')) = '' then
    raise exception 'Título é obrigatório';
  end if;

  if trim(coalesce(p_kpi_chave, '')) = '' then
    raise exception 'KPI é obrigatório';
  end if;

  if coalesce(p_meta_valor, 0) <= 0 then
    raise exception 'Valor da meta deve ser maior que zero';
  end if;

  v_unidade := lower(trim(coalesce(p_unidade, 'currency')));
  if v_unidade not in ('currency', 'percent', 'count') then
    raise exception 'Unidade inválida';
  end if;

  if p_responsavel_id is not null then
    if not exists (
      select 1
        from public.tenant_users tu
       where tu.tenant_id = v_tenant
         and tu.user_id = p_responsavel_id
    ) then
      raise exception 'Responsável não pertence ao tenant';
    end if;
  end if;

  insert into public.fornecedor_bi_metas (
    tenant_id,
    fornecedor_id,
    responsavel_id,
    titulo,
    kpi_chave,
    meta_valor,
    unidade,
    prazo,
    observacoes
  ) values (
    v_tenant,
    v_uid,
    p_responsavel_id,
    trim(p_titulo),
    lower(trim(p_kpi_chave)),
    p_meta_valor,
    v_unidade,
    p_prazo,
    nullif(trim(coalesce(p_observacoes, '')), '')
  ) returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.atualizar_fornecedor_bi_meta_status(
  p_meta_id uuid,
  p_status text,
  p_valor_atual numeric default null,
  p_progresso_pct numeric default null,
  p_observacoes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_role text;
  v_status text;
  v_meta_valor numeric;
  v_novo_valor numeric;
  v_novo_progresso numeric;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  select tu.role
    into v_role
    from public.tenant_users tu
   where tu.tenant_id = v_tenant
     and tu.user_id = v_uid
   limit 1;

  if v_role not in ('owner', 'admin', 'manager') then
    raise exception 'Sem permissão para atualizar meta';
  end if;

  if p_meta_id is null then
    raise exception 'Meta inválida';
  end if;

  v_status := lower(trim(coalesce(p_status, '')));
  if v_status not in ('aberta', 'em_risco', 'concluida', 'pausada') then
    raise exception 'Status inválido';
  end if;

  select m.meta_valor, m.valor_atual
    into v_meta_valor, v_novo_valor
    from public.fornecedor_bi_metas m
   where m.id = p_meta_id
     and m.tenant_id = v_tenant
   limit 1;

  if v_meta_valor is null then
    raise exception 'Meta não encontrada';
  end if;

  if p_valor_atual is not null then
    v_novo_valor := greatest(p_valor_atual, 0);
  end if;

  if p_progresso_pct is not null then
    v_novo_progresso := greatest(0, least(p_progresso_pct, 100));
  else
    v_novo_progresso := case when v_meta_valor > 0 then greatest(0, least((v_novo_valor / v_meta_valor) * 100, 100)) else 0 end;
  end if;

  update public.fornecedor_bi_metas
     set status = v_status,
         valor_atual = v_novo_valor,
         progresso_pct = v_novo_progresso,
         observacoes = coalesce(nullif(trim(coalesce(p_observacoes, '')), ''), observacoes)
   where id = p_meta_id
     and tenant_id = v_tenant;
end;
$$;

revoke all on function public.listar_fornecedor_bi_metas(integer) from public;
revoke all on function public.salvar_fornecedor_bi_meta(text, text, numeric, text, date, uuid, text) from public;
revoke all on function public.atualizar_fornecedor_bi_meta_status(uuid, text, numeric, numeric, text) from public;

grant execute on function public.listar_fornecedor_bi_metas(integer) to authenticated;
grant execute on function public.salvar_fornecedor_bi_meta(text, text, numeric, text, date, uuid, text) to authenticated;
grant execute on function public.atualizar_fornecedor_bi_meta_status(uuid, text, numeric, numeric, text) to authenticated;
