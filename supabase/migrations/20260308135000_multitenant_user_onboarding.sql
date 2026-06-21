-- Onboarding multi-tenant para novos usuários
-- Garante membership em tenant default e sincroniza profiles -> tenant_users.

create or replace function public.ensure_current_user_tenant_context()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_default_tenant uuid;
  v_default_exists boolean;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_default_tenant := public.default_tenant_id();

  if v_default_tenant is null then
    raise exception 'Tenant default não encontrado';
  end if;

  insert into public.tenant_users (tenant_id, user_id, role, is_default)
  values (v_default_tenant, v_uid, 'owner', true)
  on conflict (tenant_id, user_id) do nothing;

  select exists (
    select 1
    from public.tenant_users
    where user_id = v_uid
      and is_default = true
  )
  into v_default_exists;

  if not v_default_exists then
    update public.tenant_users
       set is_default = true
     where user_id = v_uid
       and tenant_id = v_default_tenant;
  end if;

  return public.current_tenant_id();
end;
$$;

create or replace function public.sync_profile_tenant_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_default_tenant uuid;
  v_has_default boolean;
begin
  v_default_tenant := public.default_tenant_id();

  if new.tenant_id is null then
    new.tenant_id := v_default_tenant;
  end if;

  if new.id is null or new.tenant_id is null then
    return new;
  end if;

  insert into public.tenant_users (tenant_id, user_id, role, is_default)
  values (new.tenant_id, new.id, 'owner', false)
  on conflict (tenant_id, user_id) do nothing;

  select exists (
    select 1
    from public.tenant_users
    where user_id = new.id
      and is_default = true
  )
  into v_has_default;

  if not v_has_default then
    update public.tenant_users
       set is_default = true
     where user_id = new.id
       and tenant_id = new.tenant_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_sync_tenant_membership on public.profiles;
create trigger trg_profiles_sync_tenant_membership
before insert or update on public.profiles
for each row
execute function public.sync_profile_tenant_membership();

revoke all on function public.ensure_current_user_tenant_context() from public;
grant execute on function public.ensure_current_user_tenant_context() to authenticated;
