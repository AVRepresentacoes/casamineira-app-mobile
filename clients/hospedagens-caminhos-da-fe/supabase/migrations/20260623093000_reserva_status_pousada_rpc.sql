create or replace function public.caminho_hospedagem_atualizar_status_por_pousada(
  p_reserva_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva public.caminho_hospedagem_reservas%rowtype;
  v_is_owner boolean;
begin
  if p_status not in ('confirmada', 'concluida') then
    raise exception 'Status não permitido para atualização pela pousada.';
  end if;

  select *
  into v_reserva
  from public.caminho_hospedagem_reservas
  where id = p_reserva_id;

  if not found then
    raise exception 'Reserva não encontrada.';
  end if;

  select exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.tenant_id = v_reserva.tenant_id
      and p.slug = v_reserva.hospedagem_slug
      and p.owner_user_id = auth.uid()
  )
  into v_is_owner;

  if not (v_is_owner or public.is_empresa_admin(v_reserva.tenant_id) or public.is_super_admin()) then
    raise exception 'Você não tem permissão para atualizar esta reserva.';
  end if;

  update public.caminho_hospedagem_reservas
  set status = p_status,
      status_pagamento = case
        when p_status = 'confirmada' and status_pagamento = 'pendente' then status_pagamento
        else status_pagamento
      end,
      updated_at = now()
  where id = p_reserva_id;
end;
$$;

revoke all on function public.caminho_hospedagem_atualizar_status_por_pousada(uuid, text) from public;
grant execute on function public.caminho_hospedagem_atualizar_status_por_pousada(uuid, text) to authenticated;
