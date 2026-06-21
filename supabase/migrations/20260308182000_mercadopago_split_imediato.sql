create extension if not exists pgcrypto;

alter table public.pagamentos
  add column if not exists split_mode boolean not null default false,
  add column if not exists split_provider text,
  add column if not exists split_destination_id text;

create index if not exists pagamentos_split_mode_idx
  on public.pagamentos (split_mode, created_at desc);

create table if not exists public.profissional_gateway_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.default_tenant_id() references public.tenants(id) on delete restrict,
  profissional_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'mercadopago' check (provider in ('mercadopago')),
  provider_user_id text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  status text not null default 'active' check (status in ('active', 'inactive', 'revoked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profissional_id, provider)
);

create index if not exists profissional_gateway_accounts_tenant_prof_idx
  on public.profissional_gateway_accounts (tenant_id, profissional_id, provider);

create or replace function public.set_updated_at_profissional_gateway_accounts()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profissional_gateway_accounts_updated_at on public.profissional_gateway_accounts;
create trigger trg_profissional_gateway_accounts_updated_at
before update on public.profissional_gateway_accounts
for each row
execute function public.set_updated_at_profissional_gateway_accounts();

alter table public.profissional_gateway_accounts enable row level security;

revoke all on public.profissional_gateway_accounts from authenticated;

-- somente service role lê tabela direto; app usa RPC abaixo.

create or replace function public.upsert_profissional_mercadopago_account(
  p_access_token text,
  p_provider_user_id text default null,
  p_refresh_token text default null,
  p_token_expires_at timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  if coalesce(trim(p_access_token), '') = '' then
    raise exception 'access_token obrigatório';
  end if;

  v_tenant := coalesce(public.current_tenant_id(), public.default_tenant_id());
  if v_tenant is null then
    raise exception 'Tenant não encontrado';
  end if;

  insert into public.profissional_gateway_accounts (
    tenant_id,
    profissional_id,
    provider,
    provider_user_id,
    access_token,
    refresh_token,
    token_expires_at,
    status
  ) values (
    v_tenant,
    v_uid,
    'mercadopago',
    nullif(trim(coalesce(p_provider_user_id, '')), ''),
    trim(p_access_token),
    nullif(trim(coalesce(p_refresh_token, '')), ''),
    p_token_expires_at,
    'active'
  )
  on conflict (profissional_id, provider)
  do update set
    tenant_id = excluded.tenant_id,
    provider_user_id = excluded.provider_user_id,
    access_token = excluded.access_token,
    refresh_token = excluded.refresh_token,
    token_expires_at = excluded.token_expires_at,
    status = 'active',
    updated_at = now();

  return true;
end;
$$;

create or replace function public.get_profissional_mercadopago_account_status()
returns table (
  connected boolean,
  provider_user_id text,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_row public.profissional_gateway_accounts%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  select *
    into v_row
    from public.profissional_gateway_accounts
   where profissional_id = v_uid
     and provider = 'mercadopago'
   limit 1;

  if not found then
    return query
    select false, null::text, null::text, null::timestamptz;
    return;
  end if;

  return query
  select
    (v_row.status = 'active' and coalesce(length(trim(v_row.access_token)), 0) > 0),
    v_row.provider_user_id,
    v_row.status,
    v_row.updated_at;
end;
$$;

revoke all on function public.upsert_profissional_mercadopago_account(text, text, text, timestamptz) from public;
revoke all on function public.get_profissional_mercadopago_account_status() from public;

grant execute on function public.upsert_profissional_mercadopago_account(text, text, text, timestamptz) to authenticated;
grant execute on function public.get_profissional_mercadopago_account_status() to authenticated;
