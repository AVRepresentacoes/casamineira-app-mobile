do $$
begin
  if to_regprocedure('public.change_current_empresa_plan(uuid)') is null then
    raise exception 'Dependência ausente: execute 20260314143000_saas_plan_enforcement.sql antes desta migration.';
  end if;
end $$;

create table if not exists public.saas_billing_integrations (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.tenants(id) on delete cascade,
  assinatura_id uuid references public.assinaturas_saas(id) on delete set null,
  provider text not null,
  gateway_customer_id text,
  gateway_subscription_id text,
  gateway_status text,
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saas_billing_integrations_provider_check check (provider in ('mercadopago', 'stripe', 'asaas', 'manual')),
  unique (empresa_id, provider)
);

create table if not exists public.saas_billing_events (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.tenants(id) on delete cascade,
  assinatura_id uuid references public.assinaturas_saas(id) on delete set null,
  provider text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  process_status text not null default 'pending',
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint saas_billing_events_provider_check check (provider in ('mercadopago', 'stripe', 'asaas', 'manual')),
  constraint saas_billing_events_process_status_check check (process_status in ('pending', 'processed', 'failed'))
);

create index if not exists saas_billing_integrations_empresa_idx
  on public.saas_billing_integrations (empresa_id);

create index if not exists saas_billing_events_empresa_created_idx
  on public.saas_billing_events (empresa_id, created_at desc);

create or replace function public.set_updated_at_saas_billing_integrations()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_saas_billing_integrations_updated_at on public.saas_billing_integrations;
create trigger trg_saas_billing_integrations_updated_at
before update on public.saas_billing_integrations
for each row
execute function public.set_updated_at_saas_billing_integrations();

alter table public.saas_billing_integrations enable row level security;
alter table public.saas_billing_events enable row level security;

drop policy if exists saas_billing_integrations_select_member on public.saas_billing_integrations;
create policy saas_billing_integrations_select_member
on public.saas_billing_integrations
for select
to authenticated
using (public.user_belongs_to_tenant(empresa_id) or public.is_super_admin());

drop policy if exists saas_billing_integrations_manage_admin on public.saas_billing_integrations;
create policy saas_billing_integrations_manage_admin
on public.saas_billing_integrations
for all
to authenticated
using (public.is_empresa_admin(empresa_id) or public.is_super_admin())
with check (public.is_empresa_admin(empresa_id) or public.is_super_admin());

drop policy if exists saas_billing_events_select_member on public.saas_billing_events;
create policy saas_billing_events_select_member
on public.saas_billing_events
for select
to authenticated
using (public.user_belongs_to_tenant(empresa_id) or public.is_super_admin());

drop policy if exists saas_billing_events_manage_super_admin on public.saas_billing_events;
create policy saas_billing_events_manage_super_admin
on public.saas_billing_events
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create or replace function public.upsert_current_empresa_billing_integration(
  p_provider text,
  p_gateway_customer_id text default null,
  p_gateway_subscription_id text default null,
  p_gateway_status text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_assinatura_id uuid;
begin
  v_empresa_id := public.current_empresa_id();

  if not public.is_empresa_admin(v_empresa_id) then
    raise exception 'Acesso restrito ao admin da empresa';
  end if;

  select a.id
    into v_assinatura_id
  from public.assinaturas_saas a
  where a.empresa_id = v_empresa_id
  order by a.created_at desc
  limit 1;

  insert into public.saas_billing_integrations (
    empresa_id,
    assinatura_id,
    provider,
    gateway_customer_id,
    gateway_subscription_id,
    gateway_status,
    metadata,
    last_synced_at
  )
  values (
    v_empresa_id,
    v_assinatura_id,
    lower(trim(p_provider)),
    nullif(trim(coalesce(p_gateway_customer_id, '')), ''),
    nullif(trim(coalesce(p_gateway_subscription_id, '')), ''),
    nullif(trim(coalesce(p_gateway_status, '')), ''),
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict (empresa_id, provider) do update
  set
    assinatura_id = excluded.assinatura_id,
    gateway_customer_id = coalesce(excluded.gateway_customer_id, public.saas_billing_integrations.gateway_customer_id),
    gateway_subscription_id = coalesce(excluded.gateway_subscription_id, public.saas_billing_integrations.gateway_subscription_id),
    gateway_status = coalesce(excluded.gateway_status, public.saas_billing_integrations.gateway_status),
    metadata = public.saas_billing_integrations.metadata || excluded.metadata,
    last_synced_at = now();
end;
$$;

create or replace function public.register_saas_billing_event(
  p_empresa_id uuid,
  p_provider text,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_assinatura_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Acesso restrito ao super admin';
  end if;

  select a.id
    into v_assinatura_id
  from public.assinaturas_saas a
  where a.empresa_id = p_empresa_id
  order by a.created_at desc
  limit 1;

  insert into public.saas_billing_events (
    empresa_id,
    assinatura_id,
    provider,
    event_type,
    payload
  )
  values (
    p_empresa_id,
    v_assinatura_id,
    lower(trim(p_provider)),
    trim(p_event_type),
    coalesce(p_payload, '{}'::jsonb)
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

create or replace function public.get_current_empresa_billing_snapshot()
returns table (
  empresa_id uuid,
  assinatura_id uuid,
  provider text,
  gateway_customer_id text,
  gateway_subscription_id text,
  gateway_status text,
  metadata jsonb,
  last_synced_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    sbi.empresa_id,
    sbi.assinatura_id,
    sbi.provider,
    sbi.gateway_customer_id,
    sbi.gateway_subscription_id,
    sbi.gateway_status,
    sbi.metadata,
    sbi.last_synced_at
  from public.saas_billing_integrations sbi
  where sbi.empresa_id = public.current_empresa_id()
  order by sbi.updated_at desc
  limit 1;
$$;

revoke all on function public.upsert_current_empresa_billing_integration(text, text, text, text, jsonb) from public;
revoke all on function public.register_saas_billing_event(uuid, text, text, jsonb) from public;
revoke all on function public.get_current_empresa_billing_snapshot() from public;

grant execute on function public.upsert_current_empresa_billing_integration(text, text, text, text, jsonb) to authenticated;
grant execute on function public.register_saas_billing_event(uuid, text, text, jsonb) to authenticated;
grant execute on function public.get_current_empresa_billing_snapshot() to authenticated;
