create extension if not exists pgcrypto;

-- 1) Pagamentos: marca se foi split imediato (repasse direto no MP)
alter table public.pagamentos
  add column if not exists split_mode boolean not null default false,
  add column if not exists split_provider text,
  add column if not exists split_profissional_mp_user_id text,
  add column if not exists split_metadata jsonb not null default '{}'::jsonb;

create index if not exists pagamentos_split_mode_idx
  on public.pagamentos (split_mode, created_at desc);

-- 2) Conta Mercado Pago conectada por profissional (OAuth / token vendedor)
create table if not exists public.profissional_gateway_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.default_tenant_id() references public.tenants(id) on delete restrict,
  profissional_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'mercadopago' check (provider in ('mercadopago')),
  mp_user_id text,
  mp_access_token text not null,
  mp_refresh_token text,
  token_expires_at timestamptz,
  status text not null default 'active' check (status in ('active', 'inactive', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profissional_id, provider)
);

alter table public.profissional_gateway_accounts
  add column if not exists tenant_id uuid not null default public.default_tenant_id(),
  add column if not exists mp_user_id text,
  add column if not exists mp_access_token text,
  add column if not exists mp_refresh_token text,
  add column if not exists token_expires_at timestamptz,
  add column if not exists status text not null default 'active',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists profissional_gateway_accounts_profissional_idx
  on public.profissional_gateway_accounts (profissional_id, provider, status);

create or replace function public.set_updated_at_prof_gateway_accounts()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_prof_gateway_accounts_updated_at on public.profissional_gateway_accounts;
create trigger trg_prof_gateway_accounts_updated_at
before update on public.profissional_gateway_accounts
for each row
execute function public.set_updated_at_prof_gateway_accounts();

-- Sem exposição direta de token para authenticated
alter table public.profissional_gateway_accounts enable row level security;
revoke all on public.profissional_gateway_accounts from authenticated;

-- 3) RPC segura para profissional registrar/atualizar token MP
create or replace function public.upsert_profissional_mp_account(
  p_mp_access_token text,
  p_mp_user_id text default null,
  p_mp_refresh_token text default null,
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

  if coalesce(trim(p_mp_access_token), '') = '' then
    raise exception 'Access token do Mercado Pago é obrigatório';
  end if;

  v_tenant := coalesce(public.current_tenant_id(), public.default_tenant_id());

  insert into public.profissional_gateway_accounts (
    tenant_id,
    profissional_id,
    provider,
    mp_user_id,
    mp_access_token,
    mp_refresh_token,
    token_expires_at,
    status
  ) values (
    v_tenant,
    v_uid,
    'mercadopago',
    nullif(trim(coalesce(p_mp_user_id, '')), ''),
    trim(p_mp_access_token),
    nullif(trim(coalesce(p_mp_refresh_token, '')), ''),
    p_token_expires_at,
    'active'
  )
  on conflict (profissional_id, provider)
  do update set
    tenant_id = excluded.tenant_id,
    mp_user_id = excluded.mp_user_id,
    mp_access_token = excluded.mp_access_token,
    mp_refresh_token = excluded.mp_refresh_token,
    token_expires_at = excluded.token_expires_at,
    status = 'active',
    updated_at = now();

  return true;
end;
$$;

create or replace function public.get_profissional_mp_account_status()
returns table (
  conectado boolean,
  provider text,
  status text,
  mp_user_id text,
  token_expires_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    true as conectado,
    a.provider,
    a.status,
    a.mp_user_id,
    a.token_expires_at,
    a.updated_at
  from public.profissional_gateway_accounts a
  where a.profissional_id = auth.uid()
    and a.provider = 'mercadopago'
  limit 1;
$$;

revoke all on function public.upsert_profissional_mp_account(text, text, text, timestamptz) from public;
revoke all on function public.get_profissional_mp_account_status() from public;

grant execute on function public.upsert_profissional_mp_account(text, text, text, timestamptz) to authenticated;
grant execute on function public.get_profissional_mp_account_status() to authenticated;
