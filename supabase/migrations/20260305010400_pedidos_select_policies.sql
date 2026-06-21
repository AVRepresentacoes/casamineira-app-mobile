-- Corrige leitura de propostas do cliente:
-- a policy de propostas valida dono do pedido via subquery em public.pedidos.
-- Sem policy SELECT em pedidos, essa validação falha por RLS e retorna lista vazia.

alter table public.pedidos enable row level security;

drop policy if exists pedidos_select_cliente_dono on public.pedidos;
create policy pedidos_select_cliente_dono
on public.pedidos
for select
to authenticated
using (auth.uid() = cliente_id);

drop policy if exists pedidos_select_profissional_vinculado on public.pedidos;
create policy pedidos_select_profissional_vinculado
on public.pedidos
for select
to authenticated
using (
  auth.uid()::text = coalesce(
    to_jsonb(pedidos)->>'profissional_id',
    to_jsonb(pedidos)->>'prestador_id'
  )
);

grant select on public.pedidos to authenticated;
