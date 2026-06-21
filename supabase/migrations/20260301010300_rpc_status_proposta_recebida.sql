-- Permite atualizar status do pedido para proposta_recebida
-- quando o profissional já enviou proposta para o pedido.
-- Evita bloqueio de RLS no fluxo de envio de proposta.

create or replace function public.marcar_pedido_como_proposta_recebida(p_pedido_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not exists (
    select 1
    from public.propostas pr
    where pr.pedido_id = p_pedido_id
      and pr.profissional_id = v_uid
  ) then
    raise exception 'Sem permissão para atualizar este pedido.';
  end if;

  update public.pedidos
     set status = 'proposta_recebida',
         updated_at = now()
   where id = p_pedido_id
     and status in ('aguardando_proposta', 'proposta_recebida');
end;
$$;

grant execute on function public.marcar_pedido_como_proposta_recebida(uuid) to authenticated;
