-- Corrige recursão infinita de RLS entre pedidos <-> disparo_pedidos.
-- Causa: policy em pedidos consultando disparo_pedidos e policy em disparo_pedidos consultando pedidos.

create or replace function public.profissional_tem_disparo_pedido(
  p_pedido_id uuid,
  p_profissional_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.disparo_pedidos dp
    where dp.pedido_id = p_pedido_id
      and dp.profissional_id = p_profissional_id
      and dp.status in ('pendente', 'visualizado', 'aceito')
  );
$$;

revoke all on function public.profissional_tem_disparo_pedido(uuid, uuid) from public;
grant execute on function public.profissional_tem_disparo_pedido(uuid, uuid) to authenticated;

drop policy if exists pedidos_select_profissional_disparo_rapido on public.pedidos;
create policy pedidos_select_profissional_disparo_rapido
on public.pedidos
for select
to authenticated
using (
  public.profissional_tem_disparo_pedido(pedidos.id, auth.uid())
);
