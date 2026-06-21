-- ERP avançado do fornecedor: estoque, compras e CRM.

create table if not exists public.fornecedor_estoque_movimentos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  produto_id uuid references public.produtos_fornecedor(id) on delete set null,
  tipo text not null,
  quantidade integer not null,
  motivo text,
  custo_unitario numeric(12,2),
  created_at timestamptz not null default now(),
  constraint fornecedor_estoque_movimentos_tipo_check check (tipo in ('entrada', 'saida', 'ajuste')),
  constraint fornecedor_estoque_movimentos_qtd_check check (quantidade > 0),
  constraint fornecedor_estoque_movimentos_custo_check check (custo_unitario is null or custo_unitario >= 0)
);

create index if not exists fornecedor_estoque_movimentos_idx
  on public.fornecedor_estoque_movimentos (tenant_id, fornecedor_id, created_at desc);

alter table public.fornecedor_estoque_movimentos enable row level security;
grant select, insert on public.fornecedor_estoque_movimentos to authenticated;

drop policy if exists fornecedor_estoque_movimentos_select_own on public.fornecedor_estoque_movimentos;
create policy fornecedor_estoque_movimentos_select_own
on public.fornecedor_estoque_movimentos
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_estoque_movimentos_insert_own on public.fornecedor_estoque_movimentos;
create policy fornecedor_estoque_movimentos_insert_own
on public.fornecedor_estoque_movimentos
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

create table if not exists public.fornecedor_compras (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  numero text,
  fornecedor_nome text not null,
  status text not null default 'rascunho',
  data_emissao date not null default current_date,
  data_prevista date,
  valor_total numeric(12,2) not null default 0,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fornecedor_compras_status_check check (status in ('rascunho', 'emitida', 'parcial', 'recebida', 'cancelada')),
  constraint fornecedor_compras_total_check check (valor_total >= 0)
);

create index if not exists fornecedor_compras_idx
  on public.fornecedor_compras (tenant_id, fornecedor_id, status, created_at desc);

create table if not exists public.fornecedor_compras_itens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  compra_id uuid not null references public.fornecedor_compras(id) on delete cascade,
  produto_nome text not null,
  quantidade integer not null,
  custo_unitario numeric(12,2) not null,
  subtotal numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fornecedor_compras_itens_qtd_check check (quantidade > 0),
  constraint fornecedor_compras_itens_custo_check check (custo_unitario >= 0),
  constraint fornecedor_compras_itens_subtotal_check check (subtotal >= 0)
);

create index if not exists fornecedor_compras_itens_idx
  on public.fornecedor_compras_itens (tenant_id, compra_id, created_at desc);

create or replace function public.set_updated_at_fornecedor_erp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_fornecedor_compras_updated_at on public.fornecedor_compras;
create trigger trg_fornecedor_compras_updated_at
before update on public.fornecedor_compras
for each row
execute function public.set_updated_at_fornecedor_erp();

drop trigger if exists trg_fornecedor_compras_itens_updated_at on public.fornecedor_compras_itens;
create trigger trg_fornecedor_compras_itens_updated_at
before update on public.fornecedor_compras_itens
for each row
execute function public.set_updated_at_fornecedor_erp();

create or replace function public.recalc_fornecedor_compra_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_compra_id uuid;
begin
  v_compra_id := coalesce(new.compra_id, old.compra_id);

  update public.fornecedor_compras c
     set valor_total = coalesce((
       select sum(i.subtotal)
       from public.fornecedor_compras_itens i
       where i.compra_id = v_compra_id
     ), 0)
   where c.id = v_compra_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_fornecedor_compras_itens_recalc_total on public.fornecedor_compras_itens;
create trigger trg_fornecedor_compras_itens_recalc_total
after insert or update or delete on public.fornecedor_compras_itens
for each row
execute function public.recalc_fornecedor_compra_total();

alter table public.fornecedor_compras enable row level security;
alter table public.fornecedor_compras_itens enable row level security;

grant select, insert, update, delete on public.fornecedor_compras to authenticated;
grant select, insert, update, delete on public.fornecedor_compras_itens to authenticated;

drop policy if exists fornecedor_compras_select_own on public.fornecedor_compras;
create policy fornecedor_compras_select_own
on public.fornecedor_compras
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_compras_insert_own on public.fornecedor_compras;
create policy fornecedor_compras_insert_own
on public.fornecedor_compras
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_compras_update_own on public.fornecedor_compras;
create policy fornecedor_compras_update_own
on public.fornecedor_compras
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

drop policy if exists fornecedor_compras_delete_own on public.fornecedor_compras;
create policy fornecedor_compras_delete_own
on public.fornecedor_compras
for delete
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_compras_itens_select_own on public.fornecedor_compras_itens;
create policy fornecedor_compras_itens_select_own
on public.fornecedor_compras_itens
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1
    from public.fornecedor_compras c
    where c.id = fornecedor_compras_itens.compra_id
      and c.fornecedor_id = auth.uid()
      and c.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists fornecedor_compras_itens_insert_own on public.fornecedor_compras_itens;
create policy fornecedor_compras_itens_insert_own
on public.fornecedor_compras_itens
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1
    from public.fornecedor_compras c
    where c.id = fornecedor_compras_itens.compra_id
      and c.fornecedor_id = auth.uid()
      and c.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists fornecedor_compras_itens_update_own on public.fornecedor_compras_itens;
create policy fornecedor_compras_itens_update_own
on public.fornecedor_compras_itens
for update
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1
    from public.fornecedor_compras c
    where c.id = fornecedor_compras_itens.compra_id
      and c.fornecedor_id = auth.uid()
      and c.tenant_id = public.current_tenant_id()
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1
    from public.fornecedor_compras c
    where c.id = fornecedor_compras_itens.compra_id
      and c.fornecedor_id = auth.uid()
      and c.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists fornecedor_compras_itens_delete_own on public.fornecedor_compras_itens;
create policy fornecedor_compras_itens_delete_own
on public.fornecedor_compras_itens
for delete
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1
    from public.fornecedor_compras c
    where c.id = fornecedor_compras_itens.compra_id
      and c.fornecedor_id = auth.uid()
      and c.tenant_id = public.current_tenant_id()
  )
);

create table if not exists public.fornecedor_crm_leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  origem text,
  etapa text not null default 'novo',
  valor_potencial numeric(12,2),
  observacoes text,
  proximo_contato_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fornecedor_crm_leads_etapa_check check (etapa in ('novo', 'contato', 'proposta', 'ganho', 'perdido'))
);

create index if not exists fornecedor_crm_leads_idx
  on public.fornecedor_crm_leads (tenant_id, fornecedor_id, etapa, created_at desc);

drop trigger if exists trg_fornecedor_crm_leads_updated_at on public.fornecedor_crm_leads;
create trigger trg_fornecedor_crm_leads_updated_at
before update on public.fornecedor_crm_leads
for each row
execute function public.set_updated_at_fornecedor_erp();

alter table public.fornecedor_crm_leads enable row level security;
grant select, insert, update, delete on public.fornecedor_crm_leads to authenticated;

drop policy if exists fornecedor_crm_leads_select_own on public.fornecedor_crm_leads;
create policy fornecedor_crm_leads_select_own
on public.fornecedor_crm_leads
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_crm_leads_insert_own on public.fornecedor_crm_leads;
create policy fornecedor_crm_leads_insert_own
on public.fornecedor_crm_leads
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_crm_leads_update_own on public.fornecedor_crm_leads;
create policy fornecedor_crm_leads_update_own
on public.fornecedor_crm_leads
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

drop policy if exists fornecedor_crm_leads_delete_own on public.fornecedor_crm_leads;
create policy fornecedor_crm_leads_delete_own
on public.fornecedor_crm_leads
for delete
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);
