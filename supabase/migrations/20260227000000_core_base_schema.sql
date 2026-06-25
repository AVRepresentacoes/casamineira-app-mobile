-- Core base schema for fresh Casa Mineira SaaS Supabase projects.
-- This migration is intentionally conservative: it creates the legacy tables
-- that later migrations already assume exist.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid,
  name text,
  full_name text,
  nome text,
  email text,
  phone text,
  telefone text,
  role text,
  tipo text,
  avatar_url text,
  plano_ativo boolean not null default false,
  plano_nome text,
  assinatura_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  cliente_id uuid not null references auth.users(id) on delete cascade,
  profissional_id uuid references auth.users(id) on delete set null,
  categoria text not null,
  servico text,
  descricao text not null,
  status text not null default 'aberto',
  status_logistica text,
  latitude double precision,
  longitude double precision,
  cidade text,
  bairro text,
  endereco text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  descricao text,
  categoria text,
  preco numeric,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_tenant_idx
  on public.profiles (tenant_id);

create index if not exists profiles_role_idx
  on public.profiles (role);

create index if not exists pedidos_cliente_created_idx
  on public.pedidos (cliente_id, created_at desc);

create index if not exists pedidos_profissional_created_idx
  on public.pedidos (profissional_id, created_at desc);

create index if not exists pedidos_status_created_idx
  on public.pedidos (status, created_at desc);

create index if not exists pedidos_tenant_created_idx
  on public.pedidos (tenant_id, created_at desc);

create index if not exists servicos_user_idx
  on public.servicos (user_id, created_at desc);

create index if not exists servicos_tenant_idx
  on public.servicos (tenant_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_pedidos_updated_at on public.pedidos;
create trigger trg_pedidos_updated_at
before update on public.pedidos
for each row
execute function public.set_updated_at();

drop trigger if exists trg_servicos_updated_at on public.servicos;
create trigger trg_servicos_updated_at
before update on public.servicos
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.pedidos enable row level security;
alter table public.servicos enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists pedidos_insert_cliente on public.pedidos;
create policy pedidos_insert_cliente
on public.pedidos
for insert
to authenticated
with check (cliente_id = auth.uid());

drop policy if exists pedidos_select_participantes on public.pedidos;
create policy pedidos_select_participantes
on public.pedidos
for select
to authenticated
using (
  cliente_id = auth.uid()
  or profissional_id = auth.uid()
  or profissional_id is null
);

drop policy if exists pedidos_update_participantes on public.pedidos;
create policy pedidos_update_participantes
on public.pedidos
for update
to authenticated
using (cliente_id = auth.uid() or profissional_id = auth.uid())
with check (cliente_id = auth.uid() or profissional_id = auth.uid());

drop policy if exists servicos_select_active on public.servicos;
create policy servicos_select_active
on public.servicos
for select
to authenticated
using (ativo = true or user_id = auth.uid());

drop policy if exists servicos_insert_own on public.servicos;
create policy servicos_insert_own
on public.servicos
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists servicos_update_own on public.servicos;
create policy servicos_update_own
on public.servicos
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.pedidos to authenticated;
grant select, insert, update on public.servicos to authenticated;
