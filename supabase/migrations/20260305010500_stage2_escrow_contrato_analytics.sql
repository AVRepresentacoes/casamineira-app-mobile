-- Stage 2: Escrow por marcos + contrato digital + analytics operacional

create extension if not exists pgcrypto;

-- =========================================================
-- 1) CONTRATO DIGITAL
-- =========================================================
create table if not exists public.contratos_digitais (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  cliente_id uuid not null references auth.users(id) on delete cascade,
  profissional_id uuid not null references auth.users(id) on delete cascade,
  termos text not null default '',
  status text not null default 'pendente_assinaturas',
  cliente_signed_at timestamptz,
  profissional_signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pedido_id)
);

alter table public.contratos_digitais
  add column if not exists termos text not null default '',
  add column if not exists status text not null default 'pendente_assinaturas',
  add column if not exists cliente_signed_at timestamptz,
  add column if not exists profissional_signed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.contratos_digitais
  drop constraint if exists contratos_digitais_status_check;

alter table public.contratos_digitais
  add constraint contratos_digitais_status_check
  check (status in ('pendente_assinaturas', 'ativo', 'cancelado'));

-- =========================================================
-- 2) ESCROW POR MARCOS
-- =========================================================
create table if not exists public.escrow_milestones (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  ordem integer not null,
  titulo text not null,
  descricao text,
  percentual numeric not null,
  valor numeric not null,
  status text not null default 'pendente',
  approved_client_at timestamptz,
  approved_prof_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pedido_id, ordem)
);

alter table public.escrow_milestones
  add column if not exists descricao text,
  add column if not exists status text not null default 'pendente',
  add column if not exists approved_client_at timestamptz,
  add column if not exists approved_prof_at timestamptz,
  add column if not exists released_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.escrow_milestones
  drop constraint if exists escrow_milestones_status_check;

alter table public.escrow_milestones
  add constraint escrow_milestones_status_check
  check (status in ('pendente', 'em_execucao', 'aprovado', 'liberado', 'disputa'));

-- =========================================================
-- 3) ANALYTICS OPERACIONAL
-- =========================================================
create table if not exists public.analytics_eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  pedido_id uuid references public.pedidos(id) on delete set null,
  evento text not null,
  metadata jsonb not null default '{}'::jsonb,
  plataforma text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_eventos_user_created_idx
  on public.analytics_eventos (user_id, created_at desc);

create index if not exists analytics_eventos_pedido_created_idx
  on public.analytics_eventos (pedido_id, created_at desc);

create index if not exists analytics_eventos_evento_idx
  on public.analytics_eventos (evento);

-- =========================================================
-- 4) UPDATED_AT triggers
-- =========================================================
create or replace function public.set_updated_at_stage2()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_contratos_digitais_updated_at on public.contratos_digitais;
create trigger trg_contratos_digitais_updated_at
before update on public.contratos_digitais
for each row
execute function public.set_updated_at_stage2();

drop trigger if exists trg_escrow_milestones_updated_at on public.escrow_milestones;
create trigger trg_escrow_milestones_updated_at
before update on public.escrow_milestones
for each row
execute function public.set_updated_at_stage2();

-- =========================================================
-- 5) RLS
-- =========================================================
alter table public.contratos_digitais enable row level security;
alter table public.escrow_milestones enable row level security;
alter table public.analytics_eventos enable row level security;

-- CONTRATOS DIGITAIS
drop policy if exists contratos_digitais_select_participantes on public.contratos_digitais;
create policy contratos_digitais_select_participantes
on public.contratos_digitais
for select
to authenticated
using (
  auth.uid() = cliente_id
  or auth.uid() = profissional_id
);

drop policy if exists contratos_digitais_insert_participantes on public.contratos_digitais;
create policy contratos_digitais_insert_participantes
on public.contratos_digitais
for insert
to authenticated
with check (
  auth.uid() = cliente_id
  or auth.uid() = profissional_id
);

drop policy if exists contratos_digitais_update_participantes on public.contratos_digitais;
create policy contratos_digitais_update_participantes
on public.contratos_digitais
for update
to authenticated
using (
  auth.uid() = cliente_id
  or auth.uid() = profissional_id
)
with check (
  auth.uid() = cliente_id
  or auth.uid() = profissional_id
);

-- ESCROW MILESTONES
drop policy if exists escrow_milestones_select_participantes on public.escrow_milestones;
create policy escrow_milestones_select_participantes
on public.escrow_milestones
for select
to authenticated
using (
  exists (
    select 1
    from public.pedidos p
    where p.id = escrow_milestones.pedido_id
      and (
        p.cliente_id = auth.uid()
        or auth.uid()::text = coalesce(to_jsonb(p)->>'profissional_id', to_jsonb(p)->>'prestador_id')
      )
  )
);

drop policy if exists escrow_milestones_insert_participantes on public.escrow_milestones;
create policy escrow_milestones_insert_participantes
on public.escrow_milestones
for insert
to authenticated
with check (
  exists (
    select 1
    from public.pedidos p
    where p.id = escrow_milestones.pedido_id
      and (
        p.cliente_id = auth.uid()
        or auth.uid()::text = coalesce(to_jsonb(p)->>'profissional_id', to_jsonb(p)->>'prestador_id')
      )
  )
);

drop policy if exists escrow_milestones_update_participantes on public.escrow_milestones;
create policy escrow_milestones_update_participantes
on public.escrow_milestones
for update
to authenticated
using (
  exists (
    select 1
    from public.pedidos p
    where p.id = escrow_milestones.pedido_id
      and (
        p.cliente_id = auth.uid()
        or auth.uid()::text = coalesce(to_jsonb(p)->>'profissional_id', to_jsonb(p)->>'prestador_id')
      )
  )
)
with check (
  exists (
    select 1
    from public.pedidos p
    where p.id = escrow_milestones.pedido_id
      and (
        p.cliente_id = auth.uid()
        or auth.uid()::text = coalesce(to_jsonb(p)->>'profissional_id', to_jsonb(p)->>'prestador_id')
      )
  )
);

-- ANALYTICS EVENTOS
drop policy if exists analytics_eventos_select_proprio on public.analytics_eventos;
create policy analytics_eventos_select_proprio
on public.analytics_eventos
for select
to authenticated
using (
  user_id = auth.uid()
  or user_id is null
);

drop policy if exists analytics_eventos_insert_proprio on public.analytics_eventos;
create policy analytics_eventos_insert_proprio
on public.analytics_eventos
for insert
to authenticated
with check (
  user_id = auth.uid()
  or user_id is null
);

grant select, insert, update on public.contratos_digitais to authenticated;
grant select, insert, update on public.escrow_milestones to authenticated;
grant select, insert on public.analytics_eventos to authenticated;
