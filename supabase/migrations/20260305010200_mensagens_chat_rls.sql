-- Base de chat: compatível com schemas antigos e novos.
-- Garante leitura/envio de mensagens por cliente dono do pedido e profissional vinculado.

create extension if not exists pgcrypto;

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  mensagem text,
  texto text,
  remetente_tipo text,
  remetente text,
  remetente_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.mensagens
  add column if not exists mensagem text,
  add column if not exists texto text,
  add column if not exists remetente_tipo text,
  add column if not exists remetente text,
  add column if not exists remetente_id uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

create index if not exists mensagens_pedido_created_idx
  on public.mensagens (pedido_id, created_at asc);

alter table public.mensagens enable row level security;

drop policy if exists mensagens_select_participantes on public.mensagens;
create policy mensagens_select_participantes
on public.mensagens
for select
to authenticated
using (
  exists (
    select 1
    from public.pedidos p
    where p.id = mensagens.pedido_id
      and (
        p.cliente_id = auth.uid()
        or auth.uid()::text = coalesce(
          to_jsonb(p)->>'profissional_id',
          to_jsonb(p)->>'prestador_id'
        )
      )
  )
);

drop policy if exists mensagens_insert_participantes on public.mensagens;
create policy mensagens_insert_participantes
on public.mensagens
for insert
to authenticated
with check (
  exists (
    select 1
    from public.pedidos p
    where p.id = mensagens.pedido_id
      and (
        p.cliente_id = auth.uid()
        or auth.uid()::text = coalesce(
          to_jsonb(p)->>'profissional_id',
          to_jsonb(p)->>'prestador_id'
        )
      )
  )
  and (mensagens.remetente_id is null or mensagens.remetente_id = auth.uid())
);

grant select, insert on public.mensagens to authenticated;
