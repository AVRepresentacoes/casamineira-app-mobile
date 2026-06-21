-- ERP Fornecedor: financeiro avançado (pagar/receber), conciliação e fiscal.

create table if not exists public.fornecedor_financeiro_lancamentos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  categoria text,
  descricao text not null,
  valor numeric(12,2) not null,
  vencimento date,
  status text not null default 'aberto',
  pago_em date,
  origem text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fornecedor_financeiro_lancamentos_tipo_check check (tipo in ('pagar', 'receber')),
  constraint fornecedor_financeiro_lancamentos_status_check check (status in ('aberto', 'pago', 'atrasado', 'cancelado')),
  constraint fornecedor_financeiro_lancamentos_valor_check check (valor >= 0)
);

create index if not exists fornecedor_financeiro_lancamentos_idx
  on public.fornecedor_financeiro_lancamentos (tenant_id, fornecedor_id, tipo, status, vencimento, created_at desc);

create table if not exists public.fornecedor_conciliacao_extratos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  data_movimento date not null,
  descricao text not null,
  valor numeric(12,2) not null,
  tipo text not null,
  status text not null default 'pendente',
  referencia_lancamento_id uuid references public.fornecedor_financeiro_lancamentos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fornecedor_conciliacao_extratos_tipo_check check (tipo in ('credito', 'debito')),
  constraint fornecedor_conciliacao_extratos_status_check check (status in ('pendente', 'conciliado')),
  constraint fornecedor_conciliacao_extratos_valor_check check (valor >= 0)
);

create index if not exists fornecedor_conciliacao_extratos_idx
  on public.fornecedor_conciliacao_extratos (tenant_id, fornecedor_id, status, data_movimento desc);

create table if not exists public.fornecedor_documentos_fiscais (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  numero text,
  serie text,
  chave_acesso text,
  cliente_nome text,
  valor_total numeric(12,2) not null default 0,
  emissao_em date not null default current_date,
  status text not null default 'emitido',
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fornecedor_documentos_fiscais_tipo_check check (tipo in ('nfe', 'nfse', 'recibo')),
  constraint fornecedor_documentos_fiscais_status_check check (status in ('emitido', 'cancelado')),
  constraint fornecedor_documentos_fiscais_valor_check check (valor_total >= 0)
);

create index if not exists fornecedor_documentos_fiscais_idx
  on public.fornecedor_documentos_fiscais (tenant_id, fornecedor_id, tipo, emissao_em desc, created_at desc);

create or replace function public.set_updated_at_fornecedor_financeiro_fiscal()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_fornecedor_financeiro_lancamentos_updated_at on public.fornecedor_financeiro_lancamentos;
create trigger trg_fornecedor_financeiro_lancamentos_updated_at
before update on public.fornecedor_financeiro_lancamentos
for each row
execute function public.set_updated_at_fornecedor_financeiro_fiscal();

drop trigger if exists trg_fornecedor_conciliacao_extratos_updated_at on public.fornecedor_conciliacao_extratos;
create trigger trg_fornecedor_conciliacao_extratos_updated_at
before update on public.fornecedor_conciliacao_extratos
for each row
execute function public.set_updated_at_fornecedor_financeiro_fiscal();

drop trigger if exists trg_fornecedor_documentos_fiscais_updated_at on public.fornecedor_documentos_fiscais;
create trigger trg_fornecedor_documentos_fiscais_updated_at
before update on public.fornecedor_documentos_fiscais
for each row
execute function public.set_updated_at_fornecedor_financeiro_fiscal();

alter table public.fornecedor_financeiro_lancamentos enable row level security;
alter table public.fornecedor_conciliacao_extratos enable row level security;
alter table public.fornecedor_documentos_fiscais enable row level security;

grant select, insert, update, delete on public.fornecedor_financeiro_lancamentos to authenticated;
grant select, insert, update, delete on public.fornecedor_conciliacao_extratos to authenticated;
grant select, insert, update, delete on public.fornecedor_documentos_fiscais to authenticated;

drop policy if exists fornecedor_financeiro_lancamentos_select_own on public.fornecedor_financeiro_lancamentos;
create policy fornecedor_financeiro_lancamentos_select_own
on public.fornecedor_financeiro_lancamentos
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_financeiro_lancamentos_insert_own on public.fornecedor_financeiro_lancamentos;
create policy fornecedor_financeiro_lancamentos_insert_own
on public.fornecedor_financeiro_lancamentos
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_financeiro_lancamentos_update_own on public.fornecedor_financeiro_lancamentos;
create policy fornecedor_financeiro_lancamentos_update_own
on public.fornecedor_financeiro_lancamentos
for update
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
)
with check (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_financeiro_lancamentos_delete_own on public.fornecedor_financeiro_lancamentos;
create policy fornecedor_financeiro_lancamentos_delete_own
on public.fornecedor_financeiro_lancamentos
for delete
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_conciliacao_extratos_select_own on public.fornecedor_conciliacao_extratos;
create policy fornecedor_conciliacao_extratos_select_own
on public.fornecedor_conciliacao_extratos
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_conciliacao_extratos_insert_own on public.fornecedor_conciliacao_extratos;
create policy fornecedor_conciliacao_extratos_insert_own
on public.fornecedor_conciliacao_extratos
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_conciliacao_extratos_update_own on public.fornecedor_conciliacao_extratos;
create policy fornecedor_conciliacao_extratos_update_own
on public.fornecedor_conciliacao_extratos
for update
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
)
with check (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_conciliacao_extratos_delete_own on public.fornecedor_conciliacao_extratos;
create policy fornecedor_conciliacao_extratos_delete_own
on public.fornecedor_conciliacao_extratos
for delete
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_documentos_fiscais_select_own on public.fornecedor_documentos_fiscais;
create policy fornecedor_documentos_fiscais_select_own
on public.fornecedor_documentos_fiscais
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_documentos_fiscais_insert_own on public.fornecedor_documentos_fiscais;
create policy fornecedor_documentos_fiscais_insert_own
on public.fornecedor_documentos_fiscais
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_documentos_fiscais_update_own on public.fornecedor_documentos_fiscais;
create policy fornecedor_documentos_fiscais_update_own
on public.fornecedor_documentos_fiscais
for update
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
)
with check (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_documentos_fiscais_delete_own on public.fornecedor_documentos_fiscais;
create policy fornecedor_documentos_fiscais_delete_own
on public.fornecedor_documentos_fiscais
for delete
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

create or replace function public.conciliar_lancamento_extrato(
  p_lancamento_id uuid,
  p_extrato_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
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
     set status = 'pago',
         pago_em = coalesce(pago_em, current_date)
   where id = p_lancamento_id
     and tenant_id = v_tenant
     and fornecedor_id = v_uid;

  update public.fornecedor_conciliacao_extratos
     set status = 'conciliado',
         referencia_lancamento_id = p_lancamento_id
   where id = p_extrato_id
     and tenant_id = v_tenant
     and fornecedor_id = v_uid;
end;
$$;

revoke all on function public.conciliar_lancamento_extrato(uuid, uuid) from public;
grant execute on function public.conciliar_lancamento_extrato(uuid, uuid) to authenticated;
