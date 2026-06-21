-- Avaliações + reputação para marketplace
-- Idempotente e compatível com schema atual.

create extension if not exists pgcrypto;

-- =========================================================
-- 1) TABELA AVALIACOES
-- =========================================================
create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  avaliador_id uuid not null references auth.users(id) on delete cascade,
  avaliado_id uuid not null references auth.users(id) on delete cascade,
  nota integer not null check (nota >= 1 and nota <= 5),
  comentario text,
  created_at timestamptz not null default now()
);

-- Compatibilidade com bases antigas
alter table public.avaliacoes
  add column if not exists avaliador_id uuid references auth.users(id) on delete cascade,
  add column if not exists avaliado_id uuid references auth.users(id) on delete cascade,
  add column if not exists comentario text;

-- Evita avaliação duplicada para o mesmo pedido pelo mesmo avaliador
create unique index if not exists avaliacoes_pedido_avaliador_uidx
  on public.avaliacoes (pedido_id, avaliador_id);

create index if not exists avaliacoes_avaliado_idx
  on public.avaliacoes (avaliado_id, created_at desc);

-- =========================================================
-- 2) PERFIL: MÉDIA E TOTAL
-- =========================================================
alter table public.profiles
  add column if not exists media_avaliacao numeric not null default 0,
  add column if not exists media_avaliacoes numeric not null default 0,
  add column if not exists total_avaliacoes integer not null default 0;

-- =========================================================
-- 3) RLS
-- =========================================================
alter table public.avaliacoes enable row level security;

-- Usuário pode ver avaliações públicas
 drop policy if exists avaliacoes_select_publico on public.avaliacoes;
create policy avaliacoes_select_publico
on public.avaliacoes
for select
to authenticated
using (true);

-- Usuário só pode inserir se for o avaliador e tiver participado do pedido
 drop policy if exists avaliacoes_insert_participante on public.avaliacoes;
create policy avaliacoes_insert_participante
on public.avaliacoes
for insert
to authenticated
with check (
  auth.uid() = avaliador_id
  and exists (
    select 1
    from public.pedidos p
    where p.id = avaliacoes.pedido_id
      and (
        p.cliente_id = auth.uid()
        or auth.uid()::text = coalesce(to_jsonb(p)->>'profissional_id', to_jsonb(p)->>'prestador_id')
      )
      and avaliado_id::text in (
        p.cliente_id::text,
        coalesce(to_jsonb(p)->>'profissional_id', to_jsonb(p)->>'prestador_id')
      )
      and avaliado_id <> auth.uid()
      and p.status = 'finalizado'
  )
);

grant select, insert on public.avaliacoes to authenticated;
