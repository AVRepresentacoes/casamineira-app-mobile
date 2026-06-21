create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'active',
  plan_code text not null default 'starter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_status_check check (status in ('active', 'suspended', 'cancelled'))
);

create table if not exists public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  constraint tenant_users_role_check check (role in ('owner', 'admin', 'manager', 'staff'))
);

create unique index if not exists tenant_users_user_default_uidx
  on public.tenant_users (user_id)
  where is_default = true;

insert into public.tenants (slug, name, status, plan_code)
values ('default', 'Default Tenant', 'active', 'starter')
on conflict (slug) do update
set name = excluded.name,
    status = excluded.status,
    plan_code = excluded.plan_code;

create or replace function public.set_updated_at_multitenant()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tenants_updated_at on public.tenants;
create trigger trg_tenants_updated_at
before update on public.tenants
for each row
execute function public.set_updated_at_multitenant();

drop trigger if exists trg_tenant_users_updated_at on public.tenant_users;
create trigger trg_tenant_users_updated_at
before update on public.tenant_users
for each row
execute function public.set_updated_at_multitenant();

create or replace function public.default_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.tenants where slug = 'default' limit 1;
$$;

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

  if v_uid is not null then
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

    if v_tenant is not null then
      return v_tenant;
    end if;
  end if;

  return public.default_tenant_id();
end;
$$;

create or replace function public.user_belongs_to_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = p_tenant_id
  );
$$;

alter table public.tenants enable row level security;
alter table public.tenant_users enable row level security;

revoke all on function public.default_tenant_id() from public;
revoke all on function public.current_tenant_id() from public;
revoke all on function public.user_belongs_to_tenant(uuid) from public;

grant execute on function public.default_tenant_id() to authenticated;
grant execute on function public.current_tenant_id() to authenticated;
grant execute on function public.user_belongs_to_tenant(uuid) to authenticated;

drop policy if exists tenants_select_member on public.tenants;
create policy tenants_select_member
on public.tenants
for select
to authenticated
using (public.user_belongs_to_tenant(tenants.id));

drop policy if exists tenant_users_select_own on public.tenant_users;
create policy tenant_users_select_own
on public.tenant_users
for select
to authenticated
using (tenant_users.user_id = auth.uid());

