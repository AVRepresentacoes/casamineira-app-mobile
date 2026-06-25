-- Compatibility base for legacy finance migrations.
-- Later migrations create or alter this table, but the first payments migration
-- reads from it during a backfill.

create extension if not exists pgcrypto;

create table if not exists public.comissoes (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  profissional_id uuid not null references auth.users(id) on delete cascade,
  valor_total numeric not null default 0,
  percentual numeric not null default 20,
  valor_comissao numeric not null default 0,
  valor_profissional numeric not null default 0,
  status_pagamento text not null default 'pendente',
  created_at timestamptz not null default now()
);

create index if not exists comissoes_profissional_idx
  on public.comissoes (profissional_id, created_at desc);

create unique index if not exists comissoes_pedido_uidx
  on public.comissoes (pedido_id);

alter table public.comissoes enable row level security;

drop policy if exists comissoes_select_profissional_base on public.comissoes;
create policy comissoes_select_profissional_base
on public.comissoes
for select
to authenticated
using (auth.uid() = profissional_id);

grant select on public.comissoes to authenticated;
