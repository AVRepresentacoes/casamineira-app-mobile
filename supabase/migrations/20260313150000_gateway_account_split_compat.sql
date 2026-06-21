-- Compatibilidade entre as duas versões de split Mercado Pago já existentes no projeto.
-- Garante que ambientes que receberam a migração antiga continuem compatíveis com o app atual.

alter table public.pagamentos
  add column if not exists split_destination_id text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pagamentos'
      and column_name = 'split_profissional_mp_user_id'
  ) then
    execute $sql$
      update public.pagamentos
         set split_destination_id = coalesce(split_destination_id, split_profissional_mp_user_id)
       where split_destination_id is null
         and split_profissional_mp_user_id is not null
    $sql$;
  end if;
end $$;

alter table public.profissional_gateway_accounts
  add column if not exists mp_user_id text,
  add column if not exists mp_access_token text,
  add column if not exists mp_refresh_token text,
  add column if not exists provider_user_id text,
  add column if not exists access_token text,
  add column if not exists refresh_token text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profissional_gateway_accounts'
      and column_name = 'mp_user_id'
  ) then
    execute $sql$
      update public.profissional_gateway_accounts
         set provider_user_id = coalesce(provider_user_id, mp_user_id)
       where provider_user_id is null
         and mp_user_id is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profissional_gateway_accounts'
      and column_name = 'mp_access_token'
  ) then
    execute $sql$
      update public.profissional_gateway_accounts
         set access_token = coalesce(access_token, mp_access_token)
       where access_token is null
         and mp_access_token is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profissional_gateway_accounts'
      and column_name = 'mp_refresh_token'
  ) then
    execute $sql$
      update public.profissional_gateway_accounts
         set refresh_token = coalesce(refresh_token, mp_refresh_token)
       where refresh_token is null
         and mp_refresh_token is not null
    $sql$;
  end if;
end $$;

create index if not exists profissional_gateway_accounts_tenant_prof_idx
  on public.profissional_gateway_accounts (tenant_id, profissional_id, provider);

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
    status,
    metadata
  ) values (
    v_tenant,
    v_uid,
    'mercadopago',
    nullif(trim(coalesce(p_provider_user_id, '')), ''),
    trim(p_access_token),
    nullif(trim(coalesce(p_refresh_token, '')), ''),
    p_token_expires_at,
    'active',
    '{}'::jsonb
  )
  on conflict (profissional_id, provider)
  do update set
    tenant_id = excluded.tenant_id,
    provider_user_id = excluded.provider_user_id,
    access_token = excluded.access_token,
    refresh_token = excluded.refresh_token,
    token_expires_at = excluded.token_expires_at,
    status = 'active',
    updated_at = now(),
    metadata = coalesce(public.profissional_gateway_accounts.metadata, '{}'::jsonb);

  update public.profissional_gateway_accounts
     set provider_user_id = coalesce(provider_user_id, nullif(trim(coalesce(p_provider_user_id, '')), '')),
         access_token = coalesce(access_token, trim(p_access_token)),
         refresh_token = coalesce(refresh_token, nullif(trim(coalesce(p_refresh_token, '')), ''))
   where profissional_id = v_uid
     and provider = 'mercadopago';

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profissional_gateway_accounts'
      and column_name = 'mp_user_id'
  ) then
    execute $sql$
      update public.profissional_gateway_accounts
         set mp_user_id = coalesce(mp_user_id, nullif(trim(coalesce($1, '')), ''))
       where profissional_id = $2
         and provider = 'mercadopago'
    $sql$
    using p_provider_user_id, v_uid;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profissional_gateway_accounts'
      and column_name = 'mp_access_token'
  ) then
    execute $sql$
      update public.profissional_gateway_accounts
         set mp_access_token = coalesce(mp_access_token, trim($1))
       where profissional_id = $2
         and provider = 'mercadopago'
    $sql$
    using p_access_token, v_uid;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profissional_gateway_accounts'
      and column_name = 'mp_refresh_token'
  ) then
    execute $sql$
      update public.profissional_gateway_accounts
         set mp_refresh_token = coalesce(mp_refresh_token, nullif(trim(coalesce($1, '')), ''))
       where profissional_id = $2
         and provider = 'mercadopago'
    $sql$
    using p_refresh_token, v_uid;
  end if;

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
  v_row record;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  select
    profissional_id,
    provider,
    coalesce(provider_user_id, mp_user_id) as provider_user_id,
    coalesce(access_token, mp_access_token) as access_token,
    status,
    updated_at
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
