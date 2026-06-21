-- Gestão de equipe por tenant via RPCs (owner/admin).

create or replace function public.get_tenant_team_members()
returns table (
  user_id uuid,
  name text,
  email text,
  role text,
  is_default boolean,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_my_role text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  select tu.role
    into v_my_role
    from public.tenant_users tu
   where tu.tenant_id = v_tenant
     and tu.user_id = v_uid
   limit 1;

  if v_my_role is null then
    raise exception 'Usuário não pertence ao tenant';
  end if;

  return query
  select
    tu.user_id,
    coalesce(p.name, split_part(coalesce(u.email, ''), '@', 1), 'Usuário') as name,
    coalesce(u.email, '') as email,
    tu.role,
    tu.is_default,
    tu.created_at as joined_at
  from public.tenant_users tu
  left join public.profiles p on p.id = tu.user_id
  left join auth.users u on u.id = tu.user_id
  where tu.tenant_id = v_tenant
  order by
    case when tu.role = 'owner' then 0 else 1 end,
    tu.created_at asc;
end;
$$;

create or replace function public.tenant_team_add_member(
  p_email text,
  p_role text default 'staff'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_my_role text;
  v_email text;
  v_role text;
  v_target_user_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  select tu.role
    into v_my_role
    from public.tenant_users tu
   where tu.tenant_id = v_tenant
     and tu.user_id = v_uid
   limit 1;

  if v_my_role not in ('owner', 'admin') then
    raise exception 'Sem permissão para adicionar membro';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' then
    raise exception 'E-mail é obrigatório';
  end if;

  v_role := lower(trim(coalesce(p_role, 'staff')));
  if v_role not in ('admin', 'manager', 'staff') then
    raise exception 'Papel inválido';
  end if;

  select u.id
    into v_target_user_id
    from auth.users u
   where lower(coalesce(u.email, '')) = v_email
   limit 1;

  if v_target_user_id is null then
    raise exception 'Usuário com esse e-mail não encontrado';
  end if;

  insert into public.tenant_users (
    tenant_id,
    user_id,
    role,
    is_default
  )
  values (
    v_tenant,
    v_target_user_id,
    v_role,
    false
  )
  on conflict (tenant_id, user_id)
  do update set role = excluded.role;

  return v_target_user_id;
end;
$$;

create or replace function public.tenant_team_update_role(
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_my_role text;
  v_target_role text;
  v_new_role text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  select tu.role
    into v_my_role
    from public.tenant_users tu
   where tu.tenant_id = v_tenant
     and tu.user_id = v_uid
   limit 1;

  if v_my_role not in ('owner', 'admin') then
    raise exception 'Sem permissão para alterar papel';
  end if;

  if p_user_id is null then
    raise exception 'Membro inválido';
  end if;

  v_new_role := lower(trim(coalesce(p_role, '')));
  if v_new_role not in ('admin', 'manager', 'staff') then
    raise exception 'Papel inválido';
  end if;

  select tu.role
    into v_target_role
    from public.tenant_users tu
   where tu.tenant_id = v_tenant
     and tu.user_id = p_user_id
   limit 1;

  if v_target_role is null then
    raise exception 'Membro não encontrado';
  end if;

  if v_target_role = 'owner' then
    raise exception 'Não é permitido alterar papel do owner';
  end if;

  update public.tenant_users
     set role = v_new_role
   where tenant_id = v_tenant
     and user_id = p_user_id;
end;
$$;

create or replace function public.tenant_team_remove_member(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_my_role text;
  v_target_role text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  select tu.role
    into v_my_role
    from public.tenant_users tu
   where tu.tenant_id = v_tenant
     and tu.user_id = v_uid
   limit 1;

  if v_my_role not in ('owner', 'admin') then
    raise exception 'Sem permissão para remover membro';
  end if;

  if p_user_id is null then
    raise exception 'Membro inválido';
  end if;

  if p_user_id = v_uid then
    raise exception 'Você não pode remover a si mesmo';
  end if;

  select tu.role
    into v_target_role
    from public.tenant_users tu
   where tu.tenant_id = v_tenant
     and tu.user_id = p_user_id
   limit 1;

  if v_target_role is null then
    raise exception 'Membro não encontrado';
  end if;

  if v_target_role = 'owner' then
    raise exception 'Não é permitido remover o owner';
  end if;

  delete from public.tenant_users
   where tenant_id = v_tenant
     and user_id = p_user_id;
end;
$$;

revoke all on function public.get_tenant_team_members() from public;
revoke all on function public.tenant_team_add_member(text, text) from public;
revoke all on function public.tenant_team_update_role(uuid, text) from public;
revoke all on function public.tenant_team_remove_member(uuid) from public;

grant execute on function public.get_tenant_team_members() to authenticated;
grant execute on function public.tenant_team_add_member(text, text) to authenticated;
grant execute on function public.tenant_team_update_role(uuid, text) to authenticated;
grant execute on function public.tenant_team_remove_member(uuid) to authenticated;
