create extension if not exists pgcrypto;

-- =========================================================
-- 1) Estrutura mínima de carteira/extrato (compatível)
-- =========================================================
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  saldo numeric not null default 0,
  bloqueado numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallets
  add column if not exists tenant_id uuid,
  add column if not exists saldo numeric not null default 0,
  add column if not exists bloqueado numeric not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists wallets_user_idx on public.wallets (user_id);
create index if not exists wallets_tenant_user_idx on public.wallets (tenant_id, user_id);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  valor numeric not null,
  descricao text,
  status text not null default 'confirmado',
  referencia_tipo text,
  referencia_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.wallet_transactions
  add column if not exists tenant_id uuid,
  add column if not exists tipo text,
  add column if not exists valor numeric,
  add column if not exists descricao text,
  add column if not exists status text not null default 'confirmado',
  add column if not exists referencia_tipo text,
  add column if not exists referencia_id text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create index if not exists wallet_transactions_user_created_idx
  on public.wallet_transactions (user_id, created_at desc);
create index if not exists wallet_transactions_tenant_created_idx
  on public.wallet_transactions (tenant_id, created_at desc);
create index if not exists wallet_transactions_ref_idx
  on public.wallet_transactions (referencia_tipo, referencia_id);

-- evita crédito duplicado em corrida de webhook para o mesmo pagamento
-- (null continua permitido em linhas legadas)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'wallet_transactions_referencia_unique'
      and conrelid = 'public.wallet_transactions'::regclass
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_referencia_unique
      unique (referencia_tipo, referencia_id);
  end if;
exception
  when duplicate_object then
    null;
end $$;

-- =========================================================
-- 2) Solicitações de saque PIX
-- =========================================================
create table if not exists public.saque_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.default_tenant_id() references public.tenants(id) on delete restrict,
  profissional_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete set null,
  valor numeric not null check (valor > 0),
  pix_key text not null,
  pix_key_type text not null default 'EVP' check (pix_key_type in ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP')),
  pix_holder_name text,
  pix_holder_document text,
  provider text not null default 'mercadopago',
  status text not null default 'requested' check (status in ('requested', 'processing', 'paid', 'failed', 'cancelled')),
  provider_transfer_id text,
  provider_status text,
  attempts integer not null default 0,
  idempotency_key text,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saque_solicitacoes
  add column if not exists tenant_id uuid not null default public.default_tenant_id(),
  add column if not exists wallet_id uuid,
  add column if not exists valor numeric,
  add column if not exists pix_key text,
  add column if not exists pix_key_type text not null default 'EVP',
  add column if not exists pix_holder_name text,
  add column if not exists pix_holder_document text,
  add column if not exists provider text not null default 'mercadopago',
  add column if not exists status text not null default 'requested',
  add column if not exists provider_transfer_id text,
  add column if not exists provider_status text,
  add column if not exists attempts integer not null default 0,
  add column if not exists idempotency_key text,
  add column if not exists failure_reason text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists requested_at timestamptz not null default now(),
  add column if not exists processed_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists saque_solicitacoes_profissional_status_idx
  on public.saque_solicitacoes (profissional_id, status, requested_at desc);
create index if not exists saque_solicitacoes_tenant_status_idx
  on public.saque_solicitacoes (tenant_id, status, requested_at desc);
create unique index if not exists saque_solicitacoes_idempotency_key_uniq
  on public.saque_solicitacoes (idempotency_key)
  where idempotency_key is not null;

create or replace function public.set_updated_at_saque_solicitacoes()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_saque_solicitacoes_updated_at on public.saque_solicitacoes;
create trigger trg_saque_solicitacoes_updated_at
before update on public.saque_solicitacoes
for each row
execute function public.set_updated_at_saque_solicitacoes();

-- =========================================================
-- 3) RPC segura para abrir solicitação de saque
-- =========================================================
create or replace function public.request_pix_withdrawal(
  p_valor numeric,
  p_pix_key text,
  p_pix_key_type text default 'EVP',
  p_pix_holder_name text default null,
  p_pix_holder_document text default null,
  p_idempotency_key text default null
)
returns table (
  solicitacao_id uuid,
  status text,
  valor numeric,
  disponivel_apos numeric,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_wallet public.wallets%rowtype;
  v_solicitacao_id uuid;
  v_disponivel numeric;
  v_pix_key_type text;
  v_idempotency_key text;
  v_existente public.saque_solicitacoes%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_valor is null or p_valor <= 0 then
    raise exception 'Valor de saque inválido';
  end if;

  if coalesce(trim(p_pix_key), '') = '' then
    raise exception 'Chave PIX obrigatória';
  end if;

  v_tenant := coalesce(public.current_tenant_id(), public.default_tenant_id());
  if v_tenant is null then
    raise exception 'Tenant não encontrado para o usuário';
  end if;

  v_pix_key_type := upper(coalesce(nullif(trim(p_pix_key_type), ''), 'EVP'));
  if v_pix_key_type not in ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP') then
    v_pix_key_type := 'EVP';
  end if;

  v_idempotency_key := nullif(trim(coalesce(p_idempotency_key, '')), '');

  if v_idempotency_key is not null then
    select *
      into v_existente
      from public.saque_solicitacoes s
     where s.idempotency_key = v_idempotency_key
       and s.profissional_id = v_uid
     limit 1;

    if found then
      return query
      select
        v_existente.id,
        v_existente.status,
        v_existente.valor,
        greatest(coalesce(v_wallet.saldo, 0) - coalesce(v_wallet.bloqueado, 0), 0),
        'Solicitação já registrada (idempotência).';
      return;
    end if;
  end if;

  select *
    into v_wallet
    from public.wallets w
   where w.user_id = v_uid
     and coalesce(w.tenant_id, v_tenant) = v_tenant
   order by w.created_at asc
   limit 1
   for update;

  if not found then
    insert into public.wallets (tenant_id, user_id, saldo, bloqueado)
    values (v_tenant, v_uid, 0, 0)
    returning * into v_wallet;
  end if;

  v_disponivel := greatest(coalesce(v_wallet.saldo, 0) - coalesce(v_wallet.bloqueado, 0), 0);
  if p_valor > v_disponivel then
    raise exception 'Saldo insuficiente para saque';
  end if;

  update public.wallets
     set bloqueado = coalesce(bloqueado, 0) + p_valor
   where id = v_wallet.id
   returning * into v_wallet;

  insert into public.saque_solicitacoes (
    tenant_id,
    profissional_id,
    wallet_id,
    valor,
    pix_key,
    pix_key_type,
    pix_holder_name,
    pix_holder_document,
    status,
    idempotency_key
  ) values (
    v_tenant,
    v_uid,
    v_wallet.id,
    p_valor,
    trim(p_pix_key),
    v_pix_key_type,
    nullif(trim(coalesce(p_pix_holder_name, '')), ''),
    nullif(regexp_replace(coalesce(p_pix_holder_document, ''), '\\D', '', 'g'), ''),
    'requested',
    v_idempotency_key
  )
  returning id into v_solicitacao_id;

  insert into public.wallet_transactions (
    tenant_id,
    user_id,
    tipo,
    valor,
    descricao,
    status,
    referencia_tipo,
    referencia_id,
    metadata
  ) values (
    v_tenant,
    v_uid,
    'saque_solicitado',
    p_valor,
    'Solicitação de saque PIX',
    'pending',
    'saque_solicitacao',
    v_solicitacao_id::text,
    jsonb_build_object('pix_key_type', v_pix_key_type)
  );

  return query
  select
    v_solicitacao_id,
    'requested'::text,
    p_valor,
    greatest(coalesce(v_wallet.saldo, 0) - coalesce(v_wallet.bloqueado, 0), 0),
    'Solicitação de saque recebida.'::text;
end;
$$;

revoke all on function public.request_pix_withdrawal(numeric, text, text, text, text, text) from public;
grant execute on function public.request_pix_withdrawal(numeric, text, text, text, text, text) to authenticated;

-- =========================================================
-- 4) RLS do saque
-- =========================================================
alter table public.saque_solicitacoes enable row level security;

revoke delete on public.saque_solicitacoes from authenticated;
grant select, insert, update on public.saque_solicitacoes to authenticated;

drop policy if exists saque_solicitacoes_select_own on public.saque_solicitacoes;
create policy saque_solicitacoes_select_own
on public.saque_solicitacoes
for select
to authenticated
using (
  profissional_id = auth.uid()
  and tenant_id = public.current_tenant_id()
);

drop policy if exists saque_solicitacoes_insert_own on public.saque_solicitacoes;
create policy saque_solicitacoes_insert_own
on public.saque_solicitacoes
for insert
to authenticated
with check (
  profissional_id = auth.uid()
  and tenant_id = public.current_tenant_id()
);

drop policy if exists saque_solicitacoes_update_cancel_own on public.saque_solicitacoes;
create policy saque_solicitacoes_update_cancel_own
on public.saque_solicitacoes
for update
to authenticated
using (
  profissional_id = auth.uid()
  and tenant_id = public.current_tenant_id()
  and status in ('requested', 'processing')
)
with check (
  profissional_id = auth.uid()
  and tenant_id = public.current_tenant_id()
  and status in ('cancelled', 'requested', 'processing')
);
