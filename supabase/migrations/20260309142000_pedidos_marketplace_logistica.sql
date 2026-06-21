-- Status logístico para pedidos de marketplace.

alter table public.pedidos
  add column if not exists status_logistica text;

update public.pedidos
set status_logistica = coalesce(status_logistica, 'novo')
where coalesce(categoria, '') = 'Marketplace';

alter table public.pedidos
  alter column status_logistica set default 'novo';

alter table public.pedidos
  drop constraint if exists pedidos_status_logistica_check;

alter table public.pedidos
  add constraint pedidos_status_logistica_check
  check (
    status_logistica is null
    or status_logistica in ('novo', 'preparando', 'enviado', 'entregue', 'cancelado')
  );

create index if not exists pedidos_marketplace_logistica_idx
  on public.pedidos (tenant_id, categoria, status_logistica, created_at desc);

drop policy if exists pedidos_update_fornecedor_logistica_marketplace on public.pedidos;
create policy pedidos_update_fornecedor_logistica_marketplace
on public.pedidos
for update
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and profissional_id = auth.uid()
  and coalesce(categoria, '') = 'Marketplace'
)
with check (
  tenant_id = public.current_tenant_id()
  and profissional_id = auth.uid()
  and coalesce(categoria, '') = 'Marketplace'
);
