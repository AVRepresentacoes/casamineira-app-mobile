-- Hardening multi-tenant: elimina fallback inseguro e reduz privilégio automático.

create or replace function public.current_tenant_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_claims jsonb;
  v_claim_tenant uuid;
  v_tenant uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return null;
  end if;

  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then
    v_claims := null;
  end;

  begin
    v_claim_tenant := nullif(v_claims ->> 'tenant_id', '')::uuid;
  exception when others then
    v_claim_tenant := null;
  end;

  if v_claim_tenant is not null then
    if exists (
      select 1
      from public.tenant_users tu
      where tu.user_id = v_uid
        and tu.tenant_id = v_claim_tenant
    ) then
      return v_claim_tenant;
    end if;
  end if;

  select tu.tenant_id
    into v_tenant
    from public.tenant_users tu
   where tu.user_id = v_uid
     and tu.is_default = true
   limit 1;

  if v_tenant is not null then
    return v_tenant;
  end if;

  select tu.tenant_id
    into v_tenant
    from public.tenant_users tu
   where tu.user_id = v_uid
   order by tu.created_at asc
   limit 1;

  return v_tenant;
end;
$$;

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
  values (v_default_tenant, v_uid, 'staff', true)
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
  values (new.tenant_id, new.id, 'staff', false)
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

-- Normaliza privilégios legados: mantém apenas 1 owner por tenant.
with ranked as (
  select
    id,
    tenant_id,
    role,
    row_number() over (partition by tenant_id order by created_at asc) as rn
  from public.tenant_users
)
update public.tenant_users tu
set role = case
  when ranked.rn = 1 then 'owner'
  when ranked.role = 'owner' then 'staff'
  else ranked.role
end
from ranked
where ranked.id = tu.id;

-- Branding: restringe anon ao default e authenticated ao tenant atual ou default.
drop policy if exists app_branding_select_active on public.app_branding;
create policy app_branding_select_active
on public.app_branding
for select
to anon, authenticated
using (
  active = true
  and (
    (auth.uid() is null and tenant_slug = 'default')
    or tenant_slug = 'default'
    or exists (
      select 1
      from public.tenants t
      where t.id = public.current_tenant_id()
        and lower(t.slug) = lower(app_branding.tenant_slug)
    )
  )
);
