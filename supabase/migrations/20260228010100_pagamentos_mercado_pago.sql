-- Mercado Pago + pagamentos + status de comissão
-- Idempotente e seguro para rodar múltiplas vezes.

create extension if not exists pgcrypto;

-- =========================================================
-- 1) TABELA PAGAMENTOS
-- =========================================================
create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  profissional_id uuid not null references auth.users(id) on delete cascade,
  valor_total numeric not null,
  valor_comissao numeric not null,
  valor_profissional numeric not null,
  payment_id text,
  preference_id text,
  external_reference text,
  init_point text,
  status_pagamento text not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pagamentos
  add column if not exists pedido_id uuid references public.pedidos(id) on delete cascade,
  add column if not exists profissional_id uuid references auth.users(id) on delete cascade,
  add column if not exists valor_total numeric,
  add column if not exists valor_comissao numeric,
  add column if not exists valor_profissional numeric,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists payment_id text,
  add column if not exists preference_id text,
  add column if not exists external_reference text,
  add column if not exists init_point text,
  add column if not exists status_pagamento text not null default 'pendente',
  add column if not exists updated_at timestamptz not null default now();

-- Backfill básico para ambientes legados que não tinham profissional_id em pagamentos
update public.pagamentos pg
set profissional_id = c.profissional_id
from public.comissoes c
where pg.profissional_id is null
  and c.pedido_id = pg.pedido_id;

create unique index if not exists pagamentos_pedido_uidx
  on public.pagamentos (pedido_id);

create unique index if not exists pagamentos_payment_id_uidx
  on public.pagamentos (payment_id)
  where payment_id is not null;

create index if not exists pagamentos_profissional_idx
  on public.pagamentos (profissional_id, created_at desc);

-- =========================================================
-- 2) STATUS FINANCEIROS
-- =========================================================
update public.comissoes
set status_pagamento = 'aguardar_pagamento'
where status_pagamento = 'pendente';

-- Evita constraints antigas conflitantes
alter table public.comissoes
  drop constraint if exists comissoes_status_pagamento_check;

alter table public.comissoes
  add constraint comissoes_status_pagamento_check
  check (status_pagamento in ('aguardar_pagamento', 'pago', 'recusado', 'estornado'));

alter table public.pagamentos
  drop constraint if exists pagamentos_status_pagamento_check;

alter table public.pagamentos
  add constraint pagamentos_status_pagamento_check
  check (status_pagamento in ('pendente', 'aprovada', 'recusada', 'estornada'));

-- =========================================================
-- 3) UPDATED_AT automático para pagamentos
-- =========================================================
create or replace function public.set_updated_at_pagamentos()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pagamentos_updated_at on public.pagamentos;
create trigger trg_pagamentos_updated_at
before update on public.pagamentos
for each row
execute function public.set_updated_at_pagamentos();

-- =========================================================
-- 4) RLS
-- =========================================================
alter table public.pagamentos enable row level security;

-- Cliente do pedido pode ver pagamentos do próprio pedido
 drop policy if exists pagamentos_select_cliente_dono_pedido on public.pagamentos;
create policy pagamentos_select_cliente_dono_pedido
on public.pagamentos
for select
to authenticated
using (
  exists (
    select 1
    from public.pedidos p
    where p.id = pagamentos.pedido_id
      and p.cliente_id = auth.uid()
  )
);

-- Profissional só vê os próprios pagamentos
 drop policy if exists pagamentos_select_profissional on public.pagamentos;
create policy pagamentos_select_profissional
on public.pagamentos
for select
to authenticated
using (auth.uid() = profissional_id);

-- Inserção autenticada para manter compatibilidade com fluxo atual
 drop policy if exists pagamentos_insert_authenticated on public.pagamentos;
create policy pagamentos_insert_authenticated
on public.pagamentos
for insert
to authenticated
with check (true);

grant select, insert on public.pagamentos to authenticated;
