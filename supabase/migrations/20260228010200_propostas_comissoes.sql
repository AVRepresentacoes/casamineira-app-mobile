-- Marketplace: propostas + aceite + comissoes (20%)
-- Safe migration with IF NOT EXISTS / idempotent blocks.

create extension if not exists pgcrypto;

-- =========================================================
-- 1) TABELA PROPOSTAS
-- =========================================================
create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  profissional_id uuid not null references auth.users(id) on delete cascade,
  valor numeric not null,
  descricao text,
  contato_liberado boolean not null default false,
  status text not null default 'enviada',
  created_at timestamptz not null default now()
);

-- Compatibilidade com bases antigas
alter table public.propostas
  add column if not exists descricao text,
  add column if not exists contato_liberado boolean not null default false;

-- Não permitir proposta duplicada por profissional no mesmo pedido
create unique index if not exists propostas_pedido_profissional_uidx
  on public.propostas (pedido_id, profissional_id);

-- =========================================================
-- 2) TABELA PEDIDOS (NOVAS COLUNAS)
-- =========================================================
alter table public.pedidos
  add column if not exists proposta_aceita_id uuid null references public.propostas(id),
  add column if not exists valor_final numeric null,
  add column if not exists updated_at timestamptz not null default now();

-- =========================================================
-- 3) TABELA COMISSOES
-- =========================================================
create table if not exists public.comissoes (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  profissional_id uuid not null references auth.users(id) on delete cascade,
  valor_total numeric not null,
  percentual numeric not null,
  valor_comissao numeric not null,
  valor_profissional numeric not null,
  status_pagamento text not null default 'pendente',
  created_at timestamptz not null default now()
);

create index if not exists comissoes_profissional_idx
  on public.comissoes (profissional_id, created_at desc);

create unique index if not exists comissoes_pedido_uidx
  on public.comissoes (pedido_id);

-- =========================================================
-- 4) RLS
-- =========================================================
alter table public.propostas enable row level security;
alter table public.comissoes enable row level security;
alter table public.pedidos enable row level security;

-- -------------------------
-- PROPOSTAS policies
-- -------------------------
drop policy if exists propostas_insert_profissional on public.propostas;
create policy propostas_insert_profissional
on public.propostas
for insert
to authenticated
with check (auth.uid() = profissional_id);

drop policy if exists propostas_select_cliente_dono_pedido on public.propostas;
create policy propostas_select_cliente_dono_pedido
on public.propostas
for select
to authenticated
using (
  exists (
    select 1
    from public.pedidos p
    where p.id = propostas.pedido_id
      and p.cliente_id = auth.uid()
  )
);

drop policy if exists propostas_select_profissional on public.propostas;
create policy propostas_select_profissional
on public.propostas
for select
to authenticated
using (auth.uid() = profissional_id);

drop policy if exists propostas_update_cliente_aceite on public.propostas;
create policy propostas_update_cliente_aceite
on public.propostas
for update
to authenticated
using (
  exists (
    select 1
    from public.pedidos p
    where p.id = propostas.pedido_id
      and p.cliente_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.pedidos p
    where p.id = propostas.pedido_id
      and p.cliente_id = auth.uid()
  )
  and (
    status <> 'aceita'
    or contato_liberado = true
  )
);

-- -------------------------
-- COMISSOES policies
-- -------------------------
drop policy if exists comissoes_insert_authenticated on public.comissoes;
create policy comissoes_insert_authenticated
on public.comissoes
for insert
to authenticated
with check (true);

drop policy if exists comissoes_select_profissional on public.comissoes;
create policy comissoes_select_profissional
on public.comissoes
for select
to authenticated
using (auth.uid() = profissional_id);

-- -------------------------
-- PEDIDOS policies
-- -------------------------
drop policy if exists pedidos_update_cliente_dono on public.pedidos;
create policy pedidos_update_cliente_dono
on public.pedidos
for update
to authenticated
using (auth.uid() = cliente_id)
with check (auth.uid() = cliente_id);

-- Grants mínimos
grant select, insert, update on public.propostas to authenticated;
grant select, insert on public.comissoes to authenticated;
grant update on public.pedidos to authenticated;
