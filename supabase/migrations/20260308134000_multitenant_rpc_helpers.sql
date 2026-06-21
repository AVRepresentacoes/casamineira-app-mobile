-- Fase 1: helpers de tenant para app/admin

create or replace function public.get_meus_tenants()
returns table (
  tenant_id uuid,
  slug text,
  name text,
  role text,
  is_default boolean,
  status text,
  plan_code text
)
language sql
security definer
set search_path = public
as $$
  select
    t.id as tenant_id,
    t.slug,
    t.name,
    tu.role,
    tu.is_default,
    t.status,
    t.plan_code
  from public.tenant_users tu
  inner join public.tenants t on t.id = tu.tenant_id
  where tu.user_id = auth.uid()
  order by tu.is_default desc, t.created_at asc;
$$;

create or replace function public.set_tenant_ativo(p_tenant_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant_id uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  select t.id
    into v_tenant_id
    from public.tenants t
    inner join public.tenant_users tu on tu.tenant_id = t.id
   where tu.user_id = v_uid
     and lower(t.slug) = lower(coalesce(p_tenant_slug, ''))
   limit 1;

  if v_tenant_id is null then
    raise exception 'Tenant não encontrado para este usuário';
  end if;

  update public.tenant_users
     set is_default = false
   where user_id = v_uid;

  update public.tenant_users
     set is_default = true
   where user_id = v_uid
     and tenant_id = v_tenant_id;

  return v_tenant_id;
end;
$$;

revoke all on function public.get_meus_tenants() from public;
revoke all on function public.set_tenant_ativo(text) from public;

grant execute on function public.get_meus_tenants() to authenticated;
grant execute on function public.set_tenant_ativo(text) to authenticated;

