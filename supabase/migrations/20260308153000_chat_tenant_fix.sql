-- Fix: envio de chat compatível com multi-tenant e schemas legados

create or replace function public.enviar_mensagem_chat(
  p_pedido_id uuid,
  p_texto text,
  p_remetente text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_remetente text;
  v_msg_id uuid;
  v_pedido_tenant uuid;
  v_has_tenant boolean;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if coalesce(trim(p_texto), '') = '' then
    raise exception 'Mensagem vazia.';
  end if;

  select p.tenant_id
    into v_pedido_tenant
    from public.pedidos p
   where p.id = p_pedido_id
   limit 1;

  if not exists (
    select 1
    from public.pedidos p
    where p.id = p_pedido_id
      and (
        p.cliente_id = v_uid
        or v_uid::text = coalesce(
          to_jsonb(p)->>'profissional_id',
          to_jsonb(p)->>'prestador_id'
        )
      )
  ) then
    if not exists (
      select 1
      from public.propostas pr
      where pr.pedido_id = p_pedido_id
        and pr.profissional_id = v_uid
        and pr.status in ('aceita', 'enviada')
    ) then
      raise exception 'Sem permissão para enviar mensagem neste pedido.';
    end if;
  end if;

  v_remetente := coalesce(nullif(trim(p_remetente), ''), 'cliente');

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'mensagens'
      and column_name = 'tenant_id'
  ) into v_has_tenant;

  if v_has_tenant then
    insert into public.mensagens (
      tenant_id,
      pedido_id,
      mensagem,
      texto,
      remetente_tipo,
      remetente,
      remetente_id
    )
    values (
      coalesce(v_pedido_tenant, public.current_tenant_id()),
      p_pedido_id,
      p_texto,
      p_texto,
      v_remetente,
      v_remetente,
      v_uid
    )
    returning id into v_msg_id;
  else
    insert into public.mensagens (
      pedido_id,
      mensagem,
      texto,
      remetente_tipo,
      remetente,
      remetente_id
    )
    values (
      p_pedido_id,
      p_texto,
      p_texto,
      v_remetente,
      v_remetente,
      v_uid
    )
    returning id into v_msg_id;
  end if;

  return v_msg_id;
end;
$$;

grant execute on function public.enviar_mensagem_chat(uuid, text, text) to authenticated;
