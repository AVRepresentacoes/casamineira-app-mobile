-- Vertical de marketplace para gas de cozinha: revendedores e pedidos MVP.

create table if not exists public.gas_revendedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid null,
  nome text not null,
  whatsapp text null,
  preco_p13 numeric(12,2) not null,
  tempo_entrega_min integer null,
  bairro text null,
  cidade text null,
  avaliacao numeric(3,2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.gas_revendedores
  drop constraint if exists gas_revendedores_preco_p13_check;

alter table public.gas_revendedores
  add constraint gas_revendedores_preco_p13_check check (preco_p13 > 0);

alter table public.gas_revendedores
  drop constraint if exists gas_revendedores_tempo_entrega_min_check;

alter table public.gas_revendedores
  add constraint gas_revendedores_tempo_entrega_min_check check (tempo_entrega_min is null or tempo_entrega_min >= 0);

alter table public.gas_revendedores
  drop constraint if exists gas_revendedores_avaliacao_check;

alter table public.gas_revendedores
  add constraint gas_revendedores_avaliacao_check check (avaliacao >= 0 and avaliacao <= 5);

create table if not exists public.gas_pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid null references auth.users(id) on delete set null,
  revendedor_id uuid null references public.gas_revendedores(id) on delete set null,
  tipo_botijao text not null default 'P13',
  preco numeric(12,2) null,
  endereco text null,
  bairro text null,
  cidade text null,
  status text not null default 'solicitado',
  created_at timestamptz not null default now()
);

alter table public.gas_pedidos
  drop constraint if exists gas_pedidos_tipo_botijao_check;

alter table public.gas_pedidos
  add constraint gas_pedidos_tipo_botijao_check check (tipo_botijao in ('P13'));

create index if not exists gas_revendedores_ativo_cidade_idx
  on public.gas_revendedores (ativo, cidade, preco_p13);

create index if not exists gas_revendedores_created_at_idx
  on public.gas_revendedores (created_at desc);

create index if not exists gas_pedidos_cliente_created_at_idx
  on public.gas_pedidos (cliente_id, created_at desc);

create index if not exists gas_pedidos_revendedor_created_at_idx
  on public.gas_pedidos (revendedor_id, created_at desc);

create index if not exists gas_pedidos_status_created_at_idx
  on public.gas_pedidos (status, created_at desc);

alter table public.gas_revendedores enable row level security;
alter table public.gas_pedidos enable row level security;

grant select on public.gas_revendedores to authenticated;
grant select, insert on public.gas_pedidos to authenticated;

drop policy if exists gas_revendedores_select_ativos on public.gas_revendedores;
create policy gas_revendedores_select_ativos
on public.gas_revendedores
for select
to authenticated
using (ativo = true);

drop policy if exists gas_pedidos_select_own on public.gas_pedidos;
create policy gas_pedidos_select_own
on public.gas_pedidos
for select
to authenticated
using (cliente_id = auth.uid());

drop policy if exists gas_pedidos_insert_own on public.gas_pedidos;
create policy gas_pedidos_insert_own
on public.gas_pedidos
for insert
to authenticated
with check (cliente_id = auth.uid());

insert into public.gas_revendedores (
  nome,
  whatsapp,
  preco_p13,
  tempo_entrega_min,
  bairro,
  cidade,
  avaliacao,
  ativo
)
select seed.nome, seed.whatsapp, seed.preco_p13, seed.tempo_entrega_min, seed.bairro, seed.cidade, seed.avaliacao, seed.ativo
from (
  values
    ('Gas da Avenida', '5535999123456', 112.90, 25, 'Avenida', 'Itajuba', 4.8, true),
    ('Ultragas Centro Sul', '5535999234567', 118.50, 18, 'Centro', 'Itajuba', 4.9, true),
    ('Gas Boa Entrega', '5535999345678', 109.90, 35, 'Medicina', 'Itajuba', 4.6, true),
    ('Gas Santa Rita', '5535999456789', 115.00, 28, 'Santa Rita', 'Pirangucu', 4.7, true)
) as seed(nome, whatsapp, preco_p13, tempo_entrega_min, bairro, cidade, avaliacao, ativo)
where not exists (
  select 1
  from public.gas_revendedores existing
  where lower(existing.nome) = lower(seed.nome)
    and coalesce(lower(existing.cidade), '') = coalesce(lower(seed.cidade), '')
);
