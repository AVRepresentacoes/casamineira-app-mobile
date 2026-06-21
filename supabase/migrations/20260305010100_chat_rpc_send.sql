-- RPC robusta para envio de mensagens no chat.
-- Evita falhas por variação de schema e bloqueios de RLS no insert direto.

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
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if coalesce(trim(p_texto), '') = '' then
    raise exception 'Mensagem vazia.';
  end if;

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

  return v_msg_id;
end;
$$;

grant execute on function public.enviar_mensagem_chat(uuid, text, text) to authenticated;

create or replace function public.listar_mensagens_chat(
  p_pedido_id uuid
)
returns table (
  id uuid,
  texto text,
  remetente text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_has_texto boolean;
  v_has_mensagem boolean;
  v_has_remetente boolean;
  v_has_remetente_tipo boolean;
  v_has_created_at boolean;
  v_texto_expr text;
  v_remetente_expr text;
  v_created_expr text;
  v_sql text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

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
      raise exception 'Sem permissão para acessar chat deste pedido.';
    end if;
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'mensagens' and column_name = 'texto'
  ) into v_has_texto;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'mensagens' and column_name = 'mensagem'
  ) into v_has_mensagem;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'mensagens' and column_name = 'remetente'
  ) into v_has_remetente;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'mensagens' and column_name = 'remetente_tipo'
  ) into v_has_remetente_tipo;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'mensagens' and column_name = 'created_at'
  ) into v_has_created_at;

  if v_has_texto and v_has_mensagem then
    v_texto_expr := 'coalesce(texto, mensagem)';
  elsif v_has_texto then
    v_texto_expr := 'texto';
  elsif v_has_mensagem then
    v_texto_expr := 'mensagem';
  else
    v_texto_expr := '''''::text';
  end if;

  if v_has_remetente and v_has_remetente_tipo then
    v_remetente_expr := 'coalesce(remetente, remetente_tipo)';
  elsif v_has_remetente then
    v_remetente_expr := 'remetente';
  elsif v_has_remetente_tipo then
    v_remetente_expr := 'remetente_tipo';
  else
    v_remetente_expr := '''cliente''::text';
  end if;

  if v_has_created_at then
    v_created_expr := 'created_at';
  else
    v_created_expr := 'now()';
  end if;

  v_sql := format(
    'select id::uuid as id, %s as texto, %s as remetente, %s as created_at
     from public.mensagens
     where pedido_id = %L::uuid
     order by %s asc',
    v_texto_expr,
    v_remetente_expr,
    v_created_expr,
    p_pedido_id::text,
    v_created_expr
  );

  return query execute v_sql;
end;
$$;

grant execute on function public.listar_mensagens_chat(uuid) to authenticated;
