-- Retorna nome/contato de profissionais das propostas de um pedido do cliente autenticado.

create or replace function public.listar_contatos_profissionais_propostas(
  p_pedido_id uuid
)
returns table (
  profissional_id uuid,
  nome text,
  contato text
)
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
      from public.pedidos p
     where p.id = p_pedido_id
       and p.cliente_id = v_uid
  ) then
    raise exception 'Sem permissão para acessar contatos deste pedido.';
  end if;

  return query
  select distinct
    pr.profissional_id,
    coalesce(nullif(trim(pf.name), ''), nullif(trim(pf.nome), ''), 'Profissional') as nome,
    coalesce(
      nullif(trim(pf.phone), ''),
      nullif(trim(pf.telefone), ''),
      nullif(trim(pf.whatsapp), ''),
      'Telefone não cadastrado'
    ) as contato
  from public.propostas pr
  left join public.profiles pf on pf.id = pr.profissional_id
  where pr.pedido_id = p_pedido_id
    and pr.profissional_id is not null
    and (pr.status = 'aceita' or coalesce(pr.contato_liberado, false) = true);
end;
$$;

grant execute on function public.listar_contatos_profissionais_propostas(uuid) to authenticated;
