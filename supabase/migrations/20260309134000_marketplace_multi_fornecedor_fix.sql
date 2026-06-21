-- Ajustes de robustez para checkout marketplace multi-fornecedor.

alter table public.produtos_fornecedor
  alter column tenant_id set default public.current_tenant_id();

create table if not exists public.pedido_produtos_itens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  produto_id uuid references public.produtos_fornecedor(id) on delete set null,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  cliente_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  quantidade integer not null,
  preco_unitario numeric(12,2) not null,
  subtotal numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pedido_produtos_itens
  drop constraint if exists pedido_produtos_itens_qtd_check;

alter table public.pedido_produtos_itens
  add constraint pedido_produtos_itens_qtd_check check (quantidade > 0);

alter table public.pedido_produtos_itens
  drop constraint if exists pedido_produtos_itens_preco_check;

alter table public.pedido_produtos_itens
  add constraint pedido_produtos_itens_preco_check check (preco_unitario > 0);

alter table public.pedido_produtos_itens
  drop constraint if exists pedido_produtos_itens_subtotal_check;

alter table public.pedido_produtos_itens
  add constraint pedido_produtos_itens_subtotal_check check (subtotal > 0);

create index if not exists pedido_produtos_itens_pedido_idx
  on public.pedido_produtos_itens (tenant_id, pedido_id, created_at desc);

create index if not exists pedido_produtos_itens_fornecedor_idx
  on public.pedido_produtos_itens (tenant_id, fornecedor_id, created_at desc);

create index if not exists pedido_produtos_itens_cliente_idx
  on public.pedido_produtos_itens (tenant_id, cliente_id, created_at desc);

create or replace function public.set_updated_at_pedido_produtos_itens()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_pedido_produtos_itens_updated_at on public.pedido_produtos_itens;
create trigger trg_pedido_produtos_itens_updated_at
before update on public.pedido_produtos_itens
for each row
execute function public.set_updated_at_pedido_produtos_itens();

alter table public.pedido_produtos_itens enable row level security;
grant select on public.pedido_produtos_itens to authenticated;

drop policy if exists pedido_produtos_itens_select_own on public.pedido_produtos_itens;
create policy pedido_produtos_itens_select_own
on public.pedido_produtos_itens
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (cliente_id = auth.uid() or fornecedor_id = auth.uid())
);
