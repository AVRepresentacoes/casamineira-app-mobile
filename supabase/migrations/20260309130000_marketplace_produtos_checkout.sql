-- Marketplace de produtos: catálogo do fornecedor + checkout reaproveitando pedidos/pagamentos.

create table if not exists public.produtos_fornecedor (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  descricao text,
  categoria text,
  preco numeric(12,2) not null,
  estoque integer not null default 0,
  ativo boolean not null default true,
  imagem_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.produtos_fornecedor
  drop constraint if exists produtos_fornecedor_preco_check;

alter table public.produtos_fornecedor
  add constraint produtos_fornecedor_preco_check check (preco > 0);

alter table public.produtos_fornecedor
  drop constraint if exists produtos_fornecedor_estoque_check;

alter table public.produtos_fornecedor
  add constraint produtos_fornecedor_estoque_check check (estoque >= 0);

create index if not exists produtos_fornecedor_tenant_ativo_idx
  on public.produtos_fornecedor (tenant_id, ativo, created_at desc);

create index if not exists produtos_fornecedor_fornecedor_idx
  on public.produtos_fornecedor (fornecedor_id, tenant_id);

create or replace function public.set_updated_at_produtos_fornecedor()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_produtos_fornecedor_updated_at on public.produtos_fornecedor;
create trigger trg_produtos_fornecedor_updated_at
before update on public.produtos_fornecedor
for each row
execute function public.set_updated_at_produtos_fornecedor();

alter table public.produtos_fornecedor enable row level security;
grant select, insert, update, delete on public.produtos_fornecedor to authenticated;

drop policy if exists produtos_fornecedor_select_tenant on public.produtos_fornecedor;
create policy produtos_fornecedor_select_tenant
on public.produtos_fornecedor
for select
to authenticated
using (tenant_id = public.current_tenant_id());

drop policy if exists produtos_fornecedor_insert_own on public.produtos_fornecedor;
create policy produtos_fornecedor_insert_own
on public.produtos_fornecedor
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists produtos_fornecedor_update_own on public.produtos_fornecedor;
create policy produtos_fornecedor_update_own
on public.produtos_fornecedor
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

drop policy if exists produtos_fornecedor_delete_own on public.produtos_fornecedor;
create policy produtos_fornecedor_delete_own
on public.produtos_fornecedor
for delete
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);
