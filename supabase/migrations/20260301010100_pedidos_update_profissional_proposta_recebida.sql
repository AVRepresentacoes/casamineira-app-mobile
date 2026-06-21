-- Permite que o profissional atualize o pedido para proposta_recebida
-- após enviar proposta para aquele pedido.
-- Evita falha por RLS no envio de proposta.

drop policy if exists pedidos_update_profissional_proposta_recebida on public.pedidos;
create policy pedidos_update_profissional_proposta_recebida
on public.pedidos
for update
to authenticated
using (
  exists (
    select 1
    from public.propostas pr
    where pr.pedido_id = pedidos.id
      and pr.profissional_id = auth.uid()
  )
  and pedidos.status in ('aguardando_proposta', 'proposta_recebida')
)
with check (
  exists (
    select 1
    from public.propostas pr
    where pr.pedido_id = pedidos.id
      and pr.profissional_id = auth.uid()
  )
  and status = 'proposta_recebida'
);
